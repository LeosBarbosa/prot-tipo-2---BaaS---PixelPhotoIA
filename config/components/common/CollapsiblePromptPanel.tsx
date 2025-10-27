/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { type ToolId } from '../../../types';
import PromptEnhancer from '../tools/common/PromptEnhancer';
import { usePromptSuggestions } from '../../../hooks/usePromptSuggestions';
import PromptSuggestionsDropdown from './PromptSuggestionsDropdown';
import LazyIcon from '../LazyIcon';


interface CollapsiblePromptPanelProps {
  title: string;
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  negativePrompt: string;
  onNegativePromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  toolId: ToolId;
  promptPlaceholder?: string;
  negativePromptPlaceholder?: string;
  promptHelperText?: string;
  negativePromptHelperText?: string;
}

const CollapsiblePromptPanel: React.FC<CollapsiblePromptPanelProps> = ({
  title,
  prompt,
  setPrompt,
  negativePrompt,
  onNegativePromptChange,
  isLoading,
  toolId,
  promptPlaceholder,
  negativePromptPlaceholder,
  promptHelperText,
  negativePromptHelperText,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // State and hooks for POSITIVE prompt
  const [showPositiveSuggestions, setShowPositiveSuggestions] = useState(false);
  const positiveSuggestions = usePromptSuggestions(prompt, toolId, 'positive');
  
  // State and hooks for NEGATIVE prompt
  const [showNegativeSuggestions, setShowNegativeSuggestions] = useState(false);
  const negativeSuggestions = usePromptSuggestions(negativePrompt, toolId, 'negative');

  useEffect(() => {
    setShowPositiveSuggestions(positiveSuggestions.length > 0);
  }, [positiveSuggestions]);
  
  useEffect(() => {
    setShowNegativeSuggestions(negativeSuggestions.length > 0);
  }, [negativeSuggestions]);

  const handleSelectPositiveSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
    setShowPositiveSuggestions(false);
  };
  
  const handleSelectNegativeSuggestion = (suggestion: string) => {
    const event = {
      target: {
        value: negativePrompt ? `${negativePrompt}, ${suggestion}` : suggestion
      }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    onNegativePromptChange(event);
    setShowNegativeSuggestions(false);
  };

  return (
    <div className="bg-gray-800/80 border border-gray-700 rounded-lg overflow-hidden transition-all duration-300">
      <header
        className="flex items-center p-3 cursor-pointer select-none hover:bg-gray-700/60"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <h4 className="flex-grow font-semibold text-white">{title}</h4>
        <LazyIcon name="ChevronDownIcon" className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`} />
      </header>
      <div
        className={`transition-all duration-300 ease-in-out grid ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        style={{ transitionProperty: 'grid-template-rows, opacity' }}
      >
        <div className="overflow-hidden">
          <div className="p-4 border-t border-gray-700/50 flex flex-col gap-4">
            <div className="relative">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onBlur={() => setTimeout(() => setShowPositiveSuggestions(false), 200)}
                  onFocus={() => setShowPositiveSuggestions(positiveSuggestions.length > 0)}
                  placeholder={promptPlaceholder || "Ex: um astronauta surfando em uma onda cósmica..."}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 pr-12 text-base min-h-[120px]"
                  disabled={isLoading}
                  rows={5}
                />
                <PromptEnhancer prompt={prompt} setPrompt={setPrompt} toolId={toolId} />
              </div>
              {showPositiveSuggestions && (
                  <PromptSuggestionsDropdown
                      suggestions={positiveSuggestions}
                      onSelect={handleSelectPositiveSuggestion}
                      searchTerm={prompt}
                  />
              )}
              {promptHelperText && <p className="mt-1 text-xs text-gray-500 px-1">{promptHelperText}</p>}
            </div>
            <div className="relative">
              <textarea
                value={negativePrompt}
                onChange={onNegativePromptChange}
                onBlur={() => setTimeout(() => setShowNegativeSuggestions(false), 200)}
                onFocus={() => setShowNegativeSuggestions(negativeSuggestions.length > 0)}
                placeholder={negativePromptPlaceholder || "Prompt Negativo (Opcional): o que evitar..."}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base min-h-[60px]"
                disabled={isLoading}
                rows={2}
              />
              {showNegativeSuggestions && (
                  <PromptSuggestionsDropdown
                      suggestions={negativeSuggestions}
                      onSelect={handleSelectNegativeSuggestion}
                      searchTerm={negativePrompt}
                  />
              )}
              {negativePromptHelperText && <p className="mt-1 text-xs text-gray-500 px-1">{negativePromptHelperText}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsiblePromptPanel;