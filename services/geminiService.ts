/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality, Part, Type } from "@google/genai";
import { fileToDataURL } from '../utils/imageUtils';
import { type DetectedObject } from '../types';
import { smartSearchToolDeclarations } from './smartSearchToolDeclarations';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const fileToPart = async (file: File): Promise<Part> => {
    const dataUrl = await fileToDataURL(file);
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("URL de dados inválida");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Não foi possível analisar o tipo MIME da URL de dados");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const handleGenAIResponse = <T extends GenerateContentResponse>(response: T): T => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        throw new Error(`Pedido bloqueado. Razão: ${blockReason}. ${blockReasonMessage || ''}`);
    }
    return response;
};

const extractBase64Image = (response: GenerateContentResponse): string => {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error('Nenhuma imagem foi gerada pelo modelo.');
};

const generateImageFromParts = async (parts: Part[], model: string = 'gemini-2.5-flash-image-preview'): Promise<string> => {
    const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    handleGenAIResponse(response);
    return extractBase64Image(response);
};

const singleImageAndTextToImage = async (image: File, prompt: string): Promise<string> => {
    const imagePart = await fileToPart(image);
    return generateImageFromParts([imagePart, { text: prompt }]);
};

// --- Implementations for all missing functions ---

export const generateImageFromText = async (prompt: string, aspectRatio: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
        },
    });
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
};

export const renderSketch = (sketchImage: File, prompt: string) => singleImageAndTextToImage(sketchImage, prompt);
export const generateCharacter = (prompt: string) => generateImageFromText(prompt, '9:16');
export const generateLogo = (prompt: string) => generateImageFromText(prompt, '1:1');
export const generate3DModel = (prompt: string) => generateImageFromText(prompt, '1:1');
export const generateSeamlessPattern = (prompt: string) => generateImageFromText(prompt, '1:1');

export const generateSticker = async (prompt: string, sourceImage?: File): Promise<string> => {
    if (sourceImage) {
        const fullPrompt = `Based on the provided image, create a cartoon sticker with a white border. Additional instructions: ${prompt}`;
        return singleImageAndTextToImage(sourceImage, fullPrompt);
    }
    const fullPrompt = `A cartoon sticker of ${prompt}, with a thick white border, on a grey background.`;
    return generateImageFromText(fullPrompt, '1:1');
};

export const applyTextEffect = (sourceImage: File, prompt: string): Promise<string> => {
    const fullPrompt = `Apply a visual effect to the text in this image based on the following description: ${prompt}. Only modify the text, keeping the rest of the image intact.`;
    return singleImageAndTextToImage(sourceImage, fullPrompt);
};

export const convertToVector = (sourceImage: File): Promise<string> => singleImageAndTextToImage(sourceImage, "Convert this image to a vector art style, with clean lines and flat colors.");

export const generateMagicMontage = async (sourceImage: File, prompt: string, secondImage?: File): Promise<string> => {
    const sourcePart = await fileToPart(sourceImage);
    const parts: Part[] = [sourcePart];
    
    if (secondImage) {
        const secondPart = await fileToPart(secondImage);
        parts.push(secondPart);
    }
    
    parts.push({ text: prompt });

    return generateImageFromParts(parts);
};

const processVideoGeneration = async (request: any): Promise<string> => {
    let operation = await ai.models.generateVideos(request);
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('A geração de vídeo falhou ou não retornou um URI.');
    }
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Falha ao baixar o vídeo: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};

export const generateVideo = (prompt: string, aspectRatio: string): Promise<string> => {
    return processVideoGeneration({
        model: 'veo-2.0-generate-001',
        prompt,
        config: { aspectRatio }
    });
};

export const generateAnimationFromImage = async (sourceImage: File, prompt: string): Promise<string> => {
    const dataUrl = await fileToDataURL(sourceImage);
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mimeType = mimeMatch?.[1] || sourceImage.type;
    const data = arr[1];

    return processVideoGeneration({
        model: 'veo-2.0-generate-001',
        prompt,
        image: { imageBytes: data, mimeType },
    });
};

export const generateInteriorDesign = async (image: File, mask: File, roomType: string, roomStyle: string, prompt: string): Promise<string> => {
    const imagePart = await fileToPart(image);
    const maskPart = await fileToPart(mask);
    const textPrompt = `Com base na foto de um(a) ${roomType}, redesenhe a área mascarada para se adequar a um estilo ${roomStyle}. Use as seguintes instruções: ${prompt}. O resultado deve ser fotorrealista, com iluminação e sombras consistentes, e se integrar perfeitamente ao resto da imagem. Apenas a área mascarada deve ser alterada.`;
    const textPart = { text: textPrompt };
    return generateImageFromParts([imagePart, maskPart, textPart]);
};

