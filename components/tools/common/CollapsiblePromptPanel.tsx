/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { ChevronDownIcon } from '../../icons';

interface CollapsiblePromptPanelProps {
  title: string;
  prompt: string;
  onPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  negativePrompt: string;
  onNegativePromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
}

const CollapsiblePromptPanel: React.FC<CollapsiblePromptPanelProps> = ({
  title,
  prompt,
  onPromptChange,
  negativePrompt,
  onNegativePromptChange,
  isLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden transition-all duration-300">
      <header
        className="flex items-center p-3 cursor-pointer select-none hover:bg-white/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${!isExpanded ? '-rotate-90' : ''}`} />
        <h4 className="flex-grow font-semibold text-white ml-3">{title}</h4>
      </header>
      <div
        className={`transition-all duration-300 ease-in-out grid ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        style={{ transitionProperty: 'grid-template-rows, opacity' }}
      >
        <div className="overflow-hidden">
          <div className="p-4 border-t border-gray-700/50 flex flex-col gap-4">
            <textarea
              value={prompt}
              onChange={onPromptChange}
              placeholder="Ex: um astronauta surfando em uma onda cósmica..."
              className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base min-h-[120px]"
              disabled={isLoading}
              rows={5}
            />
            <textarea
              value={negativePrompt}
              onChange={onNegativePromptChange}
              placeholder="Prompt Negativo (Opcional): o que evitar..."
              className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base min-h-[60px]"
              disabled={isLoading}
              rows={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsiblePromptPanel;
