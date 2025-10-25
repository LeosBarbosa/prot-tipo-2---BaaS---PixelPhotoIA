/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { type UploadProgressStatus, type GifFrame, type FilterState } from '../types';
import { type PixelCrop } from 'react-image-crop';

/**
 * Converts a data URL string into a File object.
 * @param dataurl The data URL string to convert.
 * @param filename The name of the file to be created.
 * @returns A File object.
 */
export const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

/**
 * Converts a File object into a data URL string.
 * @param file The File object to convert.
 * @returns A Promise that resolves with the data URL string.
 */
export const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

export const frameToDataURL = (frameData: GifFrame['imageData']): string => {
    const canvas = document.createElement('canvas');
    canvas.width = frameData.width;
    canvas.height = frameData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create canvas context");
    const imageData = new ImageData(frameData.data, frameData.width, frameData.height);
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
};

export const frameToFile = (frameData: GifFrame['imageData'], filename: string): File => {
    const dataUrl = frameToDataURL(frameData);
    return dataURLtoFile(dataUrl, filename);
};


export const dataURLToImageData = (dataUrl: string): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error("Could not get canvas context"));
            ctx.drawImage(img, 0, 0);
            resolve(ctx.getImageData(0, 0, img.width, img.height));
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
};

/**
 * Creates a mask image data URL from a crop selection.
 * @param crop The pixel crop object.
 * @param imageWidth The natural width of the original image.
 * @param imageHeight The natural height of the original image.
 * @returns A data URL string of the mask image.
 */
export const createMaskFromCrop = (crop: PixelCrop, imageWidth: number, imageHeight: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    // The mask should be white for the selected area and black for the rest.
    // For simplicity with the Gemini API, often just the filled area on a transparent canvas is enough.
    // Let's create a full-size mask as it's more robust.
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, imageWidth, imageHeight);
    ctx.fillStyle = 'white';
    ctx.fillRect(crop.x, crop.y, crop.width, crop.height);
    return canvas.toDataURL('image/png');
};

/**
 * Optimizes an image by resizing and compressing it in a Web Worker to avoid blocking the main thread.
 * This ensures better performance and a smoother UI during uploads.
 * @param file The image file to optimize.
 * @param onProgress A callback to report the optimization progress.
 * @param maxWidth The maximum width allowed.
 * @param maxHeight The maximum height allowed.
 * @param quality The quality for JPEG compression (0 to 1).
 * @returns A Promise that resolves with the optimized image File.
 */
