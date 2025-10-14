/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Gera um histograma de cores a partir dos dados de pixel de uma imagem.
 * @param imageData O objeto ImageData de um canvas.
 * @returns Um objeto contendo três arrays (r, g, b) para o histograma.
 */
export const generateHistogram = (imageData: ImageData): { r: number[], g: number[], b: number[] } => {
  const { data } = imageData;
  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    r[data[i]]++;
    g[data[i + 1]]++;
    b[data[i + 2]]++;
  }
  return { r, g, b };
};

/**
 * Calcula um ponto em uma curva de Bézier cúbica.
 * @param t O parâmetro da curva (0 a 1).
 * @param p0 Ponto inicial.
 * @param p1 Primeiro ponto de controle.
 * @param p2 Segundo ponto de controle.
 * @param p3 Ponto final.
 * @returns As coordenadas (x, y) do ponto na curva.
 */
const getCubicBezierPoint = (t: number, p0: number, p1: number, p2: number, p3: number): number => {
    const cX = 3 * (p1 - p0);
    const bX = 3 * (p2 - p1) - cX;
    const aX = p3 - p0 - cX - bX;
    return ((aX * t + bX) * t + cX) * t + p0;
};


/**
 * Cria uma Look-Up Table (LUT) a partir dos pontos de controle de uma curva.
 * @param controlPoints Os dois pontos de controle da curva de Bézier, normalizados (0-1).
 * @returns Um array de 256 números representando a LUT.
 */
export const createCurveLUT = (controlPoints: { x: number; y: number }[]): number[] => {
    const p0 = { x: 0, y: 1 }; // Canto inferior esquerdo (y invertido)
    const p3 = { x: 1, y: 0 }; // Canto superior direito (y invertido)
    const [p1, p2] = controlPoints;

    const samples = 256;
    const curvePoints: {x: number, y: number}[] = [];
    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const x = getCubicBezierPoint(t, p0.x, p1.x, p2.x, p3.x);
        const y = getCubicBezierPoint(t, p0.y, p1.y, p2.y, p3.y);
        curvePoints.push({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
    }
    
    const lut = new Uint8ClampedArray(256);
    let curveIndex = 0;
    for (let i = 0; i < 256; i++) {
        const targetX = i / 255;
        while (curveIndex < curvePoints.length - 1 && curvePoints[curveIndex + 1].x < targetX) {
            curveIndex++;
        }
        
        const pt1 = curvePoints[curveIndex];
        const pt2 = curvePoints[curveIndex + 1] || pt1;
        
        const segmentDx = pt2.x - pt1.x;
        let y;
        if (segmentDx > 1e-6) {
            const t = (targetX - pt1.x) / segmentDx;
            y = pt1.y + (pt2.y - pt1.y) * t;
        } else {
            y = pt1.y;
        }

        lut[i] = Math.round((1 - y) * 255); // Inverte y de volta para o sistema de cores
    }

    return Array.from(lut);
};


/**
 * Aplica uma Look-Up Table (LUT) aos dados de pixel de uma imagem.
 * @param imageData O objeto ImageData a ser modificado.
 * @param lut A LUT a ser aplicada.
 * @returns O objeto ImageData modificado.
 */
export const applyLUT = (imageData: ImageData, lut: number[]): ImageData => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }
  return imageData;
};

// Helper to load an image from a data URL
export const loadImage = (url: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    // Handle CORS issues if images are from external sources
    img.crossOrigin = "anonymous";
    img.src = url;
});


/**
 * Applies CSS-like filters to a specific area of an image defined by a mask.
 * @param originalImageUrl The data URL of the original image.
 * @param maskDataUrl The data URL of the black and white mask.
 * @param filterString The CSS filter string to apply (e.g., 'brightness(1.5) contrast(1.2)').
 * @returns A promise that resolves with the data URL of the edited image.
 */
export const applyFiltersToMaskedArea = async (
    originalImageUrl: string,
    maskDataUrl: string,
    filterString: string
): Promise<string> => {
    const [originalImage, maskImage] = await Promise.all([
        loadImage(originalImageUrl),
        loadImage(maskDataUrl)
    ]);

    const { width, height } = originalImage;

    // Main canvas for the final result
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get main canvas context");

    // Offscreen canvas for the filtered layer
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error("Could not get temp canvas context");

    // 1. Draw original image onto the main canvas. This will be the base.
    ctx.drawImage(originalImage, 0, 0);

    // 2. Create the masked, filtered layer in the offscreen temp canvas.
    // 2a. Draw the original image onto the temp canvas.
    tempCtx.drawImage(originalImage, 0, 0);
    // 2b. Apply the desired filter to the entire temp canvas context.
    tempCtx.filter = filterString;
    // 2c. Redraw the image on the temp canvas. This action applies the filter to the pixels.
    tempCtx.drawImage(originalImage, 0, 0); 
    // 2d. Use 'destination-in' to mask the filtered image. This operation keeps the temp canvas's pixels
    // only where they overlap with the mask image's opaque areas.
    tempCtx.globalCompositeOperation = 'destination-in';
    tempCtx.drawImage(maskImage, 0, 0, width, height);
    
    // 3. Draw the resulting masked, filtered layer from the temp canvas onto the main canvas.
    // Since the temp canvas is now mostly transparent except for the masked area, this composites
    // the filtered part perfectly on top of the original image.
    ctx.drawImage(tempCanvas, 0, 0);
    
    return canvas.toDataURL('image/png');
};

/**
 * Applies a solid background color to a transparent image.
 * @param imageUrl The data URL of the image (preferably a transparent PNG).
 * @param color The CSS color string for the background.
 * @returns A promise that resolves with the data URL of the image with the new background.
 */
export const applyBackgroundColor = async (
    imageUrl: string,
    color: string
): Promise<string> => {
    const image = await loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    return canvas.toDataURL('image/png');
};