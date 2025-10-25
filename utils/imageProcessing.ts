/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Loads an image from a source URL.
 * @param src The URL of the image to load.
 * @returns A Promise that resolves with the loaded HTMLImageElement.
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
};

/**
 * Generates a histogram for an image's pixel data.
 * @param imageData The ImageData object from a canvas.
 * @returns An object with arrays for red, green, and blue channels.
 */
export const generateHistogram = (imageData: ImageData): { r: number[], g: number[], b: number[] } => {
    const data = imageData.data;
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
 * Applies a Look-Up Table (LUT) to an ImageData object.
 * @param imageData The ImageData to modify.
 * @param lut The LUT array (256 numbers).
 */
export const applyLUT = (imageData: ImageData, lut: number[]): void => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = lut[data[i]];
        data[i + 1] = lut[data[i + 1]];
        data[i + 2] = lut[data[i + 2]];
    }
};

/**
 * Applies a CSS filter string to a specific area of an image defined by a mask.
 * @param imageUrl The URL of the base image.
 * @param maskUrl The URL of the mask image (white areas indicate where to apply the filter).
 * @param filterString The CSS filter string to apply (e.g., 'brightness(150%)').
 * @returns A Promise that resolves with the data URL of the resulting image.
 */
export const applyFiltersToMaskedArea = async (imageUrl: string, maskUrl: string, filterString: string): Promise<string> => {
    const [image, mask] = await Promise.all([loadImage(imageUrl), loadImage(maskUrl)]);

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");

    // Step 1: Create a temporary canvas for the filtered image.
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.naturalWidth;
    tempCanvas.height = image.naturalHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error("Could not get temporary canvas context");
    
    // Step 2: Draw the filtered image onto the temporary canvas.
    tempCtx.filter = filterString;
    tempCtx.drawImage(image, 0, 0);

    // Step 3: Use the mask to clip the filtered image.
    // 'destination-in' keeps the destination (filtered image) where the new source (mask) is opaque.
    tempCtx.globalCompositeOperation = 'destination-in';
    tempCtx.drawImage(mask, 0, 0);

    // Step 4: Draw the original image onto the main canvas.
    ctx.drawImage(image, 0, 0);

    // Step 5: Draw the masked, filtered content on top of the original image.
    ctx.drawImage(tempCanvas, 0, 0);

    return canvas.toDataURL('image/png');
};

/**
 * Calculates a point on a cubic Bezier curve.
 * @param t - The position on the curve, from 0 to 1.
 * @param p0 - The start point.
 * @param p1 - The first control point.
 * @param p2 - The second control point.
 * @param p3 - The end point.
 * @returns The point on the curve.
 */
function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const c = 3 * p1 - 3 * p0;
    const b = 3 * p2 - 6 * p1 + 3 * p0;
    const a = p3 - p0 - c - b;
    return (a * t * t * t) + (b * t * t) + (c * t) + p0;
}

/**
 * Creates a Look-Up Table (LUT) from Bezier curve control points for tone curve adjustments.
 * @param controlPoints The two control points defining the Bezier curve.
 * @returns A LUT array of 256 numbers representing the brightness mapping.
 */
export const createCurveLUT = (controlPoints: { x: number; y: number }[]): number[] => {
    const lut = new Array(256).fill(0);
    // In the canvas, y=0 is top, y=1 is bottom. For brightness, 0 is dark, 255 is bright.
    // The curve maps input brightness (x) to output brightness (y).
    // The canvas is drawn from bottom-left (0, 255) to top-right (255, 0).
    // So our curve points are inverted on the y-axis.
    const p0 = { x: 0, y: 1 }; 
    const p3 = { x: 1, y: 0 };
    const p1 = controlPoints[0];
    const p2 = controlPoints[1];

    const curvePoints: { x: number, y: number }[] = [];
    // Sample the curve at many points for precision
    for (let i = 0; i <= 1000; i++) {
        const t = i / 1000;
        const x = cubicBezier(t, p0.x, p1.x, p2.x, p3.x);
        const y = cubicBezier(t, p0.y, p1.y, p2.y, p3.y);
        // Convert normalized coordinates (0-1) to brightness values (0-255)
        curvePoints.push({ x: x * 255, y: y * 255 });
    }

    // Map input values (0-255) to output values from the curve
    let curveIndex = 0;
    for (let i = 0; i < 256; i++) {
        // Find the point on the curve that corresponds to the current input value \`i\`
        while (curveIndex < curvePoints.length - 1 && curvePoints[curveIndex].x < i) {
            curveIndex++;
        }
        
        // Interpolate between two points on the curve if an exact match for \`i\` isn't found
        if (curveIndex > 0) {
            const pPrev = curvePoints[curveIndex - 1];
            const pNext = curvePoints[curveIndex];
            if (pNext.x > pPrev.x) {
                const t = (i - pPrev.x) / (pNext.x - pPrev.x);
                const interpolatedY = pPrev.y + t * (pNext.y - pPrev.y);
                lut[i] = Math.max(0, Math.min(255, Math.round(interpolatedY)));
            } else {
                 lut[i] = Math.max(0, Math.min(255, Math.round(pPrev.y)));
            }
        } else {
             lut[i] = Math.max(0, Math.min(255, Math.round(curvePoints[0].y)));
        }
    }

    return lut;
};

// FIX: Moved createMaskFromBoundingBox here to resolve import error.
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