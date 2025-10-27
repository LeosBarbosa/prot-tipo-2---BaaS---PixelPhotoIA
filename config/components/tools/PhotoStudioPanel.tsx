/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { useEditor } from '../../../context/EditorContext';
import * as geminiService from '../../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import TipBox from '../common/TipBox';
import CollapsibleToolPanel from '../CollapsibleToolPanel';
import LazyIcon from '../LazyIcon';

const PromptField: React.FC<{
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder: string;
    rows?: number;
    disabled: boolean;
}> = ({ label, value, onChange, placeholder, rows = 2, disabled }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-base resize-none text-gray-300 placeholder-gray-500"
            disabled={disabled}
            rows={rows}
        />
    </div>
);

interface Preset {
    name: string;
    thumbnail: string;
    photoStyle: string;
    location: string;
    clothing: string;
    lighting: string;
    pose: string;
}

const presets: Preset[] = [
    {
        name: 'Headshot LinkedIn',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/linkedin_headshot.webp',
        photoStyle: "Retrato editorial cinematográfico hiper-realista.",
        location: "Estúdio escuro e sombrio, cercado por uma fumaça suave.",
        clothing: "Terno luxuoso azul-ardósia, combinado com uma camisa de seda branca ligeiramente desabotoada.",
        lighting: "Holofote dramático.",
        pose: "Mãos nos bolsos, autoridade relaxada. Ombros relaxados, expressão confiante, cabeça ligeiramente inclinada para cima, de frente para a câmera.",
    },
    {
        name: 'Ensaio de Moda',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/fashion_photoshoot.webp',
        photoStyle: "Ensaio fotográfico profissional de moda ao ar livre.",
        location: "Ao ar livre, com fundo verde desfocado e algumas flores laranjas para um efeito bokeh suave.",
        clothing: "Suéter de tricô verde-sálvia claro com meio zíper, calça cargo off-white, óculos de sol redondos pretos e um smartwatch moderno.",
        lighting: "Luz natural suave.",
        pose: "Posando com estilo, uma mão no bolso e a outra ajustando os óculos de sol, com um penteado elegante e barba curta.",
    },
    {
        name: 'Retrato de Cinema',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/cinematic_portrait.webp',
        photoStyle: "Retrato editorial cinematográfico hiper-realista.",
        location: "Estúdio escuro e sombrio, cercado por uma coluna suave de fumaça.",
        clothing: "Terno masculino luxuoso azul-ardósia, com uma camisa de seda branca ligeiramente desabotoada.",
        lighting: "Holofote dramático vindo de cima.",
        pose: "Mãos nos bolsos, ombros relaxados, expressão confiante, cabeça ligeiramente inclinada para cima, olhando para a câmera.",
    },
    {
        name: 'Selfie com Heróis',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/heroes_selfie.webp',
        photoStyle: "Selfie ultra-realista 4K HDR com a Liga da Justiça.",
        location: "Dentro de um elevador.",
        clothing: "Roupas casuais que combinem com a cena.",
        lighting: "Iluminação cinematográfica realista.",
        pose: "Posando para uma selfie em grupo com Aquaman, Superman, Mulher-Maravilha, Batman e Flash. Todos sorrindo, exceto o Batman (expressão séria). Aquaman e Mulher-Maravilha interagem de forma divertida.",
    },
    {
        name: 'Retrato Emocional',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/emotional_portrait.webp',
        photoStyle: "Retrato em close-up hiper-realista de 16k com emoção intensa.",
        location: "Fundo simples e brilhante com partículas e névoa cor de vinho. Um líquido vermelho vibrante e textura de fumaça envolve o pescoço e os ombros.",
        clothing: "Minimalista, o foco está na expressão emocional.",
        lighting: "Dramática e artística.",
        pose: "Olhos fechados, lábios entreabertos, rosto inclinado para cima. Cabelo bagunçado ao vento e sobre os olhos.",
    },
    {
        name: 'Retrato Introspectivo',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/introspective_portrait.webp',
        photoStyle: "Retrato estético em preto e branco com precisão de 100% do rosto, estilo cinematográfico.",
        location: "Sentado no chão em um cômodo escuro. Sombras de uma janela projetam-se sobre a parede atrás dele, criando uma atmosfera artística e melancólica.",
        clothing: "Traje escuro grande demais (oversized).",
        lighting: "Iluminação dramática e de alto contraste, vinda de uma única fonte de luz lateral.",
        pose: "Pose emocional e introspectiva, com uma mão perto da boca e a cabeça ligeiramente inclinada para o lado. A atmosfera geral é misteriosa e emocional.",
    },
    {
        name: 'Retrato de Estúdio',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/studio_portrait.webp',
        photoStyle: "Ensaio fotográfico estilo revista de moda, fotografia realista, alta qualidade.",
        location: "Estúdio profissional com um fundo cinza limpo.",
        clothing: "Terno slim-fit azul marinho estiloso com camisa azul clara, gravata listrada e sapatos de couro marrom polidos.",
        lighting: "Iluminação de estúdio profissional.",
        pose: "Retrato de corpo inteiro confiante, sentado em um banco alto branco.",
    },
    {
        name: 'Herói de Gears of War',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/gears_of_war.webp',
        photoStyle: "Obra de arte 3D cinematográfica hiper-realista, ultra-detalhada, resolução 8K.",
        location: "Dentro da Cavidade (Hollow): um campo de batalha subterrâneo, escuro e rochoso, cheio de poeira, detritos e fendas de luz brilhantes. Atmosfera tensa e bélica.",
        clothing: "Transformado em Marcus Fenix, vestindo sua icônica armadura COG pesada, arranhada e desgastada, com a insígnia de caveira no peito e detalhes azuis brilhantes. Usa sua bandana reconhecível e segura firmemente seu rifle de assalto com baioneta de motosserra.",
        lighting: "Iluminação cinematográfica HDR, enfatizando texturas da armadura, reflexos da arma e determinação facial.",
        pose: "Retrato americano (da cabeça até a metade da coxa), segurando a arma com ambas as mãos, pronto para a ação.",
    },
    {
        name: 'Retrato Halftone',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/halftone_portrait.webp',
        photoStyle: "Retrato halftone ultra-detalhado, com estética digital moderna e estilo de impressão de qualidade de museu, textura de pontos ultra-nítida.",
        location: "Fundo preto minimalista, perfeitamente centrado e simétrico.",
        clothing: "Não especificado, o foco está no rosto.",
        lighting: "Iluminação cinematográfica de alto contraste, com densidade de pontos em gradiente suave para áreas claras e escuras.",
        pose: "Rosto humano composto inteiramente por pontos brancos que formam a estrutura facial e as sombras, com alinhamento e espaçamento perfeitos.",
    },
    {
        name: 'E se...?',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/what_if.webp',
        photoStyle: "Foto espontânea em uma atmosfera humilde e vivida, com um toque de pobreza.",
        location: "Cozinha rústica com paredes desgastadas, canos expostos e vários utensílios domésticos pendurados.",
        clothing: "Regata branca e shorts vermelhos, com tatuagens nos braços.",
        lighting: "Iluminação natural, como se fosse um momento capturado da vida cotidiana.",
        pose: "Tirando uma selfie com o braço ao redor de uma mulher (gerada pela IA, parecida com uma celebridade) que está cozinhando em um fogão.",
    },
];

const PhotoStudioPanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        baseImageFile,
        setInitialImage,
        currentImageUrl,
        handleConfidentStudio,
    } = useEditor();
    
    const [personImage, setPersonImage] = useState<File[]>([]);
    const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);

    const [photoStyle, setPhotoStyle] = useState('');
    const [location, setLocation] = useState('');
    const [clothing, setClothing] = useState('');
    const [lighting, setLighting] = useState('');
    const [pose, setPose] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');

    const [isOptionsExpanded, setIsOptionsExpanded] = useState(true);

    useEffect(() => {
        if (baseImageFile && personImage.length === 0) {
            setPersonImage([baseImageFile]);
        }
    }, [baseImageFile, personImage]);

    useEffect(() => {
        if (selectedPreset) {
            setPhotoStyle(selectedPreset.photoStyle);
            setLocation(selectedPreset.location);
            setClothing(selectedPreset.clothing);
            setLighting(selectedPreset.lighting);
            setPose(selectedPreset.pose);
        }
    }, [selectedPreset]);

    const handlePersonFileSelect = (files: File[]) => {
        setPersonImage(files);
        if (files[0]) {
            setInitialImage(files[0]);
        }
    };
    
    const handleGenerate = async () => {
        const imageFile = personImage[0];
        if (!imageFile) return;

        const mainPrompt = `Gere uma foto de estúdio profissional e fotorrealista da pessoa na imagem fornecida, colocando-a na seguinte cena:\n\n**Instrução Crítica:** A identidade facial, cabelo, tom de pele e tipo de corpo da pessoa devem ser preservados com 100% de precisão. O resultado deve ser uma nova fotografia da *mesma pessoa*.\n\n**Detalhes da Cena:**\n- **Estilo da Foto:** ${photoStyle}\n- **Localização:** ${location}\n- **Figurino:** ${clothing}\n- **Iluminação:** ${lighting}\n- **Pose e Ação:** ${pose}\n\n**Qualidade:** A imagem deve ser de alta resolução (qualidade 8K), hiperdetalhada e com alto realismo.`;
        
        handleConfidentStudio(imageFile, mainPrompt, negativePrompt);
    };

    const isGenerateButtonDisabled = isLoading || personImage.length === 0 || !photoStyle.trim() || !location.trim() || !clothing.trim() || !lighting.trim() || !pose.trim();

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50 overflow-y-auto scrollbar-thin">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Ensaio Fotográfico IA</h3>
                    <p className="text-sm text-gray-400 mt-1">Gere ensaios fotográficos realistas com qualidade de estúdio.</p>
                </div>
                
                <ImageDropzone files={personImage} onFilesChange={handlePersonFileSelect} label="Sua Foto (Modelo)"/>

                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Predefinições de Ensaio</h4>
                    <div className="grid grid-cols-2 gap-2">
                         {presets.map(preset => (
                            <button key={preset.name} onClick={() => setSelectedPreset(preset)} disabled={isLoading} className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedPreset?.name === preset.name ? 'border-blue-500 scale-105' : 'border-transparent hover:border-gray-500'}`} title={preset.name}>
                                <img src={preset.thumbnail} alt={preset.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                                <p className="absolute bottom-1 left-0 right-0 text-white text-[10px] font-bold text-center drop-shadow-md p-1 bg-black/20">{preset.name}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <CollapsibleToolPanel
                    title="Direção de Cena"
                    icon="AdjustmentsHorizontalIcon"
                    isExpanded={isOptionsExpanded}
                    onExpandToggle={() => setIsOptionsExpanded(!isOptionsExpanded)}
                >
                    <div className="flex flex-col gap-3">
                        <PromptField label="Estilo da Foto" value={photoStyle} onChange={(e) => setPhotoStyle(e.target.value)} placeholder="Ex: Retrato editorial, cinematográfico..." disabled={isLoading}/>
                        <PromptField label="Localização" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Estúdio escuro, praia ao pôr do sol..." disabled={isLoading}/>
                        <PromptField label="Figurino" value={clothing} onChange={(e) => setClothing(e.target.value)} placeholder="Ex: Terno azul, vestido de seda..." disabled={isLoading}/>
                        <PromptField label="Iluminação" value={lighting} onChange={(e) => setLighting(e.target.value)} placeholder="Ex: Holofote dramático, luz natural suave..." disabled={isLoading}/>
                        <PromptField label="Pose e Ação" value={pose} onChange={(e) => setPose(e.target.value)} placeholder="Ex: Mãos nos bolsos, olhando para a câmera..." disabled={isLoading}/>
                        <PromptField label="O que evitar (Prompt Negativo)" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="Ex: Mãos deformadas, cores berrantes..." disabled={isLoading}/>
                    </div>
                </CollapsibleToolPanel>

                <TipBox>
                    Use as predefinições como ponto de partida e personalize os detalhes para criar seu ensaio fotográfico perfeito.
                </TipBox>
                
                <button onClick={handleGenerate} disabled={isGenerateButtonDisabled} className="w-full mt-auto bg-gradient-to-br from-indigo-600 to-purple-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <LazyIcon name="CameraIcon" className="w-5 h-5" />
                    Gerar Ensaio
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={currentImageUrl}
                    loadingMessage="Montando o estúdio..."
                />
            </main>
        </div>
    );
};

export default PhotoStudioPanel;