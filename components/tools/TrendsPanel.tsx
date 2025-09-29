/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { SparkleIcon, PixarIcon, ToyIcon, ClockIcon, GtaIcon, LegoIcon } from '../icons';
import StylePreview from '../common/StylePreview';
import TipBox from '../common/TipBox';

interface Trend {
    name: string;
    prompt: string;
    bg: string;
    icon?: React.ReactNode;
}

const trends: Trend[] = [
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
        prompt: "Transforme a pessoa na foto em um boneco colecionável do estilo Funko Pop. O boneco deve ter a cabeça grande, olhos pretos redondos e um corpo pequeno, mantendo características chave como cabelo e roupa da pessoa original.",
        bg: 'bg-gradient-to-br from-gray-700 to-slate-900',
        icon: <ToyIcon className="w-6 h-6 text-white/80" />
    },
    {
        name: 'LEGO',
        prompt: "Reconstrua a cena da foto usando blocos de LEGO. As pessoas, objetos e o cenário devem ser representados como se fossem feitos de peças de LEGO, em um estilo fotorrealista.",
        bg: 'bg-gradient-to-br from-red-500 to-yellow-400',
        icon: <LegoIcon className="w-6 h-6 text-white/80" />
    },
    {
        name: 'Anuário Anos 90',
        prompt: "Transforme esta foto em um retrato de anuário escolar dos anos 90. O fundo deve ser um azul ou cinza manchado, a iluminação suave e a pose um pouco formal, com um leve sorriso.",
        bg: 'bg-gradient-to-br from-teal-400 to-blue-500',
        icon: <ClockIcon className="w-6 h-6 text-white/80" />
    },
    {
        name: 'Estilo GTA',
        prompt: "Redesenhe a imagem no estilo artístico icônico das capas do jogo Grand Theft Auto (GTA). Use cores saturadas, contornos pretos fortes e um estilo semi-realista de história em quadrinhos.",
        bg: 'bg-gradient-to-br from-orange-500 to-purple-800',
        icon: <GtaIcon className="w-6 h-6 text-white/80" />
    },
];

const TrendsPanel: React.FC = () => {
    const { isLoading, generateAIPreview, isPreviewLoading, previewState } = useEditor();

    const handleTrendClick = (prompt: string) => {
        // This panel doesn't support GIFs, so applyToAll is false.
        generateAIPreview(prompt, false);
    };

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Tendências</h3>
                <p className="text-sm text-gray-400 -mt-1">Experimente os estilos mais recentes.</p>
            </div>

            <StylePreview />

            <div className={`transition-opacity duration-300 ${isPreviewLoading || previewState ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="grid grid-cols-2 gap-3">
                    {trends.map(trend => (
                        <button
                            key={trend.name}
                            onClick={() => handleTrendClick(trend.prompt)}
                            disabled={isLoading || isPreviewLoading}
                            className="aspect-video bg-gray-800 rounded-lg text-center font-semibold text-white hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center justify-center p-2 relative overflow-hidden group"
                        >
                            <div className={`absolute inset-0 ${trend.bg} opacity-70 group-hover:opacity-90 transition-opacity`}></div>
                            {trend.icon && <div className="relative z-10 mb-1">{trend.icon}</div>}
                            <span className="relative z-10 drop-shadow-md text-sm">{trend.name}</span>
                        </button>
                    ))}
                </div>
                <TipBox>
                    Experimente os estilos mais populares da internet! Estes efeitos são ótimos para criar avatares e posts de redes sociais que se destacam.
                </TipBox>
            </div>
        </div>
    );
};

export default TrendsPanel;