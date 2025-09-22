/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { generateAnimationFromImage } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import Spinner from '../Spinner';
import { BananaIcon, DownloadIcon } from '../icons';

const BananimatePanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, loadingMessage, setLoadingMessage } = useEditor();
    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [prompt, setPrompt] = useState('');
    const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!sourceImage) {
            setError("Por favor, carregue uma imagem para animar.");
            return;
        }
        if (!prompt.trim()) {
            setError("Por favor, descreva a animação desejada.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultVideoUrl(null);

        const messages = [
            "Sua animação está sendo criada...",
            "Adicionando um toque de banana...",
            "Renderizando os pixels dançantes...",
            "A IA está aquecendo os motores de animação...",
            "Quase pronto! Polindo a animação..."
        ];
        
        let messageIndex = 0;
        const intervalId = setInterval(() => {
            messageIndex = (messageIndex + 1) % messages.length;
            setLoadingMessage(messages[messageIndex]);
        }, 8000);

        try {
            setLoadingMessage(messages[0]);
            const result = await generateAnimationFromImage(sourceImage, prompt);
            setResultVideoUrl(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            clearInterval(intervalId);
            setIsLoading(false);
            setLoadingMessage(null);
        }
    };
    
    const handleDownload = () => {
        if (!resultVideoUrl) return;
        fetch(resultVideoUrl)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `bananimate-${Date.now()}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            })
            .catch(err => {
                console.error("Failed to download video:", err);
                setError("Não foi possível baixar o vídeo.");
            });
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Bananimate</h3>
                    <p className="text-sm text-gray-400 mt-1">Dê vida às suas fotos com animações divertidas.</p>
                </div>
                <ImageDropzone
                    imageFile={sourceImage}
                    onFileSelect={setSourceImage}
                    label="Sua Imagem"
                />
                <label className="block text-sm font-medium text-gray-300">Descrição da Animação</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: faça o gato dançar, adicione vapor saindo da xícara..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base min-h-[120px]"
                    disabled={isLoading}
                    rows={5}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !sourceImage || !prompt.trim()}
                    className="w-full mt-auto bg-gradient-to-br from-yellow-500 to-orange-400 text-gray-900 font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <BananaIcon className="w-5 h-5" />
                    Gerar Animação
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                {isLoading && (
                    <div className="text-center text-gray-300 animate-fade-in">
                        <Spinner />
                        <p className="mt-4 font-semibold animate-pulse">{loadingMessage || "Processando..."}</p>
                    </div>
                )}
                {error && !isLoading && (
                    <div className="text-center text-red-400 animate-fade-in bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                        <h3 className="font-bold text-red-300">Ocorreu um Erro</h3>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                )}
                {resultVideoUrl && !isLoading && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 animate-fade-in">
                       <video src={resultVideoUrl} controls autoPlay loop className="max-w-full max-h-[80%] rounded-lg" />
                       <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            Baixar Vídeo
                        </button>
                    </div>
                )}
                {!resultVideoUrl && !isLoading && !error && (
                     <div className="text-center text-gray-500 animate-fade-in">
                        <BananaIcon className="w-16 h-16 mx-auto text-yellow-500/50" />
                        <p className="mt-2 font-semibold">Sua animação aparecerá aqui</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default BananimatePanel;
