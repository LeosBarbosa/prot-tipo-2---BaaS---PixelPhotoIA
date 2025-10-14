/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
// FIX: Correct import path
import { useEditor } from '../../context/EditorContext';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { ShirtIcon } from '../icons';
import TipBox from '../common/TipBox';

const TryOnPanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        baseImageFile,
        setInitialImage,
        handleVirtualTryOn,
        currentImageUrl, // Assuming result is shown here
    } = useEditor();
    
    const [personImage, setPersonImage] = useState<File | null>(null);
    const [clothingImage, setClothingImage] = useState<File | null>(null);
    const [shoeImage, setShoeImage] = useState<File | null>(null);

    useEffect(() => {
        if (baseImageFile && !personImage) {
            setPersonImage(baseImageFile);
        }
    }, [baseImageFile, personImage]);

    const handlePersonFileSelect = (file: File | null) => {
        setPersonImage(file);
        if (file) {
            setInitialImage(file);
        }
    };

    const handleGenerate = () => {
        if (!personImage || !clothingImage) return;
        handleVirtualTryOn(personImage, clothingImage, shoeImage ?? undefined);
    };
    
    const isGenerateDisabled = isLoading || !personImage || !clothingImage;

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Provador Virtual</h3>
                    <p className="text-sm text-gray-400 mt-1">Experimente roupas e calçados em sua foto.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <ImageDropzone imageFile={personImage} onFileSelect={handlePersonFileSelect} label="Sua Foto"/>
                    <ImageDropzone imageFile={clothingImage} onFileSelect={setClothingImage} label="Peça de Roupa"/>
                </div>
                
                <ImageDropzone imageFile={shoeImage} onFileSelect={setShoeImage} label="Calçado (Opcional)"/>

                <TipBox>
                   Para melhores resultados, use uma foto de corpo inteiro e imagens de roupas/calçados com fundo branco ou transparente.
                </TipBox>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerateDisabled}
                    className="w-full mt-auto bg-gradient-to-br from-pink-600 to-purple-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <ShirtIcon className="w-5 h-5" />
                    Experimentar
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={currentImageUrl} // The result will update currentImageUrl
                    loadingMessage="Vestindo a roupa..."
                />
            </main>
        </div>
    );
};

export default TryOnPanel;
