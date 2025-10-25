/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import LazyIcon from '../LazyIcon';

const GlobalMagicPrompt: React.FC = () => {
  const { handleMagicPrompt, isLoading } = useEditor();
  const [prompt, setPrompt] = useState('');

  const handleApply = () => {
    if (prompt.trim()) {
      handleMagicPrompt(prompt);
      setPrompt(''); // Limpar após a execução
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleApply();
    }
  };

  return (
    <div className="p-2">
      <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 flex flex-col gap-3">
        <h3 className="text-md font-semibold text-gray-200 flex items-center justify-center gap-2">
          <LazyIcon name="MagicWandIcon" className="w-5 h-5 text-purple-400" />
          Prompt Mágico
        </h3>
        <p className="text-xs text-gray-400 text-center -mt-2">
          Descreva uma edição e deixe a IA trabalhar.
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: 'Remova o fundo'..."
          className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm min-h-[70px] resize-none"
          disabled={isLoading}
          rows={3}
        />
        <button
          onClick={handleApply}
          disabled={isLoading || !prompt.trim()}
          className="w-full bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
        >
          <span className={isLoading ? 'animate-pulse' : ''}>{isLoading ? 'Executando...' : 'Executar'}</span>
        </button>
      </div>
    </div>
  );
};

export default GlobalMagicPrompt;