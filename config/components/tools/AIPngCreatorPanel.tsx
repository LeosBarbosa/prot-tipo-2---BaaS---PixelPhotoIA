/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../../context/EditorContext';
import * as geminiService from '../../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import CollapsibleToolPanel from '../CollapsibleToolPanel';
import ToggleSwitch from '../common/ToggleSwitch';
import TipBox from '../common/TipBox';
import { dataURLtoFile } from '../../../utils/imageUtils';
import LazyIcon from '../LazyIcon';

const AIPngCreatorPanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        setError, 
        setIsLoading, 
        baseImageFile,
        setInitialImage, 
        setLoadingMessage,
        setActiveTool,
        setToast,
        loadingMessage,
    } = useEditor();
    
    const [sourceImage, setSourceImage] = useState<File[]>([]);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isOptionsExpanded, setIsOptionsExpanded] = useState(false);
    
    // Options state
    const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
    const [backgroundPrompt, setBackgroundPrompt] = useState('');
    const [enhanceImage, setEnhanceImage] = useState(true);
    const [backgroundType, setBackgroundType] = useState<'none' | 'color' | 'prompt'>('none');

    useEffect(() => {
        if (baseImageFile && sourceImage.length === 0) {
            setSourceImage([baseImageFile]);
        }
    }, [baseImageFile, sourceImage]);

    const handleFileSelect = (files: File[]) => {
        setSourceImage(files);
        if (files[0]) {
            setInitialImage(files[0]);
        }
        setResultImage(null);
    };

    const handleGenerate = async () => {
        const imageFile = sourceImage[0];
        if (!imageFile) {
            setError("Por favor, carregue uma imagem para converter.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResultImage(null);
        setLoadingMessage('Removendo o fundo...');

        try {
            const options: Parameters<typeof geminiService.createTransparentPng>[1] = {
                enhance: enhanceImage,
            };

            if (backgroundType === 'color') {
                options.background = { type: 'color', value: backgroundColor };
                setLoadingMessage('Aplicando cor de fundo...');
            } else if (backgroundType === 'prompt' && backgroundPrompt.trim()) {
                options.background = { type: 'prompt', value: backgroundPrompt };
                setLoadingMessage('Gerando novo fundo com IA...');
            }
            
            if(enhanceImage && !options.background) {
                setLoadingMessage('Removendo fundo e aprimorando...');
            }

            const result = await geminiService.createTransparentPng(imageFile, options, setToast);
            setResultImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    };
    
    const isGenerateButtonDisabled = isLoading || sourceImage.length === 0;

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50 overflow-y-auto scrollbar-thin">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Criador de PNG Transparente</h3>
                    <p className="text-sm text-gray-400 mt-1">Remova o fundo e aprimore sua imagem com um clique.</p>
                </div>
                
                <ImageDropzone files={sourceImage} onFilesChange={handleFileSelect} label="Sua Imagem"/>

                <CollapsibleToolPanel
                    title="Opções Adicionais"
                    icon="SparkleIcon"
                    isExpanded={isOptionsExpanded}
                    onExpandToggle={() => setIsOptionsExpanded(!isOptionsExpanded)}
                >
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Fundo</label>
                            <div className="flex w-full bg-gray-900/50 border border-gray-600 rounded-lg p-1">
                                <button type="button" onClick={() => setBackgroundType('none')} className={`w-full text-center font-semibold py-2 rounded-md text-xs transition-all ${backgroundType === 'none' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>Transparente</button>
                                <button type="button" onClick={() => setBackgroundType('color')} className={`w-full text-center font-semibold py-2 rounded-md text-xs transition-all ${backgroundType === 'color' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>Cor</button>
                                <button type="button" onClick={() => setBackgroundType('prompt')} className={`w-full text-center font-semibold py-2 rounded-md text-xs transition-all ${backgroundType === 'prompt' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>Gerado por IA</button>
                            </div>
                        </div>

                        {backgroundType === 'color' && (
                             <div className="flex items-center gap-3 animate-fade-in">
                                <label htmlFor="bg-color" className="text-sm font-medium text-gray-300">Escolha uma cor:</label>
                                <input id="bg-color" type="color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="w-12 h-8 bg-gray-800 border border-gray-600 rounded p-1"/>
                            </div>
                        )}
                        
                        {backgroundType === 'prompt' && (
                            <div className="animate-fade-in">
                                <textarea value={backgroundPrompt} onChange={e => setBackgroundPrompt(e.target.value)} placeholder="Ex: um estúdio profissional, uma praia ensolarada..." className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-base min-h-[80px]" disabled={isLoading}/>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                          <label htmlFor="enhance-toggle" className="font-semibold text-gray-200 text-sm cursor-pointer">Melhorar Qualidade</label>
                          <ToggleSwitch id="enhance-toggle" checked={enhanceImage} onChange={setEnhanceImage} disabled={isLoading} />
                        </div>
                    </div>
                </CollapsibleToolPanel>
                
                <TipBox>
                    A IA preservará detalhes finos como cabelo e pelagem. Use as opções para adicionar um fundo ou melhorar a nitidez da imagem final.
                </TipBox>
                
                <button onClick={handleGenerate} disabled={isGenerateButtonDisabled} className="w-full mt-auto bg-gradient-to-br from-green-600 to-teal-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <LazyIcon name="PngIcon" className="w-5 h-5" />
                    Converter para PNG
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage={loadingMessage}
                />
            </main>
        </div>
    );
};

export default AIPngCreatorPanel;