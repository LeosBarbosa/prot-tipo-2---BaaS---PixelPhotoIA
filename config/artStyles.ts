/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface ArtStyle {
  id: string;
  name: string;
  prompt: string;
  thumbnail: string;
}

export type ArtStyleCategory = 'digital' | 'traditional' | 'stylized';

export const categoryLabels: Record<ArtStyleCategory, string> = {
  digital: 'Digital',
  traditional: 'Tradicional',
  stylized: 'Estilizado',
};

// New categorized structure
export const artStyleCategories: Record<ArtStyleCategory, ArtStyle[]> = {
  digital: [
    {
      id: 'photorealistic',
      name: 'Fotorrealista',
      prompt: 'fotorrealista, hiperdetalhado, 8k, fotografia profissional',
      thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/artstyles/photorealistic.webp'
    },
    {
      id: 'fantasy',
      name: 'Fantasia',
      prompt: 'arte conceitual de fantasia, épico, detalhado, matte painting',
      thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/artstyles/fantasy.webp'
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      prompt: 'estilo cyberpunk, luzes de neon, futurista, sombrio',
      thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/artstyles/cyberpunk.webp'
    },
    {
      id: 'low-poly',
      name: 'Low Poly',
      prompt: 'estilo low poly, geométrico, renderização 3D',
      thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/artstyles/low_poly.webp'
    }
  ],
  traditional: [
    {
      id: 'oil-painting',
      name: 'Pintura a Óleo',
      prompt: 'pintura a óleo, pinceladas texturizadas, estilo clássico',
      thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/artstyles/oil_painting.webp'
    },
    {
      id: 'watercolor',
      name: 'Aquarela',
      prompt: 'pintura em aquarela, traços suaves, cores pastéis',
      thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/artstyles/watercolor.webp'
    },
    {
        id: 'charcoal',
        name: 'Carvão',
        prompt: 'esboço a carvão, preto e branco, texturizado, dramático',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/artstyles/charcoal.webp'
    },
    {
        id: 'ink',
        name: 'Tinta',
        prompt: 'desenho a tinta, arte de linha, alto contraste, minimalista',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/artstyles/ink.webp'
    }
  ],
  stylized: [
    {
      id: 'anime',
      name: 'Anime',
      prompt: 'estilo de anime, arte digital, vibrante, arte de estúdio ghibli',
      thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/artstyles/anime.webp'
    },
    {
      id: 'pixel-art',
      name: 'Pixel Art',
      prompt: 'pixel art, 16-bits, estilo de videogame retrô',
      thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/artstyles/pixel_art.webp'
    },
    {
        id: 'cartoon',
        name: 'Cartoon',
        prompt: 'estilo cartoon, cores vivas, contornos ousados',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/artstyles/cartoon.webp'
    },
    {
        id: 'vintage-comic',
        name: 'HQ Vintage',
        prompt: 'estilo de história em quadrinhos vintage, pontilhado (halftone), cores dessaturadas',
        thumbnail: 'https://storage.googleapis.com/maker-studio-tools-us-east1/artstyles/vintage_comic.webp'
    }
  ]
};

// Define the order of categories for the UI
export const artStyleCategoryOrder: ArtStyleCategory[] = ['digital', 'traditional', 'stylized'];

// For easy lookup, a flattened array
export const allArtStyles: ArtStyle[] = Object.values(artStyleCategories).flat();