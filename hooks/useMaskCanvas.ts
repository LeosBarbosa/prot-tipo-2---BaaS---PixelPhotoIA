/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useCallback } from 'react';

/**
 * @description Manages the state and drawing logic for a mask canvas.
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef - A React ref object pointing to the canvas element.
 * @param {number} brushSize - The current size of the drawing brush.
 * @returns {object} An object containing the mask state and drawing handlers.
 * @property {string | null} maskDataUrl - The data URL of the current mask.
 * @property {React.Dispatch<React.SetStateAction<string | null>>} setMaskDataUrl - Setter for the mask data URL.
 * @property {() => void} clearMask - Clears the canvas and the mask state.
 * @property {(e: React.MouseEvent<HTMLCanvasElement>) => void} startDrawing - The onMouseDown event handler.
 * @property {() => void} stopDrawing - The onMouseUp/onMouseLeave event handler.
 * @property {(e: React.MouseEvent<HTMLCanvasElement>) => void} draw - The onMouseMove event handler.
 */
export const useMaskCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>, brushSize: number) => {
    const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number, y: number } | null>(null);

    const getCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>): { x: number, y: number } | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }, [canvasRef]);

    const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCoords(e);
        if (!coords) return;
        isDrawing.current = true;
        lastPos.current = coords;
        
        // Draw a single dot if the user just clicks
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }

    }, [getCoords, brushSize, canvasRef]);

    const stopDrawing = useCallback(() => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const buffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
            setMaskDataUrl(buffer.some(color => color !== 0) ? canvas.toDataURL() : null);
        }
        lastPos.current = null;
    }, [canvasRef]);

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing.current) return;
        const coords = getCoords(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (!coords || !ctx || !lastPos.current) return;
        ctx.beginPath();
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        ctx.closePath();
        lastPos.current = coords;
    }, [getCoords, canvasRef, brushSize]);

    const clearMask = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
        setMaskDataUrl(null);
    }, [canvasRef]);

    return {
        maskDataUrl,
        setMaskDataUrl,
        clearMask,
        startDrawing,
        stopDrawing,
        draw,
    };
};