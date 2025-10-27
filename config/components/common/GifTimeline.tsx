/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useEditor } from '../../../context/EditorContext';
import { frameToDataURL } from '../../../utils/imageUtils';
import LazyIcon from '../LazyIcon';

const GifTimeline: React.FC = () => {
    const { gifFrames, currentFrameIndex, setCurrentFrameIndex } = useEditor();
    const [isPlaying, setIsPlaying] = useState(false);
    const timelineRef = useRef<HTMLDivElement>(null);
    const frameRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying, gifFrames.length]);

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
                {isPlaying ? <LazyIcon name="PauseIcon" className="w-6 h-6 text-white" /> : <LazyIcon name="PlayIcon" className="w-6 h-6 text-white" />}
            </button>
            <div className="text-sm font-mono text-white w-24 text-center border-l border-r border-gray-600 px-2">
                Frame {currentFrameIndex + 1} / {gifFrames.length}
            </div>
            <div ref={timelineRef} className="flex-grow flex items-center gap-2 overflow-x-auto overflow-y-hidden h-20 scrollbar-thin">
                {gifFrames.map((frame, index) => {
                    // Memoize a URL de dados para evitar recalcular a cada renderização
                    const dataUrl = useMemo(() => frameToDataURL(frame.imageData), [frame.imageData]);
                    
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