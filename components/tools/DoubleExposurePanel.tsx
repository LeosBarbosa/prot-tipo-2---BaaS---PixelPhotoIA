/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import * as geminiService from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { DoubleExposureIcon } from '../icons';
import TipBox from '../common/TipBox';
import { dataURLtoFile } from '../../utils/imageUtils';
import { type Part } from '@google/genai';

type InputType = 'upload' | 'generate';

const DoubleExposurePanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        setError, 
        setIsLoading, 
        baseImageFile,
        setInitialImage,
        setLoadingMessage,
    } = useEditor();
    
    const [personImage, setPersonImage] = useState<File | null>(null);
    const [themeImage, setThemeImage] = useState<File | null>(null);
    const [themePrompt, setThemePrompt] = useState('uma paisagem de floresta enevoada com uma grande árvore');
    const [inputType, setInputType] = useState<InputType>('generate');
    const [resultImage, setResultImage] = useState<string | null>(null);

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
        setResultImage(null);
    };

    const handleGenerate = async () => {
        if (!personImage) {
            setError("Por favor, carregue a foto do retrato.");
            return;
        }
        if (inputType === 'upload' && !themeImage) {
            setError("Por favor, carregue a imagem do tema.");
            return;
        }
        if (inputType === 'generate' && !themePrompt.trim()) {
            setError("Por favor, descreva a cena do tema.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResultImage(null);
        
        try {
            let finalThemeImage = themeImage;
            if (inputType === 'generate') {
                setLoadingMessage('Gerando imagem de tema...');
                const generatedThemeDataUrl = await geminiService.generateImageFromText(themePrompt, '9:16');
                finalThemeImage = dataURLtoFile(generatedThemeDataUrl, 'theme.png');
            }

            if (!finalThemeImage) {
                throw new Error("Falha ao obter a imagem do tema.");
            }

            setLoadingMessage('Criando dupla exposição...');
            const personPart = await geminiService.fileToPart(personImage);
            const themePart = await geminiService.fileToPart(finalThemeImage);

            const doubleExposurePrompt = `
                Crie um retrato cinematográfico de dupla exposição de alta qualidade.
                **Imagem 1:** A foto do retrato.
                **Imagem 2:** A imagem de paisagem/textura.

                **Instrução Principal:** Mescle perfeitamente a Imagem 2 (paisagem) no perfil e silhueta da pessoa na Imagem 1. A transição deve ser suave e artística, simbolizando um pensamento profundo e uma conexão com a natureza.
                
                **Estilo:**
                - O tom da cor deve ser suave e atmosférico, com luz suave.
                - Mantenha uma textura hiper-realista.
                - O clima deve ser emocional e introspectivo.
                - Preserve os detalhes finos do rosto e da paisagem.
                - O resultado deve ter uma iluminação cinematográfica fotorrealista.
            `;
            
            const textPart = { text: doubleExposurePrompt };
            
            const parts: Part[] = [
                { text: "Imagem 1 (Retrato):" },
                personPart,
                { text: "Imagem 2 (Paisagem/Textura):" },
                themePart,
                textPart,
            ];

            const result = await geminiService.generateImageFromParts(parts);
            setResultImage(result);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    };

    const isGenerateButtonDisabled = isLoading || !personImage || (inputType === 'upload' && !themeImage) || (inputType === 'generate' && !themePrompt.trim());

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50 overflow-y-auto scrollbar-thin">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Dupla Exposição Artística</h3>
                    <p className="text-sm text-gray-400 mt-1">Combine um retrato com uma paisagem ou textura.</p>
                </div>
                
                <ImageDropzone imageFile={personImage} onFileSelect={handlePersonFileSelect} label="Sua Foto (Retrato)"/>
                
                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Imagem de Sobreposição</h4>
                     <div className="flex w-full bg-gray-900/50 border border-gray-600 rounded-lg p-1">
                        <button type="button" onClick={() => setInputType('generate')} className={`w-full text-center font-semibold py-2 rounded-md text-xs transition-all ${inputType === 'generate' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>Gerar com IA</button>
                        <button type="button" onClick={() => setInputType('upload')} className={`w-full text-center font-semibold py-2 rounded-md text-xs transition-all ${inputType === 'upload' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>Carregar Imagem</button>
                    </div>
                </div>

                {inputType === 'generate' && (
                    <div className="animate-fade-in">
                        <label htmlFor="theme-prompt" className="text-sm font-semibold text-gray-300">Descreva a cena</label>
                        <textarea id="theme-prompt" value={themePrompt} onChange={(e) => setThemePrompt(e.target.value)} placeholder="Ex: uma floresta enevoada, uma cidade à noite..." className="mt-1 w-full bg-gray-800/50 border border-gray-600 rounded-lg p-2 text-base min-h-[80px] resize-none text-gray-300 placeholder-gray-500" disabled={isLoading} rows={3}/>
                    </div>
                )}
                
                {inputType === 'upload' && (
                    <div className="animate-fade-in">
                        <ImageDropzone imageFile={themeImage} onFileSelect={setThemeImage} label="Imagem de Tema"/>
                    </div>
                )}
                
                <TipBox>
                    Para melhores resultados, use um retrato de perfil ou com um fundo simples. A IA mesclará a imagem do tema com a silhueta da pessoa.
                </TipBox>

                <button onClick={handleGenerate} disabled={isGenerateButtonDisabled} className="w-full mt-auto bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <DoubleExposureIcon className="w-5 h-5" />
                    Criar Dupla Exposição
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Criando efeito..."
                />
            </main>
        </div>
    );
};

export default DoubleExposurePanel;