export const fuseImages = async (compositionImage: File, styleImage: File): Promise<string> => {
    const compositionPart = await fileToPart(compositionImage);
    const stylePart = await fileToPart(styleImage);
    const textPart = { text: "Combine the composition of the first image with the style of the second image." };
    return generateImageFromParts([compositionPart, stylePart, textPart]);
};

export const faceSwap = async (sourceImage: File, targetImage: File, prompt: string): Promise<string> => {
    const sourcePart = await fileToPart(sourceImage);
    const targetPart = await fileToPart(targetImage);
    const textPrompt = `Swap the face from the first image (source face) onto the person in the second image (target image). Additional instructions: ${prompt}.`;
    const textPart = { text: textPrompt };
    return generateImageFromParts([sourcePart, targetPart, textPart]);
};

export const outpaintImage = (sourceImage: File, prompt: string, aspectRatio: string): Promise<string> => {
    const fullPrompt = `Expand this image to a ${aspectRatio} aspect ratio. Fill the new areas with content that logically extends the original image. Extra instructions for the new areas: ${prompt}`;
    return singleImageAndTextToImage(sourceImage, fullPrompt);
};

export const generateProductPhoto = (sourceImage: File, prompt: string): Promise<string> => {
    const fullPrompt = `A foto de um produto com o fundo já removido é fornecida. Coloque este produto em uma nova cena fotorrealista com base na seguinte descrição: ${prompt}. Garanta que o produto se integre perfeitamente à nova cena, com iluminação, sombras e reflexos realistas que correspondam ao ambiente. O foco deve ser destacar o produto de forma atraente.`;
    return singleImageAndTextToImage(sourceImage, fullPrompt);
};

export const restorePhoto = (image: File) => singleImageAndTextToImage(image, "Restaure esta imagem para a maior qualidade possível. Remova todos os artefatos visuais como ruído, poeira e arranhões. Aprimore a nitidez, os detalhes e a resolução. Se houver rostos presentes, preste atenção especial para restaurar as características faciais de forma realista.");
export const generateImageVariation = (sourceImage: File, strength: number): Promise<string> => singleImageAndTextToImage(sourceImage, `Generate a variation of this image. The variation strength should be around ${strength}%.`);
export const applyStyle = (image: File, stylePrompt: string) => singleImageAndTextToImage(image, `Apply the following artistic style to this image: ${stylePrompt}`);
export const removeBackground = (image: File) => singleImageAndTextToImage(image, "Remove the background of this image, leaving only the main subject with a transparent background.");
export const generateAdjustedImage = (image: File, adjustmentPrompt: string) => singleImageAndTextToImage(image, `Adjust this image based on the following description: ${adjustmentPrompt}`);
export const reacenderImage = (image: File, prompt: string) => singleImageAndTextToImage(image, `Relight this image according to the following description: ${prompt}`);
export const generateLowPoly = (image: File) => singleImageAndTextToImage(image, "Convert this image into a low-poly art style.");
export const extractArt = (image: File) => singleImageAndTextToImage(image, "Extract the line art from this image, creating a black and white sketch of the main contours.");
export const applyDustAndScratch = (image: File) => singleImageAndTextToImage(image, "Apply a vintage film effect to this image, adding realistic dust and scratches.");
export const denoiseImage = (image: File) => restorePhoto(image);
export const applyFaceRecovery = (image: File) => restorePhoto(image);
export const generateProfessionalPortrait = (image: File) => singleImageAndTextToImage(image, "Transform this photo into a professional business headshot. The subject should be wearing professional attire, and the background should be a neutral studio backdrop. Preserve the person's facial features.");
export const upscaleImage = (image: File, factor: number, preserveFace: boolean) => singleImageAndTextToImage(image, `Upscale this image by a factor of ${factor}. ${preserveFace ? 'Pay special attention to preserving and enhancing facial details realistically.' : ''}`);
export const unblurImage = (image: File, sharpenLevel: number, denoiseLevel: number, model: string) => singleImageAndTextToImage(image, `Correct the blur in this image. The blur type seems to be ${model}. Apply sharpening at ${sharpenLevel}% and noise reduction at ${denoiseLevel}%.`);

