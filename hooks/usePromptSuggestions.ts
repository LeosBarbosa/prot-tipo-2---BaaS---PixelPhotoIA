/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useEffect, useMemo } from 'react';
import { useEditor } from '../context/EditorContext';
import { promptExamples } from '../config/promptExamples';
import { type ToolId } from '../types';

/**
 * A custom hook to provide contextual prompt suggestions.
 * It combines tool-specific examples with the user's personal prompt history.
 * @param prompt - The current user input in the text area.
 * @param toolId - The ID of the active tool.
 * @returns An array of suggestion strings.
 */
export const usePromptSuggestions = (prompt: string, toolId: ToolId | null): string[] => {
    const { promptHistory } = useEditor();
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const memoizedExamples = useMemo(() => (toolId ? promptExamples[toolId] : []) || [], [toolId]);

    useEffect(() => {
        if (!prompt || prompt.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        const lowerCasePrompt = prompt.toLowerCase();
        
        // Combine and deduplicate sources, giving priority to tool-specific examples.
        const combinedSource = [
            ...memoizedExamples,
            ...promptHistory,
        ];
        const uniqueSuggestions = [...new Set(combinedSource)];

        // Filter based on user input.
        const filtered = uniqueSuggestions.filter(p =>
            p.toLowerCase().includes(lowerCasePrompt) &&
            p.toLowerCase() !== lowerCasePrompt
        );

        // Limit results.
        setSuggestions(filtered.slice(0, 5));

    }, [prompt, toolId, promptHistory, memoizedExamples]);

    return suggestions;
};
