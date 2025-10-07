/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import * as geminiService from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { CaricatureIcon, DownloadIcon, BrushIcon, PixarIcon, ToyIcon, MagicWandIcon, ClockIcon } from '../icons';
import { dataURLtoFile } from '../../utils/imageUtils';
import PromptEnhancer from './common/PromptEnhancer';
import PromptSuggestionsDropdown from '../common/PromptSuggestionsDropdown';
import { usePromptSuggestions } from '../../hooks/usePromptSuggestions';

type StyleId = 'caricature' | 'pixar' | '3d' | 'yearbook90s';

interface StyleConfig {
    id: StyleId;
    name: string;
    icon: React.ReactNode;
    promptPlaceholder: string;
}

const styles: StyleConfig[] = [
    { id: 'caricature', name: 'Caricatura', icon: <CaricatureIcon className="w-6 h-6" />, promptPlaceholder: "Crie uma caricatura divertida em estilo de pintura digital. Exagere grosseiramente os olhos da pessoa e dê a ela um sorriso enorme e amigável. Coloque um chapéu de chef ridiculamente alto e inclinado em sua cabeça. O fundo deve ser uma cena de cozinha dinâmica e desfocada, com panelas e frigideiras voando no ar, em estilo de história em quadrinhos." },
    { id: 'pixar', name: 'Disney Pixar', icon: <PixarIcon className="w-6 h-6" />, promptPlaceholder: "Transforme a pessoa em um personagem no estilo Pixar, colocando-a em um cenário de floresta encantada, interagindo com um pequeno animal falante." },
    { id: '3d', name: 'Miniatura 3D', icon: <ToyIcon className="w-6 h-6" />, promptPlaceholder: "Crie uma miniatura 3D da pessoa como um aventureiro, com uma pose heroica, segurando um mapa antigo e com uma mochila nas costas." },
    { id: 'yearbook90s', name: 'Anuário 90s', icon: <ClockIcon className="w-6 h-6" />, promptPlaceholder: "Transforme a pessoa em uma foto de anuário escolar dos anos 90. Dê a ela um penteado levemente repicado e um sorriso suave e sem graça. O fundo deve ser um clássico azul ou cinza manchado, com feixes de laser bregas se cruzando atrás dela. Adicione um brilho sutil de foco suave à imagem inteira." },
];

interface CaricatureSubStyle {
    id: string;
    name: string;
    thumbnail: string;
    prompt: string;
}

