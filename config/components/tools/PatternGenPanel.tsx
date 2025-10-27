/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { useEditor } from '../../../context/EditorContext';
import { generateSeamlessPattern } from '../../../services/geminiService';
import ResultViewer from './common/ResultViewer';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import { dataURLtoFile } from '../../../utils/imageUtils';
import LazyIcon from '../LazyIcon';

const PatternGenPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, setInitialImage, setActiveTool, setToast, setLoadingMessage } = useEditor();
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Por favor, descreva o padrão que você deseja criar.");
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
            const result = await generateSeamlessPattern(fullPrompt, setToast, setLoadingMessage);
            setResultImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Gerador de Padrões</h3>
                    <p className="text-sm text-gray-400 mt-1">Crie padrões de fundo sem costura.</p>
                </div>
                 <CollapsiblePromptPanel
                  title="Descrição do Padrão"
                  prompt={prompt}
                  setPrompt={setPrompt}
                  negativePrompt={negativePrompt}
                  onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                  isLoading={isLoading}
                  toolId="patternGen"
                  promptHelperText="Descreva os elementos que se repetem, a paleta de cores e o estilo (ex: geométrico, floral)."
                  negativePromptHelperText="Ex: elementos que não se encaixam, cores indesejadas."
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full mt-auto bg-gradient-to-br from-teal-600 to-cyan-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <LazyIcon name="PatternIcon" className="w-5 h-5" />
                    Gerar Padrão
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Criando seu padrão..."
                />
            </main>
        </div>
    );
};

export default PatternGenPanel;