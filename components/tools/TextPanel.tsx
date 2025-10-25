/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import TipBox from '../common/TipBox';
import LazyIcon from '../LazyIcon';

const fontFamilies = [ 'Impact', 'Arial', 'Verdana', 'Georgia', 'Comic Sans MS', 'Times New Roman', 'Courier New', 'Helvetica' ];

const TextPanel: React.FC = () => {
    const { 
        isLoading,
        textToolState,
        setTextToolState,
        handleApplyText,
        resetTextToolState,
    } = useEditor();

    const updateState = (key: string, value: any) => {
        setTextToolState(prev => ({...prev, [key]: value}));
    }

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Adicionar Texto</h3>
                <p className="text-sm text-gray-400 -mt-1">Adicione e estilize texto na sua imagem.</p>
            </div>

            <textarea
                value={textToolState.content}
                onChange={(e) => updateState('content', e.target.value)}
                placeholder="Digite seu texto aqui"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base min-h-[100px]"
                disabled={isLoading}
                rows={4}
            />

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300">Fonte</label>
                    <select value={textToolState.fontFamily} onChange={e => updateState('fontFamily', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-base">
                        {fontFamilies.map(font => <option key={font} value={font}>{font}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300">Cor</label>
                    <input type="color" value={textToolState.color} onChange={e => updateState('color', e.target.value)} className="w-full h-10 bg-gray-800 border border-gray-600 rounded-lg p-1" />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300 flex justify-between">
                    <span>Tamanho</span>
                    <span className="text-white font-mono">{textToolState.fontSize.toFixed(1)}%</span>
                </label>
                <input
                    type="range"
                    min="1"
                    max="25"
                    step="0.5"
                    value={textToolState.fontSize}
                    onChange={e => updateState('fontSize', parseFloat(e.target.value))}
                    disabled={isLoading}
                    className="w-full"
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Alinhamento</label>
                    <div className="flex w-full bg-gray-800/50 border border-gray-600 rounded-lg p-1">
                        {(['left', 'center', 'right'] as const).map((align) => (
                            <button key={align} type="button" onClick={() => updateState('align', align)} className={`w-full text-center font-semibold py-2 rounded-md transition-all text-sm ${textToolState.align === align ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/10'}`}>
                                {align.charAt(0).toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Estilo</label>
                     <div className="flex w-full bg-gray-800/50 border border-gray-600 rounded-lg p-1">
                        <button type="button" onClick={() => updateState('bold', !textToolState.bold)} className={`w-full text-center font-bold py-2 rounded-md transition-all text-sm ${textToolState.bold ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/10'}`}>
                            B
                        </button>
                         <button type="button" onClick={() => updateState('italic', !textToolState.italic)} className={`w-full text-center italic py-2 rounded-md transition-all text-sm ${textToolState.italic ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/10'}`}>
                            I
                        </button>
                    </div>
                </div>
            </div>

             <TipBox>
                Depois de adicionar o texto, você pode clicar e arrastá-lo diretamente na imagem para posicioná-lo onde quiser.
            </TipBox>

            <div className="border-t border-gray-700/50 my-2"></div>
            
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={resetTextToolState}
                    disabled={isLoading}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                    Resetar
                </button>
                <button
                    type="button"
                    onClick={handleApplyText}
                    disabled={isLoading || !textToolState.content.trim()}
                    className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
                >
                    <LazyIcon name="TextToolIcon" className="w-5 h-5" />
                    Aplicar Texto
                </button>
            </div>
        </div>
    );
};

export default TextPanel;