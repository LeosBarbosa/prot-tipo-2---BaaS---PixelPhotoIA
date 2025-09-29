/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { type PixelCrop } from 'react-image-crop';
import { type UploadProgressStatus } from '../types';

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

export const frameToDataURL = (imageData: ImageData): string => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create canvas context");
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
};

export const frameToFile = (imageData: ImageData, filename: string): File => {
    const dataUrl = frameToDataURL(imageData);
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
 * Optimizes an image by resizing and compressing it if it's too large.
 * This ensures better performance within the editor.
 * @param file The image file to optimize.
 * @param onProgress A callback to report the optimization progress (0-100).
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
    quality: number = 0.95
): Promise<File> => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/') || file.type === 'image/gif') {
            onProgress({ progress: 100, stage: 'done' });
            return resolve(file);
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onprogress = (event) => {
            if (event.lengthComputable) {
                // Reading the file will be the first 50% of the progress
                const percentLoaded = Math.round((event.loaded / event.total) * 50);
                onProgress({ progress: percentLoaded, stage: 'reading' });
            }
        };

        reader.onload = (event) => {
            onProgress({ progress: 50, stage: 'processing' });
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                onProgress({ progress: 75, stage: 'processing' });
                let { width, height } = img;

                if (width <= maxWidth && height <= maxHeight) {
                    onProgress({ progress: 100, stage: 'done' });
                    return resolve(file);
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

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    onProgress({ progress: 100, stage: 'done' });
                    return reject(new Error('Não foi possível obter o contexto do canvas.'));
                }

                ctx.drawImage(img, 0, 0, width, height);
                onProgress({ progress: 95, stage: 'compressing' });

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                
                const originalFilename = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                const newFilename = `${originalFilename}.jpg`;

                onProgress({ progress: 100, stage: 'done' });
                resolve(dataURLtoFile(dataUrl, newFilename));
            };
            img.onerror = (error) => {
                onProgress({ progress: 100, stage: 'done' });
                reject(error);
            };
        };
        reader.onerror = (error) => {
            onProgress({ progress: 100, stage: 'done' });
            reject(error);
        };
    });
};