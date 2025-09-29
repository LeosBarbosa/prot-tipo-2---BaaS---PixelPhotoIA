/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { PhotoIcon, FaceSmileIcon, StickersIcon, ClipboardIcon, CheckCircleIcon } from './icons';

// Define suggestion categories based on specific tools
type SuggestionCategory = 'imageGen' | 'characterDesign' | 'stickerCreator';

const suggestions: Record<SuggestionCategory, { prompt: string }[]> = {
    imageGen: [
        { prompt: 'Uma vasta biblioteca interior com livros que se estendem até um teto abobadado, feixes de luz empoeirados, estilo de fantasia cinematográfica, detalhado.' },
        { prompt: 'Um close-up fotorrealista de um camaleão em um galho, com a textura da pele detalhada e um fundo de selva desfocado.' },
        { prompt: 'Uma cidade subaquática surreal com edifícios de coral brilhantes e cardumes de peixes como veículos, arte digital.' },
        { prompt: 'Um pôster de viagem vintage para Marte, com estilo art déco, foguetes e paisagens de rochas vermelhas.' },
    ],
    characterDesign: [
        { prompt: 'Um cavaleiro élfico com armadura ornamentada e uma espada mágica, em um ambiente de floresta encantada, arte realista' },
        { prompt: 'Uma feiticeira cibernética com cabelos roxos neon e implantes tecnológicos, em uma cidade futurista chuvosa, estilo cyberpunk' },
        { prompt: 'Um robô amigável feito de peças de sucata, com olhos grandes e expressivos, em um cenário de deserto pós-apocalíptico' },
        { prompt: 'Um animal místico, como um esquilo com asas de borboleta, vivendo em uma árvore mágica, estilo de pintura a óleo fantástica' },
    ],
    stickerCreator: [
        { prompt: 'Um gato astronauta fofo em estilo anime com borda branca' },
        { prompt: 'Um emoji de café sorridente em estilo cartoon com uma caneca fumegante, borda branca espessa' },
        { prompt: 'Um carro esportivo retrô com um acabamento cromado brilhante, estilo de desenho animado, borda branca' },
        { prompt: 'Um personagem de abacaxi vegetal dançando com óculos escuros, estilo kawaii, borda branca' },
    ],
};

const categoryConfig: Record<SuggestionCategory, { title: string; icon: React.ReactNode }> = {
    imageGen: { title: "Geração de Imagens", icon: <PhotoIcon className="w-5 h-5" /> },
    characterDesign: { title: "Design de Personagem", icon: <FaceSmileIcon className="w-5 h-5" /> },
    stickerCreator: { title: "Criador de Stickers", icon: <StickersIcon className="w-5 h-5" /> },
};

const PromptSuggestions: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<SuggestionCategory>('imageGen');
    const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

    const handleCopy = (prompt: string) => {
        navigator.clipboard.writeText(prompt);
        setCopiedPrompt(prompt);
        setTimeout(() => {
            setCopiedPrompt(null);
        }, 2000);
    };
    
    const categoryKeys = Object.keys(categoryConfig) as SuggestionCategory[];

    return (
        <div className="mb-12 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Inspire-se com Sugestões de Prompt</h2>
                <p className="text-gray-400 mt-1">Não sabe por onde começar? Copie um prompt e veja a mágica acontecer.</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center mb-6 border-b border-gray-700">
                {categoryKeys.map((key) => (
                    <button
                        key={key}
                        onClick={() => setActiveCategory(key)}
                        className={`flex items-center gap-3 px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold transition-colors duration-200 border-b-2
                            ${activeCategory === key
                                ? 'border-blue-500 text-white'
                                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                            }`}
                    >
                        {categoryConfig[key].icon}
                        {categoryConfig[key].title}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions[activeCategory].map((suggestion, index) => (
                    <div 
                        key={`${activeCategory}-${index}`}
                        className="group bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center justify-between gap-4 transition-all hover:bg-gray-700/50"
                    >
                        <p className="text-gray-300 text-sm flex-grow">{suggestion.prompt}</p>
                        <button 
                            onClick={() => handleCopy(suggestion.prompt)}
                            className="flex-shrink-0 p-2 rounded-md bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
                            aria-label="Copiar prompt"
                        >
                            {copiedPrompt === suggestion.prompt ? (
                                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                            ) : (
                                <ClipboardIcon className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PromptSuggestions;