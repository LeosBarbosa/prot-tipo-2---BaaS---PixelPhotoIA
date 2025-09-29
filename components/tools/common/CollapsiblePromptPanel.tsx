/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { ChevronDownIcon } from '../../icons';
import { type ToolId } from '../../../types';
import PromptEnhancer from './PromptEnhancer';


interface CollapsiblePromptPanelProps {
  title: string;
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  negativePrompt: string;
  onNegativePromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  toolId: ToolId;
}

const CollapsiblePromptPanel: React.FC<CollapsiblePromptPanelProps> = ({
  title,
  prompt,
  setPrompt,
  negativePrompt,
  onNegativePromptChange,
  isLoading,
  toolId,
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
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: um astronauta surfando em uma onda cósmica..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 pr-12 text-base min-h-[120px]"
                disabled={isLoading}
                rows={5}
              />
              <PromptEnhancer prompt={prompt} setPrompt={setPrompt} toolId={toolId} />
            </div>
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