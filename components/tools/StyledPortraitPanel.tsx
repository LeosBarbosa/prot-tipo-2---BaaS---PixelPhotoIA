/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import TipBox from '../common/TipBox';
import PromptPresetPanel from './common/PromptPresetPanel';
import LazyIcon from '../LazyIcon';

const StyledPortraitPanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        baseImageFile,
        setInitialImage,
        currentImageUrl,
        handleStyledPortrait,
    } = useEditor();
    const [personImage, setPersonImage] = useState<File[]>([]);
    const [styleImages, setStyleImages] = useState<File[]>([]);
    const [prompt, setPrompt] = useState(''); // Instruções adicionais
    const [negativePrompt, setNegativePrompt] = useState('');

    useEffect(() => {
        if (baseImageFile && personImage.length === 0) {
            setPersonImage([baseImageFile]);
        }
    }, [baseImageFile, personImage]);

    const handlePersonFileSelect = (files: File[]) => {
        setPersonImage(files);
        if (files[0]) {
            setInitialImage(files[0]);
        }
    };

    const handleGenerate = async () => {
        const personFile = personImage[0];
        if (!personFile || styleImages.length === 0) {
            return;
        }
        handleStyledPortrait(personFile, styleImages, prompt, negativePrompt);
    };
    
    const isGenerateDisabled = isLoading || personImage.length === 0 || styleImages.length === 0;

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Retrato Estilizado</h3>
                    <p className="text-sm text-gray-400 mt-1">Aplique o estilo de uma foto em outra, mantendo o rosto original intacto.</p>
                </div>
                
                <ImageDropzone 
                    files={personImage}
                    onFilesChange={handlePersonFileSelect}
                    label="Sua Foto (Pessoa)"
                />
                
                <ImageDropzone 
                    files={styleImages}
                    onFilesChange={setStyleImages}
                    label="Imagens de Estilo (Máx. 3)"
                    multiple
                    maxFiles={3}
                />
                
                <CollapsiblePromptPanel
                  title="Instruções Adicionais (Modificações)"
                  prompt={prompt}
                  setPrompt={setPrompt}
                  negativePrompt={negativePrompt}
                  onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                  isLoading={isLoading}
                  toolId="styledPortrait"
                  promptPlaceholder="Ex: mantenha o cabelo curto, adicione um leve sorriso, troque a cor da camisa para verde."
                  promptHelperText="Use este campo para refinar a aparência, pose, ou para adicionar/remover um acessório. O rosto será preservado."
                  negativePromptHelperText="Ex: óculos, chapéu, cores específicas, não altere o fundo."
                />

                <PromptPresetPanel 
                    toolId="styledPortrait"
                    onSelectPreset={(selectedPrompt) => setPrompt(selectedPrompt)}
                    isLoading={isLoading}
                />
                
                <TipBox>
                   Use a primeira imagem para o estilo principal, e adicione outras para combinar elementos (ex: roupa de uma, fundo de outra). O rosto será sempre preservado.
                </TipBox>
                
                <button
                    onClick={handleGenerate}
                    disabled={isGenerateDisabled}
                    className="w-full mt-auto bg-gradient-to-br from-teal-600 to-cyan-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <LazyIcon name="ShirtIcon" className="w-5 h-5" />
                    Gerar Retrato
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                 <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={currentImageUrl}
                    loadingMessage="Criando seu novo retrato..."
                />
            </main>
        </div>
    );
};

export default StyledPortraitPanel;