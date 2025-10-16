// components/tools/MagicMontagePanel.tsx

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { validatePromptSpecificity } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { MagicWandIcon, DownloadIcon, BrushIcon, LayersIcon, FireIcon, GtaIcon, UserIcon, LineArtIcon, SunIcon, TextToolIcon, ClockIcon, PhotoIcon, LightbulbIcon } from '../icons';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import { dataURLtoFile } from '../../utils/imageUtils';
import TipBox from '../common/TipBox';
import CollapsibleToolPanel from '../CollapsibleToolPanel';
import PromptPresetPanel from '../common/PromptPresetPanel';

const presets = [
    { name: 'Adicionar Tatuagem', prompt: 'Adicione uma tatuagem de dragão realista no braço da pessoa.', icon: <FireIcon className="w-5 h-5"/>, negativePrompt: 'roupa alterada' },
    { name: 'Estilo GTA', prompt: 'Transforme a imagem em uma arte de pôster do Grand Theft Auto, com contornos ousados e cores vibrantes.', icon: <GtaIcon className="w-5 h-5"/>, negativePrompt: 'fotorrealista' },
    { name: 'Trocar Roupas', prompt: 'Mude a roupa da pessoa para um terno de negócios elegante e profissional.', icon: <UserIcon className="w-5 h-5"/>, negativePrompt: 'rosto alterado' },
    { name: 'Desenho de Linha', prompt: 'Converta a imagem em um esboço de arte de linha preto e branco.', icon: <LineArtIcon className="w-5 h-5"/>, negativePrompt: 'cor, sombreamento' },
    { name: 'Iluminação Dramática', prompt: 'Altere a iluminação para ser mais dramática, com uma única fonte de luz vinda de cima.', icon: <SunIcon className="w-5 h-5"/>, negativePrompt: 'plano, brilhante' },
    { name: 'Adicionar Texto', prompt: 'Adicione o texto "AVENTURA" em um estilo cinematográfico na parte inferior da imagem.', icon: <TextToolIcon className="w-5 h-5"/>, negativePrompt: 'texto ilegível' },
    { name: 'Foto Antiga', prompt: 'Dê à foto um visual antigo, com cor sépia, grão de filme e algumas pequenas imperfeições.', icon: <ClockIcon className="w-5 h-5"/>, negativePrompt: 'moderno, limpo' },
];

const MagicMontagePanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        setInitialImage,
        setActiveTool,
        setToast,
        addPromptToHistory,
        baseImageFile,
        handleMagicMontage,
        currentImageUrl,
    } = useEditor();

    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [secondImage, setSecondImage] = useState<File | null>(null);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [isImagesExpanded, setIsImagesExpanded] = useState(true);
    const [isInspirationsExpanded, setIsInspirationsExpanded] = useState(true);
    
    const resultImage = currentImageUrl;

    useEffect(() => {
        if (baseImageFile && !sourceImage) {
            setSourceImage(baseImageFile);
        }
    }, [baseImageFile, sourceImage]);

    const handleSourceFileSelect = (file: File | null) => {
        setSourceImage(file);
        if (file) {
            setInitialImage(file);
        }
    };

    const handlePresetClick = (preset: typeof presets[0]) => {
        setPrompt(preset.prompt);
        setNegativePrompt(preset.negativePrompt);
        setToast({ message: `Preset '${preset.name}' carregado!`, type: 'info' });
    };

    const handleGenerate = async () => {
        if (!sourceImage) {
            setToast({ message: "Por favor, carregue uma imagem para editar.", type: 'error' });
            return;
        }
        if (!prompt.trim()) {
            setToast({ message: "Por favor, descreva a edição desejada.", type: 'error' });
            return;
        }

        addPromptToHistory(prompt);
        
        let fullPrompt = prompt;
        if (negativePrompt.trim()) {
            fullPrompt += `. Evite o seguinte: ${negativePrompt}`;
        }
        
        handleMagicMontage(sourceImage, fullPrompt, secondImage || undefined);
    };

    const handleDownload = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `montagem-magica-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUseInEditor = () => {
        if (!resultImage) return;
        setActiveTool(null);
    };

    const handleCreateVariation = () => {
        if (!resultImage) return;

        const newSourceFile = dataURLtoFile(resultImage, `variation-base-${Date.now()}.png`);
        
        setSourceImage(newSourceFile);
        setSecondImage(null);
        setPrompt('');
        setNegativePrompt('');
        
        setToast({
            message: "Resultado definido como imagem base. Descreva sua próxima edição.",
            type: 'info',
        });
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <main className="h-3/5 md:h-auto flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4 md:order-2">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Realizando a mágica..."
                />
                {resultImage && !isLoading && (
                    <div className="mt-4 flex flex-wrap justify-center gap-3 animate-fade-in">
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            Baixar Imagem
                        </button>
                        <button
                            onClick={handleCreateVariation}
                            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            <LayersIcon className="w-5 h-5" />
                            Criar Variação
                        </button>
                        <button
                            onClick={handleUseInEditor}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                             <BrushIcon className="w-5 h-5" />
                            Continuar Editando
                        </button>
                    </div>
                )}
            </main>
            <aside className="h-2/5 md:h-auto w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50 md:order-1 overflow-y-auto scrollbar-thin">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Montagem Mágica ✨</h3>
                    <p className="text-sm text-gray-400 mt-1">Descreva qualquer edição e deixe a IA transformar sua foto.</p>
                </div>

                <CollapsibleToolPanel
                    title="Imagens de Origem"
                    icon={<PhotoIcon className="w-5 h-5" />}
                    isExpanded={isImagesExpanded}
                    onExpandToggle={() => setIsImagesExpanded(!isImagesExpanded)}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <ImageDropzone 
                            imageFile={sourceImage}
                            onFileSelect={handleSourceFileSelect}
                            label="Imagem Principal"
                        />
                        <ImageDropzone 
                            imageFile={secondImage}
                            onFileSelect={setSecondImage}
                            label="Imagem Opcional"
                        />
                    </div>
                </CollapsibleToolPanel>

                <CollapsibleToolPanel
                    title="Inspirações"
                    icon={<LightbulbIcon className="w-5 h-5" />}
                    isExpanded={isInspirationsExpanded}
                    onExpandToggle={() => setIsInspirationsExpanded(!isInspirationsExpanded)}
                >
                    <div className="flex flex-col gap-2">
                        {presets.map(preset => (
                            <button
                                key={preset.name}
                                type="button"
                                onClick={() => handlePresetClick(preset)}
                                disabled={isLoading}
                                className="w-full text-left p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors flex items-center gap-3"
                            >
                                <div className="text-orange-400 flex-shrink-0">{preset.icon}</div>
                                <p className="font-semibold text-white text-sm">{preset.name}</p>
                            </button>
                        ))}
                    </div>
                </CollapsibleToolPanel>
                
                <CollapsiblePromptPanel
                  title="Descrição da Edição"
                  prompt={prompt}
                  setPrompt={setPrompt}
                  negativePrompt={negativePrompt}
                  onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                  isLoading={isLoading}
                  toolId="magicMontage"
                  promptPlaceholder="Ex: coloque um chapéu de pirata na pessoa..."
                  promptHelperText="Seja o mais descritivo possível sobre a alteração que você deseja."
                  negativePromptHelperText="Ex: não altere a cor da camisa, evite adicionar sombras."
                />

                <PromptPresetPanel 
                    toolId="magicMontage"
                    onSelectPreset={(selectedPrompt) => setPrompt(selectedPrompt)}
                    isLoading={isLoading}
                />

                <TipBox>
                   Seja descritivo! Em vez de "adicione um chapéu", tente "adicione um chapéu de pirata preto com uma caveira branca". Use a imagem opcional para adicionar elementos de outra foto.
                </TipBox>
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !sourceImage || !prompt.trim()}
                    className="w-full mt-auto bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <MagicWandIcon className="w-5 h-5" />
                    Gerar Montagem
                </button>
            </aside>
        </div>
    );
};

export default MagicMontagePanel;
