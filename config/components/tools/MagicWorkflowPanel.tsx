/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useEditor } from '../../../context/EditorContext';
import LazyIcon from '../LazyIcon';

const MagicWorkflowPanel: React.FC = () => {
  const { handleMagicPrompt, isLoading, setError } = useEditor();
  const [prompt, setPrompt] = useState('');

  const handleApply = () => {
    if (prompt.trim()) {
      setError(null);
      handleMagicPrompt(prompt);
    } else {
      setError("Por favor, descreva a tarefa que você quer executar.");
    }
  };

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 h-full">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-200">Fluxo de Trabalho Mágico</h3>
        <p className="text-sm text-gray-400 mt-1">
          Descreva uma tarefa e a IA escolherá a ferramenta certa para si.
        </p>
      </div>
      
      <textarea
        id="magic-prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ex: 'Remova o fundo', 'faça isto parecer um desenho animado', 'melhore a resolução desta foto'"
        className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base min-h-[120px]"
        disabled={isLoading}
        rows={5}
      />

      <div className="text-xs text-gray-500 p-2 bg-gray-900/40 rounded-md">
        <p className="font-semibold">Ferramentas disponíveis:</p>
        <ul className="list-disc list-inside">
            <li>Remover Fundo</li>
            <li>Retrato Profissional</li>
            <li>Aplicar Estilo Artístico</li>
            <li>Melhorar Resolução</li>
        </ul>
      </div>

      <button
        onClick={handleApply}
        disabled={isLoading || !prompt.trim()}
        className="w-full bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
      >
        <LazyIcon name="MagicWandIcon" className="w-5 h-5" />
        Executar
      </button>
    </div>
  );
};

export default MagicWorkflowPanel;