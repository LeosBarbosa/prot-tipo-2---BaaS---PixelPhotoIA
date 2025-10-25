/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Type, type FunctionDeclaration } from '@google/genai';

const openToolDeclaration: FunctionDeclaration = {
    name: "openTool",
    description: "Abre um painel de ferramenta de edição específico. Use isso quando o usuário pedir para realizar uma ação como 'cortar', 'ajustar cores', 'aplicar um filtro', 'remover objetos', etc., mas não fornecer todos os detalhes para a ação em si.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            toolId: {
                type: Type.STRING,
                description: "O ID da ferramenta a ser aberta. Valores possíveis incluem 'crop', 'adjust', 'style', 'objectRemover', 'removeBg', 'text'."
            }
        },
        required: ['toolId']
    },
};

export const voiceToolDeclarations: FunctionDeclaration[] = [
    openToolDeclaration, // Adicionado
    {
        name: "adjustImage",
        description: "Ajusta as propriedades da imagem como brilho, contraste ou cor com base na descrição do usuário. Use para comandos como 'deixe mais claro', 'aumente o contraste', 'deixe o céu mais azul'.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: {
                    type: Type.STRING,
                    description: "A descrição do ajuste a ser feito, por exemplo, 'deixe o céu mais azul' ou 'aumente o brilho em 20%'."
                }
            },
            required: ['prompt']
        },
    },
    {
        name: "applyStyle",
        description: "Aplica um estilo artístico à imagem. Use para comandos como 'aplique um estilo de anime' ou 'transforme em uma pintura a óleo'.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                stylePrompt: {
                    type: Type.STRING,
                    description: "O estilo artístico a ser aplicado, por exemplo, 'estilo de anime dos anos 90' ou 'pintura a óleo no estilo de Van Gogh'."
                }
            },
            required: ['stylePrompt']
        },
    },
    {
        name: "removeBackground",
        description: "Remove o fundo da imagem. Use para comandos como 'remova o fundo' ou 'isole a pessoa'.",
        parameters: {
            type: Type.OBJECT,
            properties: {},
        },
    },
    {
        name: "undo",
        description: "Desfaz a última ação de edição. Use para o comando 'desfazer'.",
        parameters: {
            type: Type.OBJECT,
            properties: {},
        },
    },
    {
        name: "redo",
        description: "Refaz a última ação desfeita. Use para o comando 'refazer'.",
        parameters: {
            type: Type.OBJECT,
            properties: {},
        },
    }
];