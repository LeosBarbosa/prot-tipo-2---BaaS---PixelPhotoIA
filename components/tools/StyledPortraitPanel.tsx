/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { generateStyledPortrait } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { ShirtIcon, CloseIcon } from '../icons';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import TipBox from '../common/TipBox';
import PromptPresetPanel from '../common/PromptPresetPanel';

const StyledPortraitPanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        baseImageFile,
        setInitialImage,
        currentImageUrl,
        handleStyledPortrait,
    } = useEditor();
    const [personImage, setPersonImage] = useState<File | null>(null);
    const [styleImages, setStyleImages] = useState<(File | null)[]>([null]); // Suporte a um slot inicial
    const [prompt, setPrompt] = useState(''); // Instruções adicionais
    const [negativePrompt, setNegativePrompt] = useState('');

    useEffect(() => {
        if (baseImageFile && !personImage) {
            setPersonImage(baseImageFile);
        }
    }, [baseImageFile, personImage]);

    const handlePersonFileSelect = (file: File | null) => {
        setPersonImage(file);
        if (file) {
            setInitialImage(file);
        }
    };
    
    const handleStyleFileSelect = (file: File | null, index: number) => {
        const newStyleImages = [...styleImages];
        newStyleImages[index] = file;
        setStyleImages(newStyleImages);
    };
    
    const addStyleImageSlot = () => {
        if (styleImages.length < 3) {
            setStyleImages(prev => [...prev, null]);
        }
    };
    
    const removeStyleImageSlot = (index: number) => {
        setStyleImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerate = async () => {
        const validStyleImages = styleImages.filter((f): f is File => f !== null);
        if (!personImage || validStyleImages.length === 0) {
            return;
        }
        handleStyledPortrait(personImage, validStyleImages, prompt, negativePrompt);
    };
    
    const isGenerateDisabled = isLoading || !personImage || styleImages.filter(f => f !== null).length === 0;

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Retrato Estilizado</h3>
                    <p className="text-sm text-gray-400 mt-1">Aplique o estilo de uma foto em outra, mantendo o rosto original intacto.</p>
                </div>
                
                <ImageDropzone 
                    imageFile={personImage}
                    onFileSelect={handlePersonFileSelect}
                    label="Sua Foto (Pessoa)"
                />
                
                <div>
                     <h4 className="text-sm font-semibold text-gray-300 mb-2">Imagens de Estilo (Máx. 3)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {styleImages.map((img, index) => (
                            <div key={index} className="relative">
                                <ImageDropzone 
                                    imageFile={img}
                                    onFileSelect={(file) => handleStyleFileSelect(file, index)}
                                    label={`Estilo ${index + 1}`}
                                />
                                {styleImages.length > 1 && (
                                    <button 
                                        type="button"
                                        onClick={() => removeStyleImageSlot(index)}
                                        className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white p-1 rounded-full text-xs z-10"
                                        title="Remover imagem de estilo"
                                    >
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {styleImages.length < 3 && (
                        <button 
                            type="button"
                            onClick={addStyleImageSlot}
                            disabled={isLoading || styleImages.filter(f => f === null).length === 0 && styleImages.length === 1 && !styleImages[0]}
                            className="mt-3 text-sm text-blue-400 hover:text-blue-300 w-full text-center py-2 border border-blue-400/50 rounded-lg hover:bg-blue-400/10 disabled:opacity-50"
                        >
                            + Adicionar Referência de Estilo
                        </button>
                    )}
                </div>
                
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
                    <ShirtIcon className="w-5 h-5" />
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