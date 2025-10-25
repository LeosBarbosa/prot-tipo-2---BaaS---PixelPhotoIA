/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import LazyIcon from '../LazyIcon';
import TipBox from '../common/TipBox';

const textures = [
  { name: 'Grão de Filme', url: 'https://storage.googleapis.com/maker-studio-tools-us-east1/textures/film-grain.png', blendMode: 'overlay' as const },
  { name: 'Papel', url: 'https://storage.googleapis.com/maker-studio-tools-us-east1/textures/paper.png', blendMode: 'multiply' as const },
  { name: 'Tecido', url: 'https://storage.googleapis.com/maker-studio-tools-us-east1/textures/fabric.png', blendMode: 'overlay' as const },
  { name: 'Poeira', url: 'https://storage.googleapis.com/maker-studio-tools-us-east1/textures/dust.png', blendMode: 'screen' as const },
];

const TexturePanel: React.FC = () => {
    const { 
        isLoading, 
        texturePreview, 
        setTexturePreview, 
        handleApplyTexture 
    } = useEditor();
    
    const [opacity, setOpacity] = useState(texturePreview?.opacity ?? 0.5);
    const [selectedTextureUrl, setSelectedTextureUrl] = useState<string | null>(texturePreview?.url ?? null);

    const handleSelectTexture = (texture: typeof textures[0]) => {
        setSelectedTextureUrl(texture.url);
        setTexturePreview({ url: texture.url, opacity, blendMode: texture.blendMode });
    };

    const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newOpacity = parseFloat(e.target.value);
        setOpacity(newOpacity);
        if (selectedTextureUrl) {
            const currentTexture = textures.find(t => t.url === selectedTextureUrl);
            if (currentTexture) {
                setTexturePreview({ url: selectedTextureUrl, opacity: newOpacity, blendMode: currentTexture.blendMode });
            }
        }
    };
    
    const handleApply = () => {
        if (texturePreview) {
            handleApplyTexture();
        }
    };
    
    const handleReset = () => {
        setTexturePreview(null);
        setSelectedTextureUrl(null);
        setOpacity(0.5);
    };
    
    // Clear preview when component unmounts without applying
    useEffect(() => {
        return () => {
            setTexturePreview(null);
        }
    }, [setTexturePreview]);

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Texturas</h3>
                <p className="text-sm text-gray-400 -mt-1">Adicione um toque final à sua imagem.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {textures.map((texture) => (
                    <button
                        key={texture.name}
                        onClick={() => handleSelectTexture(texture)}
                        disabled={isLoading}
                        className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedTextureUrl === texture.url ? 'border-blue-500 scale-105' : 'border-transparent hover:border-gray-500'}`}
                    >
                        <img src={texture.url} alt={texture.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                        <p className="absolute bottom-1 left-0 right-0 text-white text-sm font-bold text-center drop-shadow-md">{texture.name}</p>
                    </button>
                ))}
            </div>
            
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300 flex justify-between">
                    <span>Opacidade</span>
                    <span className="text-white font-mono">{Math.round(opacity * 100)}%</span>
                </label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={opacity}
                    onChange={handleOpacityChange}
                    disabled={isLoading || !selectedTextureUrl}
                    className="w-full"
                />
            </div>

            <TipBox>
                Use o controle de opacidade para aplicar texturas sutis que não sobrecarreguem a imagem original. 'Overlay' e 'Screen' são ótimos modos de mesclagem para começar.
            </TipBox>
            
            <div className="flex gap-2 mt-2">
                <button
                    onClick={handleReset}
                    disabled={isLoading || !texturePreview}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                    Resetar
                </button>
                <button
                    onClick={handleApply}
                    disabled={isLoading || !texturePreview}
                    className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:cursor-not-allowed"
                >
                    <LazyIcon name="TextureIcon" className="w-5 h-5" />
                    Aplicar
                </button>
            </div>
        </div>
    );
};

export default TexturePanel;