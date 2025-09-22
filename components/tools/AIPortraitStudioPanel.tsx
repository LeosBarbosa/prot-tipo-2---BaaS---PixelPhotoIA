/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import * as geminiService from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { CaricatureIcon, DownloadIcon, BrushIcon, PixarIcon, ToyIcon, PolaroidIcon } from '../icons';
import { dataURLtoFile } from '../../utils/imageUtils';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';

type StyleId = 'caricature' | 'pixar' | '3d' | 'polaroid';

interface StyleConfig {
    id: StyleId;
    name: string;
    icon: React.ReactNode;
    promptPlaceholder: string;
    needsCelebrity: boolean;
}

const styles: StyleConfig[] = [
    { id: 'caricature', name: 'Caricatura', icon: <CaricatureIcon className="w-6 h-6" />, promptPlaceholder: "Adicione detalhes extras, ex: 'segurando uma guitarra'...", needsCelebrity: false },
    { id: 'pixar', name: 'Disney Pixar', icon: <PixarIcon className="w-6 h-6" />, promptPlaceholder: "Descreva a cena, ex: 'em um cenário de fantasia'...", needsCelebrity: false },
    { id: '3d', name: 'Miniatura 3D', icon: <ToyIcon className="w-6 h-6" />, promptPlaceholder: "Descreva a pose ou acessórios da miniatura...", needsCelebrity: false },
    { id: 'polaroid', name: 'Polaroid', icon: <PolaroidIcon className="w-6 h-6" />, promptPlaceholder: "Foto com uma celebridade. Nenhum prompt necessário.", needsCelebrity: true },
];

// Define caricature sub-styles
interface CaricatureSubStyle {
    id: string;
    name: string;
    thumbnail: string;
    prompt: string;
}

const caricatureSubStyles: CaricatureSubStyle[] = [
    { id: 'exaggerated', name: 'Exagerada', thumbnail: 'https://picsum.photos/seed/exaggerated/100/100', prompt: 'Estilo de caricatura com exagero acentuado nas características faciais, de forma cômica.' },
    { id: 'artistic', name: 'Artística', thumbnail: 'https://picsum.photos/seed/artistic/100/100', prompt: 'Estilo de caricatura artística, com traços de pintura digital e foco na expressão.' },
    { id: 'comic', name: 'HQ', thumbnail: 'https://picsum.photos/seed/comic/100/100', prompt: 'Estilo de caricatura de história em quadrinhos (HQ), com contornos fortes e cores chapadas.' },
    { id: 'classic', name: 'Clássica', thumbnail: 'https://picsum.photos/seed/classic/100/100', prompt: 'Estilo de caricatura clássica em preto e branco, com sombreamento de hachura.' },
    { id: 'pencil-sketch-bw', name: 'Esboço a Lápis', thumbnail: 'https://picsum.photos/seed/pencil-bw/100/100', prompt: 'Converta a imagem para uma caricatura com estilo de esboço a lápis (pencil sketch). Exagere de forma artística as características faciais e mantenha a semelhança com a pessoa. Utilize um sombreamento detalhado, com hachuras e traços de lápis, para criar profundidade e textura. A paleta de cores deve ser em preto e branco com tons de cinza. O fundo deve ser limpo e branco, sem elementos adicionais.' },
    { id: 'pencil-sketch-color', name: 'Esboço Colorido', thumbnail: 'https://picsum.photos/seed/pencil-color/100/100', prompt: 'Converta a imagem para uma caricatura com estilo de esboço a lápis colorido. Exagere de forma artística as características faciais e mantenha a semelhança com a pessoa. Utilize um sombreamento detalhado, com hachuras e traços de lápis, para criar profundidade e textura. A paleta de cores deve ser vibrante e expressiva, como um desenho a lápis colorido. O fundo deve ser limpo e branco, sem elementos adicionais.' },
    {
        id: 'artistic-portrait',
        name: 'Retrato Artístico',
        thumbnail: 'https://picsum.photos/seed/artistic-portrait/100/100',
        prompt: 'Converta a imagem para uma caricatura colorida em estilo de desenho artístico. Exagere as características faciais de forma amigável e expressiva, mantendo uma forte semelhança com a pessoa. Utilize uma paleta de cores vibrante e expressiva, com sombreamento suave e gradientes sutis para dar profundidade e volume. Os contornos devem ser definidos, mas sem a rigidez de um desenho de HQ. O fundo deve ser uma cor sólida ou um gradiente simples para destacar o retrato. O resultado deve ter um acabamento de pintura digital de alta qualidade, sem textura de lápis.'
    },
];

const AIPortraitStudioPanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        setError, 
        setIsLoading, 
        setInitialImage, 
        setActiveTool 
    } = useEditor();
    
    const [selectedStyle, setSelectedStyle] = useState<StyleId>('caricature');
    const [personImage, setPersonImage] = useState<File | null>(null);
    const [celebrityImage, setCelebrityImage] = useState<File | null>(null);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [selectedCaricatureStyle, setSelectedCaricatureStyle] = useState<string>(caricatureSubStyles[0].id);
    
    const currentStyleConfig = styles.find(s => s.id === selectedStyle)!;

    const handleGenerate = async () => {
        if (!personImage || (currentStyleConfig.needsCelebrity && !celebrityImage)) {
            setError("Por favor, carregue todas as imagens necessárias.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            let result: string;
            
            switch (selectedStyle) {
                case 'caricature': {
                    const subStylePrompt = caricatureSubStyles.find(s => s.id === selectedCaricatureStyle)?.prompt || '';
                    const fullPrompt = `${subStylePrompt} ${prompt} ${negativePrompt ? `. Evite o seguinte: ${negativePrompt}` : ''}`.trim();
                    result = await geminiService.generateCaricature(personImage, fullPrompt);
                    break;
                }
                case 'pixar': {
                    const fullPrompt = `${prompt} ${negativePrompt ? `. Evite o seguinte: ${negativePrompt}` : ''}`.trim();
                    result = await geminiService.applyDisneyPixarStyle(personImage, fullPrompt);
                    break;
                }
                case '3d': {
                    const fullPrompt = `${prompt} ${negativePrompt ? `. Evite o seguinte: ${negativePrompt}` : ''}`.trim();
                    result = await geminiService.generate3DMiniature(personImage, fullPrompt);
                    break;
                }
                case 'polaroid':
                    result = await geminiService.applyPolaroidEffect(personImage, celebrityImage!);
                    break;
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
        link.download = `portrait-studio-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUseInEditor = () => {
        if (!resultImage) return;
        const file = dataURLtoFile(resultImage, `portrait-studio-${Date.now()}.png`);
        setInitialImage(file);
        setActiveTool('adjust');
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Estúdio de Retrato IA</h3>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {styles.map(style => (
                        <button
                            key={style.id}
                            onClick={() => setSelectedStyle(style.id)}
                            disabled={isLoading}
                            className={`p-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${selectedStyle === style.id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300'}`}
                        >
                            {style.icon}
                            <span className="text-xs font-semibold">{style.name}</span>
                        </button>
                    ))}
                </div>

                {selectedStyle === 'caricature' && (
                    <div className="animate-fade-in">
                        <h4 className="text-sm font-semibold text-gray-300 mb-2 text-center">Estilo de Caricatura</h4>
                        <div className="grid grid-cols-4 gap-2">
                            {caricatureSubStyles.map(subStyle => (
                                <button 
                                    key={subStyle.id}
                                    type="button"
                                    onClick={() => setSelectedCaricatureStyle(subStyle.id)}
                                    className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedCaricatureStyle === subStyle.id ? 'border-blue-500 scale-105' : 'border-transparent hover:border-gray-500'}`}
                                    title={subStyle.name}
                                    disabled={isLoading}
                                >
                                    <img src={subStyle.thumbnail} alt={subStyle.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                                    <p className="absolute bottom-1 left-0 right-0 text-white text-[10px] font-bold text-center drop-shadow-md">{subStyle.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className={`grid gap-4 ${currentStyleConfig.needsCelebrity ? 'grid-cols-2' : 'grid-cols-1'}`}>
                     <ImageDropzone
                        imageFile={personImage}
                        onFileSelect={setPersonImage}
                        label="Sua Foto"
                    />
                    {currentStyleConfig.needsCelebrity && (
                        <ImageDropzone
                            imageFile={celebrityImage}
                            onFileSelect={setCelebrityImage}
                            label="Celebridade"
                        />
                    )}
                </div>
                
                {!currentStyleConfig.needsCelebrity && (
                    <CollapsiblePromptPanel
                        title="Detalhes Criativos"
                        prompt={prompt}
                        onPromptChange={(e) => setPrompt(e.target.value)}
                        negativePrompt={negativePrompt}
                        onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                        isLoading={isLoading}
                    />
                )}
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !personImage || (currentStyleConfig.needsCelebrity && !celebrityImage)}
                    className="w-full mt-auto bg-gradient-to-br from-lime-600 to-green-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <CaricatureIcon className="w-5 h-5" />
                    Gerar Retrato
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Criando sua arte..."
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

export default AIPortraitStudioPanel;
