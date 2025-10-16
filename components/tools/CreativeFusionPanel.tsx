

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
// FIX: Use a more appropriate icon for "Creative Fusion"
import { CombineIcon } from '../icons';

const CreativeFusionPanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        setInitialImage,
        baseImageFile,
        // FIX: Use handleCreativeFusion as intended for this panel.
        handleCreativeFusion,
        currentImageUrl,
    } = useEditor();

    const [compositionImage, setCompositionImage] = useState<File | null>(null);
    const [styleImage, setStyleImage] = useState<File | null>(null);

    useEffect(() => {
        if (baseImageFile && !compositionImage) {
            setCompositionImage(baseImageFile);
        }
    }, [baseImageFile, compositionImage]);

    const handleCompositionFileSelect = (file: File | null) => {
        setCompositionImage(file);
        if (file) {
            setInitialImage(file);
        }
    };

    const handleGenerate = async () => {
        if (!compositionImage || !styleImage) {
            return;
        }
        // FIX: Call the correct function with the correct arguments (an array of style images).
        handleCreativeFusion(compositionImage, [styleImage]);
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    {/* FIX: Update title to match the component's purpose. */}
                    <h3 className="text-lg font-semibold text-gray-200">Fusão Criativa</h3>
                    <p className="text-sm text-gray-400 mt-1">Combine a composição de uma imagem com o estilo de outra.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ImageDropzone 
                        imageFile={compositionImage}
                        onFileSelect={handleCompositionFileSelect}
                        // FIX: Update label for clarity.
                        label="Imagem de Composição"
                    />
                    <ImageDropzone 
                        imageFile={styleImage}
                        onFileSelect={setStyleImage}
                        // FIX: Update label for clarity.
                        label="Imagem de Estilo"
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !compositionImage || !styleImage}
                    // FIX: Use a more appropriate color scheme and text.
                    className="w-full mt-auto bg-gradient-to-br from-pink-600 to-purple-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {/* FIX: Use a more appropriate icon. */}
                    <CombineIcon className="w-5 h-5" />
                    Criar Fusão
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={currentImageUrl}
                    // FIX: Update loading message.
                    loadingMessage="Criando fusão artística..."
                />
            </main>
        </div>
    );
};

export default CreativeFusionPanel;