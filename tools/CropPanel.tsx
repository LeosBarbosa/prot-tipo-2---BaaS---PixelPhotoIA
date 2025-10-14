/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { CropIcon, RotateLeftIcon, RotateRightIcon, FlipHorizontalIcon, FlipVerticalIcon, AspectRatioSquareIcon, AspectRatioLandscapeIcon, AspectRatioPortraitIcon } from '../icons';
import TipBox from '../common/TipBox';

const CropPanel: React.FC = () => {
    const {
        isLoading,
        aspect,
        setAspect,
        handleApplyCrop,
        handleTransform,
        completedCrop,
    } = useEditor();

    const aspectRatios = [
        { name: 'Livre', value: undefined, icon: <CropIcon className="w-6 h-6" /> },
        { name: '1:1', value: 1 / 1, icon: <AspectRatioSquareIcon className="w-6 h-6" /> },
        { name: '4:3', value: 4 / 3, icon: <AspectRatioLandscapeIcon className="w-6 h-6" /> },
        { name: '16:9', value: 16 / 9, icon: <AspectRatioLandscapeIcon className="w-6 h-6" /> },
        { name: '3:4', value: 3 / 4, icon: <AspectRatioPortraitIcon className="w-6 h-6" /> },
    ];

    const transforms = [
        { name: 'Girar Esquerda', type: 'rotate-left' as const, icon: <RotateLeftIcon className="w-6 h-6" /> },
        { name: 'Girar Direita', type: 'rotate-right' as const, icon: <RotateRightIcon className="w-6 h-6" /> },
        { name: 'Inverter H.', type: 'flip-h' as const, icon: <FlipHorizontalIcon className="w-6 h-6" /> },
        { name: 'Inverter V.', type: 'flip-v' as const, icon: <FlipVerticalIcon className="w-6 h-6" /> },
    ];

    return (
        <div className="w-full flex flex-col gap-6 animate-fade-in">
            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                <h3 className="font-bold text-white text-md mb-3 text-center">Proporção</h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {aspectRatios.map(({ name, value, icon }) => (
                        <button
                            key={name}
                            onClick={() => setAspect(value)}
                            disabled={isLoading}
                            className={`p-2 rounded-md text-sm font-semibold transition-all duration-200 aspect-square flex flex-col items-center justify-center gap-1 ${aspect === value ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300'}`}
                            title={name}
                        >
                            {icon}
                            <span className="text-xs">{name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                 <h3 className="font-bold text-white text-md mb-3 text-center">Transformar</h3>
                <div className="grid grid-cols-4 gap-2">
                    {transforms.map(({ name, type, icon }) => (
                         <button 
                            key={type} 
                            onClick={() => handleTransform(type)} 
                            disabled={isLoading} 
                            className="p-2 rounded-md text-sm font-semibold transition-all duration-200 aspect-square flex flex-col items-center justify-center gap-1 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300"
                            title={name}
                        >
                            {icon}
                            <span className="text-xs">{name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <TipBox>
                Selecione uma proporção predefinida para manter o enquadramento consistente. Arraste as alças para ajustar o corte manualmente.
            </TipBox>

            <button
                onClick={handleApplyCrop}
                disabled={isLoading || !completedCrop?.width || !completedCrop?.height}
                className="w-full mt-2 bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
            >
                <CropIcon className="w-5 h-5" />
                Aplicar Corte
            </button>
        </div>
    );
};

export default CropPanel;
