/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Type, type FunctionDeclaration } from '@google/genai';

// NOTE: These are FunctionDeclaration objects for use with Gemini's tool/function-calling feature.

// Declaração para a função de remoção de fundo
export const removeBackgroundDeclaration: FunctionDeclaration = {
    name: "removeBackground",
    description: "Remove o fundo da imagem, isolando o objeto ou pessoa principal.",
    parameters: {
        type: Type.OBJECT,
        properties: {}, // No input parameters are needed for this function.
    },
};

// Declaração para a função de geração de foto profissional
export const generateProfessionalHeadshotDeclaration: FunctionDeclaration = {
    name: "generateProfessionalHeadshot",
    description: "Transforma uma foto de rosto em uma foto de perfil profissional de alta qualidade, com iluminação e roupas de negócios.",
    parameters: {
        type: Type.OBJECT,
        properties: {}, // No input parameters are needed, the model will use the image context.
    },
};

// Declaração para a função de aplicação de estilo
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

// Declaração para a função de melhoria de resolução (upscale)
export const upscaleImageDeclaration: FunctionDeclaration = {
    name: "upscaleImage",
    description: "Aumenta a resolução (melhora a qualidade, aumenta o tamanho) da imagem. Útil para fotos de baixa qualidade ou borradas. O fator de aumento pode ser 2x, 4x, ou 8x.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            factor: {
                type: Type.NUMBER,
                description: "O fator de aumento. Deve ser 2, 4, ou 8.",
            },
            preserveFace: {
                type: Type.BOOLEAN,
                description: "Se deve prestar atenção especial para preservar e melhorar as características faciais de forma realista. Definir como true se houver um rosto proeminente."
            }
        },
        required: ['factor'],
    },
};

// Agrupa todas as declarações em um único array
export const availableTools: FunctionDeclaration[] = [
    removeBackgroundDeclaration,
    generateProfessionalHeadshotDeclaration,
    applyStyleDeclaration,
    upscaleImageDeclaration,
];