/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
// FIX: Replaced direct useEditor call with useLoadingError and a targeted useEditor call to resolve confusing scope errors.
import { useEditor, useLoadingError } from '../../context/EditorContext';
import * as geminiService from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { CameraIcon, DownloadIcon, BrushIcon } from '../icons';
import { dataURLtoFile } from '../../utils/imageUtils';
import PromptEnhancer from './common/PromptEnhancer';

type StyleId = 'rembrandt' | 'dramatic' | 'cinematic-bw' | 'classic' | 'ring-light' | 'casal-anos-90';

interface StyleConfig {
    id: StyleId;
    name: string;
    prompt: string;
    isCouple?: boolean;
}

const styles: StyleConfig[] = [
    { id: 'classic', name: 'Clássico', prompt: 'Iluminação de estúdio clássica e suave, com um fundo cinza neutro.' },
    { id: 'rembrandt', name: 'Rembrandt', prompt: 'Iluminação Rembrandt dramática, com um lado do rosto em sombra e um triângulo de luz na bochecha.' },
    { id: 'dramatic', name: 'Contraluz', prompt: 'Iluminação de contraluz dramática para criar uma silhueta e um brilho de contorno (rim light).' },
    { id: 'cinematic-bw', name: 'P&B Cinematográfico', prompt: 'Retrato em preto e branco de alto contraste, com grão de filme e uma sensação cinematográfica.' },
    { id: 'ring-light', name: 'Anel de Luz', prompt: 'Iluminação de estúdio moderna com um anel de luz (ring light), criando um brilho suave e uniforme e reflexos circulares distintos nos olhos.' },
    { id: 'casal-anos-90', name: 'Casal Anos 90', prompt: "Transforme a foto de um casal em um retrato de estúdio profissional com a estética de um anuário dos anos 90. O fundo deve ser um cinza sólido ou um azul-acinzentado texturizado. A iluminação deve ser de estúdio, suave e uniforme. As roupas devem ser casuais, consistentes com a moda do final dos anos 80 ou início dos anos 90 (jaquetas jeans, suéteres, etc.). Preserve 100% a identidade e as características faciais do casal. O resultado deve ser fotorrealista, parecendo uma foto de filme da época.", isCouple: true },
];

const PhotoStudioPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading } = useLoadingError();
    const { currentImage, setInitialImage, setActiveTool } = useEditor();
    
    const [personOneImage, setPersonOneImage] = useState<File | null>(null);
    const [personTwoImage, setPersonTwoImage] = useState<File | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<StyleId>('classic');
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [resultImage, setResultImage] = useState<string | null>(null);
    
    const currentStyleConfig = styles.find(s => s.id === selectedStyle)!;
    
    useEffect(() => {
        if (currentImage && !personOneImage) {
            setPersonOneImage(currentImage);
        }
    }, [currentImage, personOneImage]);

    const handlePersonOneFileSelect = (file: File | null) => {
        setPersonOneImage(file);
        if (file) {
            setInitialImage(file);
        }
        setResultImage(null);
    };

    const handleGenerate = async () => {
        const isCoupleStyle = currentStyleConfig.isCouple;

        if (!personOneImage || (isCoupleStyle && !personTwoImage)) {
            setError("Por favor, carregue todas as imagens necessárias.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            let result: string;
            if (isCoupleStyle) {
                const fullPrompt = `${currentStyleConfig.prompt} Detalhes adicionais: ${prompt}. Evite o seguinte: ${negativePrompt}`.trim();
                result = await geminiService.generateMagicMontage(personOneImage, fullPrompt, personTwoImage!);
            } else {
                result = await geminiService.generateStudioPortrait(personOneImage, currentStyleConfig.prompt, prompt, negativePrompt);
            }
            setResultImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `photo-studio-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUseInEditor = () => {
        if (!resultImage) return;
        const file = dataURLtoFile(resultImage, `photo-studio-${Date.now()}.png`);
        setInitialImage(file);
        setActiveTool('adjust');
    };

    const isGenerateButtonDisabled = isLoading || !personOneImage || (currentStyleConfig.isCouple && !personTwoImage);

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Foto Studio IA</h3>
                    <p className="text-sm text-gray-400 mt-1">Transforme sua foto em um retrato profissional.</p>
                </div>
                
                {currentStyleConfig.isCouple ? (
                    <div className="grid grid-cols-2 gap-4">
                        <ImageDropzone imageFile={personOneImage} onFileSelect={handlePersonOneFileSelect} label="Pessoa 1"/>
                        <ImageDropzone imageFile={personTwoImage} onFileSelect={setPersonTwoImage} label="Pessoa 2"/>
                    </div>
                ) : (
                     <ImageDropzone
                        imageFile={personOneImage}
                        onFileSelect={handlePersonOneFileSelect}
                        label="Sua Foto"
                    />
                )}

                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Estilo de Iluminação</h4>
                    <div className="grid grid-cols-3 gap-2">
                        {styles.map(style => (
                            <button
                                key={style.id}
                                onClick={() => setSelectedStyle(style.id)}
                                disabled={isLoading}
                                className={`p-3 rounded-lg text-sm text-center font-semibold transition-all ${selectedStyle === style.id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300'}`}
                            >
                                {style.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative">
                     <label htmlFor="positive-prompt" className="text-sm font-semibold text-gray-300">Detalhes Adicionais (Opcional)</label>
                     <textarea
                        id="positive-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ex: 'vestindo um terno preto', 'fundo de escritório moderno', 'cabelo preso'..."
                        className="mt-1 w-full bg-gray-800/50 border border-gray-600 rounded-lg p-2 pr-12 text-base min-h-[80px] resize-none text-gray-300 placeholder-gray-500"
                        disabled={isLoading}
                        rows={3}
                    />
                    <PromptEnhancer prompt={prompt} setPrompt={setPrompt} toolId="photoStudio" />
                    <p className="mt-1 text-xs text-gray-500">Descreva detalhes sobre roupa, cenário ou aparência que você gostaria de adicionar ou modificar.</p>
                </div>

                <div>
                     <label htmlFor="negative-prompt" className="text-sm font-semibold text-gray-300">Prompt Negativo (Opcional)</label>
                     <textarea
                        id="negative-prompt"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="Ex: 'óculos', 'mãos extras', 'rosto deformado', 'fundo poluído'..."
                        className="mt-1 w-full bg-gray-800/50 border border-gray-600 rounded-lg p-2 text-base min-h-[60px] resize-none text-gray-300 placeholder-gray-500"
                        disabled={isLoading}
                        rows={2}
                    />
                    <p className="mt-1 text-xs text-gray-500">Liste aqui o que a IA deve evitar. Isso ajuda a prevenir distorções e resultados indesejados.</p>
                </div>
                
                <button
                    onClick={handleGenerate}
                    disabled={isGenerateButtonDisabled}
                    className="w-full mt-auto bg-gradient-to-br from-sky-600 to-blue-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <CameraIcon className="w-5 h-5" />
                    Gerar Retrato
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Criando seu retrato de estúdio..."
                />
                 {resultImage && !isLoading && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-3 animate-fade-in">
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            Baixar Imagem
                        </button>
                        <button
                            onClick={handleUseInEditor}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                             <BrushIcon className="w-5 h-5" />
                            Usar no Editor
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PhotoStudioPanel;