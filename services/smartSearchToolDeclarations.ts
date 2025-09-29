/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Type, type FunctionDeclaration } from '@google/genai';
import { tools } from '../config/tools';

/**
 * Generates function declarations for Gemini dynamically from the application's tool configuration.
 * This ensures the Smart Search AI is aware of all available tools.
 */
export const smartSearchToolDeclarations: FunctionDeclaration[] = tools.map(tool => ({
    name: tool.id,
    // Provide a rich description to help the model understand the tool's purpose.
    description: `Use this tool to ${tool.name}. ${tool.description}`,
    parameters: {
        type: Type.OBJECT,
        properties: {
            // An optional parameter for the AI to extract the main subject or details from the user's prompt.
            // Ex: for "create an image of a cat", the 'subject' would be "a cat".
            subject: {
                type: Type.STRING,
                description: `The main subject or detailed request from the user's prompt. For example, if the user says 'create an image of a cat', the subject is 'a cat'.`
            }
        }
    }
}));
