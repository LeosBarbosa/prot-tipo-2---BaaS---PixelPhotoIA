/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { enhancePrompt } from '../../../../services/promptEnhancementService';
import { type ToolId } from '../../../../types';
// FIX: Correct import path for LazyIcon
import LazyIcon from '../../LazyIcon';

interface PromptEnhancerProps {
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  toolId: ToolId;
}

const PromptEnhancer: React.FC<PromptEnhancerProps> = ({ prompt, setPrompt, toolId }) => {
    const [isEnhancing, setIsEnhancing] = useState(false);

    const handleEnhance = async () => {
        if (!prompt.trim() || isEnhancing) return;
        
        const originalPrompt = prompt;
        // Optimistically update UI to show loading
        setPrompt(p => p + '...');
        setIsEnhancing(true);
        
        try {
            const enhanced = await enhancePrompt(originalPrompt, toolId);
            setPrompt(enhanced);
        } catch (error) {
            console.error("Failed to enhance prompt", error);
            // Revert on error
            setPrompt(originalPrompt);
        } finally {
            setIsEnhancing(false);
        }
    };

    return (
        <div className="absolute top-2 right-2 z-10">
            <button
                type="button"
                onClick={handleEnhance}
                disabled={isEnhancing || !prompt.trim()}
                className="p-2 rounded-full bg-gray-700/50 hover:bg-blue-600/50 text-gray-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Melhorar prompt com IA"
            >
                <LazyIcon name="MagicWandIcon" className={`w-5 h-5 ${isEnhancing ? 'animate-pulse text-blue-400' : ''}`} />
            </button>
        </div>
    );
};

export default PromptEnhancer;