const caricatureSubStyles: CaricatureSubStyle[] = [
    { id: 'exaggerated', name: 'Exagerada', thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/thumbnails/caricature_exaggerated.webp', prompt: 'Estilo de caricatura com exagero acentuado nas características faciais, de forma cômica.' },
    { id: 'artistic', name: 'Artística', thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/thumbnails/caricature_artistic.webp', prompt: 'Estilo de caricatura artística, com traços de pintura digital e foco na expressão.' },
    { id: 'comic', name: 'HQ', thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/thumbnails/caricature_comic.webp', prompt: 'Estilo de caricatura de história em quadrinhos (HQ), com contornos fortes e cores chapadas.' },
    { id: 'classic', name: 'Clássica', thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/thumbnails/caricature_classic.webp', prompt: 'Estilo de caricatura clássica em preto e branco, com sombreamento de hachura.' },
    { id: 'pencil-sketch-bw', name: 'Esboço a Lápis', thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/thumbnails/caricature_pencil_bw.webp', prompt: 'Converta a imagem para uma caricatura com estilo de esboço a lápis (pencil sketch). Exagere de forma artística as características faciais e mantenha a semelhança com a pessoa. Utilize um sombreamento detalhado, com hachuras e traços de lápis, para criar profundidade e textura. A paleta de cores deve ser em preto e branco com tons de cinza. O fundo deve ser limpo e branco, sem elementos adicionais.' },
    { id: 'pencil-sketch-color', name: 'Esboço Colorido', thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/thumbnails/caricature_pencil_color.webp', prompt: 'Converta a imagem para uma caricatura com estilo de esboço a lápis colorido. Exagere de forma artística as características faciais e mantenha a semelhança com a pessoa. Utilize um sombreamento detalhado, com hachuras e traços de lápis, para criar profundidade e textura. A paleta de cores deve ser vibrante e expressiva, como um desenho a lápis colorido. O fundo deve ser limpo e branco, sem elementos adicionais.' },
    {
        id: 'artistic-portrait',
        name: 'Retrato Artístico',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/thumbnails/caricature_artistic_portrait.webp',
        prompt: 'Converta a imagem para uma caricatura colorida em estilo de desenho artístico. Exagere as características faciais de forma amigável e expressiva, mantendo uma forte semelhança com a pessoa. Utilize uma paleta de cores vibrante e expressiva, com sombreamento suave e gradientes sutis para dar profundidade e volume. Os contornos devem ser definidos, mas sem a rigidez de um desenho de HQ. O fundo deve ser uma cor sólida ou um gradiente simples para destacar o retrato. O resultado deve ter um acabamento de pintura digital de alta qualidade, sem textura de lápis.'
    },
    {
        id: 'funny',
        name: 'Engraçada',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/thumbnails/caricature_funny.webp',
        prompt: 'Crie uma caricatura com um estilo de desenho animado engraçado e cômico. Foque em exageros divertidos, como olhos grandes, expressões bobas ou um sorriso largo. O estilo deve ser vibrante e animado.'
    },
    {
      id: 'watercolor',
      name: 'Aquarela',
      thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/thumbnails/caricature_watercolor.webp',
      prompt: 'Estilo de caricatura em aquarela, com cores suaves e fluidas, traços leves e um toque artístico e elegante.'
    },
    {
      id: 'grotesque',
      name: 'Grotesca',
      thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/thumbnails/caricature_grotesque.webp',
      prompt: 'Estilo de caricatura grotesca, com grande distorção e exagero extremo para efeito cômico ou satírico, inspirado por artistas como Ralph Steadman.'
    },
    {
      id: 'minimalist-line-art',
      name: 'Linha Minimalista',
      thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/thumbnails/caricature_minimalist.webp',
      prompt: 'Caricatura de arte de linha minimalista, usando apenas contornos pretos sobre um fundo branco para capturar a essência da pessoa com o mínimo de detalhes.'
    },
    {
      id: 'pop-art',
      name: 'Pop Art',
      thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/thumbnails/caricature_popart.webp',
      prompt: 'Estilo de caricatura pop art inspirado em Andy Warhol, com cores vibrantes e contrastantes, e uso de padrões de pontos Ben-Day.'
    },
    {
      id: 'artist-sketch',
      name: 'Esboço do Artista',
      thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/thumbnails/caricature_artist_sketch.webp',
      prompt: 'Crie um desenho de linha / esboço a tinta em estilo de foto de um rosto idêntico à imagem de referência enviada - mantenha todas as características faciais, proporções e expressões exatamente iguais. Use tons de tinta verde e branca com detalhes intrincados de linhas finas, desenhados em um fundo estilo página de caderno. Mostre uma mão direita segurando uma caneta perto do esboço, como se o artista ainda estivesse trabalhando no desenho. Estilo: desenho fotorrealista, textura de tinta detalhada, sombreamento suave, grão de papel suave, resolução 8K.'
    }
];

const AIPortraitStudioPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, addPromptToHistory, baseImageFile, setInitialImage, setActiveTool } = useEditor();

    const [personImages, setPersonImages] = useState<(File | null)[]>([null]);
    const [selectedStyle, setSelectedStyle] = useState<StyleId>('caricature');
    const [selectedCaricatureSubStyleId, setSelectedCaricatureSubStyleId] = useState<string>(caricatureSubStyles[0].id);
    const [prompt, setPrompt] = useState('');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestions = usePromptSuggestions(prompt, 'aiPortraitStudio');

    const currentStyleConfig = styles.find(s => s.id === selectedStyle)!;
    
    useEffect(() => {
        setShowSuggestions(suggestions.length > 0);
    }, [suggestions]);

    const handleSelectSuggestion = (suggestion: string) => {
        setPrompt(suggestion);
        setShowSuggestions(false);
    };

    useEffect(() => {
        if (baseImageFile && !personImages[0]) {
            const newImages = [...personImages];
            newImages[0] = baseImageFile;
            setPersonImages(newImages);
        }
    }, [baseImageFile, personImages]);

    const handleGenerate = async () => {
        const validImages = personImages.filter((img): img is File => img !== null);
        if (validImages.length === 0) {
            setError("Por favor, carregue pelo menos uma imagem.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResultImage(null);
        if (prompt.trim()) {
            addPromptToHistory(prompt);
        }
        try {
            let result;
            let finalPrompt = prompt;

            switch (selectedStyle) {
                case 'caricature':
                    const subStyle = caricatureSubStyles.find(s => s.id === selectedCaricatureSubStyleId);
                    if (subStyle) {
                        finalPrompt = `${subStyle.prompt} Additional details: ${prompt}`;
                    }
                    result = await geminiService.generateCaricature(validImages, finalPrompt);
                    break;
                case 'pixar':
                    result = await geminiService.applyDisneyPixarStyle(validImages[0], prompt);
                    break;
                case '3d':
                    result = await geminiService.generate3DMiniature(validImages[0], prompt);
                    break;
                case 'yearbook90s':
                    result = await geminiService.generate90sYearbookPortrait(validImages[0], prompt);
                    break;
                default:
                    throw new Error("Estilo selecionado inválido.");
            }
            setResultImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleImageChange = (index: number, file: File | null) => {
        const newImages = [...personImages];
        newImages[index] = file;
        setPersonImages(newImages);
        if (index === 0 && file) {
            setInitialImage(file);
        }
        setResultImage(null);
    };

    const addImageSlot = () => {
        setPersonImages([...personImages, null]);
    };

    const handleDownload = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `ai-portrait-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUseInEditor = () => {
        if (!resultImage) return;
        const file = dataURLtoFile(resultImage, `ai-portrait-${Date.now()}.png`);
        setInitialImage(file);
        setActiveTool('adjust');
    };

    const isGenerateButtonDisabled = isLoading || personImages.every(img => img === null);

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-[420px] flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50 overflow-y-auto scrollbar-thin">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Estúdio de Retrato IA</h3>
                    <p className="text-sm text-gray-400 mt-1">Transforme retratos com estilos criativos.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {personImages.map((img, index) => (
                        <ImageDropzone 
                            key={index}
                            imageFile={img}
                            onFileSelect={(file) => handleImageChange(index, file)}
                            label={`Pessoa ${index + 1}`}
                        />
                    ))}
                </div>
                {selectedStyle === 'caricature' && (
                    <button onClick={addImageSlot} className="text-sm text-blue-400 hover:text-blue-300 w-full text-center">+ Adicionar outra pessoa</button>
                )}

                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Estilo</h4>
                    <div className="flex w-full bg-gray-900/50 border border-gray-600 rounded-lg p-1">
                        {styles.map(style => (
                            <button key={style.id} onClick={() => setSelectedStyle(style.id)} disabled={isLoading} className={`w-full text-center font-semibold py-2 rounded-md transition-all text-sm flex items-center justify-center gap-2 ${selectedStyle === style.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>
                                {style.icon} {style.name}
                            </button>
                        ))}
                    </div>
                </div>

                {selectedStyle === 'caricature' && (
                    <div className="animate-fade-in">
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Sub-estilo de Caricatura</h4>
                        <div className="grid grid-cols-4 gap-2">
                             {caricatureSubStyles.map(subStyle => (
                                <button key={subStyle.id} onClick={() => setSelectedCaricatureSubStyleId(subStyle.id)} disabled={isLoading} className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedCaricatureSubStyleId === subStyle.id ? 'border-blue-500 scale-105' : 'border-transparent hover:border-gray-500'}`} title={subStyle.name}>
                                    <img src={subStyle.thumbnail} alt={subStyle.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                                    <p className="absolute bottom-1 left-0 right-0 text-white text-[10px] font-bold text-center drop-shadow-md">{subStyle.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="relative">
                     <label htmlFor="positive-prompt" className="text-sm font-semibold text-gray-300">Instruções Adicionais (Opcional)</label>
                     <div className="relative mt-1">
                        <textarea id="positive-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} onFocus={() => setShowSuggestions(suggestions.length > 0)} placeholder={currentStyleConfig.promptPlaceholder} className="w-full bg-gray-800/50 border border-gray-600 rounded-lg p-2 pr-12 text-base min-h-[80px] resize-none text-gray-300 placeholder-gray-500" disabled={isLoading} rows={3}/>
                        <PromptEnhancer prompt={prompt} setPrompt={setPrompt} toolId="aiPortraitStudio" />
                        {showSuggestions && (
                            <PromptSuggestionsDropdown
                                suggestions={suggestions}
                                onSelect={handleSelectSuggestion}
                                searchTerm={prompt}
                            />
                        )}
                     </div>
                </div>
                
                <button onClick={handleGenerate} disabled={isGenerateButtonDisabled} className="w-full mt-auto bg-gradient-to-br from-lime-600 to-green-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <MagicWandIcon className="w-5 h-5" />
                    Gerar Retrato
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer isLoading={isLoading} error={error} resultImage={resultImage} loadingMessage="Criando seu retrato..."/>
                {resultImage && !isLoading && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-3 animate-fade-in">
                        <button onClick={handleDownload} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                            <DownloadIcon className="w-5 h-5" /> Baixar Imagem
                        </button>
                        <button onClick={handleUseInEditor} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                            <BrushIcon className="w-5 h-5" /> Usar no Editor
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AIPortraitStudioPanel;