export const generativeEdit = async (image: File, prompt: string, mode: 'fill' | 'remove' | 'compose', options: { maskImage?: File, secondImage?: File }): Promise<string> => {
    const imagePart = await fileToPart(image);
    const parts: Part[] = [imagePart];
    let textPrompt = '';

    if (mode === 'compose' && options.secondImage) {
        parts.push(await fileToPart(options.secondImage));
        textPrompt = `Compose the first image and the second image based on this prompt: ${prompt}`;
    } else if ((mode === 'fill' || mode === 'remove') && options.maskImage) {
        parts.push(await fileToPart(options.maskImage));
        textPrompt = `Using the provided mask (second image, where white indicates the area to edit), modify the original image (first image). The instruction for the masked area is: ${prompt || 'Remove the object in the masked area and fill it in realistically'}.`;
    } else {
        throw new Error("Invalid parameters for generative edit.");
    }
    parts.push({ text: textPrompt });
    return generateImageFromParts(parts);
};

export const suggestToolFromPrompt = async (prompt: string): Promise<{name: string, args: any} | null> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ functionDeclarations: smartSearchToolDeclarations }],
        }
    });
    handleGenAIResponse(response);
    const functionCall = response.functionCalls?.[0];
    if (functionCall) {
        return { name: functionCall.name, args: functionCall.args };
    }
    return null;
};

export const generateMask = (image: File): Promise<string> => singleImageAndTextToImage(image, "Analyze this image and identify the main subject. Generate a black and white mask where the main subject is white and the background is black.");

export const detectObjects = async (image: File): Promise<DetectedObject[]> => {
    const imagePart = await fileToPart(image);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, {text: "Detect all distinct objects in this image and provide their labels and normalized bounding boxes."}] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              objects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING, description: 'The name of the detected object.' },
                    box: {
                      type: Type.OBJECT,
                      description: 'The normalized bounding box coordinates (0.0 to 1.0).',
                      properties: {
                        x_min: { type: Type.NUMBER },
                        y_min: { type: Type.NUMBER },
                        x_max: { type: Type.NUMBER },
                        y_max: { type: Type.NUMBER },
                      },
                      required: ['x_min', 'y_min', 'x_max', 'y_max'],
                    },
                  },
                  required: ['label', 'box'],
                },
              },
            },
            required: ['objects'],
          },
        },
    });
    handleGenAIResponse(response);
    try {
        const jsonResponse = JSON.parse(response.text);
        return (jsonResponse.objects as DetectedObject[]) || [];
    } catch (e) {
        console.error("Failed to parse JSON from object detection", e);
        return [];
    }
};

export const generateCaricature = async (images: File[], prompt: string): Promise<string> => {
    const imageParts = await Promise.all(images.map(fileToPart));
    const textPart = { text: `Create a single caricature combining the features of the people in all provided images. Style instructions: ${prompt}` };
    return generateImageFromParts([...imageParts, textPart]);
};

export const applyDisneyPixarStyle = (image: File, prompt: string): Promise<string> => singleImageAndTextToImage(image, `Transform this portrait into a character in the Disney Pixar 3D animation style. Additional instructions: ${prompt}.`);
export const generate3DMiniature = (image: File, prompt:string): Promise<string> => singleImageAndTextToImage(image, `Turn the person in this photo into a 3D toy miniature. Additional instructions: ${prompt}.`);
export const generate90sYearbookPortrait = (image: File, prompt: string): Promise<string> => singleImageAndTextToImage(image, `Transform this photo into a 90s yearbook portrait. It should have the characteristic soft focus, studio lighting, and background of that era. Additional instructions: ${prompt}.`);

export const generateStyledPortrait = async (personImage: File, styleImage: File, prompt: string, negativePrompt: string): Promise<string> => {
    const personPart = await fileToPart(personImage);
    const stylePart = await fileToPart(styleImage);
    const textPrompt = `Apply the style (clothing, background, lighting) from the second image to the person in the first image, keeping the person's face and identity intact. Additional instructions: ${prompt}. Avoid the following: ${negativePrompt}.`;
    return generateImageFromParts([personPart, stylePart, { text: textPrompt }]);
};

export const generateStudioPortrait = (personImage: File, stylePrompt: string, detailsPrompt: string, negativePrompt: string): Promise<string> => {
    const fullPrompt = `Transform this photo into a professional studio portrait. Use the following lighting style: ${stylePrompt}. Additional details to incorporate: ${detailsPrompt}. Avoid the following elements: ${negativePrompt}. It is critical to preserve the person's facial identity.`;
    return singleImageAndTextToImage(personImage, fullPrompt);
};

export const generatePolaroidWithCelebrity = async (personImage: File, celebrityImage: File, negativePrompt: string): Promise<string> => {
    const personPart = await fileToPart(personImage);
    const celebrityPart = await fileToPart(celebrityImage);
    const textPrompt = `Create a realistic polaroid-style photo featuring the person from the first image and the celebrity from the second image together. They should look like they are in the same photo, interacting naturally. Avoid the following: ${negativePrompt}.`;
    return generateImageFromParts([personPart, celebrityPart, { text: textPrompt }]);
};