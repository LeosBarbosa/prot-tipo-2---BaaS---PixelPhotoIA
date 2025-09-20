/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// FIX: Import the `Type` enum and `FunctionDeclaration` type to correctly define function parameter schemas.
import { Type, type FunctionDeclaration } from '@google/genai';

// NOTE: These are FunctionDeclaration objects for use with Gemini's tool/function-calling feature.

// Declaração para a função de remoção de fundo
// FIX: Changed `parameters.type` from string "object" to `Type.OBJECT` to match the required type.
export const removeBackgroundDeclaration: FunctionDeclaration = {
    name: "removeBackground",
    description: "Remove o fundo da imagem, isolando o objeto ou pessoa principal.",
    parameters: {
        type: Type.OBJECT,
        properties: {}, // No input parameters are needed for this function.
    },
};

// Declaração para a função de geração de foto profissional
// FIX: Changed `parameters.type` from string "object" to `Type.OBJECT` to match the required type.
export const generateProfessionalHeadshotDeclaration: FunctionDeclaration = {
    name: "generateProfessionalHeadshot",
    description: "Transforma uma foto de rosto em uma foto de perfil profissional de alta qualidade, com iluminação e roupas de negócios.",
    parameters: {
        type: Type.OBJECT,
        properties: {}, // No input parameters are needed, the model will use the image context.
    },
};

// Declaração para a função de aplicação de estilo
// FIX: Changed `parameters.type` from string "object" to `Type.OBJECT` and property types to use the `Type` enum.
export const applyStyleDeclaration: FunctionDeclaration = {
    name: "applyStyle",
    description: "Aplica um estilo artístico ou de ilustração à imagem, como 'pixel art', 'anime', 'pintura a óleo', 'mangá', 'vetor', etc.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            stylePrompt: {
                type: Type.STRING,
                description: "A descrição do estilo a ser aplicado, como 'estilo pixel art' ou 'desenho a carvão'.",
            },
        },
        required: ['stylePrompt'],
    },
};

// Agrupa todas as declarações em um único array
export const availableTools: FunctionDeclaration[] = [
    removeBackgroundDeclaration,
    generateProfessionalHeadshotDeclaration,
    applyStyleDeclaration,
];