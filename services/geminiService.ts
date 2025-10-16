/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Part, Type, Modality } from "@google/genai";
import { fileToDataURL, dataURLtoFile } from '../utils/imageUtils';
import { type DetectedObject, type ToolId } from '../types';
import { smartSearchToolDeclarations } from './smartSearchToolDeclarations';
import { applyBackgroundColor } from '../utils/imageProcessing';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const CRITICAL_FACIAL_PRESERVATION_DIRECTIVE = `\n\n**DIRETRIZ DE EXECUÇÃO CRÍTICA: PRESERVAÇÃO DA IDENTIDADE FACIAL ORIGINAL**\nA prioridade absoluta é a preservação da identidade facial original. O sistema NÃO DEVE descaracterizar, alterar ou substituir o rosto da pessoa. A face deve ser mantida 100% fiel e inalterada em suas características essenciais: traços, expressões e singularidades (sardas, pintas, etc.). O resultado deve ser realista e respeitoso com a aparência original, evitando a geração de um 'rosto genérico'.`;

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
        const reason = response.promptFeedback.blockReason;
        if (reason === 'SAFETY') {
            throw new Error('Seu pedido foi bloqueado por violar as políticas de segurança. Por favor, ajuste seu prompt ou imagem para evitar conteúdo sensível.');
        }
        // For 'OTHER' and any other reason, it's often vague.
        throw new Error('Seu pedido não pôde ser processado. Isso pode acontecer se o prompt for ambíguo ou não estiver claro. Tente reformular seu pedido.');
    }
    return response;
};

const extractBase64Image = (response: GenerateContentResponse): string => {
    const parts = response.candidates?.[0]?.content?.parts;

    if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
    }
    
    // MELHORIA: Propagar a mensagem de erro da IA para facilitar a depuração.
    const textResponse = response.text?.trim();
    if (textResponse) {
        throw new Error(`A IA respondeu com texto em vez de uma imagem: "${textResponse}"`);
    }
    throw new Error('Nenhuma imagem foi gerada pelo modelo. A resposta pode estar vazia ou bloqueada por políticas de segurança.');
};

export const generateImageFromParts = async (parts: Part[], model: string = 'gemini-2.5-flash-image', config?: { [key: string]: any }): Promise<string> => {
    const finalConfig = {
        responseModalities: [Modality.IMAGE],
        ...config, // any config passed in will be merged/override
    };

    const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: finalConfig,
    });
    handleGenAIResponse(response);
    return extractBase64Image(response);
};

const singleImageAndTextToImage = async (image: File, prompt: string): Promise<string> => {
    const imagePart = await fileToPart(image);
    return generateImageFromParts([imagePart, { text: prompt }]);
};

export const validatePromptSpecificity = async (prompt: string, toolContext: string): Promise<{ isSpecific: boolean, suggestion: string }> => {
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
        - Estilo Artístico: É uma 'fotografia', 'pintura a óleo', 'arte conceitual de fantasia'?
        - Iluminação: 'contraluz dramático', 'luz suave da manhã', 'brilho de neon'.
        - Composição: 'retrato em close-up', 'vista panorâmica ampla', 'tomada de baixo ângulo'.
        Um prompt genérico é curto e vago, como "um cachorro", "uma bela paisagem".
        Com base nisso, responda SOMENTE com um objeto JSON com dois campos:
        1. "isSpecific": um booleano (true se o prompt for específico, false se for muito genérico).
        2. "suggestion": uma string em português do Brasil. Se o prompt for genérico, forneça uma sugestão criativa e encorajadora para melhorá-lo. Se o prompt já for específico, pode ser uma string vazia.
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
        return { isSpecific: true, suggestion: '' };
    }
};

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
      // More user-friendly error for Imagen model.
      throw new Error('O gerador de imagens não retornou um resultado. A causa mais comum é um prompt que viola as políticas de segurança. Por favor, tente reformular sua solicitação.');
    }
    return `data:image/png;base64,${base64ImageBytes}`;
};

export const renderSketch = (sketchImage: File, prompt: string) => {
    const fullPrompt = `### COMANDO: RENDERIZAR ESBOÇO\n\n**OBJETIVO:** Transformar a imagem de esboço fornecida em uma renderização fotorrealista.\n\n**INSTRUÇÕES DO USUÁRIO:** "${prompt}"\n\n**REGRAS DE EXECUÇÃO:**\n1.  **FIDELIDADE AO ESBOÇO:** Use as linhas e formas do esboço como a base fundamental para a renderização.\n2.  **FOTORREALISMO:** Aplique texturas, iluminação e sombras realistas para dar vida ao esboço.\n3.  **COERÊNCIA:** Garanta que o resultado final seja visualmente coeso e de alta qualidade.${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;
    return singleImageAndTextToImage(sketchImage, fullPrompt);
};

export const generateCharacter = (prompt: string) => {
    const fullPrompt = `Folha de conceito de personagem de corpo inteiro, pose dinâmica. ${prompt}. Iluminação cinematográfica, fundo detalhado, 8k, alta qualidade.`;
    return generateImageFromText(fullPrompt, '9:16');
};

export const generateLogo = (prompt: string) => {
    const fullPrompt = `Logotipo vetorial minimalista, ${prompt}. Linhas simples e limpas, cores planas, alto contraste, adequado para uma marca. Centrado em um fundo branco.`;
    return generateImageFromText(fullPrompt, '1:1');
};

export const generateLogoVariation = (sourceImage: File): Promise<string> => {
    const prompt = `### COMANDO: GERAR VARIAÇÃO DE LOGOTIPO\n\n**OBJETIVO:** Gerar uma variação sutil do logotipo fornecido.\n\n**REGRAS DE EXECUÇÃO:**\n1.  **MANTER TEMA:** O novo logotipo deve manter o mesmo tema e conceito do original.\n2.  **ESTILO CONSISTENTE:** Continue com o estilo vetorial minimalista, linhas limpas e alto contraste.\n3.  **MUDANÇA SUTIL:** Altere ligeiramente as formas, composição ou orientação dos elementos.\n4.  **SAÍDA:** O resultado deve ser centrado em um fundo branco.`;
    return singleImageAndTextToImage(sourceImage, prompt);
};

