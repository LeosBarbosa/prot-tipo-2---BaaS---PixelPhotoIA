/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { useEditor } from '../../context/EditorContext';
import { PlayIcon, PauseIcon } from '../icons';

const GifTimeline: React.FC = () => {
    const { gifFrames, currentFrameIndex, setCurrentFrameIndex } = useEditor();
    const [isPlaying, setIsPlaying] = useState(false);
    const timelineRef = useRef<HTMLDivElement>(null);
    const frameRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // FIX: Corrigida a inicialização do hook useRef. O erro "Expected 1 arguments, but got 0" apontava para esta linha, já que useRef foi chamado sem um valor inicial. Inicializá-lo com `null` resolve o problema.
    const animationFrameRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number>(0);

    const animate = (timestamp: number) => {
        if (!isPlaying) return;

        const elapsed = timestamp - lastFrameTimeRef.current;
        const currentFrame = gifFrames[currentFrameIndex];
        const delay = currentFrame.delay || 100;

        if (elapsed > delay) {
            lastFrameTimeRef.current = timestamp;
            setCurrentFrameIndex(prev => (prev + 1) % gifFrames.length);
        }
        
        animationFrameRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        if (isPlaying) {
            lastFrameTimeRef.current = performance.now();
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }

        return () => {
            if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isPlaying, gifFrames, currentFrameIndex, setCurrentFrameIndex]);

    useEffect(() => {
        const currentFrameButton = frameRefs.current[currentFrameIndex];
        if (currentFrameButton && timelineRef.current) {
            const timelineRect = timelineRef.current.getBoundingClientRect();
            const frameRect = currentFrameButton.getBoundingClientRect();

            const isVisible = (
                frameRect.left >= timelineRect.left &&
                frameRect.right <= timelineRect.right
            );

            if (!isVisible) {
                currentFrameButton.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center',
                    block: 'nearest',
                });
            }
        }
    }, [currentFrameIndex]);


    if (gifFrames.length <= 1) return null;

    return (
        <div className="flex-shrink-0 w-full bg-gray-900/70 backdrop-blur-sm border-t border-gray-700 p-2 flex items-center gap-3">
            <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                aria-label={isPlaying ? 'Pausar animação' : 'Reproduzir animação'}
            >
                {isPlaying ? <PauseIcon className="w-6 h-6 text-white" /> : <PlayIcon className="w-6 h-6 text-white" />}
            </button>
            <div className="text-sm font-mono text-white w-24 text-center border-l border-r border-gray-600 px-2">
                Frame {currentFrameIndex + 1} / {gifFrames.length}
            </div>
            <div ref={timelineRef} className="flex-grow flex items-center gap-2 overflow-x-auto overflow-y-hidden h-20 scrollbar-thin">
                {gifFrames.map((frame, index) => {
                    const canvas = document.createElement('canvas');
                    canvas.width = frame.imageData.width;
                    canvas.height = frame.imageData.height;
                    canvas.getContext('2d')?.putImageData(frame.imageData, 0, 0);
                    const dataUrl = canvas.toDataURL('image/png');
                    
                    return (
                        <button
                            key={index}
                            ref={el => { frameRefs.current[index] = el; }}
                            onClick={() => {
                                setIsPlaying(false);
                                setCurrentFrameIndex(index);
                            }}
                            className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden transition-all border-2 ${currentFrameIndex === index ? 'border-blue-500 scale-105' : 'border-transparent hover:border-gray-500'}`}
                            aria-label={`Selecionar frame ${index + 1}`}
                        >
                            <img src={dataUrl} alt={`Frame ${index + 1}`} className="w-full h-full object-contain bg-black/20" />
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

export default GifTimeline;