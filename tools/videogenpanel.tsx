/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { type VideoAspectRatio } from '../../types';
import PromptEnhancer from './common/PromptEnhancer';
import Spinner from '../Spinner';
import PromptSuggestionsDropdown from '../common/PromptSuggestionsDropdown';
import { usePromptSuggestions } from '../../hooks/usePromptSuggestions';
import LazyIcon from '../LazyIcon';

const VideoGenPanel: React.FC = () => {
    const { isLoading, handleGenerateVideo, generatedVideoUrl, setLoadingMessage, setError, loadingMessage, error, addPromptToHistory } = useEditor();
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestions = usePromptSuggestions(prompt, 'videoGen');

    useEffect(() => {
        setShowSuggestions(suggestions.length > 0);
    }, [suggestions]);

    const handleSelectSuggestion = (suggestion: string) => {
        setPrompt(suggestion);
        setShowSuggestions(false);
    };

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;
        if (isLoading) {
            const messages = [
                "A IA está a preparar a câmara...",
                "Renderizando o primeiro ato...",
                "A compor a banda sonora...",
                "Isto pode demorar alguns minutos...",
                "A dar os toques finais..."
            ];
            let messageIndex = 0;
            setLoadingMessage(messages[messageIndex]);
            intervalId = setInterval(() => {
                messageIndex = (messageIndex + 1) % messages.length;
                setLoadingMessage(messages[messageIndex]);
            }, 8000);
        }
        
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isLoading, setLoadingMessage]);


    const aspectRatios: { id: VideoAspectRatio, name: string }[] = [
        { id: '16:9', name: 'Paisagem' },
        { id: '1:1', name: 'Quadrado' },
        { id: '9:16', name: 'Retrato' },
    ];

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            setError("Por favor, descreva a cena que você quer criar.");
            return;
        }
        setError(null);
        addPromptToHistory(prompt);
        handleGenerateVideo(prompt, aspectRatio);
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <form onSubmit={handleGenerate} className="w-full flex flex-col gap-4 animate-fade-in flex-grow">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-300">Gerador de Vídeo com IA</h3>
                        <p className="text-sm text-gray-400 -mt-1">Descreva a cena que você quer criar.</p>
                    </div>

                    <div className="flex-grow flex flex-col gap-4">
                        <div className="relative flex-grow flex flex-col">
                            <label htmlFor="video-prompt" className="sr-only">Descrição do Vídeo</label>
                            <div className="relative">
                                <textarea
                                    id="video-prompt"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    onFocus={() => setShowSuggestions(suggestions.length > 0)}
                                    placeholder="Ex: um astronauta surfando em uma onda cósmica, com nebulosas coloridas ao fundo, estilo cinematográfico..."
                                    className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 pr-12 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base min-h-[120px]"
                                    disabled={isLoading}
                                    rows={5}
                                />
                                <PromptEnhancer prompt={prompt} setPrompt={setPrompt} toolId="videoGen" />
                            </div>
                            {showSuggestions && (
                                <PromptSuggestionsDropdown
                                    suggestions={suggestions}
                                    onSelect={handleSelectSuggestion}
                                    searchTerm={prompt}
                                />
                            )}
                             <p className="mt-1 text-xs text-gray-500 px-1">Descreva a ação, o movimento da câmera (ex: panorâmica, zoom) e o estilo cinematográfico.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Proporção</label>
                            <div className="flex w-full bg-gray-900/50 border border-gray-600 rounded-lg p-1">
                                {aspectRatios.map(({ id, name }) => (
                                    <button key={id} type="button" onClick={() => setAspectRatio(id)} disabled={isLoading} className={`w-full text-center font-semibold py-2 rounded-md transition-all text-sm ${aspectRatio === id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>
                                        {name} ({id})
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-auto bg-gradient-to-br from-red-600 to-orange-500 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:from-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        disabled={isLoading || !prompt.trim()}
                    >
                        <LazyIcon name="SparkleIcon" className="w-5 h-5" />
                        Gerar Vídeo
                    </button>
                </form>
            </aside>
             <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                {isLoading && (
                    <div className="text-center text-gray-400 animate-fade-in">
                        <Spinner />
                        <p 
                            key={loadingMessage} 
                            className="mt-4 font-semibold text-lg text-gray-200 animate-fade-in-text"
                        >
                            {loadingMessage}
                        </p>
                    </div>
                )}
                {generatedVideoUrl && !isLoading && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 animate-fade-in">
                       <video src={generatedVideoUrl} controls autoPlay loop className="max-w-full max-h-[80%] rounded-lg" />
                    </div>
                )}
                {!generatedVideoUrl && !isLoading && !error && (
                     <div className="text-center text-gray-500 animate-fade-in">
                        <LazyIcon name="CameraIcon" className="w-16 h-16 mx-auto" />
                        <p className="mt-2 font-semibold">O seu vídeo gerado aparecerá aqui</p>
                    </div>
                )}
                {error && !isLoading && (
                     <div className="text-center text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-lg animate-fade-in w-full max-w-md">
                        <h3 className="font-bold text-red-300">Ocorreu um Erro</h3>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default VideoGenPanel;