export const generate3DModel = (prompt: string) => {
    const fullPrompt = `Uma renderização de modelo 3D de ${prompt}. Renderização Octane, materiais fotorrealistas, iluminação de estúdio com sombras suaves, resolução 4k, em um fundo cinza simples.`;
    return generateImageFromText(fullPrompt, '1:1');
};

export const generateSeamlessPattern = (prompt: string) => {
    const fullPrompt = `Um padrão sem costura e repetível de ${prompt}. Design plano, estilo vetorial, cores vibrantes.`;
    return generateImageFromText(fullPrompt, '1:1');
};

export const generateSticker = async (prompt: string, sourceImage?: File): Promise<string> => {
    if (sourceImage) {
        const fullPrompt = `### COMANDO: CRIAR ADESIVO A PARTIR DE IMAGEM\n\n**OBJETIVO:** Criar um adesivo de vinil cortado a partir da imagem fornecida.\n\n**INSTRUÇÕES DO USUÁRIO:** "${prompt}"\n\n**REGRAS DE EXECUÇÃO:**\n1.  **ESTILO:** O estilo deve ser ilustrativo e de desenho animado.\n2.  **BORDA:** Adicione uma borda branca espessa ao redor do assunto principal.\n3.  **FUNDO:** O resultado final deve estar em um fundo simples para contraste.`;
        return singleImageAndTextToImage(sourceImage, fullPrompt);
    }
    const fullPrompt = `Um adesivo de vinil fofo cortado de ${prompt}, estilo de desenho animado ilustrativo, com uma borda branca espessa, em um fundo cinza simples para contraste.`;
    return generateImageFromText(fullPrompt, '1:1');
};

export const applyTextEffect = (sourceImage: File, prompt: string): Promise<string> => {
    const fullPrompt = `### COMANDO: APLICAR EFEITO DE TEXTO\n\n**OBJETIVO:** Aplicar um efeito visual ao texto existente na imagem.\n\n**INSTRUÇÕES DO USUÁRIO:** "${prompt}"\n\n**REGRAS DE EXECUÇÃO:**\n1.  **MODIFICAR APENAS TEXTO:** Apenas o texto na imagem deve ser alterado.\n2.  **PRESERVAR FUNDO:** O restante da imagem (fundo, outros elementos) deve permanecer intacto.`;
    return singleImageAndTextToImage(sourceImage, fullPrompt);
};

