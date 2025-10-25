/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { parseGIF, decompressFrames } from 'gifuct-js';
import { type GifFrame } from '../types';

export const parseGif = async (gifFile: File): Promise<GifFrame[]> => {
    const buffer = await gifFile.arrayBuffer();
    const parsedGif = parseGIF(buffer);
    const decompressedFrames = decompressFrames(parsedGif, true);

    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let lastFrameImageData: ImageData | null = null;

    const processedFrames: GifFrame[] = [];

    for (const frame of decompressedFrames) {
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.width = parsedGif.lsd.width;
            canvas.height = parsedGif.lsd.height;
            ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) throw new Error("Could not create canvas context for GIF processing");
            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Disposal method 2: Restore to background color (transparent)
        if (frame.disposalType === 2 && lastFrameImageData) {
             ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
        }
        
        // Disposal method 3: Restore to previous
        if (frame.disposalType === 3 && lastFrameImageData) {
            ctx.putImageData(lastFrameImageData, 0, 0);
        }

        const frameImageData = ctx.createImageData(frame.dims.width, frame.dims.height);
        frameImageData.data.set(frame.patch);
        ctx.putImageData(frameImageData, frame.dims.left, frame.dims.top);

        const fullImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Save the current state for disposal method 3
        lastFrameImageData = fullImageData;

        processedFrames.push({
            imageData: { data: new Uint8ClampedArray(fullImageData.data), width: fullImageData.width, height: fullImageData.height },
            delay: frame.delay,
        });
    }

    return processedFrames;
};