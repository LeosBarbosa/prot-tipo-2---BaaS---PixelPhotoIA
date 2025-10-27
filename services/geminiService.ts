/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Modality, type GenerateContentResponse } from "@google/genai";
import { fileToDataURL, dataURLtoFile } from "../utils/imageUtils";
import * as db from '../utils/db';
import { sha256 } from '../utils/cryptoUtils';
import { orchestrate as orchestrateTool } from "./orchestrator";
import { type SmartSearchResult, type ToolId, type Toast, type VideoAspectRatio, type DetectedObject } from "../types";

// Helper function to show a toast message
const showToast = (setToast: (toast: Toast | null) => void, message: string, type: Toast['type'] = 'info') => {
  setToast({ message, type });
};

/**
 * Parses a Gemini API error and returns a user-friendly message in Portuguese.
 * @param error The error object caught from the API call.
 * @returns A user-friendly error string.
 */
const handleGeminiError = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('api_key_invalid') || message.includes('permission_denied')) {
      return "Chave de API inválida ou não autorizada. Verifique suas credenciais no AI Studio.";
    }
    if (message.includes('billing not enabled')) {
      return "A Faturação não está ativada para o seu projeto. Por favor, ative-a no Google Cloud Console.";
    }
    if (message.includes('quota_exceeded') || message.includes('resource_exhausted')) {
      return "Você atingiu o limite de uso da API (quota). Por favor, verifique seu plano e tente novamente mais tarde.";
    }
    if (message.includes('model_not_found')) {
      return "O modelo de IA solicitado não foi encontrado. Isso pode ser um problema temporário.";
    }
    if (message.includes('invalid_argument')) {
      return "Argumento inválido. A imagem pode estar corrompida ou o prompt contém conteúdo não permitido.";
    }
    if (message.includes('deadline_exceeded') || message.includes('timed out')) {
      return "A solicitação demorou muito para responder (timeout). Verifique sua conexão e tente novamente.";
    }
    if (message.includes('requested entity was not found')) {
         return "Entidade não encontrada. Se estiver usando a geração de vídeo, sua chave de API pode ser inválida. Tente selecionar outra.";
    }
    // Return a cleaned-up version of the original message if no specific case matched
    return `Erro na API: ${error.message}`;
  }
  return "Ocorreu um erro desconhecido na comunicação com a IA.";
};


// Initialize the Gemini client
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- Helper Functions ---

const generateCacheKey = async (model: string, contents: any, config?: any): Promise<string> => {
    let contentHash = '';
    if (typeof contents === 'string') {
        contentHash = await sha256(contents);
    } else if (contents && contents.parts) {
        const partHashes = await Promise.all(contents.parts.map(async (part: any) => {
            if (part.text) {
                return await sha256(part.text);
            }
            if (part.inlineData?.data) { // base64 string
                return await sha256(part.inlineData.data);
            }
            return '';
        }));
        contentHash = partHashes.join('');
    } else if (contents instanceof File) {
        const dataUrl = await fileToDataURL(contents);
        contentHash = await sha256(dataUrl);
    }
    
    const configString = config ? JSON.stringify(config) : '';
    const keyString = `${model}:${contentHash}:${configString}`;
    return await sha256(keyString);
};


/**
 * Converts a File to a GenerativePart for the Gemini API.
 */
export const fileToPart = async (file: File) => {
  const dataUrl = await fileToDataURL(file);
  const base64Data = dataUrl.split(',')[1];
  return {
    inlineData: {
      mimeType: file.type,
      data: base64Data,
    },
  };
};

/**
 * A generic function to handle Gemini API calls that return an image.
 */
