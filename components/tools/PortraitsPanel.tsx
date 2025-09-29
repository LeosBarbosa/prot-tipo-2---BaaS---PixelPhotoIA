/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { SunIcon, UserIcon, StraightHairIcon, WavyHairIcon, CurlyHairIcon, AfroHairIcon, BraidsHairIcon } from '../icons';
import ApplyToAllToggle from '../common/ApplyToAllToggle';
import TipBox from '../common/TipBox';


const hairstyles = [
    { name: 'Liso', prompt: 'Mude o penteado para um cabelo liso e bem arrumado, mantendo a cor e o comprimento originais o máximo possível.', icon: <StraightHairIcon className="w-8 h-8" /> },
    { name: 'Ondulado', prompt: 'Mude o penteado para um cabelo ondulado e com volume, mantendo a cor e o comprimento originais o máximo possível.', icon: <WavyHairIcon className="w-8 h-8" /> },
    { name: 'Cacheado', prompt: 'Mude o penteado para um cabelo cacheado definido e volumoso, mantendo a cor e o comprimento originais o máximo possível.', icon: <CurlyHairIcon className="w-8 h-8" /> },
    { name: 'Afro', prompt: 'Mude o penteado para um cabelo afro natural e volumoso, mantendo a cor original.', icon: <AfroHairIcon className="w-8 h-8" /> },
    { name: 'Tranças', prompt: 'Mude o penteado para tranças nagô (cornrows) bem feitas, mantendo a cor original do cabelo.', icon: <BraidsHairIcon className="w-8 h-8" /> }
];

const PortraitsPanel: React.FC = () => {
    const { isLoading, handleApplyAIAdjustment, handleGenerateProfessionalPortrait, isGif } = useEditor();
    const [applyToAll, setApplyToAll] = useState(true);

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center mb-2">
                <h3 className="text-lg font-semibold text-gray-300">Retratos com IA</h3>
                <p className="text-sm text-gray-400 -mt-1">Melhore seus retratos com um clique.</p>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col items-center gap-3">
                <h4 className="font-bold text-white text-md flex items-center gap-2">
                    <SunIcon className="w-5 h-5 text-yellow-400"/>
                    Reacender (Dia Ensolarado)
                </h4>
                <p className="text-sm text-gray-400 text-center -mt-2">Ajusta a iluminação para simular um dia ensolarado.</p>
                <button
                    onClick={() => handleApplyAIAdjustment('Ajuste a iluminação do retrato para parecer um dia ensolarado, com luz quente e sombras suaves.', applyToAll)}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-br from-yellow-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
                >
                    Aplicar Iluminação
                </button>
            </div>
            
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col items-center gap-3">
                <h4 className="font-bold text-white text-md flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-blue-400"/>
                    Retrato Profissional
                </h4>
                <p className="text-sm text-gray-400 text-center -mt-2">Transforma sua foto em um retrato de negócios.</p>
                <button
                    onClick={() => handleGenerateProfessionalPortrait(applyToAll)}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
                >
                    Gerar Retrato
                </button>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col items-center gap-3">
                 <h4 className="font-bold text-white text-md flex items-center gap-2">
                    Mudar Estilo de Cabelo
                </h4>
                <p className="text-sm text-gray-400 text-center -mt-2">Experimente novos penteados com a ajuda da IA.</p>
                <div className="grid grid-cols-3 gap-2 w-full">
                    {hairstyles.map(style => (
                        <button
                            key={style.name}
                            onClick={() => handleApplyAIAdjustment(style.prompt, applyToAll)}
                            disabled={isLoading}
                            className="p-2 rounded-md text-sm font-semibold transition-all bg-white/10 hover:bg-white/20 text-gray-200 aspect-square flex flex-col items-center justify-center gap-2"
                        >
                            {style.icon}
                            <span>{style.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <TipBox>
                As ferramentas de retrato preservam a identidade facial enquanto aplicam transformações. Ideal para fotos de perfil e avatares criativos.
            </TipBox>

            {isGif && (
                <div className="mt-2">
                    <ApplyToAllToggle checked={applyToAll} onChange={setApplyToAll} />
                </div>
            )}
        </div>
    );
};

export default PortraitsPanel;