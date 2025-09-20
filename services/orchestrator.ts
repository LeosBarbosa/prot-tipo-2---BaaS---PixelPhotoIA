/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";
import { fileToPart, removeBackground, applyStyle, generateProfessionalPortrait } from './geminiService';
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
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        // FIX: The 'tools' parameter must be placed inside the 'config' object.
        config: {
            tools: [{ functionDeclarations: availableTools }],
        },
    });

    const functionCallPart = response.candidates?.[0]?.content?.parts?.find(part => part.functionCall);

    if (functionCallPart?.functionCall) {
        const { name, args } = functionCallPart.functionCall;
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
            default:
                throw new Error(`Função desconhecida solicitada pela IA: ${name}`);
        }
    }
    
    // Se nenhuma chamada de função, verifique a resposta de texto como um fallback
    const textResponse = response.text?.trim();
    if (textResponse) {
        throw new Error(`A IA respondeu com texto em vez de uma ação: "${textResponse}"`);
    }

    throw new Error("A IA não conseguiu determinar uma ação a partir do seu prompt.");
};