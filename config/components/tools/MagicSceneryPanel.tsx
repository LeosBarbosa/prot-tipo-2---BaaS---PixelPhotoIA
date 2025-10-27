/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { useEditor } from '../../../context/EditorContext';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import TipBox from '../common/TipBox';
import LazyIcon from '../LazyIcon';

const MagicSceneryPanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        baseImageFile,
        setInitialImage,
        currentImageUrl,
        handleMagicScenery,
        setLoadingMessage,
    } = useEditor();
    
    const [objectImage, setObjectImage] = useState<File[]>([]);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');

    useEffect(() => {
        if (baseImageFile && objectImage.length === 0) {
            setObjectImage([baseImageFile]);
        }
    }, [baseImageFile, objectImage]);

    const handleObjectFileSelect = (files: File[]) => {
        setObjectImage(files);
        if (files[0]) {
            setInitialImage(files[0]);
        }
    };
    
    const handleGenerate = async () => {
        const imageFile = objectImage[0];
        if (!imageFile || !prompt.trim()) return;

        let fullPrompt = prompt;
        if (negativePrompt.trim()) {
            fullPrompt += `. Evite o seguinte: ${negativePrompt}`;
        }
        
        await handleMagicScenery(imageFile, fullPrompt);
    };
    
    const isGenerateButtonDisabled = isLoading || objectImage.length === 0 || !prompt.trim();

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Cenário Mágico</h3>
                    <p className="text-sm text-gray-400 mt-1">Coloque um objeto em qualquer lugar do mundo com IA.</p>
                </div>
                
                <ImageDropzone 
                    files={objectImage}
                    onFilesChange={handleObjectFileSelect}
                    label="Imagem do Objeto (PNG)"
                />

                <CollapsiblePromptPanel
                    title="Descrição do Cenário"
                    prompt={prompt}
                    setPrompt={setPrompt}
                    negativePrompt={negativePrompt}
                    onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                    isLoading={isLoading}
                    toolId="magicScenery"
                    promptPlaceholder="Ex: em uma rua movimentada de Tóquio à noite, com reflexos de neon..."
                    promptHelperText="Seja específico sobre o local, a iluminação e a atmosfera. A IA usará sua localização para entender prompts como 'perto de mim'."
                    negativePromptHelperText="Ex: pessoas, clima ensolarado."
                />
             
                <TipBox>
                    Para melhores resultados, use uma imagem com fundo transparente (PNG). A IA solicitará sua localização para entender prompts como "perto de mim".
                </TipBox>
            
                <button
                    onClick={handleGenerate}
                    disabled={isGenerateButtonDisabled}
                    className="w-full mt-auto bg-gradient-to-br from-green-600 to-teal-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <LazyIcon name="MapPinIcon" className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
                    {isLoading ? 'Gerando...' : 'Gerar Cenário'}
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                 <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={currentImageUrl}
                    loadingMessage="Procurando o local perfeito..."
                />
            </main>
        </div>
    );
};

export default MagicSceneryPanel;