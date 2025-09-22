/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactCrop from 'react-image-crop';
import { useEditor } from '../context/EditorContext';
import Spinner from './Spinner';
import { type DetectedObject } from '../types';

const ImageViewer: React.FC = () => {
    const {
        activeTool,
        currentImage,
        currentImageUrl,
        imgRef,
        canvasRef,
        isLoading,
        loadingMessage,
        zoom,
        panOffset,
        handleWheel,
        handlePanStart,
        isPanModeActive,
        isCurrentlyPanning,
        crop,
        setCrop,
        completedCrop,
        setCompletedCrop,
        aspect,
        startDrawing,
        stopDrawing,
        draw,
        generatedVideoUrl,
        detectedObjects,
        highlightedObject,
        setHighlightedObject,
        handleSelectObject,
        localFilters,
        hasLocalAdjustments,
        buildFilterString,
        textToolState,
        setTextToolState,
        isGif,
        gifFrames,
        setCurrentFrameIndex
    } = useEditor();

    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const textOverlayRef = useRef<HTMLDivElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    // FIX: Corrigida a inicialização do hook useRef. O erro "Expected 1 arguments, but got 0" provavelmente apontava para esta linha, já que useRef foi chamado sem um valor inicial. Inicializá-lo com `null` resolve o problema.
    const animationFrameRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number>(0);
    const playbackFrameIndexRef = useRef<number>(0);
    
    const cssFilter = hasLocalAdjustments ? buildFilterString(localFilters) : 'none';
    const pixelFontSize = imgRef.current ? (textToolState.fontSize / 100) * imgRef.current.clientWidth : 30;

    const displayedImageUrl = useMemo(() => {
        if (isGif && isPlaying && gifFrames.length > 0) {
            const frameData = gifFrames[playbackFrameIndexRef.current]?.imageData;
            if (frameData) {
                const canvas = document.createElement('canvas');
                canvas.width = frameData.width;
                canvas.height = frameData.height;
                canvas.getContext('2d')?.putImageData(frameData, 0, 0);
                return canvas.toDataURL('image/png');
            }
        }
        return currentImageUrl;
    }, [isPlaying, currentImageUrl, isGif, gifFrames]);


    // Reset crop when image changes
    useEffect(() => {
        setCompletedCrop(undefined);
        setCrop(undefined);
    }, [currentImage, setCompletedCrop, setCrop]);

    // Effect to draw bounding boxes
    useEffect(() => {
        const canvas = overlayCanvasRef.current;
        const image = imgRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        const resizeObserver = new ResizeObserver(() => {
            if (!image) return;
            canvas.width = image.clientWidth;
            canvas.height = image.clientHeight;
            drawBoxes();
        });

        if (image) {
            resizeObserver.observe(image);
        }

        const drawBoxes = () => {
            if (!image || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!detectedObjects) return;
            
            const scaleX = image.clientWidth / image.naturalWidth;
            const scaleY = image.clientHeight / image.naturalHeight;

            detectedObjects.forEach(obj => {
                const isHighlighted = obj === highlightedObject;
                const { box } = obj;
                const x = box.x_min * image.naturalWidth * scaleX;
                const y = box.y_min * image.naturalHeight * scaleY;
                const width = (box.x_max - box.x_min) * image.naturalWidth * scaleX;
                const height = (box.y_max - box.y_min) * image.naturalHeight * scaleY;

                ctx.strokeStyle = isHighlighted ? '#3B82F6' : 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = isHighlighted ? 3 : 2;
                ctx.strokeRect(x, y, width, height);
                
                const labelText = obj.label;
                ctx.font = 'bold 14px sans-serif';
                const textMetrics = ctx.measureText(labelText);
                const textWidth = textMetrics.width;
                const textHeight = 14;
                
                ctx.fillStyle = isHighlighted ? '#3B82F6' : 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(x, y - textHeight - 4, textWidth + 8, textHeight + 4);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(labelText, x + 4, y - 4);
            });
        };
        
        drawBoxes();
        
        return () => {
            if (image) {
                resizeObserver.unobserve(image);
            }
        }

    }, [detectedObjects, highlightedObject, imgRef, currentImageUrl]);

    // Effect to handle text dragging
    useEffect(() => {
        const textElement = textOverlayRef.current;
        const container = imageContainerRef.current;
        if (!textElement || !container || activeTool !== 'text') return;

        let isDragging = false;
        let offset = { x: 0, y: 0 };

        const onMouseDown = (e: MouseEvent) => {
            isDragging = true;
            const parentRect = container.getBoundingClientRect();
            
            const mousePercX = ((e.clientX - parentRect.left) / parentRect.width) * 100;
            const mousePercY = ((e.clientY - parentRect.top) / parentRect.height) * 100;
            
            offset = {
                x: mousePercX - textToolState.position.x,
                y: mousePercY - textToolState.position.y,
            };

            document.body.style.cursor = 'grabbing';
            e.stopPropagation();
        };

        const onMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.cursor = '';
            }
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const parentRect = container.getBoundingClientRect();
            const newX = ((e.clientX - parentRect.left) / parentRect.width) * 100 - offset.x;
            const newY = ((e.clientY - parentRect.top) / parentRect.height) * 100 - offset.y;
            
            setTextToolState(prev => ({...prev, position: {
                x: Math.max(0, Math.min(100, newX)),
                y: Math.max(0, Math.min(100, newY)),
            }}));
        };
        
        textElement.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mousemove', onMouseMove);

        return () => {
            textElement.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('mousemove', onMouseMove);
            document.body.style.cursor = '';
        }

    }, [activeTool, textToolState, setTextToolState]);


    const isCropping = activeTool === 'crop';
    const isGenerativeEdit = activeTool === 'generativeEdit';
    const isDrawingOnCanvas = isGenerativeEdit && !detectedObjects;

    return (
        <div
            ref={imageContainerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            onWheel={handleWheel}
            onMouseDown={handlePanStart}
            style={{ cursor: isPanModeActive ? (isCurrentlyPanning ? 'grabbing' : 'grab') : 'default' }}
        >
            {isLoading && (
                <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                    <Spinner />
                    <p className="text-gray-300 text-lg font-semibold animate-pulse">{loadingMessage || 'Processando...'}</p>
                </div>
            )}
            
            {generatedVideoUrl && (
                <div className="w-full h-full flex items-center justify-center z-10">
                    <video src={generatedVideoUrl} controls autoPlay loop className="max-w-full max-h-full rounded-lg" />
                </div>
            )}
            
            {!generatedVideoUrl && currentImageUrl && (
                 <div
                    className="relative transition-transform duration-200"
                    style={{
                        transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ReactCrop
                        crop={crop}
                        onChange={c => setCrop(c)}
                        onComplete={c => setCompletedCrop(c)}
                        aspect={aspect}
                        disabled={!isCropping || isLoading}
                        className={isCropping ? 'ReactCrop--active' : ''}
                    >
                         <img
                            ref={imgRef}
                            src={displayedImageUrl!}
                            alt="Imagem do Editor"
                            className="max-w-full max-h-full object-contain block"
                            style={{ 
                                filter: cssFilter,
                                pointerEvents: isPanModeActive ? 'none' : 'auto'
                            }}
                        />
                    </ReactCrop>
                    
                     {isDrawingOnCanvas && (
                        <canvas
                            ref={canvasRef}
                            width={imgRef.current?.naturalWidth}
                            height={imgRef.current?.naturalHeight}
                            onMouseDown={startDrawing}
                            onMouseUp={stopDrawing}
                            onMouseMove={draw}
                            onMouseLeave={stopDrawing}
                            className="absolute top-0 left-0 w-full h-full opacity-50"
                            style={{ cursor: 'crosshair', pointerEvents: isLoading ? 'none' : 'auto' }}
                        />
                    )}

                    {detectedObjects && (
                        <canvas
                            ref={overlayCanvasRef}
                            className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
                        />
                    )}

                    {activeTool === 'text' && (
                         <div
                            ref={textOverlayRef}
                            className="absolute z-20 select-none p-2"
                            style={{
                                top: `${textToolState.position.y}%`,
                                left: `${textToolState.position.x}%`,
                                transform: `translate(-${textToolState.align === 'center' ? '50' : textToolState.align === 'right' ? '100' : '0'}%, 0%)`,
                                fontFamily: textToolState.fontFamily,
                                fontSize: `${pixelFontSize}px`,
                                color: textToolState.color,
                                textAlign: textToolState.align,
                                fontWeight: textToolState.bold ? 'bold' : 'normal',
                                fontStyle: textToolState.italic ? 'italic' : 'normal',
                                cursor: 'grab',
                                textShadow: `
                                    -1px -1px 0 #000,  
                                     1px -1px 0 #000,
                                    -1px  1px 0 #000,
                                     1px  1px 0 #000
                                `
                            }}
                        >
                            {textToolState.content.split('\n').map((line, index) => (
                                <span key={index} style={{ display: 'block' }}>{line || ' '}</span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ImageViewer;