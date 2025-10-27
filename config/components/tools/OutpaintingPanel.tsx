/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../../context/EditorContext';
import { outpaintImage } from '../../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import TipBox from '../common/TipBox';
import * as db from '../../../utils/db';
import { dataURLtoFile } from '../../../utils/imageUtils';
import { hashFile, sha256 } from '../../../utils/cryptoUtils';
import LazyIcon from '../LazyIcon';

const OutpaintingPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, addPromptToHistory, baseImageFile, setInitialImage, setToast, setLoadingMessage, setActiveTool } = useEditor();
    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('16:9');

     const aspectRatios: { id: string, name: string }[] = [
        { id: '16:9', name: 'Paisagem' },
        { id: '1:1', name: 'Quadrado' },
        { id: '9:16', name: 'Retrato' },
        { id: '4:3', name: 'Padrão' },
        { id: '3:4', name: 'Padrão (Vert.)' },
    ];

    useEffect(() => {
        if (baseImageFile && !sourceImage) {
            setSourceImage(baseImageFile);
        }
    }, [baseImageFile, sourceImage]);

    useEffect(() => {
        // Cleanup for object URLs
        return () => {
            if (resultImage && resultImage.startsWith('blob:')) {
                URL.revokeObjectURL(resultImage);
            }
        };
    }, [resultImage]);

    const handleFileSelect = (files: File[]) => {
        const file = files[0] || null;
        setSourceImage(file);
        if (file) {
            setInitialImage(file);
        }
        setResultImage(null);
    };

    const handleGenerate = async () => {
        if (!sourceImage) {
            setError("Por favor, carregue uma imagem para expandir.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        addPromptToHistory(prompt);
        try {
            setLoadingMessage('Expandindo sua imagem...');
            let fullPrompt = prompt;
            if (negativePrompt.trim()) {
                fullPrompt += `. Evite o seguinte: ${negativePrompt}`;
            }
            const result = await outpaintImage(sourceImage, fullPrompt, aspectRatio, setToast);
            setResultImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Pintura Expansiva (Outpainting)</h3>
                    <p className="text-sm text-gray-400 mt-1">Amplie o quadro da sua imagem com IA.</p>
                </div>
                <ImageDropzone 
                    files={sourceImage ? [sourceImage] : []}
                    onFilesChange={handleFileSelect}
                    label="Imagem Original"
                />
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nova Proporção</label>
                    <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base">
                        {aspectRatios.map(({ id, name }) => <option key={id} value={id}>{name} ({id})</option>)}
                    </select>
                </div>
                
                <CollapsiblePromptPanel
                    title="Descrição da Expansão (Opcional)"
                    prompt={prompt}
                    setPrompt={setPrompt}
                    negativePrompt={negativePrompt}
                    onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                    isLoading={isLoading}
                    toolId="outpainting"
                    promptPlaceholder="Descreva o que adicionar no espaço expandido..."
                    promptHelperText='Ex: "um céu estrelado com uma lua cheia", "continue a praia com areia e ondas".'
                    negativePromptHelperText="Ex: pessoas, edifícios."
                />

                <TipBox>
                    Descreva apenas o que você deseja adicionar nas áreas expandidas. A IA se encarregará de estender a imagem de forma coerente com o original.
                </TipBox>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !sourceImage}
                    className="w-full mt-auto bg-gradient-to-br from-indigo-600 to-purple-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <LazyIcon name="PhotoIcon" className="w-5 h-5" />
                    Expandir Imagem
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Expandindo sua imagem..."
                />
            </main>
        </div>
    );
};

export default OutpaintingPanel;