export const convertToVector = (sourceImage: File, stylePrompt?: string): Promise<string> => {
    let fullPrompt = `### COMANDO: VETORIZAR IMAGEM (ESTILO ADESIVO)\n\n**OBJETIVO:** Converter a imagem em um gráfico vetorial com estilo de adesivo cortado.\n\n**REGRAS DE EXECUÇÃO:**\n1.  **SIMPLIFICAR:** Simplifique as formas e detalhes da imagem original.\n2.  **ESTILO VETORIAL:** Use linhas limpas e paletas de cores planas.\n3.  **BORDA DE ADESIVO:** Adicione uma borda branca espessa ao redor do assunto principal para simular um adesivo de vinil.\n4.  **SAÍDA:** O resultado deve ser nítido e escalável.`;
    if (stylePrompt && stylePrompt.trim()) {
        fullPrompt += `\n\n**INSTRUÇÕES DE ESTILO ADICIONAIS:** "${stylePrompt}"`;
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

    const fullPrompt = `### COMANDO: MONTAGEM MÁGICA\n\n**OBJETIVO:** Realize uma edição na imagem base, seguindo as instruções do usuário. Se uma segunda imagem for fornecida, incorpore-a na edição.\n\n**REGRAS DE EXECUÇÃO OBRIGATÓRIAS:**\n1.  **COERÊNCIA VISUAL:** A edição deve se integrar perfeitamente à imagem base em termos de iluminação, sombras, textura, perspectiva e estilo.\n2.  **PRESERVAÇÃO DE IDENTIDADE:** Se a edição envolver um rosto, a identidade facial original (traços, expressões) deve ser 100% preservada, a menos que o prompt solicite explicitamente uma alteração de identidade. A consistência do tom de pele entre o rosto e o corpo deve ser mantida.\n3.  **FIDELIDADE AO PROMPT:** Siga as instruções do usuário com a maior precisão possível.\n\n**INSTRUÇÕES DO USUÁRIO:** "${prompt}"\n\n${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;
    parts.push({ text: fullPrompt });

    return generateImageFromParts(parts);
};

export const generateVideo = async (prompt: string, aspectRatio: string): Promise<string> => {
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: { aspectRatio }
    });
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

export const generateAnimationFromImage = async (sourceImage: File, prompt: string): Promise<string> => {
    const dataUrl = await fileToDataURL(sourceImage);
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mimeType = mimeMatch?.[1] || sourceImage.type;
    const data = arr[1];

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: { imageBytes: data, mimeType },
    });
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

export const generateInteriorDesign = async (image: File, mask: File, roomType: string, roomStyle: string, prompt: string): Promise<string> => {
    const imagePart = await fileToPart(image);
    const maskPart = await fileToPart(mask);
    const textPrompt = `### COMANDO: DESIGN DE INTERIORES\n\n**OBJETIVO:** Redesenhar a área mascarada da foto de um(a) ${roomType} para um estilo ${roomStyle}.\n\n**INSTRUÇÕES DO USUÁRIO:** "${prompt}"\n\n**REGRAS DE EXECUÇÃO:**\n1.  **ALTERAR APENAS A MÁSCARA:** Apenas a área mascarada deve ser alterada.\n2.  **INTEGRAÇÃO PERFEITA:** O novo design deve se integrar perfeitamente ao resto da imagem, com iluminação e sombras consistentes.\n3.  **FOTORREALISMO:** O resultado deve ser fotorrealista.`;
    return generateImageFromParts([imagePart, maskPart, { text: textPrompt }]);
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

    const fullPrompt = `### COMANDO: FUSÃO CRIATIVA\n\n**OBJETIVO:** Combinar a **composição** da Imagem 1 com o **estilo** das outras imagens, buscando um resultado final que pareça natural e integrado.\n\n**REGRAS DE EXECUÇÃO OBRIGATÓRIAS:**\n\n**PRIMEIRO VAI IDENTIFICAR O ESTILO DA IMAGEM**, analisando elementos como: cores predominantes, tipo de pincelada (se aplicável), intensidade da luz e sombras, e a atmosfera geral da imagem.\n\n1.  **MANTER COMPOSIÇÃO:** A estrutura, os objetos e o layout da **Imagem 1 (Composição)** DEVEM ser a base do resultado. Isso inclui a posição dos elementos principais, a perspectiva e o enquadramento da cena. Não alterar a essência da composição original.\n2.  **APLICAR ESTILO:** O estilo artístico, a paleta de cores, a iluminação e as texturas das **Imagens de Estilo** (Imagem 2, 3, etc.) DEVEM ser aplicados sobre a composição da Imagem 1. Prestar atenção especial à adaptação da paleta de cores para que se harmonize com a composição original, e à aplicação de texturas de forma realista e coerente.\n3.  **RESULTADO COESO:** O resultado final deve ser uma fusão harmoniosa e de alta qualidade. Evitar a sobreposição óbvia de estilos, buscando uma transição suave e uma sensação de unidade visual. O objetivo é criar uma imagem que pareça ter sido concebida originalmente com o estilo desejado, e não como uma colagem de elementos distintos.`;
    parts.push({ text: fullPrompt });

    return generateImageFromParts(parts);
};

export const generateDoubleExposure = async (portraitImage: File, landscapeImage: File): Promise<string> => {
    const portraitPart = await fileToPart(portraitImage);
    const landscapePart = await fileToPart(landscapeImage);
    const parts: Part[] = [
        { text: "Imagem 1 (Retrato): Use a silhueta desta pessoa como a forma principal." },
        portraitPart,
        { text: "Imagem 2 (Paisagem): Use esta imagem como a textura/preenchimento dentro da silhueta." },
        landscapePart,
    ];

    const fullPrompt = `### COMANDO: DUPLA EXPOSIÇÃO ARTÍSTICA\n\n**OBJETIVO:** Criar um efeito de dupla exposição, mesclando a imagem de paisagem (Imagem 2) dentro da silhueta da pessoa no retrato (Imagem 1).\n\n**REGRAS DE EXECUÇÃO OBRIGATÓRIAS:**\n1.  **SILHUETA DO RETRATO:** A forma principal da imagem final deve ser a silhueta da pessoa da Imagem 1.\n2.  **PREENCHIMENTO COM PAISAGEM:** A Imagem 2 (paisagem) deve preencher a silhueta da pessoa, criando uma mescla visualmente interessante.\n3.  **ESTILO ARTÍSTICO:** O resultado deve ser coeso e artístico, com uma transição suave entre a silhueta e o fundo. Um fundo claro e minimalista é preferível.\n${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;
    parts.push({ text: fullPrompt });

    return generateImageFromParts(parts);
};

export const outpaintImage = (sourceImage: File, userPrompt: string, aspectRatio: string): Promise<string> => {
    const fullPrompt = `### COMANDO: PINTURA EXPANSIVA (OUTPAINTING)\n\n**OBJETIVO:** Expandir a imagem fornecida para uma nova proporção de ${aspectRatio}.\n\n**REGRAS DE EXECUÇÃO OBRIGATÓRIAS:**\n1.  **EXTENSÃO COERENTE:** As novas áreas geradas DEVEM estender a cena original de forma lógica e realista.\n2.  **CONSISTÊNCIA TOTAL:** Mantenha 100% de consistência com a imagem original em estilo, iluminação, sombras, textura e grão.\n3.  **TRANSIÇÃO PERFEITA:** A junção entre a imagem original e as áreas geradas deve ser imperceptível.\n4.  **INSTRUÇÃO ADICIONAL:** Se houver instruções do usuário, incorpore-as nas novas áreas: "${userPrompt}"\n\n**QUALIDADE:** O resultado deve ser de alta resolução e fotorrealista.`;
    return singleImageAndTextToImage(sourceImage, fullPrompt);
};

export const generateProductPhoto = (sourceImage: File, prompt: string): Promise<string> => {
    const fullPrompt = `### COMANDO: FOTOGRAFIA DE PRODUTO\n\n**OBJETIVO:** Posicionar o produto fornecido (com fundo transparente) em um novo cenário fotorrealista.\n\n**DESCRIÇÃO DO CENÁRIO DO USUÁRIO:** "${prompt}"\n\n**REGRAS DE EXECUÇÃO OBRIGATÓRIAS:**\n1.  **INTEGRAÇÃO REALISTA:** O produto deve se integrar perfeitamente ao novo cenário.\n2.  **ILUMINAÇÃO E SOMBRAS:** A iluminação no produto DEVE corresponder à iluminação do cenário. Crie sombras e reflexos realistas.\n3.  **FOCO:** O produto deve ser o ponto focal principal, nítido e atraente.\n4.  **QUALIDADE DE ESTÚDIO:** O resultado final deve ser de alta resolução e com micro-detalhes visíveis.`;
    return singleImageAndTextToImage(sourceImage, fullPrompt);
};

export const restorePhoto = (image: File, colorize: boolean = false) => {
    let prompt = `### COMANDO: RESTAURAÇÃO DE FOTOGRAFIA\n\n**OBJETIVO:** Restaurar completamente a imagem fornecida para uma qualidade impecável e de alta definição.\n\n**TAREFAS OBRIGATÓRIAS:**\n1.  **Remover Defeitos:** Elimine TODOS os defeitos físicos (arranhões, poeira, rasgos, manchas).\n2.  **Remover Ruído:** Elimine completamente o ruído digital e o grão do filme.\n3.  **Aumentar Nitidez:** Melhore a nitidez geral e realce os micro-detalhes e texturas.\n4.  **Aumentar Resolução:** Aumente a escala da imagem em 1.5x para melhorar a clareza.`;
    if (colorize) {
        prompt += "\n5.  **Colorizar:** Se a imagem for em preto e branco ou sépia, aplique cores realistas e historicamente precisas.";
    }
    prompt += CRITICAL_FACIAL_PRESERVATION_DIRECTIVE;
    return singleImageAndTextToImage(image, prompt);
};

export const generateImageVariation = (sourceImage: File, strength: number): Promise<string> => singleImageAndTextToImage(sourceImage, `Gere uma variação desta imagem. A força da variação deve ser em torno de ${strength}%.`);
export const applyStyle = (image: File, stylePrompt: string) => singleImageAndTextToImage(image, `Aplique o seguinte estilo artístico a esta imagem: ${stylePrompt}`);
export const removeBackground = (image: File) => singleImageAndTextToImage(image, `### COMANDO: REMOVER FUNDO\n\n**OBJETIVO:** Isolar o assunto principal da imagem e remover completamente o fundo, resultando em um fundo transparente.\n\n**REGRAS DE EXECUÇÃO:**\n1.  **SEGMENTAÇÃO PRECISA:** O recorte ao redor do assunto deve ser extremamente preciso.\n2.  **PRESERVAR DETALHES FINOS:** Preste atenção especial para preservar detalhes complexos como fios de cabelo, pelos ou bordas translúcidas.\n\n${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`);
export const generateAdjustedImage = (image: File, adjustmentPrompt: string) => singleImageAndTextToImage(image, `Ajuste esta imagem com base na seguinte descrição: ${adjustmentPrompt}${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`);
export const reacenderImage = (image: File, prompt: string) => singleImageAndTextToImage(image, `Reacenda esta imagem de acordo com a seguinte descrição: ${prompt}${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`);
export const generateLowPoly = (image: File) => singleImageAndTextToImage(image, "Converta esta imagem para um estilo de arte low-poly.");
export const extractArt = (image: File) => singleImageAndTextToImage(image, "Extraia a arte de linha desta imagem, criando um esboço em preto e branco dos contornos principais.");
export const applyDustAndScratch = (image: File) => singleImageAndTextToImage(image, `Aplique um efeito de filme antigo a esta imagem, adicionando poeira e arranhões realistas.${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`);
export const denoiseImage = (image: File) => restorePhoto(image);
export const applyFaceRecovery = (image: File) => restorePhoto(image);

export const generateProfessionalPortrait = async (image: File): Promise<string> => {
    const promptTemplate = "Close-up de um headshot profissional de [ASSUNTO]. A pessoa está vestindo uma roupa profissional de negócios, com um fundo de escritório desfocado. A iluminação é suave e uniforme, destacando as características faciais da pessoa. A foto deve ser tirada com uma câmera DSLR de alta qualidade, resultando em uma imagem nítida e de alta resolução.";
    return generateImageWithDescription(image, promptTemplate);
};

export const upscaleImage = (image: File, factor: number, preserveFace: boolean) => {
    const prompt = `### COMANDO: AUMENTAR RESOLUÇÃO (UPSCALE)\n\n**OBJETIVO:** Aumentar a resolução desta imagem por um fator de ${factor}x.\n\n**REGRAS DE EXECUÇÃO:**\n1.  **AUMENTAR NITIDEZ:** Melhore a nitidez geral e realce os detalhes finos durante o processo de aumento de escala.\n2.  **EVITAR ARTEFATOS:** Não introduza artefatos visuais ou suavidade excessiva.`;
    const finalPrompt = `${prompt}${preserveFace ? `\n3.  **PRESERVAÇÃO FACIAL:** Preste atenção especial para preservar e aprimorar os detalhes faciais de forma realista. ${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}` : ''}`;
    return singleImageAndTextToImage(image, finalPrompt);
};

export const unblurImage = (image: File, sharpenLevel: number, denoiseLevel: number, model: string) => {
    const prompt = `### COMANDO: REMOVER DESFOQUE\n\n**OBJETIVO:** Corrigir o desfoque na imagem.\n\n**PARÂMETROS:**\n- **Tipo de Desfoque Identificado:** ${model}\n- **Nível de Nitidez a Aplicar:** ${sharpenLevel}%\n- **Nível de Redução de Ruído a Aplicar:** ${denoiseLevel}%\n\n**REGRAS DE EXECUÇÃO:**\n1.  **CORRIGIR DESFOQUE:** Remova o desfoque com base no modelo identificado.\n2.  **APLICAR PARÂMETROS:** Use os níveis de nitidez e redução de ruído especificados para refinar o resultado.\n${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;
    return singleImageAndTextToImage(image, prompt);
};

export const applyGenerativeSharpening = (image: File, intensity: number): Promise<string> => {
    const prompt = `### COMANDO: NITIDEZ GENERATIVA\n\n**OBJETIVO:** Aumentar a nitidez da imagem em ${intensity}%.\n\n**REGRAS DE EXECUÇÃO:**\n1.  **FOCO EM MICRO-CONTRASTE:** A nitidez deve focar em realçar micro-contrastes e texturas sutis.\n2.  **PRIORIZAR DETALHES:** Priorize detalhes finos como fios de cabelo, texturas de tecido ou imperfeições de superfície.\n3.  **EVITAR ARTEFATOS:** Não introduza halos, artefatos visuais ou granulação excessiva.\n${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;
    return singleImageAndTextToImage(image, prompt);
};

export const enhanceResolutionAndSharpness = (image: File, factor: number, intensity: number, preserveFace: boolean) => {
    const prompt = `### COMANDO: SUPER RESOLUÇÃO\n\n**OBJETIVO:** Aumentar a resolução da imagem por um fator de ${factor}x e aplicar nitidez generativa a uma intensidade de ${intensity}%.\n\n**REGRAS DE EXECUÇÃO:**\n1.  **AÇÃO DUPLA:** Realize o aumento de escala e a nitidez simultaneamente para um resultado coeso.\n2.  **MELHORIA SIGNIFICATIVA:** O objetivo é melhorar drasticamente tanto a resolução quanto a nitidez percebida.\n${preserveFace ? `3.  **PRESERVAÇÃO FACIAL:** Preste atenção especial para preservar e aprimorar os detalhes faciais de forma realista. ${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}` : ''}`;
    // FIX: Correct variable name from `finalPrompt` to `prompt`.
    return singleImageAndTextToImage(image, prompt);
};

export const generativeEdit = async (image: File, prompt: string, options: { maskImage?: File, secondImage?: File }): Promise<string> => {
    const parts: Part[] = [{ text: "Esta é a imagem base para edição:" }, await fileToPart(image)];

    if (options.secondImage) {
        parts.push({ text: "Esta é uma segunda imagem para usar na composição:" }, await fileToPart(options.secondImage));
    }

    if (options.maskImage) {
        parts.push({ text: "Esta é a máscara que define a área de edição (área branca):" }, await fileToPart(options.maskImage));
    }

    const finalPrompt = `### COMANDO: EDIÇÃO GENERATIVA\n\n**INSTRUÇÃO:** Realize uma edição na imagem base. Se uma máscara for fornecida, a edição deve ser contida APENAS na área branca da máscara.\n\n**TAREFA DO USUÁRIO:** "${prompt}"\n\n**REGRAS DE EXECUÇÃO:**\n1.  **INTEGRAÇÃO PERFEITA:** O resultado deve ser fotorrealista e se integrar perfeitamente ao resto da imagem em termos de iluminação, sombras, textura e estilo.\n2.  **PRESERVAÇÃO DO RESTANTE:** Não altere nenhuma parte da imagem fora da área de edição designada.\n3.  **FIDELIDADE AO PROMPT:** Siga a tarefa do usuário com precisão.\n${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;
    parts.push({ text: finalPrompt });

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

export const generateMask = (image: File): Promise<string> => singleImageAndTextToImage(image, "Analise esta imagem e identifique o assunto principal. Gere uma máscara em preto e branco onde o assunto principal é branco e o fundo é preto.");

export const faceSwap = async (
    targetImage: File,
    maskImage: File,
    sourceImage: File,
    userPrompt: string
): Promise<string> => {
    const targetPart = await fileToPart(targetImage);
    const maskPart = await fileToPart(maskImage);
    const sourcePart = await fileToPart(sourceImage);

    const parts: Part[] = [
        { text: "IMAGEM DE DESTINO (BASE): O rosto nesta imagem será substituído." },
        targetPart,
        { text: "IMAGEM DE ORIGEM (NOVO ROSTO): O rosto desta imagem será usado para a substituição." },
        sourcePart,
        { text: "MÁSCARA DE EDIÇÃO: A área branca indica onde o novo rosto deve ser colocado na imagem de destino." },
        maskPart,
    ];

    const finalPrompt = `### COMANDO: COMPOSIÇÃO FACIAL FOTORREALISTA

**OBJETIVO:** Substituir o rosto na área mascarada da IMAGEM DE DESTINO pelo rosto da IMAGEM DE ORIGEM, criando uma composição natural e realista.

**REGRAS DE EXECUÇÃO CRÍTICAS:**

1.  **PRESERVAÇÃO DA IDENTIDADE DE ORIGEM:** A identidade facial completa (traços, expressão, características únicas) da IMAGEM DE ORIGEM deve ser transferida para a IMAGEM DE DESTINO. O resultado DEVE ser reconhecível como a pessoa da IMAGEM DE ORIGEM.

2.  **INTEGRAÇÃO PERFEITA:** O novo rosto deve se integrar perfeitamente à imagem de destino. Isso inclui:
    * **Correspondência de Iluminação:** A iluminação no novo rosto (direção, dureza, cor da luz) DEVE corresponder exatamente à iluminação do corpo e do ambiente na IMAGEM DE DESTINO.
    * **Harmonização do Tom de Pele:** O tom de pele do novo rosto e do pescoço (da imagem de destino) DEVE ser perfeitamente harmonizado para parecer natural.
    * **Consistência de Ângulo e Perspectiva:** O ângulo e a perspectiva do novo rosto devem ser ajustados para corresponder à pose da cabeça na IMAGEM DE DESTINO.
    * **Fusão de Bordas:** A transição entre o novo rosto e o pescoço/cabelo deve ser imperceptível, sem linhas de recorte visíveis.

3.  **INSTRUÇÕES ADICIONAIS DO USUÁRIO:** ${userPrompt || "Nenhuma."}

**FALHA SERÁ CONSIDERADA SE:**
- O resultado parecer uma colagem ou recorte.
- A iluminação ou o tom de pele forem inconsistentes.
- A identidade facial da pessoa de origem for alterada.`;
    
    parts.push({ text: finalPrompt });

    return generateImageFromParts(parts);
};

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
    const textPrompt = `### COMANDO: RETOQUE FACIAL PROFISSIONAL\n\n**OBJETIVO:** Realizar um retoque facial de alta qualidade na área mascarada da imagem original.\n\n**TAREFAS (APENAS NA ÁREA MASCARADA):**\n1.  **Suavização da Pele:** Suavize sutilmente a textura da pele para reduzir linhas finas e imperfeições, preservando os poros naturais (evitar aparência de plástico).\n2.  **Remoção de Manchas:** Remova pequenas manchas, espinhas ou acne.\n3.  **Melhora dos Olhos:** Clareie suavemente o branco dos olhos e realce ligeiramente a cor e a nitidez da íris.\n4.  **Clareamento dos Dentes:** Se os dentes estiverem visíveis e amarelados, clareie-os para um tom natural.\n5.  **Redução de Sombras:** Reduza levemente as sombras fortes sob os olhos.\n\n**REGRAS DE EXECUÇÃO:**\n- O resultado deve parecer natural, realista e perfeitamente integrado com as partes não mascaradas da imagem.\n${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;
    
    return generateImageFromParts([imagePart, maskPart, { text: textPrompt }]);
};

export const generateCaricature = async (images: File[], prompt: string): Promise<string> => {
    const imageParts = await Promise.all(images.map(fileToPart));
    const textPart = { text: `Crie uma única caricatura combinando as características das pessoas de todas as imagens fornecidas. Instruções de estilo: ${prompt}` };
    return generateImageFromParts([...imageParts, textPart]);
};

export const applyDisneyPixarStyle = (image: File, prompt: string): Promise<string> => singleImageAndTextToImage(image, `Transforme este retrato em um personagem no estilo de animação 3D da Disney Pixar. Instruções adicionais: ${prompt}.${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`);
export const generate3DMiniature = (image: File, prompt:string): Promise<string> => singleImageAndTextToImage(image, `Transforme a pessoa nesta foto em uma miniatura de brinquedo 3D. Instruções adicionais: ${prompt}.${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`);
export const generate90sYearbookPortrait = (image: File, prompt: string): Promise<string> => singleImageAndTextToImage(image, `Transforme esta foto em um retrato de anuário dos anos 90. Deve ter o foco suave, a iluminação de estúdio e o fundo característicos daquela época. Instruções adicionais: ${prompt}.${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`);

export const generateStyledPortrait = async (personImage: File, styleImages: File[], prompt: string, negativePrompt: string): Promise<string> => {
    const personPart = await fileToPart(personImage);
    const parts: Part[] = [
        { text: "Imagem 1 (Pessoa): O rosto e a identidade desta pessoa devem ser preservados em 100%." },
        personPart,
    ];
    
    for (const [index, file] of styleImages.entries()) {
        const stylePart = await fileToPart(file);
        parts.push({ text: `Imagem ${index + 2} (Estilo ${index + 1}): Aplique o cenário, a iluminação e as roupas desta imagem na Pessoa (Imagem 1).` });
        parts.push(stylePart);
    }

    let textPrompt = `**Instrução principal:** Aplique o estilo (roupa, fundo, iluminação) de TODAS as imagens de estilo na pessoa da Imagem 1, garantindo que o rosto e cabelo não sejam alterados.`;
    
    if (prompt) textPrompt += ` **Instruções de refinamento:** ${prompt}.`;
    if (negativePrompt) textPrompt += ` **Evite o seguinte:** ${negativePrompt}.`;

    textPrompt += `${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;
    parts.push({ text: textPrompt });
    
    return generateImageFromParts(parts);
};

export const generateStudioPortrait = (personImage: File, mainPrompt: string, negativePrompt: string): Promise<string> => {
    const fullPrompt = `${mainPrompt} ${negativePrompt ? `Evite os seguintes elementos: ${negativePrompt}.` : ''}${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;
    return singleImageAndTextToImage(personImage, fullPrompt);
};

export const generatePolaroidWithCelebrity = async (personImage: File, celebrityImage: File, negativePrompt: string): Promise<string> => {
    const personPart = await fileToPart(personImage);
    const celebrityPart = await fileToPart(celebrityImage);
    const textPrompt = `### COMANDO: FOTO POLAROID COM CELEBRIDADE\n\n**OBJETIVO:** Criar uma foto realista no estilo Polaroid com a pessoa da Imagem 1 e a celebridade da Imagem 2 juntas.\n\n**REGRAS DE EXECUÇÃO:**\n1.  **INTEGRAÇÃO NATURAL:** As duas pessoas devem parecer estar na mesma foto, interagindo naturalmente.\n2.  **ESTILO POLAROID:** O resultado deve ter a aparência de uma foto Polaroid (bordas, cores, etc.).\n3.  **PROMPT NEGATIVO:** Evite o seguinte: ${negativePrompt}.\n\n**Diretriz de Execução de Nível Máximo: Preservação da Identidade Facial Original de AMBAS as pessoas.**\nA prioridade absoluta é a preservação da identidade facial original de AMBAS as pessoas nas fotos. O sistema NÃO deve descaracterizar NENHUM dos rostos.`;
    return generateImageFromParts([personPart, celebrityPart, { text: textPrompt }]);
};

export const generateImageWithDescription = async (image: File, promptTemplate: string): Promise<string> => {
    const imagePartForDesc = await fileToPart(image);
    const descriptionPrompt = { text: "Descreva de forma concisa o assunto principal nesta imagem (por exemplo, 'um homem de cabelo castanho vestindo uma jaqueta azul' ou 'um cachorro golden retriever'). A descrição deve ser curta e direta, adequada para ser inserida em outro prompt." };

    const descriptionResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePartForDesc, descriptionPrompt] },
    });
    handleGenAIResponse(descriptionResponse);
    const subjectDescription = descriptionResponse.text.trim();

    const finalPrompt = `${promptTemplate.replace(/\[ASSUNTO\]/g, subjectDescription)}${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;
    
    const imagePartForGen = await fileToPart(image);
    const textPartForGen = { text: finalPrompt };
    
    return generateImageFromParts([imagePartForGen, textPartForGen]);
};

export const virtualTryOn = async (
    personImage: File,
    clothingImage: File,
    shoeImage: File | undefined,
    scenePrompt: string,
    posePrompt: string,
    cameraLens: string,
    cameraAngle: string,
    lightingStyle: string,
    negativePrompt: string
): Promise<string> => {
    const personPart = await fileToPart(personImage);
    const clothingPart = await fileToPart(clothingImage);
    
    const parts: Part[] = [
        { text: "Imagem da Pessoa (userPhoto):" },
        personPart,
        { text: "Imagem da Peça de Roupa (garmentPhoto):" },
        clothingPart,
    ];

    if (shoeImage) {
        const shoePart = await fileToPart(shoeImage);
        parts.push({ text: "Imagem do Calçado (shoePhoto):" });
        parts.push(shoePart);
    }
    
    const isStudioMode = scenePrompt.trim() !== '';

    let finalInstruction = `### COMANDO: PROVADOR VIRTUAL${isStudioMode ? ': MODO ESTÚDIO' : ''}\n\n`;

    if (isStudioMode) {
        finalInstruction += `**OBJETIVO:** Criar uma foto de estúdio completa, vestindo a pessoa na 'userPhoto' com a roupa/calçado fornecidos e colocando-a em um novo cenário com pose, câmera e iluminação profissionais.\n\n`;
    } else {
        finalInstruction += `**OBJETIVO:** Vestir a pessoa na 'userPhoto' com a roupa da 'garmentPhoto' (e o calçado da 'shoePhoto', se fornecido), mantendo o fundo original.\n\n`;
    }

    finalInstruction += `**REGRAS DE EXECUÇÃO OBRIGATÓRIAS:**\n\n`;
    finalInstruction += `1.  **PRESERVAÇÃO DA IDENTIDADE 100%:** O rosto, cabelo, tom de pele e tipo de corpo da pessoa na 'userPhoto' DEVEM SER MANTIDOS 100% FIÉIS E RECONHECÍVEIS. Transfira as características exatas para o resultado final. NÃO substitua o rosto ou o corpo.\n`;
    finalInstruction += `2.  **APLICAÇÃO DA ROUPA/CALÇADO:** A(s) peça(s) de roupa/calçado fornecida(s) ('garmentPhoto', 'shoePhoto') devem ser realisticamente ajustadas ao corpo da pessoa. A textura, cor e forma devem ser transferidas fielmente.\n`;

    if (isStudioMode) {
        finalInstruction += `3.  **CRIAÇÃO DE CENA (MODO ESTÚDIO):**\n`;
        finalInstruction += `    - **Cenário:** Crie um novo cenário fotorrealista com base na seguinte descrição: "${scenePrompt}".\n`;
        finalInstruction += `    - **Pose:** Coloque a pessoa na seguinte pose: "${posePrompt}".\n`;
        finalInstruction += `    - **Câmera:** Simule a foto com uma ${cameraLens}, tirada de um ângulo ${cameraAngle}.\n`;
        finalInstruction += `    - **Iluminação:** Aplique um estilo de ${lightingStyle} que seja coeso com o cenário.\n`;
        finalInstruction += `4.  **INTEGRAÇÃO E REALISMO:** A pessoa e as roupas devem se integrar perfeitamente ao novo cenário. Sombras, reflexos e perspectiva devem ser consistentes para um resultado fotorrealista e de alta qualidade, como uma foto de revista.\n`;
    } else {
        finalInstruction += `3.  **PRESERVAÇÃO DO FUNDO (MODO SIMPLES):** O cenário de fundo da 'userPhoto' DEVE PERMANECER 100% INTACTO. Nenhuma alteração no fundo é permitida.\n`;
        finalInstruction += `4.  **INTEGRAÇÃO REALISTA:** Ajuste a iluminação e as sombras na roupa para que correspondam perfeitamente ao ambiente existente na 'userPhoto'.\n`;
    }

    if (negativePrompt.trim()) {
        finalInstruction += `5.  **PROMPT NEGATIVO:** Evite estritamente os seguintes elementos: "${negativePrompt}".\n`;
    }

    finalInstruction += `\n**FALHA SERÁ CONSIDERADA SE:**\n`;
    finalInstruction += `- O rosto ou corpo da pessoa original for alterado ou descaracterizado.\n`;
    finalInstruction += `- A roupa não for aplicada corretamente no corpo.\n`;
    if (isStudioMode) {
        finalInstruction += `- O resultado parecer uma colagem amadora em vez de uma cena integrada e fotorrealista.\n`;
    } else {
        finalInstruction += `- O fundo original da 'userPhoto' for modificado.\n`;
    }

    finalInstruction += `\n${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}`;

    parts.push({ text: finalInstruction });

    return generateImageFromParts(
        parts,
        'gemini-2.5-flash-image',
        { responseModalities: [Modality.IMAGE] }
    );
};

