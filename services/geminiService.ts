/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// FIX: Importação corrigida de @google/genai
import { GoogleGenAI, GenerateContentResponse, Modality, Part, Type } from "@google/genai";
import { fileToDataURL } from '../utils/imageUtils';
import { type PixelCrop } from 'react-image-crop';
import { createMaskFromCrop } from '../utils/imageUtils';
import { type DetectedObject } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const fileToPart = async (file: File): Promise<Part> => {
    const dataUrl = await fileToDataURL(file);
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("URL de dados inválida");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Não foi possível analisar o tipo MIME da URL de dados");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

export const handleApiResponse = (
    response: GenerateContentResponse,
): string => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        throw new Error(`Pedido bloqueado. Razão: ${blockReason}. ${blockReasonMessage || ''}`);
    }

    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        return `data:${mimeType};base64,${data}`;
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        throw new Error(`A geração de imagem parou inesperadamente. Razão: ${finishReason}.`);
    }
    
    // FIX: Acede à propriedade de texto diretamente da resposta.
    const textFeedback = response.text?.trim();
    throw new Error(`O modelo de IA não retornou uma imagem. ` + 
        (textFeedback ? `O modelo respondeu com texto: "${textFeedback}"` : "Isto pode ser devido a filtros de segurança. Tente reformular o seu prompt."));
};

// --- FERRAMENTAS GENERATIVAS ---

