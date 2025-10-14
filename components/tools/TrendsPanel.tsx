/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { SparkleIcon, PixarIcon, ToyIcon, ClockIcon, GtaIcon, LegoIcon, PixelsIcon, BrushIcon, CameraIcon } from '../icons';
import StylePreview from '../common/StylePreview';
import TipBox from '../common/TipBox';
import ApplyToAllToggle from '../common/ApplyToAllToggle';
import { type Trend } from '../../types';

const trends: Trend[] = [
    {
        name: 'Sonho',
        prompt: 'aplique um efeito de sonho suave e etéreo com um brilho suave e cores pastel',
        bg: 'bg-gradient-to-br from-pink-300 to-purple-400',
        icon: <SparkleIcon className="w-6 h-6 text-white/80" />
    },
    { name: 'Glitch', prompt: 'aplique um efeito de glitch digital, com distorção de pixels, aberração cromática e linhas de varredura', bg: 'bg-gradient-to-br from-red-500 to-blue-500' },
    { name: 'Duotone', prompt: 'converta a imagem para um efeito duotone, usando as cores primárias de azul vibrante e rosa choque', bg: 'bg-gradient-to-br from-blue-500 to-pink-500' },
    { name: 'Risograph', prompt: 'simule uma impressão risograph, com cores limitadas (vermelho e azul), grão e sobreimpressão sutil', bg: 'bg-gradient-to-br from-red-400 to-sky-400' },
    { 
        name: 'Holográfico', 
        prompt: 'aplique um efeito iridescente e holográfico à imagem, com brilhos prismáticos e reflexos', 
        bg: 'bg-gradient-to-br from-purple-400 via-pink-400 to-cyan-300',
        icon: <SparkleIcon className="w-6 h-6 text-white/80" />
    },
    { name: 'Caixa de Boneco', prompt: 'Coloque a pessoa principal da foto dentro de uma caixa de boneca de brinquedo colecionável. A caixa deve ter um design temático, uma janela de plástico transparente e texto como "Edição Limitada". O resultado deve ser fotorrealista e divertido.', bg: 'bg-gradient-to-br from-pink-500 to-violet-500' },
    { name: 'Preto e Branco', prompt: 'Crie um retrato em primeiro plano, com alto contraste, em preto e branco com lentes 35mm e qualidade 4K HD. Adicione um leve efeito de gotas de água no rosto para um toque dramático.', bg: 'bg-gradient-to-br from-gray-400 to-gray-800' },
    {
        name: 'Estilo Pixar',
        prompt: "Transforme a pessoa na foto em um personagem no estilo de animação 3D da Disney Pixar. Mantenha as características faciais reconhecíveis, mas com o visual de animação característico, com olhos grandes e expressivos e pele suave.",
        bg: 'bg-gradient-to-br from-sky-400 to-blue-600',
        icon: <PixarIcon className="w-6 h-6 text-white/80" />
    },
    {
        name: 'Funko Pop',
        prompt: "Crie uma imagem no estilo Funko Pop de [ASSUNTO]. O boneco Funko Pop deve capturar fielmente as características visuais da imagem original, incluindo cor dos olhos, estilo de cabelo/pelagem, vestuário/textura, e quaisquer acessórios proeminentes. O Funko Pop deve estar posicionado em um cenário minimalista que remete ao fundo da imagem original, se houver um, ou em um fundo simples e neutro (como uma parede clara ou um chão de madeira simples). A iluminação deve ser suave e uniforme para destacar os detalhes. Alta resolução e nitidez são essenciais.",
        bg: 'bg-gradient-to-br from-gray-700 to-slate-900',
        icon: <ToyIcon className="w-6 h-6 text-white/80" />,
        type: 'descriptive',
    },
     {
        name: 'Funko Pop na Mão',
        prompt: "Crie uma imagem no estilo Funko Pop de [ASSUNTO]. O boneco Funko Pop deve reproduzir as características exatas da imagem original, como cor dos olhos, tipo de cabelo/pelagem, vestimentas/textura e acessórios. O Funko Pop deve ser visivelmente segurado por uma mão humana realista. A mão deve apresentar detalhes como cor de pele natural, unhas visíveis e sombras que criam profundidade e realismo, fazendo com que pareça que a mão está realmente interagindo com o boneco. O fundo da cena deve ser simples e neutro, ou uma representação minimalista do fundo da imagem original, se aplicável. A imagem final deve ter alta resolução, com iluminação que enfatize tanto o Funko Pop quanto o realismo da mão que o segura, garantindo que todos os detalhes sejam claramente visíveis.",
        bg: 'bg-gradient-to-br from-stone-600 to-slate-800',
        icon: <ToyIcon className="w-6 h-6 text-white/80" />,
        type: 'descriptive'
    },
    {
        name: 'LEGO',
        prompt: "Reconstrua a cena da foto usando blocos de LEGO. As pessoas, objetos e o cenário devem ser representados como se fossem feitos de peças de LEGO, em um estilo fotorrealista.",
        bg: 'bg-gradient-to-br from-red-500 to-yellow-400',
        icon: <LegoIcon className="w-6 h-6 text-white/80" />
    },
    {
        name: 'Pixel Drop',
        prompt: "Transforme o assunto principal desta foto em um sprite de pixel art de 16 bits. O sprite deve estar flutuando no ar como se fosse um item de 'queda perfeita' em um videogame JRPG clássico. Adicione um brilho sutil e efeitos de brilho ao redor do sprite. O fundo deve ser um ambiente simples, escuro e ligeiramente desfocado de pixel art (como uma floresta ou caverna). A imagem final deve ter uma proporção nostálgica de 4:3 e uma estética consistente de 16 bits.",
        bg: 'bg-gradient-to-br from-purple-500 to-indigo-700',
        icon: <PixelsIcon className="w-6 h-6 text-white/80" />
    },
    {
        name: 'Anuário Anos 90',
        prompt: "Transforme esta foto em um retrato de anuário escolar dos anos 90. O fundo deve ser um azul ou cinza manchado, a iluminação suave e a pose um pouco formal, com um leve sorriso.",
        bg: 'bg-gradient-to-br from-teal-400 to-blue-500',
        icon: <ClockIcon className="w-6 h-6 text-white/80" />
    },
    {
        name: 'Estilo GTA',
        prompt: `Crie uma arte de pôster de capa do Grand Theft Auto com base na pessoa na foto. O estilo deve ser ilustrativo, com contornos ousados e cores vibrantes, semelhante às capas de jogos do GTA. O fundo deve ser uma cena urbana estilizada que complementa a pose.`,
        bg: 'bg-gradient-to-br from-orange-400 to-fuchsia-600',
        icon: <GtaIcon className="w-6 h-6 text-white/80" />
    },
    {
        name: "Colagem Aquarela Vintage",
        prompt: "edit this image to create a vintage watercolor collage of an elegant woman, blending nostalgic artistic elements with expressive paint splashes and delicate textures. The portrait should feature soft, flowing watercolor techniques with intentional drips, bleeds, and layered translucent washes that create romantic depth and emotional storytelling. Focus on warm amber and rich sepia tones as the dominant color palette, with accents of dusty rose, cream, honey gold, and faded mauve to evoke a timeless, vintage photograph aesthetic. Incorporate collage elements such as vintage lace patterns, antique floral illustrations, old love letters, pressed flowers, weathered journal pages, or Victorian-era ephemera subtly woven into the composition. The woman should be dressed in classic, romantic attire—perhaps a vintage lace dress, flowing blouse, or period-appropriate accessories like pearl earrings or a delicate necklace—with her features rendered in graceful, impressionistic watercolor strokes",
        bg: 'bg-gradient-to-br from-amber-200 to-rose-300',
        icon: <BrushIcon className="w-6 h-6 text-white/80" />,
    },
    {
        name: "Retrato no Carro Vintage",
        prompt: "Create a hyper-realistic portrait of [ASSUNTO] sitting in the driver's seat of a car, wearing a black shirt, combined with a faded light gray jacket and light gray wide-leg pants. White shoes should be visible, complementing the casual look. Round sunglasses with dark lenses should be positioned on the nose, highlighting a confident and slightly ironic facial expression. Relaxed posture: one arm on the sports steering wheel, the other supporting the head, conveying a relaxed look. The interior of the car should include side windows showing urban scenery (trees, buildings and part of another vehicle), and a black textured seat. Soft natural lighting, simulating daylight coming through the windows, creating a contrast between the warm colors of the clothing and the neutral environment of the car. Vintage style, with desaturated tones and slightly grainy textures, evoking a nostalgic atmosphere. Dominant tones of gray, white and black, with a balance between external light and internal shadows. Slightly elevated perspective, framing that includes the top of the knees to the head, with the steering wheel partially visible on the right.",
        bg: 'bg-gradient-to-br from-slate-500 to-gray-700',
        icon: <CameraIcon className="w-6 h-6 text-white/80" />,
        type: 'descriptive',
    },
    {
        name: "Esboço Carvão Expressivo",
        prompt: "Edit this image to transform it into an expressionist charcoal sketch of a stunning woman with piercing blue-green eyes that shimmer like ocean depths. Create the artwork with bold, passionate, and soulful charcoal strokes that dance between control and abandon. She's captured in a dynamic pose—head turned slightly over her bare shoulder, chin subtly lifted, eyes gazing directly at the viewer with penetrating intensity that's both inviting and guarded. Her features are delicately powerful—high cheekbones, full lips rendered with sensual charcoal lines, a graceful neck that flows like a swan's. The strokes defining her face are confident yet tender, with areas of intense darkness contrasting against luminous, barely-touched paper that creates her highlighted features. She wears a flowing, off-shoulder draped fabric in deep burgundy and charcoal tones that cascades around her collarbone, the texture suggested through sweeping, gestural strokes that imply silk or fine cotton. The lighting is moody and cinematic: warm golden light from the right side kisses her cheekbone, the bridge of her nose, and the curve of her shoulder, while deep violet-tinged shadows pool in the hollows of her collarbones and along her neck. Subtle touches of sage green and aquamarine are woven into the charcoal medium—most prominently in her captivating eyes, but also as ghost-like accents in her dark, loosely rendered hair that appears to move with invisible wind. Her hair is suggested rather than detailed—wild, expressive strokes that create volume and movement, some strands sharply defined while others dissolve into abstract marks. A few loose tendrils frame her face, drawn with delicate precision. The tall vertical composition creates a sense of elegance and timelessness, with intentional breathing room above and below her figure. The background is alive with emotional energy—explosive charcoal marks in the upper right suggesting turmoil or passion, transitioning to soft, meditative tones in the lower left. Include visible texture: paper grain showing through, smudged areas where fingers dragged across wet charcoal, and strategic erasing that creates ethereal highlights. The overall atmosphere is one of haunting beauty—vulnerability wrapped in strength, softness containing fire—a portrait that captures the full spectrum of feminine emotional depth in the tradition of André de Dienes' iconic dramatic portraiture",
        bg: 'bg-gradient-to-br from-gray-400 to-gray-800',
        icon: <BrushIcon className="w-6 h-6 text-white/80" />,
    },
    {
        name: "Colagem Aquarela (Masc.)",
        prompt: "edit this image to create a vintage watercolor collage of an elegant man, blending nostalgic artistic elements with expressive paint splashes and delicate textures. The portrait should feature soft, flowing watercolor techniques with intentional drips, bleeds, and layered translucent washes that create romantic depth and emotional storytelling. Focus on warm amber and rich sepia tones as the dominant color palette, with accents of dusty rose, cream, honey gold, and faded mauve to evoke a timeless, vintage photograph aesthetic. Incorporate collage elements such as vintage map fragments, antique scientific illustrations, old handwritten letters, pressed leaves, weathered journal pages, or Victorian-era ephemera subtly woven into the composition. The man should be dressed in classic, romantic attire—perhaps a vintage tweed jacket, a crisp collared shirt, or period-appropriate accessories like a pocket watch or a tie—with his features rendered in graceful, impressionistic watercolor strokes",
        bg: 'bg-gradient-to-br from-amber-300 to-stone-500',
        icon: <BrushIcon className="w-6 h-6 text-white/80" />,
    },
    {
        name: "Topo de Paris",
        prompt: "A hyper-realistic cinematic image of [ASSUNTO] standing at the very top of a famous tower in Paris. From this high vantage point, the entire Paris skyline is visible: the Eiffel Tower in the distance, classic Parisian rooftops, and winding streets below. They are wearing a white tee-shirt and a black watch. Golden daylight shines across the city, with soft atmospheric haze adding depth. The camera angle is wide, slightly low, making the person look majestic and free while embracing the panoramic view. Mood: liberating, cinematic, awe-inspiring. Aspect ratio: 16:9, ultra-realistic, cinematic detail.",
        bg: 'bg-gradient-to-br from-sky-400 to-amber-400',
        icon: <CameraIcon className="w-6 h-6 text-white/80" />,
        type: 'descriptive',
    },
];

