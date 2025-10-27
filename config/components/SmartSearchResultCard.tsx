/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { type SmartSearchResult } from '../../types';
import LazyIcon from './LazyIcon';

interface SmartSearchResultCardProps {
  result: SmartSearchResult;
}

const SmartSearchResultCard: React.FC<SmartSearchResultCardProps> = ({ result }) => {
    const { setActiveTool } = useEditor();
    const { tool, args } = result;

    const handleOpenTool = () => {
        setActiveTool(tool.id);
        // Futuramente, poderíamos passar `args` para a ferramenta para pré-preencher campos.
    };

    return (
        <div
            className="group relative bg-gray-800/50 border-2 border-blue-500/50 rounded-xl p-6 text-center transition-all duration-300 transform animate-zoom-rise shadow-lg shadow-blue-500/10 max-w-2xl mx-auto"
        >
            <div className="flex items-center justify-center gap-2 mb-3">
                <LazyIcon name="SparkleIcon" className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Sugestão da IA</h2>
            </div>
            
            <p className="text-gray-300 mb-6">Com base na sua pesquisa, a melhor ferramenta parece ser:</p>

            <div className="flex flex-col md:flex-row items-center gap-6 text-left bg-gray-900/40 p-6 rounded-lg">
                <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center bg-gray-900/50 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-500/20">
                    <LazyIcon name={tool.icon} className="w-10 h-10 text-blue-400" />
                </div>
                <div className="flex-grow text-center md:text-left">
                    <h3 className="font-bold text-2xl text-white">{tool.name}</h3>
                    <p className="text-md text-gray-400 mt-1">{tool.description}</p>
                </div>
            </div>

            <button
                onClick={handleOpenTool}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-5 rounded-lg transition-all text-lg"
            >
                Abrir {tool.name}
            </button>
        </div>
    );
};

export default SmartSearchResultCard;