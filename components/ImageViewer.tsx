/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef } from 'react';
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
    } = useEditor();

    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const textOverlayRef = useRef<HTMLDivElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    
    const cssFilter = hasLocalAdjustments ? buildFilterString(localFilters) : 'none';
    const pixelFontSize = imgRef.current ? (textToolState.fontSize / 100) * imgRef.current.clientWidth : 30;

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

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!image || !detectedObjects) {
            return;
        }
        
        canvas.width = image.clientWidth;
        canvas.height = image.clientHeight;
        
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
                document.body.style.cursor = 'default';
            }
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const parentRect = container.getBoundingClientRect();
            
            const mousePercX = ((e.clientX - parentRect.left) / parentRect.width) * 100;
            const mousePercY = ((e.clientY - parentRect.top) / parentRect.height) * 100;

            const newPercX = mousePercX - offset.x;
            const newPercY = mousePercY - offset.y;
            
            const clampedX = Math.max(0, Math.min(100, newPercX));
            const clampedY = Math.max(0, Math.min(100, newPercY));
            
            setTextToolState(prev => ({ ...prev, position: { x: clampedX, y: clampedY } }));
        };

        textElement.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mousemove', onMouseMove);

        return () => {
            textElement.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('mousemove', onMouseMove);
            if (document.body) {
                document.body.style.cursor = 'default';
            }
        };
    }, [activeTool, setTextToolState, textToolState.position.x, textToolState.position.y]);

    const handleOverlayMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!detectedObjects || !imgRef.current) return;
        const canvas = overlayCanvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const scaleX = canvas.width / imgRef.current.naturalWidth;
        const scaleY = canvas.height / imgRef.current.naturalHeight;

        let foundObject: DetectedObject | null = null;
        for (let i = detectedObjects.length - 1; i >= 0; i--) {
            const obj = detectedObjects[i];
            const { box } = obj;
            const x = box.x_min * imgRef.current.naturalWidth * scaleX;
            const y = box.y_min * imgRef.current.naturalHeight * scaleY;
            const width = (box.x_max - box.x_min) * imgRef.current.naturalWidth * scaleX;
            const height = (box.y_max - box.y_min) * imgRef.current.naturalHeight * scaleY;

            if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
                foundObject = obj;
                break;
            }
        }
        if (foundObject !== highlightedObject) {
            setHighlightedObject(foundObject);
        }
    };

    const handleOverlayClick = () => {
        if (highlightedObject) {
            handleSelectObject(highlightedObject);
        }
    };

    if (generatedVideoUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center p-4">
                <video
                    key={generatedVideoUrl}
                    src={generatedVideoUrl}
                    controls
                    autoPlay
                    loop
                    className="max-w-full max-h-full rounded-lg shadow-2xl"
                />
            </div>
        );
    }

    if (!currentImageUrl) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <p className="text-gray-500">A pré-visualização aparecerá aqui.</p>
            </div>
        );
    }
    
    const isCropping = activeTool === 'crop';

    return (
        <div
            className="w-full h-full flex items-center justify-center overflow-hidden relative select-none"
            onWheel={activeTool !== 'crop' ? handleWheel : undefined}
        >
            {isLoading && (
                <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                    <Spinner />
                    <p className="text-gray-300 text-lg font-semibold animate-pulse">{loadingMessage || 'A processar...'}</p>
                </div>
            )}
            
            <div
                className={`relative transition-transform duration-200 ease-out ${isPanModeActive ? (isCurrentlyPanning ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
                style={{
                    transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onMouseDown={handlePanStart}
            >
                <div ref={imageContainerRef} className="relative max-w-full max-h-full flex items-center justify-center">
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspect}
                        disabled={!isCropping}
                        className="max-w-full max-h-full"
                    >
                        <img
                            ref={imgRef}
                            src={currentImageUrl}
                            alt="Imagem atual"
                            className="object-contain max-w-full max-h-full"
                            style={{ 
                                imageRendering: 'pixelated',
                                filter: cssFilter,
                            }}
                            onLoad={() => {
                                const event = new Event('resize');
                                window.dispatchEvent(event);
                            }}
                        />
                    </ReactCrop>

                    <canvas
                        ref={canvasRef}
                        width={imgRef.current?.naturalWidth}
                        height={imgRef.current?.naturalHeight}
                        className="absolute top-0 left-0 w-full h-full opacity-50"
                        style={{ 
                            pointerEvents: (isPanModeActive || activeTool !== 'generativeEdit') ? 'none' : 'auto',
                            cursor: activeTool === 'generativeEdit' ? 'crosshair' : 'default',
                        }}
                        onMouseDown={startDrawing}
                        onMouseUp={stopDrawing}
                        onMouseMove={draw}
                        onMouseLeave={stopDrawing}
                    />

                    <canvas
                        ref={overlayCanvasRef}
                        className="absolute top-0 left-0 w-full h-full"
                        style={{ 
                            pointerEvents: (isPanModeActive || !detectedObjects) ? 'none' : 'auto',
                            cursor: highlightedObject ? 'pointer' : 'default'
                        }}
                        onMouseMove={handleOverlayMouseMove}
                        onClick={handleOverlayClick}
                        onMouseLeave={() => setHighlightedObject(null)}
                    />

                    {activeTool === 'text' && (
                        <div
                            ref={textOverlayRef}
                            className="absolute cursor-move z-20"
                            style={{
                                left: `${textToolState.position.x}%`,
                                top: `${textToolState.position.y}%`,
                                transform: `translateX(${textToolState.align === 'center' ? '-50%' : textToolState.align === 'right' ? '-100%' : '0%'})`,
                                fontFamily: textToolState.fontFamily,
                                fontSize: `${pixelFontSize}px`,
                                color: textToolState.color,
                                fontWeight: textToolState.bold ? 'bold' : 'normal',
                                fontStyle: textToolState.italic ? 'italic' : 'normal',
                                textAlign: textToolState.align,
                                whiteSpace: 'pre',
                                textShadow: '0px 0px 5px black, 0px 0px 5px black',
                                pointerEvents: isPanModeActive ? 'none' : 'auto',
                            }}
                        >
                            {textToolState.content}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageViewer;