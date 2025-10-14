/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality, Part, Type } from "@google/genai";
import { fileToDataURL, dataURLtoFile } from '../utils/imageUtils';
import { type DetectedObject, type ToolId } from '../types';
import { smartSearchToolDeclarations } from './smartSearchToolDeclarations';
import { applyBackgroundColor } from '../utils/imageProcessing';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const CRITICAL_FACIAL_PRESERVATION_DIRECTIVE = `\n\n**Diretriz de Execução de Nível Máximo: Preservação da Identidade Facial Original**\nA prioridade absoluta é a preservação da identidade facial original. O sistema NÃO deve descaracterizar o rosto. A face deve ser mantida 100% fiel e inalterada em suas características essenciais:\n1. **Traços Faciais Únicos:** Preservar a forma exata dos olhos, nariz, boca e contorno do maxilar.\n2. **Expressões Sutis:** Manter fidelidade às micro-expressões e linhas de expressão que definem a personalidade.\n3. **Singularidades:** Manter pequenas imperfeições como sardas, cicatrizes, pintas ou assimetrias que são cruciais para a singularidade e reconhecimento do indivíduo.\n4. **Consistência:** O resultado final deve ser realista e respeitoso com a aparência original da pessoa, evitando qualquer geração de "rosto genérico" ou "máscara".`;

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

const handleGenAIResponse = <T extends GenerateContentResponse>(response: T): T => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        throw new Error(`Pedido bloqueado. Razão: ${blockReason}. ${blockReasonMessage || ''}`);
    }
    return response;
};

const extractBase64Image = (response: GenerateContentResponse): string => {
    // Safely access parts using optional chaining. This prevents the "reading 'parts' of undefined" error.
    const parts = response.candidates?.[0]?.content?.parts;

    if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
    }
    
    // If no image part is found, provide a more informative error message.
    const textResponse = response.text?.trim();
    if (textResponse) {
        throw new Error(`A IA respondeu com texto em vez de uma imagem: "${textResponse}"`);
    }
    throw new Error('Nenhuma imagem foi gerada pelo modelo. A resposta pode estar vazia ou bloqueada por políticas de segurança.');
};

export const generateImageFromParts = async (parts: Part[], model: string = 'gemini-2.5-flash-image'): Promise<string> => {
    const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    handleGenAIResponse(response);
    return extractBase64Image(response);
};

const singleImageAndTextToImage = async (image: File, prompt: string): Promise<string> => {
    const imagePart = await fileToPart(image);
    return generateImageFromParts([imagePart, { text: prompt }]);
};