const TrendsPanel: React.FC = () => {
    const { isGif, generateAIPreview, isPreviewLoading, previewState, isLoading } = useEditor();
    const [applyToAll, setApplyToAll] = useState(true);

    const handleTrendClick = (trend: Trend) => {
        generateAIPreview(trend, applyToAll);
    };

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Tendências</h3>
                <p className="text-sm text-gray-400 -mt-1">Experimente estilos e efeitos populares do momento.</p>
            </div>

            <StylePreview />

            <div className={`transition-opacity duration-300 ${isPreviewLoading || previewState ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="grid grid-cols-2 gap-3">
                    {trends.map(trend => (
                        <button
                            key={trend.name}
                            onClick={() => handleTrendClick(trend)}
                            disabled={isLoading || isPreviewLoading}
                            className="aspect-video bg-gray-800 rounded-lg text-center font-semibold text-white hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center justify-center p-2 relative overflow-hidden group"
                        >
                            <div className={`absolute inset-0 ${trend.bg} opacity-70 group-hover:opacity-90 transition-opacity`}></div>
                            <div className="relative z-10 flex flex-col items-center justify-center gap-2">
                                {trend.icon}
                                <span className="drop-shadow-md text-sm">{trend.name}</span>
                            </div>
                        </button>
                    ))}
                </div>
                <TipBox>
                    As tendências são efeitos complexos que podem alterar drasticamente sua imagem. Use a pré-visualização para ver o resultado antes de aplicar.
                </TipBox>
                {isGif && <div className="mt-4"><ApplyToAllToggle checked={applyToAll} onChange={setApplyToAll} /></div>}
            </div>
        </div>
    );
};

export default TrendsPanel;