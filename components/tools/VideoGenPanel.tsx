/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { SparkleIcon } from '../icons';
import { type VideoAspectRatio } from '../../types';

const VideoGenPanel: React.FC = () => {
    const { isLoading, handleGenerateVideo } = useEditor()!;
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');

    const aspectRatios: { id: VideoAspectRatio, name: string }[] = [
        { id: '16:9', name: 'Paisagem' },
        { id: '1:1', name: 'Quadrado' },
        { id: '9:16', name: 'Retrato' },
    ];

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        handleGenerateVideo(prompt, aspectRatio);
    };

    return (
        <form onSubmit={handleGenerate} className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Gerador de Vídeo com IA</h3>
                <p className="text-sm text-gray-400 -mt-1">Descreva a cena que você quer criar.</p>
            </div>

            <div className="flex-grow flex flex-col gap-4">
                <label htmlFor="video-prompt" className="sr-only">Descrição do Vídeo</label>
                <textarea
                    id="video-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: um astronauta surfando em uma onda cósmica, com nebulosas coloridas ao fundo, estilo cinematográfico..."
                    className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base min-h-[120px]"
                    disabled={isLoading}
                    rows={5}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 text-center">Proporção</label>
                    <div className="flex w-full bg-gray-900/50 border border-gray-600 rounded-lg p-1">
                        {aspectRatios.map(({ id, name }) => (
                            <button key={id} type="button" onClick={() => setAspectRatio(id)} disabled={isLoading} className={`w-full text-center font-semibold py-2 rounded-md transition-all text-sm ${aspectRatio === id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/10'}`}>
                                {name} ({id})
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-700/50 my-2"></div>

            <button
                type="submit"
                className="w-full mt-2 bg-gradient-to-br from-red-600 to-orange-500 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:from-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isLoading || !prompt.trim()}
            >
                <SparkleIcon className="w-5 h-5" />
                Gerar Vídeo
            </button>
        </form>
    );
};

export default VideoGenPanel;