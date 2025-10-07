/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { generateStyledPortrait } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { ShirtIcon } from '../icons';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';

const StyledPortraitPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, addPromptToHistory, baseImageFile, setInitialImage } = useEditor();
    const [personImage, setPersonImage] = useState<File | null>(null);
    const [styleImage, setStyleImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
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
        setResultImage(null);
    };

    const handleGenerate = async () => {
        if (!personImage || !styleImage) {
            setError("Por favor, carregue a imagem da Pessoa e a de Estilo.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        addPromptToHistory(prompt);
        try {
            const result = await generateStyledPortrait(personImage, styleImage, prompt, negativePrompt);
            setResultImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Retrato Estilizado</h3>
                    <p className="text-sm text-gray-400 mt-1">Aplique o estilo de uma foto em outra, mantendo o rosto original intacto.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ImageDropzone 
                        imageFile={personImage}
                        onFileSelect={handlePersonFileSelect}
                        label="Sua Foto (Pessoa)"
                    />
                    <ImageDropzone 
                        imageFile={styleImage}
                        onFileSelect={setStyleImage}
                        label="Foto de Estilo"
                    />
                </div>
                
                <CollapsiblePromptPanel
                  title="Instruções Adicionais"
                  prompt={prompt}
                  setPrompt={setPrompt}
                  negativePrompt={negativePrompt}
                  onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                  isLoading={isLoading}
                  toolId="styledPortrait"
                  promptPlaceholder="Ex: mantenha o cabelo curto, adicione um colar..."
                  promptHelperText="Dê instruções para refinar a combinação de estilos. O rosto será preservado."
                  negativePromptHelperText="Ex: óculos, chapéu, cores específicas."
                />

                <p className="text-xs text-gray-500 text-center">A IA usará a roupa, o cenário e a luz da "Foto de Estilo" e aplicará à "Sua Foto", sem alterar seu rosto.</p>
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !personImage || !styleImage}
                    className="w-full mt-auto bg-gradient-to-br from-teal-600 to-cyan-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <ShirtIcon className="w-5 h-5" />
                    Gerar Retrato
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Criando seu novo retrato..."
                />
            </main>
        </div>
    );
};

export default StyledPortraitPanel;