export const renderSketch = async (sketchImage: File, prompt: string): Promise<string> => {
    const imagePart = await fileToPart(sketchImage);
    const textPart = { text: `Você é uma IA de renderização arquitetónica/de produto. Use a imagem de esboço fornecida como base estrutural e composicional. Aplique o seguinte estilo e detalhes descritos no prompt: "${prompt}". O resultado deve ser uma imagem fotorrealista que respeite as linhas e formas do esboço original. Retorne APENAS a imagem final renderizada.` };
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const outpaintImage = async (image: File, prompt: string, newAspectRatio: string): Promise<string> => {
    const imagePart = await fileToPart(image);
    const textPart = { text: `Você é uma IA de outpainting. A imagem fornecida é o centro de uma cena maior. Expanda a imagem para preencher uma nova proporção de ${newAspectRatio}, gerando conteúdo que se integre perfeitamente com a imagem original em estilo, iluminação e contexto. Use esta descrição para guiar a expansão: "${prompt}". Retorne APENAS a imagem final expandida.` };
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const fuseImages = async (imageA: File, imageB: File): Promise<string> => {
    const imageAPart = await fileToPart(imageA);
    const imageBPart = await fileToPart(imageB);
    const textPart = { text: `Você é uma IA de fusão artística. A primeira imagem é a 'Composição', a segunda é o 'Estilo'. Combine os elementos estilísticos e temáticos da imagem de Estilo com os elementos composicionais da imagem de Composição para criar uma nova imagem coesa. O resultado deve ser uma fusão criativa e harmoniosa das duas entradas. Retorne APENAS a imagem final.` };
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imageAPart, imageBPart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generateImageVariation = async (image: File, strength: number): Promise<string> => {
    const imagePart = await fileToPart(image);
    const textPart = { text: `Crie uma variação criativa da imagem fornecida. Mantenha o assunto principal e a composição geral, mas introduza novas texturas, iluminação ou detalhes de fundo para oferecer uma nova perspetiva. A força da variação deve ser de aproximadamente ${strength}%. Retorne APENAS a imagem final.` };
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generateImageFromText = async (prompt: string, aspectRatio: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio as any,
        },
    });
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateProductPhoto = async (productImage: File, prompt: string): Promise<string> => {
    const imagePart = await fileToPart(productImage);
    const textPart = { text: `Você é um fotógrafo de produtos de IA. A imagem fornecida contém um objeto com um fundo simples ou inexistente. A sua tarefa é colocar este objeto num novo cenário fotográfico profissional descrito como: "${prompt}". O resultado deve ser fotorrealista, com iluminação de estúdio, sombras suaves e um fundo que complemente o produto. Retorne APENAS a imagem final composta.` };
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generateCharacter = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Crie um design de personagem de corpo inteiro, em pé, com um fundo branco, com base na seguinte descrição: ${prompt}.`,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '9:16',
        },
    });
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateInteriorDesign = async (
      baseImage: File,
      maskImage: File,
      roomType: string,
      roomStyle: string,
      userPrompt: string
): Promise<string> => {
      const baseImagePart = await fileToPart(baseImage);
      const maskImagePart = await fileToPart(maskImage);
      const prompt = `Você é um especialista em IA em design de interiores e renovação. Tarefa: Redesenhe e preencha a área selecionada (indicada pela máscara branca) da imagem base. Contexto do Ambiente: O espaço é um(a) ${roomType}. Estilo Desejado: Aplique um estilo ${roomStyle}. Instruções Adicionais do Utilizador: "${userPrompt}". Regras Críticas: 1. Preencha APENAS a área mascarada. Mantenha o resto da imagem original completamente intacto. 2. A integração deve ser fotorrealista, respeitando a iluminação, sombras e perspetiva existentes da imagem base. 3. O resultado final deve ser apenas a imagem completa e redesenhada.`;
      const textPart = { text: prompt };
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [baseImagePart, maskImagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
      });
      return handleApiResponse(response); 
};

export const faceSwap = async (sourceImage: File, targetImage: File): Promise<string> => {
    const sourcePart = await fileToPart(sourceImage);
    const targetPart = await fileToPart(targetImage);
    const prompt = `Você é um especialista em troca de rostos. Receberá duas imagens. A primeira imagem é a 'fonte' (contendo o rosto a ser usado) e a segunda é o 'alvo'. A sua tarefa é substituir o rosto da pessoa principal na imagem alvo pelo rosto da pessoa na imagem fonte. O resultado deve ser extremamente realista, misturando o rosto da fonte de forma transparente com o corpo, tom de pele e iluminação da imagem alvo. Preserve a expressão и o ângulo do rosto da fonte o máximo possível. Retorne apenas a imagem final editada.`;
    const textPart = { text: prompt };
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [sourcePart, targetPart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generateProfessionalPortrait = async (originalImage: File): Promise<string> => {
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `Você é um especialista em fotografia de retratos corporativos. A sua tarefa é transformar a imagem fornecida num retrato profissional de negócios. Mantenha a identidade e as características faciais da pessoa intactas. Substitua a roupa por um fato ou blazer de negócios elegante. Altere o fundo para um fundo de estúdio profissional e neutro (como cinza ou azul desfocado). Aplique iluminação de estúdio que realce as características da pessoa. O resultado final deve ser fotorrealista e de alta qualidade. Retorne APENAS a imagem final editada.`;
    const textPart = { text: prompt };
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generateVideo = async (prompt: string, aspectRatio: string): Promise<string> => {
    console.log(`Simulando geração de vídeo para o prompt: "${prompt}" com proporção: ${aspectRatio}`);
    // Simula uma chamada de API longa (ex: 5 segundos)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Retorna um URL de vídeo fictício codificado, conforme solicitado
    const dummyVideoUrl = "https://storage.googleapis.com/web-dev-assets/video-api-demo/20240506_145034_355_A_high-quality_realistic_video_of_a_man_in_a_suit_walking_through_a_busy_city_street.mp4";
    
    // Simula um erro potencial para teste
    if (prompt.toLowerCase().includes("error")) {
        throw new Error("Falha na geração de vídeo simulada, conforme solicitado.");
    }
    
    return dummyVideoUrl;
};


// --- FERRAMENTAS DE EDIÇÃO ---

export const removeBackground = async (image: File): Promise<string> => {
    const imagePart = await fileToPart(image);
    const textPart = { text: 'Remova o fundo desta imagem, deixando apenas o assunto principal. A saída deve ser um PNG com fundo transparente.' };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const applyStyle = async (image: File, stylePrompt: string): Promise<string> => {
    const imagePart = await fileToPart(image);
    const textPart = { text: `Redesenhe toda esta imagem no seguinte estilo artístico: "${stylePrompt}". Preserve a composição e os assuntos originais.` };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generateAdjustedImage = async (image: File, adjustmentPrompt: string): Promise<string> => {
    const imagePart = await fileToPart(image);
    const textPart = { text: `Aplique o seguinte ajuste a esta imagem: "${adjustmentPrompt}". Preserve o conteúdo e a composição originais.` };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generativeEdit = async (
    baseImage: File,
    prompt: string,
    mode: 'fill' | 'remove' | 'compose',
    options?: { maskImage?: File, secondImage?: File }
): Promise<string> => {
    const parts: Part[] = [await fileToPart(baseImage)];
    let textPrompt = '';

    switch (mode) {
        case 'fill':
            if (!options?.maskImage) throw new Error("A máscara é necessária para o modo de preenchimento.");
            parts.push(await fileToPart(options.maskImage));
            textPrompt = `Preencha generativamente a área mascarada da imagem com: "${prompt}". Corresponda ao estilo e iluminação da imagem original.`;
            break;
        case 'remove':
            if (!options?.maskImage) throw new Error("A máscara é necessária para o modo de remoção.");
            parts.push(await fileToPart(options.maskImage));
            textPrompt = `Remova generativamente o objeto na área mascarada. Preencha o espaço com conteúdo de fundo realista que corresponda aos píxeis circundantes.`;
            break;
        case 'compose':
            if (!options?.secondImage) throw new Error("A segunda imagem é necessária para o modo de composição.");
            parts.push(await fileToPart(options.secondImage));
            textPrompt = `Combine estas duas imagens com base nas seguintes instruções: "${prompt}".`;
            break;
    }
    parts.push({ text: textPrompt });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const upscaleImage = async (image: File, factor: number, preserveFace: boolean): Promise<string> => {
    const imagePart = await fileToPart(image);
    const prompt = `Aumente a escala desta imagem por um fator de ${factor}x. Melhore os detalhes e a nitidez. ${preserveFace ? 'Preste atenção especial para preservar e melhorar as características faciais de forma realista.' : ''}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const reacenderImage = async (originalImage: File, userPrompt: string): Promise<string> => {
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `Você é uma IA especialista em fotografia. Sua tarefa é ajustar a iluminação da imagem com base na seguinte instrução, sem alterar a composição da foto. O resultado deve ser fotorrealista. Instrução: "${userPrompt}". Saída: Retorne APENAS a imagem final com a nova iluminação.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generateMask = async (image: File): Promise<string> => {
    const imagePart = await fileToPart(image);
    const prompt = 'Analise esta imagem e gere uma máscara a preto e branco do assunto mais proeminente. O assunto deve ser branco e o fundo preto. Retorne apenas a imagem da máscara.';
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const detectObjects = async (image: File): Promise<DetectedObject[]> => {
    const imagePart = await fileToPart(image);
    const textPart = { text: "Analise a imagem e identifique todos os objetos distintos. Para cada objeto, forneça o seu nome e as coordenadas da caixa delimitadora normalizadas (de 0.0 a 1.0). A sua resposta DEVE ser apenas um array JSON válido." };

    const responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: {
              type: Type.STRING,
              description: "O nome do objeto detetado.",
            },
            box: {
              type: Type.OBJECT,
              properties: {
                x_min: { type: Type.NUMBER },
                y_min: { type: Type.NUMBER },
                x_max: { type: Type.NUMBER },
                y_max: { type: Type.NUMBER },
              },
              required: ["x_min", "y_min", "x_max", "y_max"],
            },
          },
          required: ["label", "box"],
        },
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        const objects = JSON.parse(jsonText);
        if (!Array.isArray(objects)) {
            throw new Error("A resposta da API não é um array.");
        }
        return objects as DetectedObject[];
    } catch (e) {
        console.error("Falha ao analisar JSON do Gemini:", response.text);
        throw new Error("Falha ao analisar a resposta de deteção de objetos da IA.");
    }
};

export const generateLowPoly = async (originalImage: File): Promise<string> => {
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `Converta a imagem para um estilo artístico Low Poly. Reduza a imagem a formas geométricas triangulares e poligonais, usando uma paleta de cores limitada, sem perder o reconhecimento do objeto original. Saída: Retorne APENAS a imagem final no estilo Low Poly.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const wonderModelUpscale = async (originalImage: File): Promise<string> => {
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `
        Sua tarefa é aprimorar a imagem de entrada usando um "Modelo MAX Padrão" de última geração.
        A prioridade é restaurar a imagem, focando em:
        1. Aumentar a resolução e os detalhes de forma fotorrealista.
        2. Aumentar a nitidez de forma inteligente, sem introduzir artefatos.
        3. Remover ruído e imperfeições.
        4. Recuperar e preencher áreas que parecem "irrecuperáveis".
        O resultado deve ser uma imagem de alta qualidade, nítida e sem ruídos, pronta para uso profissional.
        Saída: Retorne APENAS a imagem final aprimorada.
    `;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const extractArt = async (originalImage: File): Promise<string> => {
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `Você é um artista de IA. Sua tarefa é analisar a imagem fornecida e extrair a arte de linha principal, como se fosse um esboço a lápis ou tinta. Ignore as cores e foque nas formas e contornos. O resultado deve ser uma imagem em preto e branco limpa que se pareça com um desenho. Retorne APENAS a imagem da arte de linha.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const applyDustAndScratch = async (originalImage: File): Promise<string> => {
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `
        Aplique um efeito de "filme antigo" ou "vintage" à imagem.
        Adicione artefatos visuais característicos como:
        - Poeira e sujeira, com pequenas partículas se movendo pela tela.
        - Arranhões visíveis e finos, com textura de filme desgastado.
        - Granulação e ruído de filme analógico para um visual autêntico.
        - Ajustes sutis de cor para simular a degradação de cor de filmes antigos, como tons sépia ou desbotados.
        Mantenha a composição e os objetos principais da imagem intactos.
        O resultado deve ser uma imagem única com o estilo de filme antigo.
        Saída: Retorne APENAS a imagem final editada.
    `;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};