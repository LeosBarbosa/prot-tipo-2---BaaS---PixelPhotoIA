/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import * as geminiService from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { CameraIcon, DownloadIcon, BrushIcon } from '../icons';
import { dataURLtoFile } from '../../utils/imageUtils';
import TipBox from '../common/TipBox';

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
    {
        name: 'Desafio Cinematográfico',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/cinematic_standoff.webp',
        photoStyle: "Obra de arte digital hipercinemática e ultradetalhada, com estética de pôster de filme de classe mundial e qualidade de nível IMAX.",
        location: "Dezenas de armas metálicas apontadas para sua cabeça de todas as direções. Faíscas, poeira atmosférica e reflexos de lente sutis.",
        clothing: "Terno escuro, camisa branca e gravata.",
        lighting: "Iluminação cinematográfica dramática, com fortes realces dourados, sombras profundas contrastantes e reflexos brilhantes nas armas. Cores ricas e nítidas.",
        pose: "De pé, desafiadoramente, com o rosto ensanguentado e desgastado pela batalha. Olhar intenso fixo para a frente, mostrando determinação.",
    },
    {
        name: 'Retrato Geométrico',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/geometric_portrait.webp',
        photoStyle: "Retrato vetorial geométrico, ilustração plana minimalista, design profissional e artístico, ultra-detalhado, alta resolução.",
        location: "Composição simétrica, fundo minimalista.",
        clothing: "Terno preto elegante e gravata. A pessoa é careca ou tem uma forma de cabeça simples e limpa, com uma barba cheia e arrumada.",
        lighting: "Sombras e destaques de alto contraste, sombreamento geométrico abstrato no rosto.",
        pose: "Estilo corporativo moderno, visual icônico e atemporal.",
    },
    {
        name: 'Retrato de Herói',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/hero_portrait.webp',
        photoStyle: "Ilustração digital hiperdetalhada, semi-realista misturada com arte de quadrinhos de alta qualidade, contornos nítidos, texturas ricas. Ultra HD, linhas limpas, cores vivas, obra-prima.",
        location: "Fundo vibrante com gradiente amarelo-laranja texturizado, brilhando com energia, evocando uma vibe de pôster moderno.",
        clothing: "Camiseta preta justa, minimalista e ousada.",
        lighting: "Iluminação cinematográfica dramática, sombreamento cinematográfico.",
        pose: "Homem careca com barba espessa, cruzando os braços poderosamente, exalando força e domínio. Expressão intensa e séria irradiando confiança. Braços musculosos e postura definida.",
    },
    {
        name: 'Retrato de Horror',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/horror_portrait.webp',
        photoStyle: "Retrato cinematográfico de terror, modo retrato, imagem 8k.",
        location: "Na escuridão, um rosto sinistro do palhaço 'It' sussurra no ouvido, meio escondido nas sombras com texturas grotescas e tons vermelhos.",
        clothing: "Rosto suado, o resto não é o foco.",
        lighting: "Um isqueiro aceso perto do rosto projeta luz dramática laranja e azul.",
        pose: "Expressão tensa, olhando diretamente para a frente.",
    },
    {
        name: 'Claymation Elegante',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/claymation_elegant.webp',
        photoStyle: "Obra-prima de claymation CGI ultra-realista com um toque inspirado na Pixar, artesanal.",
        location: "Fundo simples e artístico que complementa a figura de argila.",
        clothing: "Roupas elegantes feitas de argila, com texturas detalhadas.",
        lighting: "Iluminação suave e criativa que realça as curvas e texturas da argila.",
        pose: "Pose confiante e graciosa, capturando a essência da elegância com um toque divertido.",
    },
    {
        name: 'Duelo de Basquete',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/basketball_duel.webp',
        photoStyle: "Foto cinematográfica ultra-realista de um jogo de basquete intenso dos anos 90, 8K, texturas fotorrealistas, profundidade de campo suave.",
        location: "Quadra de madeira polida com reflexos, fundo escuro com uma multidão desfocada, destacando os dois atletas.",
        clothing: "Uniforme de basquete vintage amarelo dos Los Angeles Lakers (#21), com tatuagens de conceito japonês nos braços, tênis Jordan One vermelho e branco, shorts de compressão pretos e uma manga de braço preta no braço esquerdo.",
        lighting: "Iluminação de holofote dramática.",
        pose: "Inclinado para a frente para proteger a bola em um confronto um contra um agressivo contra Michael Jordan.",
    },
    {
        name: 'Herói Aranha',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/spider_hero.webp',
        photoStyle: "Cena dramática em um cenário urbano noturno, com textura 3D e reflexos de luz, capturando tensão e determinação.",
        location: "Céu escuro com arranha-céus e uma atmosfera enevoada, evocando uma cidade como Nova York.",
        clothing: "Traje clássico do Homem-Aranha vermelho e azul, com sinais de desgaste após uma batalha intensa. Padrão de teia detalhado, emblema de aranha prateado e áreas rasgadas mostrando uma camada interna desfiada.",
        lighting: "Iluminação dramática de cima e dos lados para destacar os contornos do rosto e do traje. Um brilho sutil nos padrões de teia.",
        pose: "Pose dinâmica em pé, olhando ligeiramente para a frente e para baixo em um ângulo de 30 a 45 graus em relação à câmera, transmitindo intensidade e foco. Cabelo castanho despenteado e rosto parcialmente visível com textura natural.",
    },
    {
        name: 'Aviador',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/aviator_child.webp',
        photoStyle: "Retrato cinematográfico hiper-realista, fotografia profissional de moda, alta qualidade.",
        location: "Em um campo de aviação vintage, com um avião de hélice antigo ao fundo.",
        clothing: "Jaqueta de couro de aviador, óculos de proteção na testa e um cachecol branco.",
        lighting: "Luz natural do final da tarde, criando um brilho dourado.",
        pose: "A criança está sentada na asa do avião, olhando para o horizonte com uma expressão sonhadora.",
    },
    {
        name: 'Chefe de Cozinha',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/chef_child.webp',
        photoStyle: "Retrato divertido e profissional, alta qualidade, 8K.",
        location: "Em uma cozinha de restaurante profissional, com utensílios de aço inoxidável e ingredientes frescos ao fundo.",
        clothing: "Dólmã branca de chef, chapéu de chef (toque blanche) e um lenço vermelho no pescoço.",
        lighting: "Iluminação brilhante e limpa, típica de uma cozinha profissional.",
        pose: "A criança está segurando um batedor e uma tigela, com uma expressão concentrada e um pouco de farinha no nariz.",
    },
    {
        name: 'Coelhinho da Páscoa',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/easter_bunny_child.webp',
        photoStyle: "Retrato de fantasia, fofo e mágico, alta qualidade.",
        location: "Em um jardim florido na primavera, com ovos de Páscoa coloridos espalhados pela grama.",
        clothing: "Fantasia de coelhinho branco fofo, com orelhas compridas e um laço azul-claro.",
        lighting: "Luz suave e difusa da manhã, criando uma atmosfera etérea.",
        pose: "A criança está sentada em uma cesta de vime, segurando uma cenoura grande, com uma expressão curiosa.",
    },
    {
        name: 'Princesa',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/princess_child.webp',
        photoStyle: "Retrato de conto de fadas, mágico e elegante, alta qualidade.",
        location: "Em um grande salão de baile de um castelo, com candelabros de cristal e cortinas de veludo ao fundo.",
        clothing: "Vestido de baile esvoaçante em tons de rosa e dourado, com uma pequena coroa brilhante no cabelo.",
        lighting: "Iluminação suave e quente dos candelabros, criando um brilho mágico.",
        pose: "A criança está fazendo uma reverência graciosa, com um sorriso gentil.",
    },
    {
        name: 'Cowboy',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/cowboy_child.webp',
        photoStyle: "Retrato de aventura no estilo faroeste, cinematográfico, alta qualidade.",
        location: "Em um rancho no Velho Oeste, com um celeiro de madeira e cercas ao fundo, ao pôr do sol.",
        clothing: "Chapéu de cowboy, colete de couro, camisa xadrez e botas de cowboy.",
        lighting: "Luz dourada do pôr do sol, criando sombras longas e dramáticas.",
        pose: "A criança está encostada em uma cerca de madeira, com uma expressão confiante e um laço de brinquedo na mão.",
    },
    {
        name: 'Bailarina',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/ballerina_child.webp',
        photoStyle: "Retrato artístico e gracioso, alta qualidade, 8k.",
        location: "Em um estúdio de balé com piso de madeira, grandes espelhos e uma barra de balé.",
        clothing: "Tutu de balé rosa claro, sapatilhas de ponta e o cabelo preso em um coque elegante.",
        lighting: "Iluminação suave e difusa vinda de uma grande janela, destacando os movimentos.",
        pose: "A criança está em uma pose de balé clássica, como um arabesque, com uma expressão serena.",
    },
    {
        name: 'Piloto de Corrida',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/race_driver_child.webp',
        photoStyle: "Retrato dinâmico e energético, estilo fotografia esportiva, alta qualidade.",
        location: "Em uma pista de corrida, com um carro de corrida de Fórmula 1 vermelho ao fundo.",
        clothing: "Macacão de corrida completo com patrocínios fictícios e um capacete debaixo do braço.",
        lighting: "Luz solar brilhante, refletindo no carro e no asfalto.",
        pose: "A criança está de pé ao lado do carro de corrida, com um sorriso vitorioso e um troféu na mão.",
    },
    {
        name: 'Soldado Invernal',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/photostudio/winter_soldier.webp',
        photoStyle: "Imagem cinematográfica hiper-realista, composição de pôster de filme, tom épico, detalhes nítidos, 8K.",
        location: "Rua de cidade esfumaçada e devastada pela guerra, com faíscas e brasas voando.",
        clothing: "Traje de combate tático icônico: armadura escura, braço cibernético de metal brilhante com gravuras, cabelo comprido e bagunçado.",
        lighting: "Iluminação de contraste sombrio.",
        pose: "Pose dramática segurando um rifle, braço de metal para a frente, máscara tática abaixada revelando uma expressão intensa e de batalha.",
    },
];

const PhotoStudioPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, baseImageFile, setInitialImage, setActiveTool } = useEditor();
    
    const [personImage, setPersonImage] = useState<File | null>(null);
    const [location, setLocation] = useState('');
    const [clothing, setClothing] = useState('');
    const [lighting, setLighting] = useState('');
    const [pose, setPose] = useState('');
    const [photoStyle, setPhotoStyle] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
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

    const handlePresetClick = (preset: Preset) => {
        setPhotoStyle(preset.photoStyle);
        setLocation(preset.location);
        setClothing(preset.clothing);
        setLighting(preset.lighting);
        setPose(preset.pose);
    };

    const handleGenerate = async () => {
        if (!personImage) {
            setError("Por favor, carregue a imagem da pessoa.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            const details = [
                photoStyle && `- **Estilo Fotográfico:** ${photoStyle} (Ex: editorial de moda, retrato dramático, cinematográfico).`,
                location && `- **Local e Cenário:** ${location} (Ex: rua parisiense à noite, estúdio minimalista, praia tropical ensolarada).`,
                clothing && `- **Figurino e Vestuário:** ${clothing} (Ex: smoking preto elegante, vestido de verão esvoaçante, jaqueta de couro robusta).`,
                lighting && `- **Iluminação:** ${lighting} (Ex: luz quente do pôr do sol, luzes vibrantes de neon da cidade, iluminação de estúdio suave e difusa).`,
                pose && `- **Pose e Ação:** ${pose} (Ex: caminhando confiantemente em direção à câmera, olhando pensativamente pela janela, rindo espontaneamente).`,
            ].filter(Boolean).join('\n');

            const mainPrompt = `**Objetivo:** Gerar uma imagem de ensaio fotográfico profissional e fotorrealista, estrelando a pessoa da foto fornecida.
**Instrução Crítica:** A identidade facial e as características distintivas da pessoa devem ser preservadas com 100% de precisão. O resultado final DEVE ser uma nova fotografia da *mesma pessoa*.

**Detalhes da Cena:**
${details}

**Qualidade:** A imagem deve ser de alta resolução (qualidade 8K), hiperdetalhada e com um aspecto cinematográfico profissional.
`.trim();
            
            const result = await geminiService.generateStudioPortrait(personImage, mainPrompt, negativePrompt);
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

    const isGenerateButtonDisabled = isLoading || !personImage || !(location || clothing || lighting || pose || photoStyle);

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50 overflow-y-auto scrollbar-thin">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Ensaio Fotográfico IA</h3>
                    <p className="text-sm text-gray-400 mt-1">Gere ensaios fotográficos realistas.</p>
                </div>
                
                <ImageDropzone imageFile={personImage} onFileSelect={handlePersonFileSelect} label="Sua Foto"/>
                
                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2 text-center">Inspirações</h4>
                    <div className="grid grid-cols-3 gap-2">
                        {presets.map(preset => (
                            <button
                                key={preset.name}
                                onClick={() => handlePresetClick(preset)}
                                disabled={isLoading}
                                className="relative group aspect-[3/4] rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
                                title={preset.name}
                            >
                                <img src={preset.thumbnail} alt={preset.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                                <p className="absolute bottom-1 left-0 right-0 text-white text-[10px] font-bold text-center drop-shadow-md p-1 bg-black/20">{preset.name}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <PromptField label="Estilo Fotográfico" value={photoStyle} onChange={e => setPhotoStyle(e.target.value)} placeholder="Ex: editorial de moda, capa de revista, cinematográfico" disabled={isLoading} />
                    <PromptField label="Local / Cenário" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: em uma rua de Paris, estúdio minimalista, praia tropical" disabled={isLoading} />
                    <PromptField label="Figurino" value={clothing} onChange={e => setClothing(e.target.value)} placeholder="Ex: terno preto elegante, vestido de verão, jaqueta de couro" disabled={isLoading} />
                    <PromptField label="Iluminação" value={lighting} onChange={e => setLighting(e.target.value)} placeholder="Ex: luz do pôr do sol, neon, estúdio profissional" disabled={isLoading} />
                    <PromptField label="Pose / Ação" value={pose} onChange={e => setPose(e.target.value)} placeholder="Ex: andando em direção à câmera, olhando para o horizonte" disabled={isLoading} />
                    <PromptField label="O que evitar (Negativo)" value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)} placeholder="Ex: óculos, chapéu, mais de uma pessoa" rows={1} disabled={isLoading} />
                </div>
                
                <TipBox>Descreva os detalhes do seu ensaio fotográfico. Quanto mais específico, melhor o resultado. É crucial que o rosto da pessoa na foto esteja claro e bem iluminado.</TipBox>
                
                <button
                    onClick={handleGenerate}
                    disabled={isGenerateButtonDisabled}
                    className="w-full mt-auto bg-gradient-to-br from-sky-600 to-blue-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <CameraIcon className="w-5 h-5" />
                    Gerar Ensaio
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer isLoading={isLoading} error={error} resultImage={resultImage} loadingMessage="Preparando seu ensaio fotográfico..."/>
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
export default PhotoStudioPanel;