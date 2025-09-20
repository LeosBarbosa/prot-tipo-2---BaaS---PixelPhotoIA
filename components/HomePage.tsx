/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../context/EditorContext';
import { tools, ToolConfig } from '../config/tools';

const ToolCard: React.FC<{ tool: ToolConfig; onClick: () => void; }> = ({ tool, onClick }) => (
    <button
        onClick={onClick}
        className="bg-gray-800/50 p-6 rounded-xl text-left hover:bg-gray-700/60 transition-all duration-200 border border-gray-700/50 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 flex items-start gap-4"
    >
        <div className="flex-shrink-0 w-12 h-12 bg-gray-900/50 rounded-lg flex items-center justify-center">
            {tool.icon}
        </div>
        <div className="flex-grow">
            <h3 className="text-lg font-bold text-white">{tool.name}</h3>
            <p className="text-sm text-gray-400 mt-1">{tool.description}</p>
        </div>
    </button>
);


const HomePage: React.FC = () => {
    const { setActiveTool } = useEditor()!;
    const generationTools = tools.filter(t => t.category === 'generation');
    const workflowTools = tools.filter(t => t.category === 'workflow');
    const editingTools = tools.filter(t => t.category === 'editing');

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">Bem-vindo ao Pixshop AI</h1>
                <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-400">
                    Sua suíte criativa completa. Escolha uma ferramenta abaixo para começar a criar.
                </p>
            </div>
            
            <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-200 border-l-4 border-blue-500 pl-4">Ferramentas de Geração</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generationTools.map(tool => (
                        <ToolCard key={tool.id} tool={tool} onClick={() => setActiveTool(tool.id)} />
                    ))}
                </div>
            </div>

            <div className="mt-16">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-200 border-l-4 border-teal-500 pl-4">Ferramentas de Edição</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {editingTools.map(tool => (
                        <ToolCard key={tool.id} tool={tool} onClick={() => setActiveTool(tool.id)} />
                    ))}
                </div>
            </div>

            <div className="mt-16">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-200 border-l-4 border-purple-500 pl-4">Fluxos de Trabalho</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workflowTools.map(tool => (
                        <ToolCard key={tool.id} tool={tool} onClick={() => setActiveTool(tool.id)} />
                    ))}
                </div>
            </div>
        </div>
    );
};
export default HomePage;