export const optimizeImage = (
    file: File,
    onProgress: (status: UploadProgressStatus) => void,
    maxWidth: number = 4096,
    maxHeight: number = 4096,
    quality: number = 0.85
): Promise<File> => {
    // Modern implementation using a Web Worker
    return new Promise((resolve, reject) => {
        // Fallback for very old browsers
        if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') {
            console.warn('Web Worker or OffscreenCanvas not supported, falling back to main thread for image optimization.');
            // Fallback logic on main thread
            return new Promise((resolveLegacy, rejectLegacy) => {
                onProgress({ progress: 10, stage: 'reading' });
                const objectUrl = URL.createObjectURL(file);
                const img = new Image();
                img.src = objectUrl;
                img.onload = () => {
                    try {
                        onProgress({ progress: 50, stage: 'processing' });
                        let { width, height } = img;
                        if (width <= maxWidth && height <= maxHeight) {
                           URL.revokeObjectURL(objectUrl);
                           onProgress({ progress: 100, stage: 'done' });
                           return resolveLegacy(file);
                        }
                        if (width > height) { if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
                        } else { if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; } }
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) { URL.revokeObjectURL(objectUrl); return rejectLegacy(new Error('Não foi possível obter o contexto do canvas.')); }
                        onProgress({ progress: 75, stage: 'compressing' });
                        ctx.drawImage(img, 0, 0, width, height);
                        URL.revokeObjectURL(objectUrl);
                        canvas.toBlob( (blob) => {
                            if (!blob) return rejectLegacy(new Error('Falha ao criar blob da imagem.'));
                            const originalFilename = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                            const newFilename = `${originalFilename}.jpg`;
                            const newFile = new File([blob], newFilename, { type: 'image/jpeg' });
                            onProgress({ progress: 100, stage: 'done' });
                            resolveLegacy(newFile);
                        }, 'image/jpeg', quality);
                    } catch (e) { URL.revokeObjectURL(objectUrl); rejectLegacy(e); }
                };
                img.onerror = () => { URL.revokeObjectURL(objectUrl); rejectLegacy(new Error("Não foi possível carregar os dados da imagem.")); };
            }).then(resolve).catch(reject);
        }

        const workerScript = `
        self.onmessage = async (e) => {
            const { file, maxWidth, maxHeight, quality } = e.data;
            
            if (!file.type.startsWith('image/') || file.type === 'image/gif') {
                self.postMessage({ type: 'progress', payload: { progress: 100, stage: 'done' } });
                self.postMessage({ type: 'result', payload: file });
                self.close();
                return;
            }

            try {
                self.postMessage({ type: 'progress', payload: { progress: 10, stage: 'reading' } });
                const imageBitmap = await createImageBitmap(file);

                self.postMessage({ type: 'progress', payload: { progress: 50, stage: 'processing' } });
                
                let { width, height } = imageBitmap;

                if (width <= maxWidth && height <= maxHeight) {
                    self.postMessage({ type: 'progress', payload: { progress: 100, stage: 'done' } });
                    self.postMessage({ type: 'result', payload: file });
                    self.close();
                    return;
                }
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = new OffscreenCanvas(width, height);
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('Could not get OffscreenCanvas context.');
                }
                
                ctx.drawImage(imageBitmap, 0, 0, width, height);
                imageBitmap.close(); // Free memory

                self.postMessage({ type: 'progress', payload: { progress: 75, stage: 'compressing' } });
                
                const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
                
                const originalFilename = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                const newFilename = \`\${originalFilename}.jpg\`;
                const newFile = new File([blob], newFilename, { type: 'image/jpeg' });
                
                self.postMessage({ type: 'progress', payload: { progress: 100, stage: 'done' } });
                self.postMessage({ type: 'result', payload: newFile });

            } catch (err) {
                let message = err.message;
                if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.message.includes('Bitmap failed to allocate'))) {
                    message = 'A resolução da imagem é muito grande para ser processada neste dispositivo. Por favor, tente uma imagem menor.';
                }
                self.postMessage({ type: 'error', payload: message });
            } finally {
                self.close(); // Terminate worker after completion
            }
        };
        `;

        const workerBlob = new Blob([workerScript], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(workerBlob);
        const worker = new Worker(workerUrl);
        
        // Revoke the object URL immediately after creating the worker to free up memory
        URL.revokeObjectURL(workerUrl);

        worker.onmessage = (event) => {
            const { type, payload } = event.data;
            switch (type) {
                case 'progress':
                    onProgress(payload);
                    break;
                case 'result':
                    resolve(payload);
                    worker.terminate();
                    break;
                case 'error':
                    reject(new Error(payload));
                    worker.terminate();
                    break;
            }
        };

        worker.onerror = (error) => {
            reject(new Error(`Erro no Web Worker de otimização: ${error.message}`));
            worker.terminate();
        };

        worker.postMessage({ file, maxWidth, maxHeight, quality });
    });
};

/**
 * Applies a solid background color to an image with a transparent background.
 * @param dataUrl The data URL of the transparent image (e.g., PNG).
 * @param color The background color to apply (e.g., '#FFFFFF').
 * @returns A Promise that resolves with the data URL of the new image (JPEG format for solid background).
 */
export const applyBackgroundColor = (dataUrl: string, color: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context.'));
            }
            
            // Fill background with the specified color
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw the transparent image on top
            ctx.drawImage(img, 0, 0);
            
            // Return as JPEG since it's now a solid background
            resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = () => {
            reject(new Error('Failed to load image for background application.'));
        };
        img.src = dataUrl;
    });
};

export const buildFilterString = (filters: Partial<FilterState>): string => {
    const { brightness = 100, contrast = 100, saturate = 100, grayscale = 0, sepia = 0, hueRotate = 0, invert = 0, blur = 0 } = filters;
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) grayscale(${grayscale}%) sepia(${sepia}%) hue-rotate(${hueRotate}deg) invert(${invert}%) blur(${blur}px)`;
};

export const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop): Promise<string> => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        return Promise.reject(new Error('Could not get canvas context'));
    }

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );

    return new Promise((resolve) => {
        resolve(canvas.toDataURL("image/png"));
    });
};

export const applyFiltersToCanvas = (ctx: CanvasRenderingContext2D, image: HTMLImageElement, filters: Partial<FilterState>) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.filter = buildFilterString(filters);
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.filter = "none";
};