export const generateImageWithGemini = async (
  model: string,
  contents: any,
  setToast: (toast: Toast | null) => void,
  config?: any
): Promise<string> => {
  const cacheKey = await generateCacheKey(model, contents, config);
  const cachedBlob = await db.loadImageFromCache(cacheKey);
  if (cachedBlob) {
    showToast(setToast, 'Resultado carregado do cache.', 'info');
    return fileToDataURL(new File([cachedBlob], 'cached.png', { type: cachedBlob.type }));
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data) {
      const mimeType = part.inlineData.mimeType;
      const dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
      
      const resultFile = dataURLtoFile(dataUrl, 'cached-result.png');
      await db.saveImageToCache(cacheKey, resultFile);

      return dataUrl;
    } else if (part?.text) {
        // Fallback for models that might return text errors instead of images
        throw new Error(`API returned text instead of an image: ${part.text}`);
    }

    throw new Error("A imagem gerada não foi encontrada na resposta da API.");
  } catch (error) {
    console.error("Erro na chamada da API Gemini:", error);
    const userFriendlyError = handleGeminiError(error);
    showToast(setToast, userFriendlyError, 'error');
    throw error;
  }
};


// --- Service Functions ---

export const analyzeImage = async (imageFile: File, question: string, setToast: (toast: Toast | null) => void): Promise<string | undefined> => {
  try {
    const ai = getAI();
    const imagePart = await fileToPart(imageFile);
    const textPart = { text: question };
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro', // A good model for multimodal tasks
      contents: { parts: [imagePart, textPart] },
    });
    return response.text;
  } catch (error) {
    console.error("Erro na análise da imagem:", error);
    const userFriendlyError = handleGeminiError(error);
    showToast(setToast, userFriendlyError, 'error');
    return undefined;
  }
};

export const generateImageFromText = async (prompt: string, aspectRatio: string, setToast: (toast: Toast | null) => void, setLoadingMessage: (message: string | null) => void): Promise<string> => {
    setLoadingMessage("Gerando imagem com Imagen...");

    const cacheKey = await sha256(`imagen-4.0-generate-001:${prompt}:${aspectRatio}`);
    const cachedBlob = await db.loadImageFromCache(cacheKey);
    if (cachedBlob) {
        setLoadingMessage(null);
        showToast(setToast, 'Imagem carregada do cache.', 'info');
        return fileToDataURL(new File([cachedBlob], "cached.png", { type: cachedBlob.type }));
    }

    try {
        const ai = getAI();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              aspectRatio: aspectRatio as any,
            },
        });

        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        const dataUrl = `data:image/png;base64,${base64ImageBytes}`;
        
        const resultFile = dataURLtoFile(dataUrl, 'cached-imagen.png');
        await db.saveImageToCache(cacheKey, resultFile);

        return dataUrl;
    } catch (error) {
        console.error("Erro na geração de imagem com Imagen:", error);
        const userFriendlyError = handleGeminiError(error);
        showToast(setToast, userFriendlyError, 'error');
        throw error; // Re-throw to allow UI to handle loading state
    }
};

export const generateImageVariation = async (imageFile: File, strength: number, setToast: (toast: Toast | null) => void): Promise<string> => {
    const imagePart = await fileToPart(imageFile);
    return generateImageWithGemini(
        'gemini-2.5-flash-image',
        { parts: [imagePart] },
        setToast,
        {
          responseModalities: [Modality.IMAGE],
          // Strength is not a direct parameter, this is a conceptual mapping.
          // We can't directly control variation strength this way.
          // This will just generate a similar image.
        }
    );
};


export const validatePromptSpecificity = async (prompt: string, toolName: string): Promise<{ isSpecific: boolean; suggestion: string }> => {
  const validationPrompt = `Analise o seguinte prompt de usuário para uma ferramenta de IA chamada "${toolName}": "${prompt}". O prompt é específico o suficiente para gerar um resultado de alta qualidade? Responda com um objeto JSON com duas chaves: "isSpecific" (um booleano) e "suggestion" (uma string em português que sugere como melhorar o prompt se ele não for específico, ou uma mensagem de confirmação se for).`;

  try {
    const ai = getAI();
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: validationPrompt,
        config: {
            responseMimeType: 'application/json'
        }
    });
    
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return {
        isSpecific: result.isSpecific ?? false,
        suggestion: result.suggestion ?? "Não foi possível validar o prompt."
    };
  } catch(e) {
      console.error("Error validating prompt:", e);
      // Proceed without validation on error
      return { isSpecific: true, suggestion: "Validação falhou; prosseguindo." };
  }
};

