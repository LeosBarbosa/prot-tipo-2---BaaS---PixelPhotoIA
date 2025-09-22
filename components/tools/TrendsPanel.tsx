/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { SparkleIcon } from '../icons';

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
];

const TrendsPanel: React.FC = () => {
    const { isLoading, handleApplyAIAdjustment } = useEditor();

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Tendências</h3>
                <p className="text-sm text-gray-400 -mt-1">Experimente os estilos mais recentes.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {trends.map(trend => (
                    <button
                        key={trend.name}
                        onClick={() => handleApplyAIAdjustment(trend.prompt)}
                        disabled={isLoading}
                        className="aspect-video bg-gray-800 rounded-lg text-center font-semibold text-white hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center justify-center p-2 relative overflow-hidden group"
                    >
                        <div className={`absolute inset-0 ${trend.bg} opacity-70 group-hover:opacity-90 transition-opacity`}></div>
                        {trend.icon && <div className="relative z-10 mb-1">{trend.icon}</div>}
                        <span className="relative z-10 drop-shadow-md text-sm">{trend.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TrendsPanel;