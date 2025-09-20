/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { CropIcon, RotateLeftIcon, RotateRightIcon, FlipHorizontalIcon, FlipVerticalIcon } from '../icons';

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
        { name: 'Livre', value: undefined },
        { name: '1:1', value: 1 / 1 },
        { name: '4:3', value: 4 / 3 },
        { name: '16:9', value: 16 / 9 },
    ];

    return (
        <div className="w-full flex flex-col gap-6 animate-fade-in">
            <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Proporção</h3>
                <div className="grid grid-cols-4 gap-2">
                    {aspectRatios.map(({ name, value }) => (
                        <button
                            key={name}
                            onClick={() => setAspect(value)}
                            disabled={isLoading}
                            className={`p-2 rounded-md text-sm font-semibold transition-all duration-200 aspect-square flex items-center justify-center text-center ${aspect === value ? 'bg-blue-600 text-white shadow-md' : 'bg-white/10 hover:bg-white/20 text-gray-200'}`}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Transformar</h3>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleTransform('rotate-left')} disabled={isLoading} className="flex items-center justify-center gap-2 bg-white/10 p-3 rounded-lg hover:bg-white/20"><RotateLeftIcon className="w-5 h-5" /> Girar</button>
                    <button onClick={() => handleTransform('rotate-right')} disabled={isLoading} className="flex items-center justify-center gap-2 bg-white/10 p-3 rounded-lg hover:bg-white/20"><RotateRightIcon className="w-5 h-5" /> Girar</button>
                    <button onClick={() => handleTransform('flip-h')} disabled={isLoading} className="flex items-center justify-center gap-2 bg-white/10 p-3 rounded-lg hover:bg-white/20"><FlipHorizontalIcon className="w-5 h-5" /> Inverter H</button>
                    <button onClick={() => handleTransform('flip-v')} disabled={isLoading} className="flex items-center justify-center gap-2 bg-white/10 p-3 rounded-lg hover:bg-white/20"><FlipVerticalIcon className="w-5 h-5" /> Inverter V</button>
                </div>
            </div>

            <div className="border-t border-gray-700/50 my-2"></div>

            <button
                onClick={handleApplyCrop}
                disabled={isLoading || !completedCrop?.width || !completedCrop?.height}
                className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
            >
                <CropIcon className="w-5 h-5" />
                Aplicar Corte
            </button>
        </div>
    );
};

export default CropPanel;