export const removeBackground = async (imageFile: File, options: any, setToast: (toast: Toast | null) => void): Promise<string> => {
    const prompt = `Remova o fundo desta imagem, preservando todos os detalhes do objeto principal, incluindo cabelos finos ou pelos. O resultado deve ser um PNG com fundo transparente.`;
    const imagePart = await fileToPart(imageFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, { text: prompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const createTransparentPng = async (imageFile: File, options: any, setToast: (toast: Toast | null) => void): Promise<string> => {
    return removeBackground(imageFile, options, setToast); // It's the same core operation
};

export const reacenderImage = async (imageFile: File, prompt: string, setToast: (toast: Toast | null) => void): Promise<string> => {
    const fullPrompt = `Reacenda esta foto. A nova iluminação deve ser: ${prompt}. Mantenha o conteúdo da imagem original, alterando apenas a luz e as sombras.`;
    const imagePart = await fileToPart(imageFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, { text: fullPrompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const generateLowPoly = async (imageFile: File, setToast: (toast: Toast | null) => void): Promise<string> => {
    const prompt = 'Transforme esta imagem em uma arte de estilo low poly, usando uma malha de polígonos geométricos e cores simplificadas.';
    const imagePart = await fileToPart(imageFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, { text: prompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const extractArt = async (imageFile: File, setToast: (toast: Toast | null) => void): Promise<string> => {
    const prompt = 'Extraia a arte de linha desta imagem, criando um esboço de contorno em preto e branco com um fundo branco limpo.';
    const imagePart = await fileToPart(imageFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, { text: prompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const applyDustAndScratches = async (imageFile: File, setToast: (toast: Toast | null) => void): Promise<string> => {
    const prompt = 'Adicione um efeito realista de poeira, arranhões e grão de filme a esta imagem para dar uma aparência vintage.';
    const imagePart = await fileToPart(imageFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, { text: prompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const denoiseImage = async (imageFile: File, setToast: (toast: Toast | null) => void): Promise<string> => {
    const prompt = 'Remova o ruído e a granulação desta imagem, preservando os detalhes finos e a nitidez.';
    const imagePart = await fileToPart(imageFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, { text: prompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const applyFaceRecovery = async (imageFile: File, setToast: (toast: Toast | null) => void): Promise<string> => {
    const prompt = 'Restaure e melhore os detalhes faciais nesta imagem. Aumente a clareza, corrija imperfeições e melhore a qualidade geral do rosto.';
    const imagePart = await fileToPart(imageFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, { text: prompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const generateProfessionalPortrait = async (imageFile: File, setToast: (toast: Toast | null) => void): Promise<string> => {
    const prompt = 'Transforme esta foto em um retrato profissional de negócios. Mantenha o rosto da pessoa, mas gere roupas de negócios, um fundo de escritório desfocado e iluminação de estúdio.';
    const imagePart = await fileToPart(imageFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, { text: prompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const restorePhoto = async (imageFile: File, colorize: boolean, setToast: (toast: Toast | null) => void): Promise<string> => {
    let prompt = 'Restaure esta foto antiga. Remova arranhões, rasgos e ruído. Melhore a nitidez e os detalhes, especialmente nos rostos.';
    if (colorize) {
        prompt += ' Se a foto for em preto e branco, adicione cores realistas.';
    }
    const imagePart = await fileToPart(imageFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, { text: prompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const upscaleImage = async (imageFile: File, factor: number, preserveFace: boolean, setToast: (toast: Toast | null) => void): Promise<string> => {
    const prompt = `Aumente a resolução desta imagem em ${factor}x. Melhore a nitidez e os detalhes. ${preserveFace ? 'Preste atenção especial para preservar e aprimorar os detalhes faciais de forma realista.' : ''}`;
    const imagePart = await fileToPart(imageFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, { text: prompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const unblurImage = async (imageFile: File, sharpenLevel: number, denoiseLevel: number, model: string, setToast: (toast: Toast | null) => void): Promise<string> => {
    const prompt = `Corrija o desfoque nesta imagem usando o modelo '${model}'. Aplique ${sharpenLevel}% de nitidez e ${denoiseLevel}% de redução de ruído.`;
    const imagePart = await fileToPart(imageFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, { text: prompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const applyStyle = async (imageFile: File, stylePrompt: string, setToast: (toast: Toast | null) => void): Promise<string> => {
    const prompt = `Reimagine esta imagem no seguinte estilo: ${stylePrompt}. Preserve os elementos principais, mas aplique a estética descrita.`;
    const imagePart = await fileToPart(imageFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, { text: prompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const generativeEdit = async (imageFile: File, prompt: string, mode: 'fill' | 'remove', options: { maskImage: File }, setToast: (toast: Toast | null) => void): Promise<string> => {
    const fullPrompt = mode === 'remove'
        ? 'Remova o objeto ou área indicada pela máscara e preencha o espaço de forma realista e coerente com o resto da imagem.'
        : `Na área indicada pela máscara, preencha com o seguinte: ${prompt}. O resultado deve se misturar perfeitamente com o resto da imagem.`;

    const imagePart = await fileToPart(imageFile);
    const maskPart = await fileToPart(options.maskImage);
    const parts = [imagePart, maskPart, { text: fullPrompt }];
    return generateImageWithGemini('gemini-2.5-flash-image', { parts }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const applyStyleToImage = async (imageFile: File, prompt: string, setToast: (toast: Toast | null) => void): Promise<string> => {
    const imagePart = await fileToPart(imageFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, { text: prompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const detectObjects = async (imageFile: File, prompt?: string): Promise<DetectedObject[]> => {
    const ai = getAI();
    const imagePart = await fileToPart(imageFile);
    const textPart = { text: `Detecte os seguintes objetos na imagem: ${prompt || 'todos os objetos principais'}. Para cada objeto, forneça um 'label' (rótulo em português) e uma 'box' (caixa delimitadora com coordenadas normalizadas x_min, y_min, x_max, y_max). Retorne um array de objetos JSON.` };
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: { parts: [imagePart, textPart] }, config: { responseMimeType: 'application/json' } });
    
    try {
        const result = JSON.parse(response.text);
        if (Array.isArray(result)) {
            // Filter out any objects that don't have a valid 'box' property with all coordinates
            const validObjects = result.filter(obj => 
                obj &&
                typeof obj === 'object' &&
                obj.box &&
                typeof obj.box.x_min === 'number' &&
                typeof obj.box.y_min === 'number' &&
                typeof obj.box.x_max === 'number' &&
                typeof obj.box.y_max === 'number'
            );
            return validObjects;
        }
    } catch (e) {
        console.error("Failed to parse Gemini response for object detection:", e, "Response text:", response.text);
        return []; // Return empty array on parsing error
    }
    
    return [];
};

export const detectFaces = async (imageFile: File): Promise<DetectedObject[]> => {
    return detectObjects(imageFile, 'todos os rostos de pessoas');
};

export const retouchFace = async (imageFile: File, maskFile: File, setToast: (toast: Toast | null) => void): Promise<string> => {
    const prompt = 'Na área indicada pela máscara, retoque a pele do rosto. Suavize imperfeições, uniformize o tom de pele e reduza o brilho, mantendo uma aparência natural e preservando a textura da pele.';
    const imagePart = await fileToPart(imageFile);
    const maskPart = await fileToPart(maskFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, maskPart, { text: prompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const faceSwap = async (targetImageFile: File, sourceImageFile: File, userPrompt: string, negativePrompt: string, setToast: (toast: Toast | null) => void, maskFile?: File): Promise<string> => {
    let prompt = `Aja como um especialista em retoque digital de classe mundial, especializado em trocas de rosto hiper-realistas e imperceptíveis para produções cinematográficas de ponta. Sua tarefa é transplantar o rosto da imagem 'fonte' para a cabeça na imagem 'alvo'.

**DIRETIVA PRINCIPAL: REALISMO ABSOLUTO E PRESERVAÇÃO DO CONTEXTO.**

**REGRAS NÃO NEGOCIÁVEIS:**
1.  **CONTEXTO IDÊNTICO:** Você deve preservar **100%** do contexto da imagem 'alvo'. Isso inclui, mas não se limita a:
    *   **Fundo e Ambiente:** Intocados.
    *   **Iluminação:** A mesma direção, cor, temperatura e dureza/suavidade das sombras devem ser perfeitamente replicadas no novo rosto.
    *   **Cabelo:** O penteado original, a linha do cabelo e quaisquer fios soltos devem permanecer idênticos.
    *   **Roupas e Corpo:** O corpo, pescoço, roupas e acessórios são invioláveis.
2.  **TRANSFERÊNCIA DE IDENTIDADE IMPECÁVEL:** A identidade facial (olhos, nariz, boca, queixo, estrutura óssea) da imagem 'fonte' deve ser perfeitamente transferida.
3.  **MESCLAGEM PERFEITA:** A integração deve ser invisível a olho nu.
    *   **Tom e Textura da Pele:** Corresponda perfeitamente ao tom, compleição e textura da pele do alvo (poros, linhas finas).
    *   **Bordas:** A transição na linha da mandíbula, pescoço e cabelo deve ser completamente suave, sem bordas visíveis ou mudanças de cor.
4.  **FOTORREALISMO É ESSENCIAL:** O resultado final deve ser indistinguível de uma fotografia real e não editada. Evite qualquer efeito de vale da estranheza, distorções, faixas de cor ou outros artefatos digitais.
`;

    if (maskFile) {
        prompt += `
**ÁREA ALVO (MÁSCARA):**
- Uma terceira imagem, uma máscara preta e branca, é fornecida.
- Você DEVE realizar a troca de rosto APENAS dentro da área branca desta máscara. A área preta deve permanecer completamente intocada.
- Esta máscara define precisamente a região do rosto alvo na imagem alvo.

**ORDEM DE ENTRADA:**
- Imagem 1: Imagem alvo (a cena e o corpo a serem usados).
- Imagem 2: Imagem fonte (o rosto a ser transplantado).
- Imagem 3: Imagem da máscara (a área a ser modificada na Imagem 1).
`;
    } else {
        prompt += `
**ORDEM DE ENTRADA:**
- Imagem 1: Imagem alvo (a cena e o corpo a serem usados).
- Imagem 2: Imagem fonte (o rosto a ser transplantado).
`;
    }

    prompt += `
**MODIFICAÇÕES DO USUÁRIO:**
-   Instruções do usuário: "${userPrompt || 'Nenhuma instrução adicional.'}"
-   Coisas a evitar: "${negativePrompt || 'Nenhuma instrução negativa.'}"

**SAÍDA:**
Uma única imagem fotorrealista de alta qualidade com a troca de rosto concluída de acordo com todas as instruções.`;

    const targetPart = await fileToPart(targetImageFile);
    const sourcePart = await fileToPart(sourceImageFile);
    // FIX: Explicitly type `parts` array to allow both image and text parts.
    const parts: any[] = [targetPart, sourcePart];

    if (maskFile) {
        const maskPart = await fileToPart(maskFile);
        parts.push(maskPart);
    }
    parts.push({ text: prompt });

    return generateImageWithGemini(
        'gemini-2.5-flash-image',
        { parts },
        setToast,
        { responseModalities: [Modality.IMAGE] }
    );
};

export const generateVideo = async (imageFile: File, prompt: string, aspectRatio: VideoAspectRatio, setToast: (toast: Toast | null) => void, setLoadingMessage: (message: string | null) => void): Promise<string> => {
    const ai = getAI();
    let operation;
    try {
        const imagePart = await fileToPart(imageFile);
        operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt,
            image: { imageBytes: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio,
            },
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Link para download do vídeo não encontrado.");
        
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("Erro na geração de vídeo:", error);
        const userFriendlyError = handleGeminiError(error);
        showToast(setToast, userFriendlyError, 'error');
        throw error;
    }
};

export const suggestToolFromPrompt = async (prompt: string): Promise<SmartSearchResult | null> => {
    return orchestrateTool(prompt);
};

export const generateAdjustedImage = async (imageFile: File, prompt: string, setToast: (toast: Toast | null) => void): Promise<string> => {
    const fullPrompt = `Ajuste esta imagem com base na seguinte descrição: "${prompt}". Mantenha o conteúdo da imagem, alterando apenas as cores e a luz.`;
    const imagePart = await fileToPart(imageFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, { text: fullPrompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const outpaintImage = async (imageFile: File, prompt: string, aspectRatio: string, setToast: (toast: Toast | null) => void): Promise<string> => {
    const fullPrompt = `Expanda esta imagem para uma proporção de ${aspectRatio}. Preencha as novas áreas com o seguinte conteúdo: ${prompt || 'continue a imagem de forma coerente'}.`;
    const imagePart = await fileToPart(imageFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, { text: fullPrompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const generateImageFromParts = async (parts: any[], setToast: (toast: Toast | null) => void): Promise<string> => {
    return generateImageWithGemini('gemini-2.5-flash-image', { parts }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const generateImageWithDescription = async (imageFile: File, description: string, setToast: (toast: Toast | null) => void): Promise<string> => {
    const imagePart = await fileToPart(imageFile);
    const textPart = { text: description };
    return generateImageFromParts([imagePart, textPart], setToast);
};

// FIX: Awaits file-to-part conversion before calling generateImageFromParts.
export const generateSuperheroFusion = (person: File, hero: File, setToast: (toast: Toast | null) => void): Promise<string> => {
    const prompt = "Faça a fusão da pessoa na primeira imagem com o super-herói na segunda imagem. Mantenha o rosto da primeira pessoa, mas aplique o traje e o estilo do herói.";
    const parts = Promise.all([fileToPart(person), fileToPart(hero)]);
    return parts.then(p => generateImageFromParts([...p, { text: prompt }], setToast));
};

export const generateCreativeFusion = (compositionFile: File, styleFiles: File[], setToast: (toast: Toast | null) => void): Promise<string> => {
    const prompt = "Use a composição da primeira imagem e aplique o estilo das imagens seguintes.";
    const parts = Promise.all([fileToPart(compositionFile), ...styleFiles.map(fileToPart)]);
    return parts.then(p => generateImageFromParts([...p, { text: prompt }], setToast));
};

export const generateAIPortrait = (style: string, personImages: File[], prompt: string, setToast: (toast: Toast | null) => void): Promise<string> => {
    const fullPrompt = `Crie um retrato no estilo '${style}' usando a(s) pessoa(s) da(s) imagem(ns). Instruções adicionais: ${prompt}`;
    const parts = Promise.all(personImages.map(fileToPart));
    return parts.then(p => generateImageFromParts([...p, { text: fullPrompt }], setToast));
};

export const generateMagicMontage = (imageFile: File, prompt: string, sourceImageFile: File, setToast: (toast: Toast | null) => void): Promise<string> => {
    const fullPrompt = `Execute a seguinte montagem: ${prompt}. Use a primeira imagem como base e a segunda imagem como fonte, se necessário.`;
    const parts = Promise.all([fileToPart(imageFile), fileToPart(sourceImageFile)]);
    return parts.then(p => generateImageFromParts([...p, { text: fullPrompt }], setToast));
};

export const generateDoubleExposure = (portraitFile: File, landscapeFile: File, setToast: (toast: Toast | null) => void): Promise<string> => {
    const prompt = "Crie um efeito de dupla exposição. Mescle a imagem de paisagem (segunda imagem) dentro da silhueta do retrato (primeira imagem).";
    const parts = Promise.all([fileToPart(portraitFile), fileToPart(landscapeFile)]);
    return parts.then(p => generateImageFromParts([...p, { text: prompt }], setToast));
};

export const getSceneryDescription = async (sceneryPrompt: string, location: { latitude: number, longitude: number }, setToast: (toast: Toast | null) => void): Promise<string> => {
    const ai = getAI();
    const prompt = `O usuário quer colocar um objeto em um cenário. O prompt dele é: "${sceneryPrompt}". A localização atual dele é latitude ${location.latitude}, longitude ${location.longitude}. Transforme o prompt do usuário em uma descrição de cenário rica e detalhada para um gerador de imagens. Se ele mencionar 'perto de mim' ou um local, use as coordenadas para inferir o ambiente. Retorne apenas a descrição do cenário.`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch(error) {
        showToast(setToast, handleGeminiError(error), 'error');
        throw error;
    }
};

export const generateProductPhoto = async (objectFile: File, sceneryPrompt: string, setToast: (toast: Toast | null) => void, setLoadingMessage: (message: string | null) => void): Promise<string> => {
    const prompt = `Coloque o objeto da imagem em um novo cenário descrito por: "${sceneryPrompt}". A iluminação no objeto deve corresponder à iluminação do novo cenário. O resultado deve ser fotorrealista.`;
    const imagePart = await fileToPart(objectFile);
    return generateImageWithGemini('gemini-2.5-flash-image', { parts: [imagePart, { text: prompt }] }, setToast, { responseModalities: [Modality.IMAGE] });
};

export const generateAnimationFromImage = async (imageFile: File, prompt: string, aspectRatio: VideoAspectRatio, setToast: (toast: Toast | null) => void, setLoadingMessage: (message: string | null) => void): Promise<string> => {
    const cacheKey = await generateCacheKey('veo-3.1-fast-generate-preview', imageFile, { prompt, aspectRatio });
    const cachedBlob = await db.loadImageFromCache(cacheKey);
    if (cachedBlob) {
        showToast(setToast, 'Animação carregada do cache.', 'info');
        return URL.createObjectURL(cachedBlob);
    }
    const resultUrl = await generateVideo(imageFile, prompt, aspectRatio, setToast, setLoadingMessage);
    const response = await fetch(resultUrl);
    const blob = await response.blob();
    await db.saveImageToCache(cacheKey, blob);
    URL.revokeObjectURL(resultUrl); // Clean up the initial blob URL
    return URL.createObjectURL(blob);
};

export const generateCharacter = (prompt: string, setToast: (toast: Toast | null) => void, setLoadingMessage: (message: string | null) => void) => generateImageFromText(prompt, '9:16', setToast, setLoadingMessage);
export const generateLogo = (prompt: string, setToast: (toast: Toast | null) => void, setLoadingMessage: (message: string | null) => void) => generateImageFromText(`logotipo vetorial minimalista, linhas simples e limpas, cores chapadas, alto contraste, adequado para uma marca, centrado em um fundo branco. Conceito: ${prompt}`, '1:1', setToast, setLoadingMessage);
export const generateSeamlessPattern = (prompt: string, setToast: (toast: Toast | null) => void, setLoadingMessage: (message: string | null) => void) => generateImageFromText(`padrão sem costura repetitivo. ${prompt}`, '1:1', setToast, setLoadingMessage);
export const generate3DModel = (prompt: string, setToast: (toast: Toast | null) => void, setLoadingMessage: (message: string | null) => void) => generateImageFromText(`renderização de modelo 3D fotorrealista de ${prompt}, iluminação de estúdio, fundo neutro.`, '1:1', setToast, setLoadingMessage);

export const generateSticker = (prompt: string, imageFile: File | undefined, setToast: (toast: Toast | null) => void, setLoadingMessage: (message: string | null) => void): Promise<string> => {
    const fullPrompt = `Crie um adesivo de vinil em estilo cartoon com uma borda branca espessa e um leve sombreamento. ${prompt}`;
    if (imageFile) {
        const imagePart = fileToPart(imageFile);
        return imagePart.then(part => generateImageWithGemini('gemini-2.5-flash-image', { parts: [part, { text: fullPrompt }] }, setToast, { responseModalities: [Modality.IMAGE] }));
    }
    return generateImageFromText(fullPrompt, '1:1', setToast, setLoadingMessage);
};

export const applyTextEffect = (imageFile: File, prompt: string, setToast: (toast: Toast | null) => void): Promise<string> => {
    const fullPrompt = `Aplique o seguinte efeito apenas ao texto na imagem: ${prompt}. Não altere o fundo ou outras partes da imagem.`;
    const imagePart = fileToPart(imageFile);
    return imagePart.then(part => generateImageWithGemini('gemini-2.5-flash-image', { parts: [part, { text: fullPrompt }] }, setToast, { responseModalities: [Modality.IMAGE] }));
};

export const convertToVector = (imageFile: File, prompt: string, setToast: (toast: Toast | null) => void): Promise<string> => {
    const fullPrompt = `Converta a imagem em uma ilustração vetorial limpa com um contorno branco espesso, como um adesivo. Instruções de estilo adicionais: ${prompt}`;
    const imagePart = fileToPart(imageFile);
    return imagePart.then(part => generateImageWithGemini('gemini-2.5-flash-image', { parts: [part, { text: fullPrompt }] }, setToast, { responseModalities: [Modality.IMAGE] }));
};

export const generateInteriorDesign = (imageFile: File, maskFile: File, roomType: string, roomStyle: string, prompt: string, setToast: (toast: Toast | null) => void): Promise<string> => {
    const fullPrompt = `Você é um designer de interiores de IA. Na área da imagem indicada pela máscara, redesenhe o espaço. Tipo de ambiente: ${roomType}. Estilo de design: ${roomStyle}. Instruções adicionais: ${prompt}. O resultado deve se misturar perfeitamente com as partes não mascaradas da imagem.`;
    const imagePart = fileToPart(imageFile);
    const maskPart = fileToPart(maskFile);
    return Promise.all([imagePart, maskPart]).then(([img, mask]) => generateImageWithGemini('gemini-2.5-flash-image', { parts: [img, mask, { text: fullPrompt }] }, setToast, { responseModalities: [Modality.IMAGE] }));
};

export const renderSketch = (sketchFile: File, prompt: string, setToast: (toast: Toast | null) => void, setLoadingMessage: (message: string | null) => void): Promise<string> => {
    const fullPrompt = `Transforme este esboço em uma imagem final com base na seguinte descrição: ${prompt}.`;
    const imagePart = fileToPart(sketchFile);
    return imagePart.then(part => generateImageWithGemini('gemini-2.5-flash-image', { parts: [part, { text: fullPrompt }] }, setToast, { responseModalities: [Modality.IMAGE] }));
};

export const generateLogoVariation = (logoFile: File, setToast: (toast: Toast | null) => void): Promise<string> => {
    const prompt = 'Gere uma variação deste logotipo, mantendo o conceito principal, mas explorando diferentes formas e arranjos.';
    const imagePart = fileToPart(logoFile);
    return imagePart.then(part => generateImageWithGemini('gemini-2.5-flash-image', { parts: [part, { text: prompt }] }, setToast, { responseModalities: [Modality.IMAGE] }));
};