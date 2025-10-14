/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";
import { fileToPart, removeBackground, applyStyle, generateProfessionalPortrait, upscaleImage } from './geminiService';
import { availableTools } from './toolDeclarations';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * @description Interpreta um prompt de linguagem natural para selecionar e executar a ferramenta de edição de IA apropriada.
 * @param image - A imagem a ser editada.
 * @param prompt - A instrução do utilizador em linguagem natural.
 * @returns Uma Promise que resolve com a data URL da imagem editada.
 */
export const handleOrchestratorCall = async (image: File, prompt: string): Promise<string> => {
    const imagePart = await fileToPart(image);
    const textPart = { text: prompt };

    // Faz a primeira chamada ao modelo com as ferramentas disponíveis
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            tools: [{ functionDeclarations: availableTools }],
        },
    });

    const functionCall = response.functionCalls?.[0];

    if (functionCall) {
        const { name, args } = functionCall;
        console.log(`IA solicitou chamar a função: ${name} com args:`, args);

        switch (name) {
            case 'removeBackground':
                return removeBackground(image);
            case 'generateProfessionalHeadshot':
                return generateProfessionalPortrait(image);
            case 'applyStyle':
                if (args.stylePrompt && typeof args.stylePrompt === 'string') {
                    return applyStyle(image, args.stylePrompt);
                }
                throw new Error("O estilo (stylePrompt) é necessário para aplicar um estilo.");
            case 'upscaleImage': {
                const factor = args.factor as number;
                // Default preserveFace to true if not provided, as it's a safe default for portraits
                const preserveFace = typeof args.preserveFace === 'boolean' ? args.preserveFace : true;
                if (typeof factor !== 'number' || ![2, 4, 8].includes(factor)) {
                    throw new Error("O fator de aumento (factor) deve ser 2, 4 ou 8.");
                }
                return upscaleImage(image, factor, preserveFace);
            }
            default:
                throw new Error(`Função desconhecida solicitada pela IA: ${name}`);
        }
    }
    
    // Se nenhuma chamada de função, verifique a resposta de texto como um fallback
    const textResponse = response.text;
    if (textResponse) {
        throw new Error(`A IA respondeu com texto em vez de uma ação: "${textResponse}"`);
    }

    throw new Error("A IA não conseguiu determinar uma ação a partir do seu prompt.");
};
