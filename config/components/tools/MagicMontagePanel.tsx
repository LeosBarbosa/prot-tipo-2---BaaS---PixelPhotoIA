/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../../context/EditorContext';
import ImageDropzone from './common/ImageDropzone';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import TipBox from '../common/TipBox';
import LazyIcon from '../LazyIcon';
import ResultViewer from './common/ResultViewer';

const MagicMontagePanel: React.FC = () => {
    const { 
        isLoading, 
        error,
        baseImageFile,
        setInitialImage,
        handleMagicMontage,
        currentImageUrl,
    } = useEditor();
    
    const [mainImage, setMainImage] = useState<File[]>([]);
    const [secondImage, setSecondImage] = useState<File[]>([]);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');

    useEffect(() => {
        if (baseImageFile && mainImage.length === 0) {
            setMainImage([baseImageFile]);
        }
    }, [baseImageFile, mainImage]);

    const handleMainFileSelect = (files: File[]) => {
        setMainImage(files);
        if (files[0]) {
            setInitialImage(files[0]);
        }
    };
    
    const handleGenerate = async () => {
        const mainImageFile = mainImage[0];
        const secondImageFile = secondImage[0];
        if (!mainImageFile || !prompt.trim()) return;
        
        // Note: The handleMagicMontage in context doesn't handle negative prompt, but we collect it for consistency
        await handleMagicMontage(mainImageFile, prompt, secondImageFile);
    };

    const isGenerateButtonDisabled = isLoading || mainImage.length === 0 || !prompt.trim();

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Montagem Mágica</h3>
                    <p className="text-sm text-gray-400 mt-1">Descreva uma edição complexa e deixe a IA fazer a montagem.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <ImageDropzone 
                        files={mainImage}
                        onFilesChange={handleMainFileSelect}
                        label="Imagem Principal"
                    />
                     <ImageDropzone 
                        files={secondImage}
                        onFilesChange={setSecondImage}
                        label="Imagem Fonte (Opcional)"
                    />
                </div>
                
                <CollapsiblePromptPanel
                    title="Descrição da Montagem"
                    prompt={prompt}
                    setPrompt={setPrompt}
                    negativePrompt={negativePrompt}
                    onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                    isLoading={isLoading}
                    toolId="magicMontage"
                    promptPlaceholder="Ex: coloque a pessoa em uma paisagem lunar..."
                    promptHelperText="Seja descritivo. Use a imagem fonte se precisar de um objeto específico para a montagem."
                />

                <TipBox>
                    Use a imagem fonte para adicionar objetos específicos, ou apenas descreva o que você quer adicionar à imagem principal.
                </TipBox>
                
                <button
                    onClick={handleGenerate}
                    disabled={isGenerateButtonDisabled}
                    className="w-full mt-auto bg-gradient-to-br from-fuchsia-600 to-purple-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <LazyIcon name="MagicWandIcon" className="w-5 h-5" />
                    Criar Montagem
                </button>
            </aside>
             <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                 <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={currentImageUrl}
                    loadingMessage="Realizando a montagem mágica..."
                />
            </main>
        </div>
    );
};

export default MagicMontagePanel;