export const validatePromptSpecificity = async (prompt: string, toolContext: string): Promise<{ isSpecific: boolean, suggestion: string }> => {
    // Prompts com menos de 3 palavras são provavelmente genéricos.
    if (prompt.trim().split(/\s+/).length < 3) {
        return {
            isSpecific: false,
            suggestion: 'Seu prompt parece um pouco vago. Tente adicionar mais detalhes para obter um resultado melhor!',
        };
    }

    const validationPrompt = `
        Analise o prompt do usuário para uma ferramenta de imagem de IA. O prompt do usuário é: "${prompt}".

        Sua tarefa é determinar se o prompt é específico o suficiente para uma imagem interessante e de alta qualidade e fornecer sugestões úteis, se não for.

        Um bom prompt específico inclui detalhes sobre:
        - Assunto e Ação: O que está acontecendo?
        - Estilo Artístico: É uma 'fotografia', 'pintura a óleo', 'arte conceitual de fantasia', 'ilustração cyberpunk'?
        - Iluminação: 'contraluz dramático', 'luz suave da manhã', 'brilho de neon'.
        - Composição: 'retrato em close-up', 'vista panorâmica ampla', 'tomada de baixo ângulo'.
        - Elementos Específicos: 'vestindo uma jaqueta vermelha', 'com uma floresta enevoada ao fundo'.

        Um prompt genérico é curto e vago, como "um cachorro", "uma bela paisagem".

        Com base nisso, responda SOMENTE com um objeto JSON com dois campos:
        1. "isSpecific": um booleano (true se o prompt for específico, false se for muito genérico).
        2. "suggestion": uma string em português do Brasil.
           - Se o prompt for genérico, forneça uma sugestão criativa e encorajadora para melhorá-lo. Por exemplo, se o usuário escreveu "um cachorro", sugira algo como: "Tente adicionar detalhes! Que tal 'Um filhote de golden retriever brincando em um campo de flores, com iluminação suave do pôr do sol, estilo fotografia profissional'?"
           - Seja específico e dê um exemplo concreto. Mencione estilo, iluminação e composição.
           - Se o prompt já for específico, pode ser uma string vazia.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: validationPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isSpecific: { type: Type.BOOLEAN, description: "O prompt é específico o suficiente?" },
                        suggestion: { type: Type.STRING, description: "Sugestão de melhoria em português do Brasil." },
                    },
                    required: ['isSpecific', 'suggestion'],
                }
            }
        });
        
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;
    } catch (e) {
        console.error("A validação do prompt falhou, assumindo como específico.", e);
        // Falha aberta: se a validação falhar, assuma que o prompt é bom para não bloquear o usuário.
        return { isSpecific: true, suggestion: '' };
    }
};

// --- Implementations for all missing functions ---

export const generateImageFromText = async (prompt: string, aspectRatio: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
        },
    });
    const base64ImageBytes: string | undefined = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) {
      throw new Error('Nenhuma imagem foi gerada pelo modelo de geração de imagens. A resposta pode estar vazia ou bloqueada por políticas de segurança.');
    }
    return `data:image/png;base64,${base64ImageBytes}`;
};

export const renderSketch = (sketchImage: File, prompt: string) => singleImageAndTextToImage(sketchImage, `Renderização fotorrealista de um esboço de '${prompt}'. Iluminação de estúdio, alta qualidade, 8k.`);

export const generateCharacter = (prompt: string) => {
    const fullPrompt = `Full body character concept sheet, dynamic pose. ${prompt}. Cinematic lighting, detailed background, 8k, high quality.`;
    return generateImageFromText(fullPrompt, '9:16');
};

export const generateLogo = (prompt: string) => {
    const fullPrompt = `Minimalist vector logo, ${prompt}. Simple, clean lines, flat colors, high contrast, suitable for a brand. Centered on a white background.`;
    return generateImageFromText(fullPrompt, '1:1');
};

export const generateLogoVariation = (sourceImage: File): Promise<string> => {
    const prompt = "Generate a slight variation of this logo. Keep the same subject and minimalist vector style, but subtly alter the line work, shapes, or composition. Maintain the 1:1 aspect ratio and high contrast on a white background.";
    return singleImageAndTextToImage(sourceImage, prompt);
};

export const generate3DModel = (prompt: string) => {
    const fullPrompt = `A 3D model render of ${prompt}. Octane render, photorealistic materials, studio lighting with soft shadows, 4k resolution, on a simple gray background.`;
    return generateImageFromText(fullPrompt, '1:1');
};

export const generateSeamlessPattern = (prompt: string) => {
    const fullPrompt = `A seamless, tileable pattern of ${prompt}. Flat design, vector style, vibrant colors.`;
    return generateImageFromText(fullPrompt, '1:1');
};

export const generateSticker = async (prompt: string, sourceImage?: File): Promise<string> => {
    if (sourceImage) {
        const fullPrompt = `Based on the provided image, create a cute die-cut vinyl sticker with a thick white border. The style should be illustrative and cartoonish. Additional instructions: ${prompt}`;
        return singleImageAndTextToImage(sourceImage, fullPrompt);
    }
    const fullPrompt = `A cute die-cut vinyl sticker of ${prompt}, illustrative cartoon style, with a thick white border, on a simple grey background for contrast.`;
    return generateImageFromText(fullPrompt, '1:1');
};

export const applyTextEffect = (sourceImage: File, prompt: string): Promise<string> => {
    const fullPrompt = `Apply a visual effect to the text in this image based on the following description: ${prompt}. Only modify the text, keeping the rest of the image intact.`;
    return singleImageAndTextToImage(sourceImage, fullPrompt);
};

export const convertToVector = (sourceImage: File, stylePrompt?: string): Promise<string> => {
    let fullPrompt = "Convert this image into a clean vector graphic with a die-cut sticker style. It must have clean lines, flat solid colors, and simplified shapes. The final result must have a thick white border around the main subject, making it look like a vinyl sticker.";
    if (stylePrompt && stylePrompt.trim()) {
        fullPrompt += ` Additional style instructions for the sticker's content: ${stylePrompt}`;
    }
    return singleImageAndTextToImage(sourceImage, fullPrompt);
};

