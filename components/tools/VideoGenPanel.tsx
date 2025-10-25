/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { useEditor } from '../../context/EditorContext';
import { type VideoAspectRatio } from '../../types';
import PromptEnhancer from './common/PromptEnhancer';
import Spinner from '../Spinner';
import PromptSuggestionsDropdown from '../common/PromptSuggestionsDropdown';
import { usePromptSuggestions } from '../../hooks/usePromptSuggestions';
import LazyIcon from '../LazyIcon';
import ImageDropzone from './common/ImageDropzone';
import { validatePromptSpecificity } from '../../services/geminiService';

const VideoGenPanel: React.FC = () => {
    const { 
        isLoading, 
        handleGenerateVideo, 
        generatedVideoUrl, 
        setLoadingMessage, 
        setError, 
        loadingMessage, 
        error, 
        addPromptToHistory,
        setToast,
        setIsLoading,
    } = useEditor();
    
    const [sourceImage, setSourceImage] = useState<File[]>([]);
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestions = usePromptSuggestions(prompt, 'videoGen');
    const [isKeyReady, setIsKeyReady] = useState(false);
    const [isCheckingKey, setIsCheckingKey] = useState(true);

    const checkApiKey = useCallback(async () => {
        setIsCheckingKey(true);
        if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
            setIsKeyReady(true);
        } else {
            setIsKeyReady(false);
        }
        setIsCheckingKey(false);
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            // Assume success and optimistically update UI to avoid race conditions
            setIsKeyReady(true); 
            setError(null); // Clear previous key errors
        }
    };

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
                "A IA está preparando a câmera...",
                "Renderizando o primeiro ato...",
                "Compondo a trilha sonora...",
                "Isso pode demorar alguns minutos...",
                "Dando os toques finais..."
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

    // Handle API key errors
    useEffect(() => {
        if (error?.includes("Requested entity was not found")) {
            setIsKeyReady(false);
            setError("Chave de API inválida. Por favor, selecione uma chave de API válida para continuar.");
        }
    }, [error, setError]);


    const aspectRatios: { id: VideoAspectRatio, name: string }[] = [
        { id: '16:9', name: 'Paisagem' },
        { id: '9:16', name: 'Retrato' },
    ];

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() && sourceImage.length === 0) {
            setError("Por favor, descreva a cena ou forneça uma imagem inicial.");
            return;
        }
        
        // Final check before generating
        if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
            setIsKeyReady(false);
            setError("É necessária uma chave de API para gerar vídeos.");
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            if (prompt.trim()) {
                setLoadingMessage('Analisando o prompt...');
                addPromptToHistory(prompt);
                const { isSpecific, suggestion } = await validatePromptSpecificity(prompt, 'Gerador de Vídeo AI');

                if (!isSpecific) {
                    setToast({ message: suggestion, type: 'info' });
                    setIsLoading(false);
                    setLoadingMessage(null);
                    return; // Stop execution
                }
            }

            await handleGenerateVideo(prompt, aspectRatio);
        } catch (err) {
             setError(err instanceof Error ? err.message : "Falha ao iniciar a geração de vídeo.");
             setIsLoading(false);
             setLoadingMessage(null);
        }
    };

    const renderContent = () => {
        if (isCheckingKey) {
            return <div className="flex justify-center items-center h-full"><Spinner /></div>;
        }
        if (!isKeyReady) {
            return (
                <div className="text-center p-4">
                    <h3 className="font-bold text-lg text-white">Chave de API Necessária</h3>
                    <p className="text-sm text-gray-400 mt-2 mb-4">A geração de vídeo com o modelo Veo requer uma chave de API com um projeto do Google Cloud associado.</p>
                    <button onClick={handleSelectKey} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg">
                        Selecionar Chave de API
                    </button>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline mt-2 block">
                        Saiba mais sobre o faturamento
                    </a>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </div>
            )
        }
        return (
            <form onSubmit={handleGenerate} className="w-full flex flex-col gap-4 animate-fade-in flex-grow">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-300">Gerador de Vídeo com IA</h3>
                    <p className="text-sm text-gray-400 mt-1">Crie vídeos a partir de texto ou de uma imagem.</p>
                </div>
                
                <ImageDropzone 
                    files={sourceImage}
                    onFilesChange={setSourceImage}
                    label="Imagem Inicial (Opcional)"
                />

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
                                placeholder="Ex: um astronauta surfando em uma onda cósmica..."
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
                    disabled={isLoading || (!prompt.trim() && sourceImage.length === 0)}
                >
                    <LazyIcon name="SparkleIcon" className="w-5 h-5" />
                    Gerar Vídeo
                </button>
            </form>
        )
    }

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                {renderContent()}
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
                       <a href={generatedVideoUrl} download={`video-gerado-${Date.now()}.mp4`} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                            <LazyIcon name="DownloadIcon" className="w-5 h-5" /> Baixar Vídeo
                       </a>
                    </div>
                )}
                {!generatedVideoUrl && !isLoading && !error && (
                     <div className="text-center text-gray-500 animate-fade-in">
                        <LazyIcon name="CameraIcon" className="w-16 h-16 mx-auto" />
                        <p className="mt-2 font-semibold">O seu vídeo gerado aparecerá aqui</p>
                    </div>
                )}
                {error && !isLoading && !isKeyReady && (
                    <div className="text-center text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg animate-fade-in w-full max-w-md">
                       <h3 className="font-bold text-yellow-300">Ação Necessária</h3>
                       <p className="text-sm mt-1">{error}</p>
                   </div>
                )}
                 {error && !isLoading && isKeyReady && (
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