interface PngCreatorBackgroundOptions {
    type: 'color' | 'prompt';
    value: string;
}

interface PngCreatorOptions {
    enhance?: boolean;
    background?: PngCreatorBackgroundOptions;
}

export const createTransparentPng = async (image: File, options: PngCreatorOptions = {}): Promise<string> => {
    // 1. Remove background
    let transparentDataUrl = await removeBackground(image);
    let imageToProcessFile = dataURLtoFile(transparentDataUrl, 'transparent.png');
    
    // 2. Enhance if requested
    if (options.enhance) {
        // restorePhoto handles enhancement. colorize=false
        const enhancedDataUrl = await restorePhoto(imageToProcessFile, false); 
        transparentDataUrl = enhancedDataUrl;
        imageToProcessFile = dataURLtoFile(transparentDataUrl, 'enhanced_transparent.png');
    }

    // 3. Apply background if requested
    if (options.background) {
        if (options.background.type === 'color') {
            return applyBackgroundColor(transparentDataUrl, options.background.value);
        } else if (options.background.type === 'prompt') {
            return generateProductPhoto(imageToProcessFile, options.background.value);
        }
    }

    // 4. Return the transparent image
    return transparentDataUrl;
};


export const suggestCreativeEdits = async (image: File): Promise<{ message: string, acceptLabel: string, toolId: ToolId, args?: any } | null> => {
    const imagePart = await fileToPart(image);
    const prompt = `
    Analise a imagem fornecida e sugira uma única, criativa e interessante edição acionável que pode ser realizada nela usando uma das ferramentas de IA disponíveis.
    A sugestão deve ser inspiradora e indicar claramente o que o usuário pode fazer.
    
    Ferramentas disponíveis para sugestões: 'outpainting', 'style', 'relight', 'generativeEdit', 'photoRestoration', 'unblur'.

    Com base no conteúdo da imagem, escolha a ferramenta MAIS relevante e empolgante. Por exemplo:
    - Se for uma bela paisagem, mas parecer cortada, sugira 'outpainting'.
    - Se for uma foto simples, sugira aplicar um 'style' interessante como 'Estilo de anime dos anos 90'.
    - Se a iluminação for plana, sugira 'relight' com uma instrução específica como 'luz quente e dourada do final da tarde'.
    - Se houver um elemento óbvio para adicionar/alterar, sugira 'generativeEdit' com um prompt como 'adicione um pequeno barco no lago'.
    - Se for uma foto antiga ou com ruído, sugira 'photoRestoration'.
    - Se estiver embaçada, sugira 'unblur'.

    Responda SOMENTE com um objeto JSON com quatro campos:
    1. "toolId": uma string, o ID da ferramenta a ser usada (ex: 'outpainting').
    2. "message": uma string em português do Brasil, a mensagem para o usuário (ex: 'Que tal expandir o céu nesta paisagem?').
    3. "acceptLabel": uma string em português do Brasil, o texto do botão de aceitar (ex: 'Expandir Céu').
    4. "args": um objeto opcional com argumentos para a ferramenta (ex: {"prompt": "adicione um céu estrelado"}). Se não houver argumentos, omita este campo.
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
                        toolId: { type: Type.STRING, description: "O ID da ferramenta a ser usada." },
                        message: { type: Type.STRING, description: "A mensagem para o usuário." },
                        acceptLabel: { type: Type.STRING, description: "O texto do botão de aceitar." },
                        args: { 
                            type: Type.OBJECT, 
                            properties: {}, // Allows any object properties
                            nullable: true, 
                            description: "Argumentos opcionais para a ferramenta." 
                        },
                    },
                    required: ['toolId', 'message', 'acceptLabel'],
                },
            },
        });

        handleGenAIResponse(response);
        const jsonResponse = JSON.parse(response.text);
        
        // Basic validation of the response
        if (jsonResponse.toolId && jsonResponse.message && jsonResponse.acceptLabel) {
            return jsonResponse as { message: string, acceptLabel: string, toolId: ToolId, args?: any };
        }
        return null;

    } catch (e) {
        console.error("Falha ao sugerir edições criativas:", e);
        return null;
    }
};

export const generateSuperheroFusion = async (userImage: File, heroImage: File): Promise<string> => {
    const userPart = await fileToPart(userImage);
    const heroPart = await fileToPart(heroImage);

    const parts: Part[] = [
        { text: "IMAGEM_BASE (Rosto do Usuário):" },
        userPart,
        { text: "IMAGEM_ALVO (Corpo e Cenário do Herói):" },
        heroPart,
    ];

    // PROMPT FINAL E OTIMIZADO: Atribui um papel à IA e detalha o processo de composição.
    const finalInstruction = `
### COMANDO: COMPOSIÇÃO DE EFEITOS VISUAIS (VFX) - SUBSTITUIÇÃO FACIAL

**PAPEL:** Você é um artista de VFX profissional especializado em composição digital fotorrealista para cinema.

**TAREFA:** Sua tarefa é compor o rosto da "IMAGEM_BASE" no corpo do personagem na "IMAGEM_ALVO", criando uma imagem final com qualidade cinematográfica e indistinguível de uma fotografia real.

**CHECKLIST DE EXECUÇÃO OBRIGATÓRIO:**

1.  **PRESERVAÇÃO DE IDENTIDADE:** Transfira o rosto da "IMAGEM_BASE" para a "IMAGEM_ALVO", mantendo 100% de fidelidade às características faciais originais. O traje, a pose e o cenário da "IMAGEM_ALVO" devem permanecer intactos.

2.  **ANÁLISE DE CENA:** Analise a "IMAGEM_ALVO" para determinar:
    * **Fonte de Luz Principal:** A direção (ex: de cima, lateral direita), a cor (quente, fria, neutra) e a dureza (suave, dura) da iluminação principal.
    * **Luz de Preenchimento e Ambiente:** A cor e a intensidade da luz ambiente que preenche as sombras.
    * **Grão e Textura:** A quantidade de grão de filme ou ruído de sensor presente na imagem.
    * **Gradação de Cor (Color Grading Global):** A paleta de cores geral da cena (ex: tons azuis, dessaturado, contraste elevado).

3.  **INTEGRAÇÃO FOTORREALISTA (CRÍTICO):** Renderize o rosto transferido para que ele se integre perfeitamente à cena, executando as seguintes ações:
    * **ILUMINAÇÃO CORRESPONDENTE:** Aplique luz e sombra no rosto que correspondam EXATAMENTE à análise de cena. Se a luz principal vem da esquerda, o lado esquerdo do rosto deve estar mais iluminado.
    * **FUSÃO DE BORDAS:** Garanta uma transição suave e imperceptível entre o pescoço do herói e a mandíbula/queixo do rosto transferido. Não deve haver nenhuma linha de recorte visível.
    * **HARMONIZAÇÃO GLOBAL DE COR E TEXTURA:** Este é o passo mais crítico. O resultado final NÃO PODE ter uma discrepância de cor entre o rosto, pescoço e corpo. Execute uma etapa final de **color grading em toda a figura fundida (rosto e corpo)** para garantir que ambos os elementos respondam à luz e à cor do ambiente de forma unificada e coesa. O tom de pele do rosto e de qualquer parte do corpo visível (como o pescoço) deve ser perfeitamente harmonizado.

**FALHA CRÍTICA (RESULTADO INACEITÁVEL):**
-   Qualquer resultado que se pareça com uma colagem, um recorte, um "adesivo" ou uma montagem "chapada".
-   Inconsistência de iluminação, cor ou textura entre o rosto e o corpo.
-   Qualquer alteração na identidade facial da "IMAGEM_BASE".
${CRITICAL_FACIAL_PRESERVATION_DIRECTIVE}
`;

    parts.push({ text: finalInstruction });
    return generateImageFromParts(parts);
};