/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useEffect, useMemo } from 'react';
import { promptExamples, negativePromptExamples } from '../config/promptExamples';
import { type ToolId } from '../types';

/**
 * A custom hook to provide contextual prompt suggestions.
 * It filters a list of tool-specific examples based on user input.
 * @param prompt - The current user input in the text area.
 * @param toolId - The ID of the active tool.
 * @param type - The type of prompt suggestions to provide ('positive' or 'negative').
 * @returns An array of suggestion strings.
 */
export const usePromptSuggestions = (
  prompt: string, 
  toolId: ToolId | null,
  type: 'positive' | 'negative' = 'positive'
): string[] => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    
    const examples = type === 'positive' ? promptExamples : negativePromptExamples;
    
    const memoizedExamples = useMemo(() => (toolId ? examples[toolId] : []) || [], [toolId, examples]);

    useEffect(() => {
        if (!prompt || prompt.trim().length < 2) { // Start suggesting after 2 characters
            setSuggestions([]);
            return;
        }

        const lowerCasePrompt = prompt.toLowerCase();
        
        const source = memoizedExamples;

        const uniqueSuggestions = [...new Set(source)];

        const filtered = uniqueSuggestions.filter((p: string) =>
            p.toLowerCase().includes(lowerCasePrompt) &&
            p.toLowerCase() !== lowerCasePrompt
        );

        setSuggestions(filtered.slice(0, 5));

    }, [prompt, toolId, memoizedExamples]);

    return suggestions;
};