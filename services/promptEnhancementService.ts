/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";
import { type ToolId } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const enhancementInstructions: Partial<Record<ToolId, string>> = {
    productPhotography: 'Enhance this prompt for a professional product photography shot. Add specific, creative details about lighting (e.g., soft studio lighting, dramatic side light, golden hour), background (e.g., minimalist white, textured marble surface, blurred outdoor scene), camera angle, and overall mood.',
    imageGen: 'Enhance this prompt for a general AI image generation model. Add rich details about artistic style (e.g., photorealistic, oil painting, watercolor, 3D render), color palette, lighting, composition, camera lens, and level of detail to create a visually stunning image.',
    sketchRender: 'Enhance this prompt for rendering a sketch. Add details about materials (e.g., brushed metal, smooth plastic), textures, lighting (e.g., studio, dramatic), and environment to turn the sketch into a photorealistic render.',
    characterDesign: 'Enhance this prompt for character design. Add details about clothing, accessories, facial expression, pose, and background setting to create a more complete and compelling character concept.',
    architecturalViz: 'Enhance this prompt for an architectural visualization. Add specific details about materials (e.g., concrete, glass, wood), time of day, weather, surrounding landscape, and architectural style (e.g., modern, brutalist).',
    interiorDesign: 'Enhance this prompt for an interior design visualization. Add details about furniture style, materials (wood, metal, fabric), color scheme, lighting fixtures, and decorative elements (e.g., plants, art, rugs).',
    logoGen: 'Enhance this prompt for logo design. Specify if it should be minimalist, an emblem, a wordmark, or abstract. Add details about color theory, typography, and the desired brand feeling (e.g., modern, classic, playful).',
    patternGen: 'Enhance this prompt for a seamless pattern. Add details about the repeating elements, color palette, style (e.g., geometric, floral, abstract), and complexity.',
    textEffects: 'Enhance this prompt for applying a visual effect to text. Be more descriptive about the texture, material, or phenomenon. For example, instead of "fire effect", describe "erupting with molten lava and glowing embers".',
    stickerCreator: 'Enhance this prompt for creating a cartoon sticker. Add details about the character\'s expression, action, and style (e.g., cute, vintage, holographic). Ensure the description mentions a thick white border.',
    model3DGen: 'Enhance this prompt for a 3D model render. Add details about the object\'s materials, surface texture, lighting setup (e.g., three-point lighting), and background.',
    videoGen: 'Enhance this prompt for video generation. Describe the action, camera movement (e.g., panning, dolly zoom), and overall mood or cinematic style (e.g., epic, documentary).',
    magicMontage: 'Enhance this prompt for a photo montage or complex edit. Be more descriptive and clear about the desired composition, blending, and desired outcome. Break down the steps if necessary.',
    faceSwap: 'Enhance this prompt for a face swap. Add details about blending the skin tones, matching lighting, and adjusting facial expressions to make the swap more seamless and realistic.',
    outpainting: 'Enhance this prompt for outpainting. Be more descriptive about the new areas to be generated, ensuring they blend seamlessly with the original image in style, lighting, and content.',
    photoStudio: 'Enhance this prompt for a professional studio portrait. Add details about clothing, mood, background textures, and specific lighting setups (e.g., butterfly lighting, split lighting).',
    relight: 'Enhance this prompt for relighting a photo. Add details about the light source (e.g., neon, candlelight, sun), color, direction, and intensity to create a specific mood.',
    generativeEdit: 'Enhance this prompt for a generative edit task. Be more descriptive and specific about the object to add, remove, or modify. Describe the desired style, texture, and how it should blend with the rest of the image.',
    bananimate: 'Enhance this prompt for animating a still image. Be more descriptive about the desired motion. Specify which parts of the image should move and how (e.g., "make the clouds drift slowly from left to right", "make the person\'s eyes blink naturally").',
    aiPortraitStudio: 'Enhance this prompt for a stylized AI portrait. Depending on the chosen style (e.g., caricature, Pixar), add relevant details about expression, accessories, or background to complement the transformation.',
    vectorConverter: 'Enhance this prompt for converting a bitmap to a vector style. Add details about line weight, color palette (e.g., flat, gradient), level of abstraction, and specific vector art styles (e.g., flat illustration, geometric, cartoon).',
    tryOn: 'Enhance this prompt for a virtual try-on photoshoot scene. Add specific, creative details about the location, mood, background elements, and overall atmosphere to create a professional and compelling fashion shot.',
};

export const enhancePrompt = async (prompt: string, toolId: ToolId): Promise<string> => {
    const instruction = enhancementInstructions[toolId];
    if (!instruction || !prompt.trim()) {
        return prompt; // No enhancement for this tool, or prompt is empty
    }

    try {
        const fullPrompt = `Com base na seguinte instrução, reescreva e enriqueça o prompt do usuário para torná-lo muito mais detalhado e eficaz para um gerador de imagens de IA. RESPONDA EM PORTUGUÊS (BRASIL). Retorne APENAS o novo prompt reescrito. Não adicione nenhum preâmbulo, explicação ou aspas.

Instrução: ${instruction}

Prompt do usuário: "${prompt}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                temperature: 0.7, // A bit of creativity
            }
        });

        const enhancedPrompt = response.text.trim();
        // Simple validation to ensure it's not an empty or weird response
        if (enhancedPrompt && enhancedPrompt.length > prompt.length) {
            return enhancedPrompt;
        }
        return prompt;
    } catch (error) {
        console.error("Error enhancing prompt:", error);
        return prompt; // Return original prompt on error
    }
};
