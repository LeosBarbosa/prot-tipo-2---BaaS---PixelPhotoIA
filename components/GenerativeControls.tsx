/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { type PixelCrop } from 'react-image-crop';
import { MagicWandIcon } from './icons';

interface GenerativeControlsProps {
    crop: PixelCrop;
    imageRef: React.RefObject<HTMLImageElement>;
    guidance: number;
    setGuidance: (value: number) => void;
    strength: number;
    setStrength: (value: number) => void;
}

const GenerativeControls: React.FC<GenerativeControlsProps> = ({
    crop,
    imageRef,
    guidance,
    setGuidance,
    strength,
    setStrength,
}) => {
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        if (crop && imageRef.current) {
            const img = imageRef.current;
            const scaleX = img.width / img.naturalWidth;
            const scaleY = img.height / img.naturalHeight;

            const top = crop.y * scaleY + crop.height * scaleY + 10;
            const left = crop.x * scaleX;
            const width = crop.width * scaleX;
            
            const containerRect = img.parentElement?.getBoundingClientRect();
            const controlHeight = 80; 
            
            const adjustedTop = (containerRect && top + controlHeight > containerRect.height) 
                ? (crop.y * scaleY - controlHeight - 10)
                : top;

            setPosition({ top: Math.max(0, adjustedTop), left, width: Math.max(width, 200) });
        }
    }, [crop, imageRef]);

    if (!crop.width) return null;

    return (
        <div 
             style={{ 
                 position: 'absolute', 
                 top: `${position.top}px`, 
                 left: `${position.left}px`, 
                 width: `${position.width}px`,
                 transform: `translateX(-${Math.max(0, (position.width - crop.width * (imageRef.current?.width || 0) / (imageRef.current?.naturalWidth || 1) )/2)}px)`
             }}
             className="bg-black/80 p-3 rounded-lg backdrop-blur-sm flex flex-col gap-3 animate-fade-in z-10 shadow-2xl border border-gray-600"
             onClick={e => e.stopPropagation()} 
        >
            <div className="flex items-center gap-3 text-sm text-gray-300">
                <MagicWandIcon className="w-5 h-5 text-blue-400 flex-shrink-0" title="Fidelidade ao Prompt" />
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={guidance} 
                    onChange={e => setGuidance(Number(e.target.value))} 
                    className="w-full" 
                />
            </div>
             <div className="flex items-center gap-3 text-sm text-gray-300">
                 <span className="w-5 h-5 text-gray-400 flex-shrink-0 font-semibold text-center" title="Força da Alteração">F</span>
                 <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={strength} 
                    onChange={e => setStrength(Number(e.target.value))} 
                    className="w-full" 
                />
            </div>
        </div>
    );
};

export default GenerativeControls;