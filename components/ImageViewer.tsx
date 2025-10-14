/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
// FIX: Correct import path
import { useEditor } from '../context/EditorContext';
// FIX: Correct import path
import { type DetectedObject } from '../types';
import ComparisonSlider from './ComparisonSlider';

// Função auxiliar para encontrar o maior divisor comum para calcular a proporção
const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
};

const ImageViewer: React.FC = () => {
    const {
        activeTab,
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
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
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
        brushSize,
    } = useEditor();

    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const textOverlayRef = useRef<HTMLDivElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const [cropDimensions, setCropDimensions] = useState<string | null>(null);
    const [brushPreview, setBrushPreview] = useState<{ x: number; y: number; size: number } | null>(null);
    const [isHoveringObject, setIsHoveringObject] = useState(false);
    const [textBbox, setTextBbox] = useState({ width: 0, height: 0, x: 0, y: 0 });

    const cssFilter = hasLocalAdjustments ? buildFilterString(localFilters) : 'none';
    const displayedImageUrl = currentImageUrl;

    // Reset crop when image changes
    useEffect(() => {
        setCompletedCrop(undefined);
        setCrop(undefined);
    }, [baseImageFile, setCompletedCrop, setCrop]);
    
    const getTextBoundingBox = useCallback((ctx: CanvasRenderingContext2D, image: HTMLImageElement) => {
        const { content, fontFamily, fontSize, align, bold, italic, position } = textToolState;
        const pixelFontSize = (fontSize / 100) * image.clientWidth;
        ctx.font = `${italic ? 'italic' : ''} ${bold ? 'bold' : ''} ${pixelFontSize}px ${fontFamily}`;
        ctx.textAlign = align;

        const lines = content.split('\n');
        const lineHeight = pixelFontSize * 1.2;
        
        let maxWidth = 0;
        lines.forEach(line => {
            const metrics = ctx.measureText(line || ' ');
            if (metrics.width > maxWidth) maxWidth = metrics.width;
        });

        const totalHeight = lines.length * lineHeight;
        const canvasX = (position.x / 100) * image.clientWidth;
        
        let x;
        if (align === 'center') x = canvasX - maxWidth / 2;
        else if (align === 'right') x = canvasX - maxWidth;
        else x = canvasX;
        
        const y = (position.y / 100) * image.clientHeight;

        return { x, y, width: maxWidth, height: totalHeight };
    }, [textToolState]);


    // Effect to draw bounding boxes or text on the overlay canvas
    useEffect(() => {
        const canvas = overlayCanvasRef.current;
        const image = imgRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas || !image) return;

        const drawOnCanvas = () => {
            if (canvas.width !== image.clientWidth || canvas.height !== image.clientHeight) {
                canvas.width = image.clientWidth;
                canvas.height = image.clientHeight;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (detectedObjects) {
                const scaleX = image.clientWidth / image.naturalWidth;
                const scaleY = image.clientHeight / image.naturalHeight;

                detectedObjects.forEach(obj => {
                    const isHighlighted = obj === highlightedObject;
                    const { box } = obj;
                    const x = box.x_min * image.naturalWidth * scaleX;
                    const y = box.y_min * image.naturalHeight * scaleY;
                    const width = (box.x_max - box.x_min) * image.naturalWidth * scaleX;
                    const height = (box.y_max - box.y_min) * image.naturalHeight * scaleY;

                    ctx.strokeStyle = isHighlighted ? '#3B82F6' : 'rgba(255, 255, 255, 0.9)';
                    ctx.lineWidth = isHighlighted ? 4 : 2;
                    ctx.setLineDash(isHighlighted ? [] : [6, 4]);
                    ctx.strokeRect(x, y, width, height);
                    ctx.setLineDash([]);
                    
                    const labelText = obj.label;
                    ctx.font = 'bold 14px sans-serif';
                    const textMetrics = ctx.measureText(labelText);
                    ctx.fillStyle = isHighlighted ? '#3B82F6' : 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(x, y - 18, textMetrics.width + 8, 18);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillText(labelText, x + 4, y - 4);
                });
            } else if (activeTab === 'text') {
                const { content, fontFamily, fontSize, color, align, bold, italic } = textToolState;
                const pixelFontSize = (fontSize / 100) * image.clientWidth;

                const bbox = getTextBoundingBox(ctx, image);
                setTextBbox(bbox);

                ctx.fillStyle = color;
                ctx.font = `${italic ? 'italic' : ''} ${bold ? 'bold' : ''} ${pixelFontSize}px ${fontFamily}`;
                ctx.textAlign = align;

                const lines = content.split('\n');
                const lineHeight = pixelFontSize * 1.2;

                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                
                lines.forEach((line, index) => {
                    const currentY = bbox.y + ((index + 1) * lineHeight) - (lineHeight * 0.2);
                    ctx.strokeText(line || ' ', bbox.x + (align === 'center' ? bbox.width / 2 : align === 'right' ? bbox.width : 0) , currentY);
                    ctx.fillText(line || ' ', bbox.x + (align === 'center' ? bbox.width / 2 : align === 'right' ? bbox.width : 0) , currentY);
                });
            }
        };

        const resizeObserver = new ResizeObserver(drawOnCanvas);
        if (image) resizeObserver.observe(image);
        drawOnCanvas();

        return () => {
            if (image) resizeObserver.unobserve(image);
        }

    }, [detectedObjects, highlightedObject, imgRef, currentImageUrl, activeTab, textToolState, getTextBoundingBox]);


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

    const handleMouseMoveForBrush = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDrawingOnCanvas || isPanModeActive || isCurrentlyPanning) {
            if (brushPreview) setBrushPreview(null);
            return;
        }
        const image = imgRef.current;
        if (!image) {
            setBrushPreview(null);
            return;
        }

        const containerRect = e.currentTarget.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();

        const scale = imageRect.width / image.naturalWidth;
        const previewSize = brushSize * scale;

        const x = e.clientX - containerRect.left;
        const y = e.clientY - containerRect.top;
        
        if (
            e.clientX >= imageRect.left &&
            e.clientX <= imageRect.right &&
            e.clientY >= imageRect.top &&
            e.clientY <= imageRect.bottom
        ) {
            setBrushPreview({ x, y, size: previewSize });
        } else {
            setBrushPreview(null);
        }
    };

    const handleMouseLeaveForBrush = () => {
        setBrushPreview(null);
    };

    const cursorStyle = useMemo(() => {
        if (isPanModeActive) return isCurrentlyPanning ? 'grabbing' : 'grab';
        if (isDrawingOnCanvas) return 'none'; // Hide cursor when brush preview is active
        return 'default';
    }, [isPanModeActive, isCurrentlyPanning, isDrawingOnCanvas]);


    const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (imageContainerRef.current) {
            const rect = imageContainerRef.current.getBoundingClientRect();
            handleTouchMove(e, rect);
        }
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = overlayCanvasRef.current;
        const image = imgRef.current;
        if (!canvas || !image || !detectedObjects || detectedObjects.length === 0) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const scaleX = image.naturalWidth / image.clientWidth;
        const scaleY = image.naturalHeight / image.clientHeight;
        const naturalClickX = clickX * scaleX;
        const naturalClickY = clickY * scaleY;

        for (let i = detectedObjects.length - 1; i >= 0; i--) {
            const obj = detectedObjects[i];
            const { box } = obj;
            const box_x_min = box.x_min * image.naturalWidth;
            const box_y_min = box.y_min * image.naturalHeight;
            const box_x_max = box.x_max * image.naturalWidth;
            const box_y_max = box.y_max * image.naturalHeight;

            if (naturalClickX >= box_x_min && naturalClickX <= box_x_max && naturalClickY >= box_y_min && naturalClickY <= box_y_max) {
                handleSelectObject(obj);
                return;
            }
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = overlayCanvasRef.current;
        const image = imgRef.current;
        if (!canvas || !image || !detectedObjects || detectedObjects.length === 0) {
            setIsHoveringObject(false);
            setHighlightedObject(null);
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const moveX = e.clientX - rect.left;
        const moveY = e.clientY - rect.top;
        const scaleX = image.naturalWidth / image.clientWidth;
        const scaleY = image.naturalHeight / image.clientHeight;
        const naturalMoveX = moveX * scaleX;
        const naturalMoveY = moveY * scaleY;

        let hovering = false;
        let objectToHighlight: DetectedObject | null = null;
        for (let i = detectedObjects.length - 1; i >= 0; i--) {
            const obj = detectedObjects[i];
            const { box } = obj;
            const box_x_min = box.x_min * image.naturalWidth;
            const box_y_min = box.y_min * image.naturalHeight;
            const box_x_max = box.x_max * image.naturalWidth;
            const box_y_max = box.y_max * image.naturalHeight;
            if (naturalMoveX >= box_x_min && naturalMoveX <= box_x_max && naturalMoveY >= box_y_min && naturalMoveY <= box_y_max) {
                hovering = true;
                objectToHighlight = obj;
                break;
            }
        }
        setHighlightedObject(objectToHighlight);
        setIsHoveringObject(hovering);
    };

    return (
        <div
            ref={imageContainerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            onWheel={handleWheel}
            onMouseDown={handlePanStart}
            onTouchStart={handleTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: cursorStyle }}
            onMouseMove={handleMouseMoveForBrush}
            onMouseLeave={handleMouseLeaveForBrush}
        >
            {generatedVideoUrl && (
                <div className="w-full h-full flex items-center justify-center z-10">
                    <video src={generatedVideoUrl} controls autoPlay loop className="max-w-full max-h-full rounded-lg" />
                </div>
            )}
            
            {!generatedVideoUrl && currentImageUrl && (
                 <div
                    className="relative"
                    style={{
                        transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                        willChange: 'transform',
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
                                decoding="async"
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
                            style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
                        />
                    )}

                    {/* Unified overlay for boxes and text */}
                    <canvas
                        ref={overlayCanvasRef}
                        className="absolute top-0 left-0 w-full h-full z-10 pointer-events-auto"
                        style={{
                            cursor: isHoveringObject ? 'pointer' : isTextToolActive ? 'grab' : 'default',
                            pointerEvents: (detectedObjects || isTextToolActive) && !showComparisonSlider ? 'auto' : 'none'
                        }}
                        onClick={handleCanvasClick}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseLeave={() => { setIsHoveringObject(false); if(activeTab !== 'text') setHighlightedObject(null); }}
                    />

                    {/* Invisible drag handle for text */}
                    {isTextToolActive && !showComparisonSlider && (
                         <div
                            ref={textOverlayRef}
                            className="absolute z-20 select-none"
                            style={{
                                top: `${textBbox.y}px`,
                                left: `${textBbox.x}px`,
                                width: `${textBbox.width}px`,
                                height: `${textBbox.height}px`,
                                cursor: 'grab',
                            }}
                        />
                    )}
                </div>
            )}
             {brushPreview && (
                <div
                    className="absolute rounded-full border-2 border-dashed border-white bg-white/20 pointer-events-none"
                    style={{
                        left: `${brushPreview.x}px`,
                        top: `${brushPreview.y}px`,
                        width: `${brushPreview.size}px`,
                        height: `${brushPreview.size}px`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 20,
                    }}
                    aria-hidden="true"
                />
            )}
        </div>
    );
};

export default ImageViewer;
