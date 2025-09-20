/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useLoadingError } from '../../context/EditorContext';
import { generateImageFromText } from '../../services/geminiService';
import ResultViewer from './common/ResultViewer';
import { PhotoIcon } from '../icons';

const ImageGenPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading } = useLoadingError();
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');

    const aspectRatios: { id: string, name: string }[] = [
        { id: '1:1', name: 'Quadrado' },
        { id: '16:9', name: 'Paisagem' },
        { id: '9:16', name: 'Retrato' },
    ];

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Por favor, digite um prompt para gerar a imagem.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            const result = await generateImageFromText(prompt, aspectRatio);
            setResultImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Gerador de Imagens AI</h3>
                    <p className="text-sm text-gray-400 mt-1">Crie imagens a partir de descrições de texto.</p>
                </div>
                
                <label className="block text-sm font-medium text-gray-300">Prompt</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: um astronauta surfando em uma onda cósmica, com nebulosas coloridas ao fundo, estilo cinematográfico..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base min-h-[150px] flex-grow"
                    disabled={isLoading}
                    rows={6}
                />
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Proporção</label>
                    <div className="flex w-full bg-gray-800/50 border border-gray-600 rounded-lg p-1">
                        {aspectRatios.map(({ id, name }) => (
                            <button key={id} type="button" onClick={() => setAspectRatio(id)} disabled={isLoading} className={`w-full text-center font-semibold py-2 rounded-md transition-all text-sm ${aspectRatio === id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/10'}`}>
                                {name} ({id})
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full mt-auto bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <PhotoIcon className="w-5 h-5" />
                    Gerar Imagem
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Gerando sua imagem..."
                />
            </main>
        </div>
    );
};

export default ImageGenPanel;
