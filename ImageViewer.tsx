/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import { useEditor } from '../context/EditorContext';
import { type DetectedObject } from '../types';
import ComparisonSlider from './ComparisonSlider';

// Função auxiliar para encontrar o maior divisor comum para calcular a proporção
const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
};

const ImageViewer: React.FC = () => {
    const {
        activeTool,
        activeTab,
        // FIX: Property 'currentImage' does not exist on type 'EditorContextType'. Replaced with 'baseImageFile'.
        baseImageFile,
        currentImageUrl,
        originalImageUrl,
        imgRef,
        canvasRef,
        isLoading,
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
        isInlineComparisonActive,
        texturePreview,
    } = useEditor();

    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const textOverlayRef = useRef<HTMLDivElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const [cropDimensions, setCropDimensions] = useState<string | null>(null);

    const cssFilter = hasLocalAdjustments ? buildFilterString(localFilters) : 'none';
    const pixelFontSize = imgRef.current ? (textToolState.fontSize / 100) * imgRef.current.clientWidth : 30;

    const displayedImageUrl = currentImageUrl;


    // Reset crop when image changes
    useEffect(() => {
        setCompletedCrop(undefined);
        setCrop(undefined);
    // FIX: Using 'baseImageFile' as dependency instead of the non-existent 'currentImage'.
    }, [baseImageFile, setCompletedCrop, setCrop]);

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
        if (!textElement || !container || activeTab !== 'text') return;

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

    }, [activeTab, textToolState, setTextToolState]);


    const isCropping = activeTab === 'crop';
    const isDrawingOnCanvas = ['generativeEdit', 'objectRemover', 'localAdjust'].includes(activeTab) && !detectedObjects;
    const isTextToolActive = activeTab === 'text';
    const showComparisonSlider = isInlineComparisonActive && originalImageUrl && displayedImageUrl && !isCropping;

    const handleCropChange = (c: Crop) => {
        setCrop(c);
        if (c.width && c.height) {
            const w = Math.round(c.width);
            const h = Math.round(c.height);
            const commonDivisor = gcd(w, h);
            const ratioStr = `${w / commonDivisor}:${h / commonDivisor}`;
            setCropDimensions(`${w} x ${h} (${ratioStr})`);
        } else {
            setCropDimensions(null);
        }
    };

    return (
        <div
            ref={imageContainerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            onWheel={handleWheel}
            onMouseDown={handlePanStart}
            style={{ cursor: isPanModeActive ? (isCurrentlyPanning ? 'grabbing' : 'grab') : 'default' }}
        >
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
                    {showComparisonSlider ? (
                        <ComparisonSlider
                            originalSrc={originalImageUrl!}
                            modifiedSrc={displayedImageUrl!}
                            filterStyle={cssFilter}
                        />
                    ) : (
                        <ReactCrop
                            crop={crop}
                            onChange={handleCropChange}
                            onComplete={c => setCompletedCrop(c)}
                            aspect={aspect}
                            disabled={!isCropping || isLoading}
                            className={isCropping ? 'ReactCrop--active' : ''}
                        >
                            <img
                                key={displayedImageUrl}
                                ref={imgRef}
                                src={displayedImageUrl!}
                                alt="Imagem do Editor"
                                className="max-w-full max-h-full object-contain block animate-fade-in"
                                style={{ 
                                    filter: cssFilter,
                                    pointerEvents: isPanModeActive ? 'none' : 'auto',
                                    transition: 'filter 0.15s linear',
                                    animationDuration: '300ms',
                                }}
                            />
                        </ReactCrop>
                    )}

                    {isCropping && crop?.width && cropDimensions && (
                        <div
                            className="absolute bg-black/70 text-white text-xs font-mono py-1 px-2 rounded-md pointer-events-none"
                            style={{
                                top: (crop.y || 0) + (crop.height || 0) + 10,
                                left: (crop.x || 0) + (crop.width || 0) / 2,
                                transform: 'translateX(-50%)',
                                zIndex: 10,
                            }}
                        >
                            {cropDimensions}
                        </div>
                    )}

                    {texturePreview && (
                        <div
                            className="absolute top-0 left-0 w-full h-full pointer-events-none"
                            style={{
                                backgroundImage: `url(${texturePreview.url})`,
                                backgroundSize: 'cover',
                                // FIX: Removed invalid 'source-over' check. The blendMode type already ensures valid CSS values.
                                mixBlendMode: texturePreview.blendMode,
                                opacity: texturePreview.opacity,
                            }}
                        />
                    )}
                    
                     {isDrawingOnCanvas && !showComparisonSlider && (
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

                    {detectedObjects && !showComparisonSlider && (
                        <canvas
                            ref={overlayCanvasRef}
                            className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
                        />
                    )}

                    {isTextToolActive && !showComparisonSlider && (
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