/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { SunIcon } from '../icons';
import PromptEnhancer from './common/PromptEnhancer';
import TipBox from '../common/TipBox';

const RelightPanel: React.FC = () => {
  const { handleRelight, isLoading } = useEditor();
  const [prompt, setPrompt] = useState('');

  const handleApply = () => {
    if (prompt.trim()) {
      handleRelight(prompt);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-300">Reacender com IA</h3>
        <p className="text-sm text-gray-400 -mt-1">
          Ajuste a iluminação da sua foto com um simples comando de texto.
        </p>
      </div>
      
      <div className="relative">
        <textarea
          id="relight-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: 'luz quente da esquerda', 'iluminação suave de estúdio'..."
          className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 pr-12 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base min-h-[100px]"
          disabled={isLoading}
          rows={4}
        />
        <PromptEnhancer prompt={prompt} setPrompt={setPrompt} toolId="relight" />
      </div>

       <TipBox>
          Experimente prompts descritivos como "luz quente de vela vindo da esquerda" ou "iluminação dramática de palco por cima".
      </TipBox>

      <button
        onClick={handleApply}
        disabled={isLoading || !prompt.trim()}
        className="w-full bg-gradient-to-br from-yellow-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
      >
        <SunIcon className="w-5 h-5" />
        Aplicar Iluminação
      </button>
    </div>
  );
};

export default RelightPanel;