export const generateMagicMontage = async (sourceImage: File, prompt: string, secondImage?: File): Promise<string> => {
    const sourcePart = await fileToPart(sourceImage);
    const parts: Part[] = [
        { text: "Esta é a imagem base principal para edição:" },
        sourcePart,
    ];

    if (secondImage) {
        const secondPart = await fileToPart(secondImage);
        parts.push({ text: "Esta é uma segunda imagem opcional para incorporar na edição:" });
        parts.push(secondPart);
    }

    let fullPrompt = `Instruções de edição: ${prompt}`;

    const retouchKeywords = [
        'mancha', 'sarda', 'espinha', 'ruga', 'olheira', 'imperfeição', 'pele', 'dente',
        'olho', 'retocar', 'suavizar', 'clarear', 'remover', 'apagar', 'corrigir', 'iluminação',
        'blemish', 'freckle', 'pimple', 'wrinkle', 'dark circle', 'imperfection', 'skin',
        'tooth', 'teeth', 'eye', 'retouch', 'soften', 'whiten', 'remove', 'erase', 'correct', 'lighting'
    ];

    const lowerCasePrompt = prompt.toLowerCase();
    const isRetouchRequest = retouchKeywords.some(keyword => lowerCasePrompt.includes(keyword));

    if (isRetouchRequest) {
        const reinforcement = `\n\n**Diretriz de Execução de Nível Máximo: Coerência Visual Global e Preservação de Identidade**
Para qualquer edição facial solicitada (retoques de pele, ajustes de iluminação, etc.), as seguintes regras são OBRIGATÓRIAS e devem ser seguidas com precisão absoluta:
1.  **Análise de Contexto Total:** Antes de qualquer modificação, o sistema DEVE analisar a iluminação, a temperatura de cor e o tom de pele de TODA A IMAGEM, incluindo o corpo visível (pescoço, colo, mãos, braços), o fundo e o ambiente geral.
2.  **Propagação Coerente de Efeitos:** Qualquer ajuste aplicado ao rosto (seja iluminação, cor, textura da pele, etc.) DEVE ser propagado de forma suave, natural e logicamente consistente para TODAS as outras áreas de pele visíveis na imagem. O objetivo é garantir a UNIFORMIDADE do tom de pele e da iluminação em toda a pessoa.
3.  **Prioridade Máxima no Realismo:** A prioridade é manter a consistência da fonte de luz original e a harmonia da composição. O resultado final NÃO PODE ter discrepâncias de cor ou luz entre o rosto e o resto do corpo. O efeito de "máscara", onde o rosto parece desconectado do corpo, é inaceitável e deve ser evitado a todo custo.
4.  **Preservação Facial:** Juntamente com a coerência global, a identidade facial original deve ser preservada. ${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;
        fullPrompt += reinforcement;
    }

    parts.push({ text: fullPrompt });

    return generateImageFromParts(parts);
};

const processVideoGeneration = async (request: any): Promise<string> => {
    let operation = await ai.models.generateVideos(request);
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('A geração de vídeo falhou ou não retornou um URI.');
    }
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Falha ao baixar o vídeo: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};

export const generateVideo = (prompt: string, aspectRatio: string): Promise<string> => {
    return processVideoGeneration({
        model: 'veo-2.0-generate-001',
        prompt,
        config: { aspectRatio }
    });
};

export const generateAnimationFromImage = async (sourceImage: File, prompt: string): Promise<string> => {
    const dataUrl = await fileToDataURL(sourceImage);
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mimeType = mimeMatch?.[1] || sourceImage.type;
    const data = arr[1];

    return processVideoGeneration({
        model: 'veo-2.0-generate-001',
        prompt,
        image: { imageBytes: data, mimeType },
    });
};

export const generateInteriorDesign = async (image: File, mask: File, roomType: string, roomStyle: string, prompt: string): Promise<string> => {
    const imagePart = await fileToPart(image);
    const maskPart = await fileToPart(mask);
    const textPrompt = `Com base na foto de um(a) ${roomType}, redesenhe a área mascarada para se adequar a um estilo ${roomStyle}. Use as seguintes instruções: ${prompt}. O resultado deve ser fotorrealista, com iluminação e sombras consistentes, e se integrar perfeitamente ao resto da imagem. Apenas a área mascarada deve ser alterada.`;
    const textPart = { text: textPrompt };
    return generateImageFromParts([imagePart, maskPart, textPart]);
};

export const fuseImages = async (compositionImage: File, styleImages: File[]): Promise<string> => {
    const compositionPart = await fileToPart(compositionImage);
    const parts: Part[] = [
        { text: "Imagem 1 (Composição): Utilize a estrutura e os objetos desta imagem como base." },
        compositionPart,
    ];

    for (const [index, file] of styleImages.entries()) {
        parts.push({ text: `Imagem ${index + 2} (Estilo): Aplique o estilo artístico, cores e iluminação desta imagem na Imagem 1.` });
        parts.push(await fileToPart(file));
    }

    parts.push({ text: "Instrução: Combine a composição da Imagem 1 com os estilos de todas as outras imagens fornecidas, criando uma fusão criativa e coerente." });

    return generateImageFromParts(parts);
};

export const outpaintImage = (sourceImage: File, userPrompt: string, aspectRatio: string): Promise<string> => {
    const fullPrompt = `Tarefa: Executar uma Pintura Expansiva (Outpainting) com tecnologia de Rede de Difusão e **coerência contextual perfeita**.

**Instruções de Expansão (Outpainting):**
1.  **Objetivo:** Expanda a imagem fornecida para a proporção final de ${aspectRatio}.
2.  **Diretriz Primária:** Preencha as novas áreas geradas com conteúdo que **logicamente e perfeitamente estenda a cena original**.
3.  **Fidelidade Contextual (Regra Máxima - Nível Imax):** O novo conteúdo DEVE manter **100% de consistência** com a imagem original em todos os aspectos. Isso inclui:
    * **Estilo e Textura:** Replicar exatamente o tipo de arte (fotografia, ilustração, pintura) e textura.
    * **Iluminação e Sombras:** Replicar as fontes de luz, a direção, a intensidade e as sombras para que o novo ambiente pareça fisicamente coerente com o original.
    * **Blending Perfeito:** As novas áreas devem ser **totalmente indistinguíveis** das áreas originais, criando uma transição suave e coesa (pixel por pixel).
4.  **Instruções Adicionais para o Preenchimento (Prioridade Secundária - Adições/Detalhes):** ${userPrompt}
5.  **Qualidade Final:** A imagem resultante deve ser **hiper-realista, nítida** e manter a resolução de impressão (4K/8K).`;
    return singleImageAndTextToImage(sourceImage, fullPrompt);
};

export const generateProductPhoto = (sourceImage: File, prompt: string): Promise<string> => {
    const fullPrompt = `A foto de um produto com o fundo já removido é fornecida. Coloque este produto em uma nova cena fotorrealista com base na seguinte descrição: ${prompt}. Garanta que o produto se integre perfeitamente à nova cena, com iluminação dramática, sombras e reflexos realistas que correspondam ao ambiente. O foco deve ser destacar o produto de forma atraente, com alta resolução, foco em micro-detalhes para garantir qualidade de estúdio.`;
    return singleImageAndTextToImage(sourceImage, fullPrompt);
};

export const restorePhoto = (image: File, colorize: boolean = false) => {
    let prompt = "Tarefa: Restauração de Fotografia Mestra. Transforme esta foto antiga ou danificada em uma versão impecável e de alta fidelidade. O objetivo é uma restauração completa que aborde todos os aspectos da degradação da imagem. Corrija todos os defeitos físicos como arranhões, poeira, rasgos e manchas. Elimine completamente o ruído digital e a granulação do filme, resultando em uma imagem limpa. Melhore a nitidez geral e realce os micro-detalhes e texturas que podem ter sido perdidos com o tempo. Se houver rostos, reconstrua e aprimore as características faciais com clareza e realismo excepcionais. O resultado final deve ser uma fotografia perfeitamente restaurada, pronta para impressão em alta qualidade. Aumente a resolução da imagem em 1.5 vezes o tamanho original, melhorando a clareza e os detalhes.";
    if (colorize) {
        prompt += " Além disso, se a imagem for em preto e branco ou sépia, aplique cores realistas e historicamente precisas.";
    }
    prompt += CRITICAL_FACIAL_PRESERVATION_DIRECTIVE;
    return singleImageAndTextToImage(image, prompt);
};
export const generateImageVariation = (sourceImage: File, strength: number): Promise<string> => singleImageAndTextToImage(sourceImage, `Generate a variation of this image. The variation strength should be around ${strength}%.`);
export const applyStyle = (image: File, stylePrompt: string) => singleImageAndTextToImage(image, `Apply the following artistic style to this image: ${stylePrompt}`);
export const removeBackground = (image: File) => singleImageAndTextToImage(image, `Remove the background of this image, leaving only the main subject with a transparent background. Ensure high-quality, precise subject segmentation, preserving fine details like hair and fur.${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`);
export const generateAdjustedImage = (image: File, adjustmentPrompt: string) => {
    const fullPrompt = `Adjust this image based on the following description: ${adjustmentPrompt}${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;
    return singleImageAndTextToImage(image, fullPrompt);
};
export const reacenderImage = (image: File, prompt: string) => singleImageAndTextToImage(image, `Relight this image according to the following description: ${prompt}${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`);
export const generateLowPoly = (image: File) => singleImageAndTextToImage(image, "Convert this image into a low-poly art style.");
export const extractArt = (image: File) => singleImageAndTextToImage(image, "Extract the line art from this image, creating a black and white sketch of the main contours.");
export const applyDustAndScratch = (image: File) => singleImageAndTextToImage(image, `Apply a vintage film effect to this image, adding realistic dust and scratches.${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`);

export const denoiseImage = (image: File) => {
    let prompt = "Tarefa: Redução de Ruído e Denoise Profissional. Remova completamente o ruído e a granulação digital ou de filme da imagem, preservando os detalhes importantes da foto. Aumente a nitidez e o micro-contraste sutilmente. Evite borrões ou aparência de 'pintura a óleo'.";
    prompt += CRITICAL_FACIAL_PRESERVATION_DIRECTIVE;
    return singleImageAndTextToImage(image, prompt);
}

export const applyFaceRecovery = (image: File) => {
    let prompt = "Tarefa: Recuperação Facial e Aprimoramento. Se rostos estiverem presentes, utilize a IA para reconstruir e aprimore as características faciais com alto realismo e clareza. Foco em olhos, pele e boca. Não altere o resto da imagem. Apenas aprimore as áreas faciais.";
    prompt += CRITICAL_FACIAL_PRESERVATION_DIRECTIVE;
    return singleImageAndTextToImage(image, prompt);
}

export const generateProfessionalPortrait = (image: File): Promise<string> => {
    const promptTemplate = "Close-up de um headshot profissional de [ASSUNTO]. A pessoa está vestindo uma roupa profissional de negócios, com um fundo de escritório desfocado. A iluminação é suave e uniforme, destacando as características faciais da pessoa. A foto deve ser tirada com uma câmera DSLR de alta qualidade, resultando em uma imagem nítida e de alta resolução.";
    return generateImageWithDescription(image, promptTemplate);
};
export const upscaleImage = (image: File, factor: number, preserveFace: boolean) => singleImageAndTextToImage(image, `Upscale this image by a factor of ${factor}. ${preserveFace ? `Pay special attention to preserving and enhancing facial details realistically. ${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}` : ''}`);
export const unblurImage = (image: File, sharpenLevel: number, denoiseLevel: number, model: string) => singleImageAndTextToImage(image, `Correct the blur in this image. The blur type seems to be ${model}. Apply sharpening at ${sharpenLevel}% and noise reduction at ${denoiseLevel}%.${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`);

export const applyGenerativeSharpening = (image: File, intensity: number): Promise<string> => {
    const prompt = `Aumentar a nitidez da imagem em ${intensity}%, com foco principal em realçar micro-contrastes e texturas sutis, especialmente em áreas de transição de cor e elementos de superfície, sem introduzir artefatos visuais ou granulação excessiva. Priorizar detalhes finos como fios de cabelo, texturas de tecido ou imperfeições de superfície.${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;
    return singleImageAndTextToImage(image, prompt);
};

export const enhanceResolutionAndSharpness = (image: File, factor: number, intensity: number, preserveFace: boolean) => {
    const prompt = `Upscale this image by a factor of ${factor}x, and simultaneously apply generative sharpening at an intensity of ${intensity}%. The goal is to significantly improve both the resolution (making it larger and clearer) and the perceived sharpness and detail of the image. The final image should be crisp and high-quality. ${preserveFace ? `Pay special attention to preserving and enhancing facial details realistically. ${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}` : ''}`;
    return singleImageAndTextToImage(image, prompt);
};

export const generativeEdit = async (image: File, prompt: string, options: { maskImage?: File, secondImage?: File }): Promise<string> => {
    const parts: Part[] = [{ text: "Esta é a imagem base para edição:" }, await fileToPart(image)];

    if (options.secondImage) {
        parts.push({ text: "Esta é uma segunda imagem para usar na composição:" }, await fileToPart(options.secondImage));
    }

    if (options.maskImage) {
        parts.push({ text: "Esta é a máscara que define a área de edição:" }, await fileToPart(options.maskImage));
    }

    parts.push({ text: `Instruções de edição: ${prompt}` });

    return generateImageFromParts(parts);
};

export const suggestToolFromPrompt = async (prompt: string): Promise<{name: string, args: any} | null> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ functionDeclarations: smartSearchToolDeclarations }],
        }
    });
    handleGenAIResponse(response);
    const functionCall = response.functionCalls?.[0];
    if (functionCall) {
        return { name: functionCall.name, args: functionCall.args };
    }
    return null;
};

export const generateMask = (image: File): Promise<string> => singleImageAndTextToImage(image, "Analyze this image and identify the main subject. Generate a black and white mask where the main subject is white and the background is black.");

export const detectObjects = async (image: File, prompt: string = "Detect up to 3 of the most prominent objects in this image, ranked by visual importance (size, focus, centrality). Provide their labels and normalized bounding boxes."): Promise<DetectedObject[]> => {
    const imagePart = await fileToPart(image);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, {text: prompt}] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              objects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING, description: 'The name of the detected object.' },
                    box: {
                      type: Type.OBJECT,
                      description: 'The normalized bounding box coordinates (0.0 to 1.0).',
                      properties: {
                        x_min: { type: Type.NUMBER },
                        y_min: { type: Type.NUMBER },
                        x_max: { type: Type.NUMBER },
                        y_max: { type: Type.NUMBER },
                      },
                      required: ['x_min', 'y_min', 'x_max', 'y_max'],
                    },
                  },
                  required: ['label', 'box'],
                },
              },
            },
            required: ['objects'],
          },
        },
    });
    handleGenAIResponse(response);
    try {
        const jsonResponse = JSON.parse(response.text);
        return (jsonResponse.objects as DetectedObject[]) || [];
    } catch (e) {
        console.error("Failed to parse JSON from object detection", e);
        return [];
    }
};

export const detectFaces = (image: File): Promise<DetectedObject[]> => {
    return detectObjects(image, "Detect all human faces in this image and provide their labels and normalized bounding boxes.");
};

export const retouchFace = async (image: File, mask: File): Promise<string> => {
    const imagePart = await fileToPart(image);
    const maskPart = await fileToPart(mask);
    const textPrompt = `Using the provided mask (second image), perform a professional-grade facial retouch on the person in the original image (first image). Actions to perform ONLY in the masked area:
1.  **Skin Smoothing:** Subtly smooth skin texture to reduce fine lines and imperfections, while preserving natural skin pores. Do not make it look plastic.
2.  **Blemish Removal:** Remove minor blemishes, spots, or acne.
3.  **Eye Enhancement:** Gently brighten the whites of the eyes and slightly enhance the iris color and sharpness.
4.  **Teeth Whitening:** If teeth are visible and yellowed, whiten them to a natural shade.
5.  **Shadow Reduction:** Lightly reduce harsh shadows under the eyes.
The result must look natural, realistic, and seamlessly blended with the unmasked parts of the image. ${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;
    
    const textPart = { text: textPrompt };
    return generateImageFromParts([imagePart, maskPart, textPart]);
};

export const generateCaricature = async (images: File[], prompt: string): Promise<string> => {
    const imageParts = await Promise.all(images.map(fileToPart));
    const textPart = { text: `Create a single caricature combining the features of the people in all provided images. Style instructions: ${prompt}` };
    return generateImageFromParts([...imageParts, textPart]);
};

export const applyDisneyPixarStyle = (image: File, prompt: string): Promise<string> => singleImageAndTextToImage(image, `Transform this portrait into a character in the Disney Pixar 3D animation style. Additional instructions: ${prompt}.${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`);
export const generate3DMiniature = (image: File, prompt:string): Promise<string> => singleImageAndTextToImage(image, `Turn the person in this photo into a 3D toy miniature. Additional instructions: ${prompt}.${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`);
export const generate90sYearbookPortrait = (image: File, prompt: string): Promise<string> => singleImageAndTextToImage(image, `Transform this photo into a 90s yearbook portrait. It should have the characteristic soft focus, studio lighting, and background of that era. Additional instructions: ${prompt}.${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`);

export const generateStyledPortrait = async (personImage: File, styleImages: File[], prompt: string, negativePrompt: string): Promise<string> => {
    const personPart = await fileToPart(personImage);
    const parts: Part[] = [
        { text: "Imagem 1 (Pessoa): O rosto e a identidade desta pessoa devem ser preservados em 100%." },
        personPart,
    ];
    
    // Adiciona todas as imagens de estilo (suporte a múltiplas imagens)
    for (const [index, file] of styleImages.entries()) {
        const stylePart = await fileToPart(file);
        parts.push({ text: `Imagem ${index + 2} (Estilo ${index + 1}): Aplique o cenário, a iluminação e as roupas desta imagem na Pessoa (Imagem 1).` });
        parts.push(stylePart);
    }

    let textPrompt = `Instrução principal: Aplique o estilo (roupa, fundo, iluminação) de TODAS as imagens de estilo na pessoa da Imagem 1, garantindo que o rosto e cabelo não sejam alterados.`;
    
    // Adiciona o prompt e o prompt negativo para modificações adicionais
    if (prompt) {
        textPrompt += ` Instruções de refinamento: ${prompt}.`;
    }
    if (negativePrompt) {
        textPrompt += ` Evite o seguinte: ${negativePrompt}.`;
    }

    textPrompt += `${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`; // Prioriza a preservação facial
    parts.push({ text: textPrompt });
    
    return generateImageFromParts(parts);
};

export const generateStudioPortrait = (personImage: File, mainPrompt: string, negativePrompt: string): Promise<string> => {
    const fullPrompt = `${mainPrompt} ${negativePrompt ? `Avoid the following elements: ${negativePrompt}.` : ''}${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;
    return singleImageAndTextToImage(personImage, fullPrompt);
};

export const generatePolaroidWithCelebrity = async (personImage: File, celebrityImage: File, negativePrompt: string): Promise<string> => {
    const personPart = await fileToPart(personImage);
    const celebrityPart = await fileToPart(celebrityImage);
    const textPrompt = `Create a realistic polaroid-style photo featuring the person from the first image and the celebrity from the second image together. They should look like they are in the same photo, interacting naturally. Avoid the following: ${negativePrompt}.
\n\n**Diretriz de Execução de Nível Máximo: Preservação da Identidade Facial Original de AMBAS as pessoas**
A prioridade absoluta é a preservação da identidade facial original de AMBAS as pessoas nas fotos. O sistema NÃO deve descaracterizar NENHUM dos rostos. As faces devem ser mantidas 100% fiéis e inalteradas em suas características essenciais:
1.  **Traços Faciais Únicos:** Preservar a forma exata dos olhos, nariz, boca e contorno do maxilar de cada pessoa.
2.  **Expressões Sutis:** Manter fidelidade às micro-expressões e linhas de expressão de cada pessoa.
3.  **Singularidades:** Manter pequenas imperfeições como sardas, cicatrizes ou pintas que são cruciais para o reconhecimento de cada indivíduo.
4.  **Consistência:** O resultado final deve ser realista e respeitoso com a aparência original das pessoas, evitando a geração de "rostos genéricos" ou "máscaras".`;
    return generateImageFromParts([personPart, celebrityPart, { text: textPrompt }]);
};

export const generateImageWithDescription = async (image: File, promptTemplate: string): Promise<string> => {
    // Step 1: Analyze the image to get a description
    const imagePartForDesc = await fileToPart(image);
    const descriptionPrompt = { text: "Descreva de forma concisa o assunto principal nesta imagem (por exemplo, 'um homem de cabelo castanho vestindo uma jaqueta azul' ou 'um cachorro golden retriever'). A descrição deve ser curta e direta, adequada para ser inserida em outro prompt." };

    const descriptionResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePartForDesc, descriptionPrompt] },
    });
    handleGenAIResponse(descriptionResponse);
    const subjectDescription = descriptionResponse.text.trim();

    // Step 2: Generate the final image using the original image, and the combined prompt.
    const finalPrompt = `${promptTemplate.replace(/\[ASSUNTO\]/g, subjectDescription)}${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;
    
    const imagePartForGen = await fileToPart(image);
    const textPartForGen = { text: finalPrompt };
    
    // The model needs the original image to faithfully capture visual characteristics.
    return generateImageFromParts([imagePartForGen, textPartForGen]);
};

export const virtualTryOn = async (personImage: File, clothingImage: File, shoeImage?: File): Promise<string> => {
    // 1. Prepare image parts and interleave with descriptive text
    const personPart = await fileToPart(personImage);
    const clothingPart = await fileToPart(clothingImage);
    
    const parts: Part[] = [
        { text: "Imagem da Pessoa (userPhoto): Esta é a imagem da pessoa que irá 'experimentar' a roupa." },
        personPart,
        { text: "Imagem da Peça de Roupa (garmentPhoto): Esta é a vestimenta a ser aplicada." },
        clothingPart,
    ];

    if (shoeImage) {
        const shoePart = await fileToPart(shoeImage);
        parts.push({ text: "Imagem do Calçado (shoePhoto): Este é o calçado a ser aplicado." });
        parts.push(shoePart);
    }
    
    // 2. Construct the new, more detailed prompt based on user feedback.
    const finalInstruction = `
**Instrução para Provador Virtual (Modo Detalhado):**

**Objetivo:** Gerar uma imagem composta onde a 'Peça de Roupa' (e 'Calçado', se fornecido) é vestida pela 'Pessoa', garantindo um ajuste realista e mantendo a identidade facial e o fundo.

**Protocolo de Processamento:**

1.  **Prioridade da Vestimenta:** A 'Peça de Roupa' ('garmentPhoto') é a **fonte primária** para a vestimenta. Sua textura, cor e detalhes devem ser replicados fielmente na imagem final.

2.  **Ajuste Corporal Dinâmico:** Aplique a 'Peça de Roupa' na 'Pessoa' ('userPhoto'). O algoritmo deve **detectar a silhueta e as proporções do corpo** na 'userPhoto' e **ajustar (escalar, distorcer suavemente)** a 'Peça de Roupa' para que se encaixe de forma natural e realista ao corpo da 'Pessoa'.

3.  **Harmonização de Iluminação e Sombra:** Analise as **condições de iluminação e sombreamento** presentes na 'userPhoto' original. A 'Peça de Roupa' aplicada deve ser renderizada com efeitos de luz e sombra que **correspondam de forma realisticamente** ao ambiente e à iluminação da 'userPhoto', integrando-a de maneira coesa.

4.  **Preservação de Proporções:** O ajuste da roupa deve respeitar as **proporções originais do corpo** da 'Pessoa' ('userPhoto'). Evite alongamentos, encolhimentos ou distorções irreais do corpo sob a nova vestimenta.

5.  **Regra de Preservação Facial e de Fundo:** O **rosto e a identidade da pessoa** na 'userPhoto' devem ser integralmente preservados. Além disso, o **fundo original da 'userPhoto' deve ser mantido**. A intervenção da IA deve ser estritamente limitada às regiões do corpo onde a vestimenta (e calçado) será aplicada.

**Saída:** Uma imagem única, fotorrealista e coesa, exibindo a 'Pessoa' usando a nova 'Peça de Roupa' (e 'Calçado') no ambiente original.
`;

    parts.push({ text: finalInstruction });
    
    // 3. Generate the image
    return generateImageFromParts(parts);
};

export const suggestCreativeEdits = async (image: File): Promise<{ message: string, acceptLabel: string, toolId: ToolId, args?: any } | null> => {
    const imagePart = await fileToPart(image);
    const prompt = `
    Analyze the provided image and suggest a single, creative, and interesting, actionable edit that could be performed on it using one of the available AI tools.
    The suggestion should be inspiring and clearly state what the user can do.
    
    Available tool IDs for suggestions: 'outpainting', 'style', 'relight', 'generativeEdit', 'photoRestoration', 'unblur'.

    Based on the image content, choose the MOST relevant and exciting tool. For example:
    - If it's a beautiful landscape but feels cropped, suggest 'outpainting'.
    - If it's a simple photo, suggest applying an interesting 'style' like 'Estilo de anime dos anos 90'.
    - If the lighting is flat, suggest 'relight' with a specific instruction like 'luz quente e dourada do final da tarde'.
    - If there's an obvious element to add/change, suggest 'generativeEdit' with a prompt like 'adicione um pequeno barco no lago'.
    - If it's an old or noisy photo, suggest 'photoRestoration'.
    - If it's blurry, suggest 'unblur'.

    Respond ONLY with a JSON object with four fields:
    1. "toolId": A string with the ID of the suggested tool (must be one of the available IDs).
    2. "message": A short, engaging message in Brazilian Portuguese suggesting the edit (e.g., "Que tal transformar esta foto em uma pintura a óleo?").
    3. "acceptLabel": A short call-to-action button label in Brazilian Portuguese (e.g., "Aplicar Estilo").
    4. "args": An object containing specific arguments for the tool.
        - For 'style', provide { "stylePrompt": "a creative style prompt in Portuguese" }.
        - For 'relight', provide { "relightPrompt": "a descriptive lighting prompt in Portuguese" }.
        - For 'generativeEdit', provide { "prompt": "a prompt describing the change in Portuguese" }.
        - For 'photoRestoration', you can provide { "colorize": true } if the image is black and white.
        - For other tools, it can be an empty object {}.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        toolId: { type: Type.STRING, description: "The ID of the suggested tool." },
                        message: { type: Type.STRING, description: "The suggestion message in Brazilian Portuguese." },
                        acceptLabel: { type: Type.STRING, description: "The button label in Brazilian Portuguese." },
                        args: { 
                            type: Type.OBJECT, 
                            description: "Optional arguments for the tool.",
                            properties: {
                                stylePrompt: { type: Type.STRING },
                                relightPrompt: { type: Type.STRING },
                                prompt: { type: Type.STRING },
                                colorize: { type: Type.BOOLEAN },
                            }
                        },
                    },
                    required: ['toolId', 'message', 'acceptLabel'],
                }
            }
        });
        
        const jsonResponse = JSON.parse(response.text);
        
        // Basic validation
        const validTools: ToolId[] = ['outpainting', 'style', 'relight', 'generativeEdit', 'photoRestoration', 'unblur'];
        if (validTools.includes(jsonResponse.toolId)) {
            return jsonResponse;
        }
        return null;

    } catch (e) {
        console.error("Creative suggestion generation failed", e);
        return null;
    }
};

interface PngCreatorOptions {
    background?: {
        type: 'color' | 'prompt';
        value: string;
    };
    enhance?: boolean;
}

export const createTransparentPng = async (
    sourceImage: File,
    options: PngCreatorOptions = {}
): Promise<string> => {
    // Phase 1: Segmentation
    const transparentDataUrl = await removeBackground(sourceImage);

    let currentFile = dataURLtoFile(transparentDataUrl, 'transparent.png');
    let currentUrl = transparentDataUrl;

    // Phase 2: Background (Conditional)
    if (options.background) {
        if (options.background.type === 'color') {
            currentUrl = await applyBackgroundColor(currentUrl, options.background.value);
            currentFile = dataURLtoFile(currentUrl, 'with-bg.png');
        } else if (options.background.type === 'prompt' && options.background.value.trim()) {
            // Use generateProductPhoto as it's designed to place a transparent subject into a new scene
            currentUrl = await generateProductPhoto(currentFile, options.background.value);
            currentFile = dataURLtoFile(currentUrl, 'with-ai-bg.png');
        }
    }

    // Phase 3: Enhance (Conditional)
    if (options.enhance) {
        // Use upscaleImage as a general enhancement
        currentUrl = await upscaleImage(currentFile, 2, true); // 2x factor is a safe default
    }

    return currentUrl;
};

export const generateSuperheroFusion = async (
    personImage: File,
    heroImage: File,
    complementaryPrompt?: string,
    negativePrompt?: string
): Promise<string> => {
    const personPart = await fileToPart(personImage);
    const heroPart = await fileToPart(heroImage);

    let finalPrompt = `
**Sua Tarefa é Fundir Duas Imagens.**

**Imagem 1:** A foto do usuário.
**Imagem 2:** A foto de referência do herói.

**REGRA NÚMERO UM (Prioridade Máxima):** Preserve PERFEITAMENTE o rosto da pessoa da **Imagem 1**. A identidade, características faciais e expressão da pessoa não devem ser alteradas. O resultado DEVE ser reconhecível como a pessoa da Imagem 1.

**Instruções de Fusão:**
1.  **Traje e Pose:** Pegue o traje completo e a pose do herói da **Imagem 2** e aplique-os no corpo da pessoa da **Imagem 1**.
2.  **Cenário:** Coloque a pessoa no mesmo cenário, com a mesma iluminação e atmosfera da **Imagem 2**.

**Resultado Final:** Uma imagem realista que mostra a pessoa da **Imagem 1** como se ela fosse o super-herói da **Imagem 2**.
`;

    if (complementaryPrompt?.trim()) {
        finalPrompt += `\n**Instruções Adicionais:** ${complementaryPrompt}`;
    }

    if (negativePrompt?.trim()) {
        finalPrompt += `\n**Elementos a Evitar:** ${negativePrompt}`;
    }

    const textPart = { text: finalPrompt };

    const parts: Part[] = [
        { text: "Imagem 1 (Foto do Usuário): O rosto desta pessoa deve ser preservado." },
        personPart,
        { text: "Imagem 2 (Foto de Referência do Herói): Use o traje, a pose e o cenário desta imagem." },
        heroPart,
        textPart,
    ];

    return generateImageFromParts(parts);
};