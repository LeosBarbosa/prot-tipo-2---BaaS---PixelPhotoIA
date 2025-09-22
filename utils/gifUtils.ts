/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { parseGIF, decompressFrames, ParsedFrame } from 'gifuct-js';

interface GifFrame {
    imageData: ImageData;
    delay: number;
}

export const parseGif = async (gifFile: File): Promise<GifFrame[]> => {
    const buffer = await gifFile.arrayBuffer();
    const parsedGif = parseGIF(buffer);
    const decompressedFrames = decompressFrames(parsedGif, true);

    let fullImageData: Uint8ClampedArray | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;

    const processedFrames: GifFrame[] = [];

    for (const frame of decompressedFrames) {
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.width = parsedGif.lsd.width;
            canvas.height = parsedGif.lsd.height;
            ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) throw new Error("Could not create canvas context for GIF processing");
            fullImageData = new Uint8ClampedArray(canvas.width * canvas.height * 4);
        }

        const frameImageData = ctx.createImageData(frame.dims.width, frame.dims.height);
        frameImageData.data.set(frame.patch);
        ctx.putImageData(frameImageData, frame.dims.left, frame.dims.top);

        const currentFullFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        processedFrames.push({
            imageData: currentFullFrame,
            delay: frame.delay,
        });
        
        // Handle disposal method
        if (frame.disposalType === 2) { // Restore to background color
             ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
        } else if (frame.disposalType === 3) { // Restore to previous
            // This is complex and requires saving previous states. For now, we proceed with current frame.
            // A more robust implementation would handle this.
        }
    }

    return processedFrames;
};