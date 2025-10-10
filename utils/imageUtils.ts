/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { type PixelCrop } from 'react-image-crop';
import { type UploadProgressStatus, type GifFrame } from '../types';

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
 * Optimizes an image by resizing and compressing it if it's too large.
 * This ensures better performance within the editor.
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
    return new Promise((resolve, reject) => {
        const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

        if (!file.type.startsWith('image/') || file.type === 'image/gif') {
            onProgress({ progress: 100, stage: 'done' });
            return resolve(file);
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentLoaded = Math.round((event.loaded / event.total) * 50);
                onProgress({ progress: percentLoaded, stage: 'reading' });
            }
        };

        reader.onload = (event) => {
            onProgress({ progress: 50, stage: 'processing' });
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                try {
                    onProgress({ progress: 75, stage: 'processing' });
                    let { width, height } = img;

                    if (width <= maxWidth && height <= maxHeight && file.size <= MAX_SIZE_BYTES) {
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
                        return reject(new Error('Não foi possível obter o contexto do canvas.'));
                    }

                    ctx.drawImage(img, 0, 0, width, height);
                    onProgress({ progress: 95, stage: 'compressing' });

                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    
                    const originalFilename = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                    const newFilename = `${originalFilename}.jpg`;

                    onProgress({ progress: 100, stage: 'done' });
                    resolve(dataURLtoFile(dataUrl, newFilename));
                } catch (e) {
                    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.message.includes('Bitmap failed to allocate') || e.message.includes('Canvas area exceeds the maximum limit'))) {
                         const specificError = new Error(
                            'DIMENSION_ERROR: A resolução da imagem é muito grande para ser processada neste dispositivo. ' +
                            'Por favor, reduza a resolução da imagem original e tente o upload novamente.'
                        );
                        reject(specificError);
                    } else {
                        reject(e);
                    }
                }
            };
            img.onerror = () => {
                reject(new Error("Não foi possível carregar os dados da imagem. O arquivo pode estar corrompido ou não ser um formato de imagem válido."));
            };
        };
        reader.onerror = () => {
            reject(new Error("Falha ao ler o arquivo. Verifique as permissões e a integridade do arquivo."));
        };
    });
};

/**
 * Creates a mask image data URL from a normalized bounding box.
 * @param box The normalized bounding box object.
 * @param imageWidth The natural width of the original image.
 * @param imageHeight The natural height of the original image.
 * @returns A data URL string of the mask image.
 */
export const createMaskFromBoundingBox = (
  box: { x_min: number; y_min: number; x_max: number; y_max: number },
  imageWidth: number,
  imageHeight: number
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = imageWidth;
  canvas.height = imageHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  const x = box.x_min * imageWidth;
  const y = box.y_min * imageHeight;
  const width = (box.x_max - box.x_min) * imageWidth;
  const height = (box.y_max - box.y_min) * imageHeight;

  // Fill the selected area with white on a black background.
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, imageWidth, imageHeight);
  ctx.fillStyle = 'white';
  ctx.fillRect(x, y, width, height);
  return canvas.toDataURL('image/png');
};