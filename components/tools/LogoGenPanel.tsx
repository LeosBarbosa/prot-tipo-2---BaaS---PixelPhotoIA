/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { generateLogo, generateLogoVariation } from '../../services/geminiService';
import { dataURLtoFile, fileToDataURL } from '../../utils/imageUtils';
import ResultViewer from './common/ResultViewer';
import { LogoIcon, SparkleIcon } from '../icons';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import Spinner from '../Spinner';
import ImageDropzone from './common/ImageDropzone';

const LogoGenPanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        setError, 
        setIsLoading, 
        addPromptToHistory, 
        setLoadingMessage, 
        loadingMessage,
    } = useEditor();
    
    // State for the main image being displayed/worked on
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    // State for text-to-logo generation
    const [prompt, setPrompt] = useState('ícone de montanha para uma marca de aventura, design geométrico');
    const [negativePrompt, setNegativePrompt] = useState('texto, formas complexas, mais de 3 cores');

    // State for variations
    const [variations, setVariations] = useState<string[]>([]);
    const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);

    const handleGenerateFromText = async () => {
        if (!prompt.trim()) {
            setError("Por favor, descreva o logotipo que você deseja criar.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage("Criando seu logotipo...");
        setError(null);
        setResultImage(null);
        setLogoFile(null);
        setVariations([]);
        addPromptToHistory(prompt);
        try {
            let fullPrompt = prompt;
            if (negativePrompt.trim()) {
                fullPrompt += `. Evite o seguinte: ${negativePrompt}`;
            }
            const resultDataUrl = await generateLogo(fullPrompt);
            setResultImage(resultDataUrl);
            setLogoFile(dataURLtoFile(resultDataUrl, 'generated-logo.png'));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    };

    const handleFileUpload = async (file: File | null) => {
        setLogoFile(file);
        setVariations([]);
        setError(null);
        if (file) {
            try {
                const dataUrl = await fileToDataURL(file);
                setResultImage(dataUrl);
            } catch (err) {
                setError("Não foi possível carregar a imagem.");
                setResultImage(null);
                setLogoFile(null);
            }
        } else {
            setResultImage(null);
        }
    };

    const handleGenerateVariations = async () => {
        if (!logoFile) return;

        setIsGeneratingVariations(true);
        setVariations([]);
        setError(null);
        try {
            const variationPromises = [
                generateLogoVariation(logoFile),
                generateLogoVariation(logoFile),
                generateLogoVariation(logoFile),
            ];
            const results = await Promise.all(variationPromises);
            setVariations(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro ao gerar variações.");
        } finally {
            setIsGeneratingVariations(false);
        }
    };
    
    const handleSelectVariation = (variationUrl: string) => {
        setResultImage(variationUrl);
        setLogoFile(dataURLtoFile(variationUrl, 'variation-logo.png'));
        setVariations([]);
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:max-w-md flex-shrink-0 bg-gray-900/30 rounded-lg p-6 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-100">Gerador de Logotipo AI</h3>
                    <p className="text-sm text-gray-400 mt-1">Crie ou gere variações de um logotipo.</p>
                </div>
                
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                    <h4 className="font-bold text-white text-md mb-3 text-center">Passo 1: Crie seu logotipo</h4>
                     <CollapsiblePromptPanel
                      title="Gerar com Texto"
                      prompt={prompt}
                      setPrompt={setPrompt}
                      negativePrompt={negativePrompt}
                      onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                      isLoading={isLoading || isGeneratingVariations}
                      toolId="logoGen"
                      promptPlaceholder="Ex: ícone de uma raposa para uma empresa de tecnologia..."
                    />
                    <button
                        onClick={handleGenerateFromText}
                        disabled={isLoading || isGeneratingVariations || !prompt.trim()}
                        className="w-full mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <LogoIcon className="w-5 h-5" />
                        Gerar
                    </button>

                    <div className="relative text-center my-4">
                        <hr className="border-t border-gray-600" />
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800/50 px-2 text-gray-400 font-semibold text-sm">OU</span>
                    </div>

                     <ImageDropzone 
                        imageFile={logoFile}
                        onFileSelect={handleFileUpload}
                        label="Carregar um logotipo"
                    />
                </div>
                
                {resultImage && (
                    <div className="border-t border-gray-700/50 pt-4 mt-auto animate-fade-in">
                         <h4 className="text-md font-semibold text-center text-gray-200 mb-2">Passo 2: Gerar Variações</h4>
                         <button
                            onClick={handleGenerateVariations}
                            disabled={isLoading || isGeneratingVariations || !resultImage}
                            className="w-full bg-gradient-to-br from-sky-600 to-cyan-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <SparkleIcon className="w-5 h-5" />
                            Gerar Variações do Logotipo Atual
                        </button>
                    </div>
                )}
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage={loadingMessage ?? "Processando..."}
                />

                {(isGeneratingVariations || variations.length > 0) && (
                    <div className="w-full mt-4 p-4 border-t border-gray-700/50">
                        <h4 className="text-md font-semibold text-center text-gray-200 mb-3">Variações</h4>
                        {isGeneratingVariations ? (
                            <div className="grid grid-cols-3 gap-4">
                                <div className="aspect-square bg-gray-900/50 rounded-lg flex items-center justify-center"><Spinner /></div>
                                <div className="aspect-square bg-gray-900/50 rounded-lg flex items-center justify-center"><Spinner /></div>
                                <div className="aspect-square bg-gray-900/50 rounded-lg flex items-center justify-center"><Spinner /></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-4 animate-fade-in">
                                {variations.map((variation, index) => (
                                    <button 
                                        key={index}
                                        onClick={() => handleSelectVariation(variation)}
                                        className="group relative aspect-square bg-gray-900/50 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 transform hover:scale-105"
                                    >
                                        <img src={variation} alt={`Variação ${index + 1}`} className="w-full h-full object-contain p-1" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <p className="text-white font-bold text-sm">Usar esta</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default LogoGenPanel;