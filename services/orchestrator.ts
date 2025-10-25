/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";
import { smartSearchToolDeclarations } from './smartSearchToolDeclarations';
import { type SmartSearchResult, type ToolId } from '../types';
import { tools } from '../config/tools';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Interprets a natural language prompt and determines the best tool to use.
 * @param prompt The user's natural language prompt (e.g., "remove the background").
 * @returns A promise that resolves with the suggested tool and any extracted arguments.
 */
export const orchestrate = async (prompt: string): Promise<SmartSearchResult | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Analyze the user's request and select the best tool to accomplish it. The user is in an image editor. Request: "${prompt}"`,
            config: {
                tools: [{ functionDeclarations: smartSearchToolDeclarations }],
            },
        });

        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            const toolId = call.name as ToolId;
            const tool = tools.find(t => t.id === toolId);

            if (tool) {
                return {
                    tool,
                    args: call.args || {},
                };
            }
        }
        
        return null; // No specific tool was identified
    } catch (error) {
        console.error("Error during orchestration:", error);
        return null;
    }
};