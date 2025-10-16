/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useEffect, useMemo } from 'react';
// FIX: Correct import path
import { promptExamples, negativePromptExamples } from '../config/promptExamples';
// FIX: Correct import path
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
        if (!prompt || prompt.trim().length < 1) {
            setSuggestions([]);
            return;
        }

        const lowerCasePrompt = prompt.toLowerCase();
        
        // Source is now only the curated examples for the tool, improving contextuality.
        const source = memoizedExamples;

        const uniqueSuggestions = [...new Set(source)];

        // The type of `p` should be correctly inferred as string by TypeScript.
        // FIX: Explicitly type `p` as a string to fix type inference issue where it was being inferred as `unknown`.
        const filtered = uniqueSuggestions.filter((p: string) =>
            p.toLowerCase().includes(lowerCasePrompt) &&
            p.toLowerCase() !== lowerCasePrompt
        );

        setSuggestions(filtered.slice(0, 5));

    }, [prompt, toolId, memoizedExamples]);

    return suggestions;
};