/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo } from 'react';
import { useEditor } from '../context/EditorContext';
import { tools, type ToolConfig, type ToolCategory } from '../config/tools';
import SearchModule from './SearchModule';
import RecentTools from './RecentTools';

const categoryConfig: Record<ToolCategory, { title: string; description: string }> = {
    generation: { title: "Geração", description: "Dê vida às suas ideias. Crie imagens, padrões, logotipos e muito mais a partir de simples descrições de texto." },
    workflow: { title: "Fluxos de Trabalho", description: "Automatize tarefas complexas com processos guiados por IA, desde design de interiores a retratos profissionais." },
    editing: { title: "Edição", description: "Aperfeiçoe suas imagens existentes com um conjunto completo de ferramentas de edição inteligentes e manuais." },
};

const ToolCard: React.FC<{ tool: ToolConfig }> = ({ tool }) => {
    const { setActiveTool } = useEditor()!;
    return (
        <button
            onClick={() => setActiveTool(tool.id)}
            className="group relative bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center hover:bg-gray-700/50 hover:border-blue-500/50 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-blue-500/10"
        >
            <div className="flex-shrink-0 w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gray-900/50 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-500/20">
                {tool.icon}
            </div>
            <div>
                <h3 className="font-semibold text-lg text-white">{tool.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{tool.description}</p>
            </div>
        </button>
    );
};

const HomePage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<ToolCategory>('generation');

    const categoryKeys = Object.keys(categoryConfig) as ToolCategory[];

    const filteredTools = useMemo(() => {
        if (searchTerm.trim()) {
            return tools.filter(tool =>
                tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tool.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return tools.filter(tool => tool.category === activeCategory);
    }, [searchTerm, activeCategory]);

    return (
        <div className="container mx-auto px-4 py-8 sm:py-12 animate-fade-in">
            <div className="text-center mb-10">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    Bem-vindo ao Pixshop AI
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                    Sua suíte completa de ferramentas de IA para criar e editar imagens.
                </p>
            </div>

            <SearchModule searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            
            {!searchTerm.trim() && <RecentTools />}

            {!searchTerm.trim() && (
                <>
                    <div className="flex flex-col sm:flex-row justify-center mt-8 border-b border-gray-700">
                        {categoryKeys.map((key) => (
                            <button
                                key={key}
                                onClick={() => setActiveCategory(key)}
                                className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold transition-colors duration-200 border-b-2
                                    ${activeCategory === key
                                        ? 'border-blue-500 text-white'
                                        : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                                    }`}
                            >
                                {categoryConfig[key].title}
                            </button>
                        ))}
                    </div>
                    <p className="text-gray-400 mt-8 text-center max-w-3xl mx-auto text-base sm:text-lg">{categoryConfig[activeCategory].description}</p>
                </>
            )}

            <section className="mt-8 animate-fade-in">
                 {filteredTools.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTools.map(tool => (
                            <ToolCard key={tool.id} tool={tool} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-gray-400 text-lg">Nenhuma ferramenta encontrada para "{searchTerm}".</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default HomePage;