/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { useLoadingError } from '../../context/EditorContext';
import { generateSticker } from '../../services/geminiService';
import ResultViewer from './common/ResultViewer';
import { StickersIcon } from '../icons';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';

const StickerCreatorPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading } = useLoadingError();
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Por favor, descreva o adesivo que você deseja criar.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            let fullPrompt = prompt;
            if (negativePrompt.trim()) {
                fullPrompt += `. Evite o seguinte: ${negativePrompt}`;
            }
            const result = await generateSticker(fullPrompt);
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
                    <h3 className="text-lg font-semibold text-gray-200">Criador de Adesivos AI</h3>
                    <p className="text-sm text-gray-400 mt-1">Gere adesivos em estilo de desenho animado a partir de um prompt.</p>
                </div>
                 <CollapsiblePromptPanel
                  title="Descrição do Adesivo"
                  prompt={prompt}
                  onPromptChange={(e) => setPrompt(e.target.value)}
                  negativePrompt={negativePrompt}
                  onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                  isLoading={isLoading}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full mt-auto bg-gradient-to-br from-pink-600 to-rose-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <StickersIcon className="w-5 h-5" />
                    Gerar Adesivo
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Criando seu adesivo..."
                />
            </main>
        </div>
    );
};

export default StickerCreatorPanel;