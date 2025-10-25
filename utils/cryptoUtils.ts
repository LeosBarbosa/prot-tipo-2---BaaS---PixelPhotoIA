/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Calculates the SHA-256 hash of a string.
 * @param str The string to hash.
 * @returns A promise that resolves with the hex-encoded hash string.
 */
export const sha256 = async (str: string): Promise<string> => {
    const textAsBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', textAsBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Calculates the SHA-256 hash of a File object.
 * @param file The file to hash.
 * @returns A promise that resolves with the hex-encoded hash string.
 */
export const hashFile = async (file: File): Promise<string> => {
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};