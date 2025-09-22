/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useCallback } from 'react';
import { UploadIcon, CloseIcon } from '../../icons';

interface ImageDropzoneProps {
    imageFile: File | null;
    onFileSelect: (file: File | null) => void;
    label: string;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ imageFile, onFileSelect, label }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const imageUrl = useMemo(() => {
        if (!imageFile) return null;
        try {
            return URL.createObjectURL(imageFile);
        } catch (e) {
            console.error("Error creating object URL", e);
            return null;
        }
    }, [imageFile]);

    const handleFileChange = useCallback((files: FileList | null) => {
        setError(null);
        if (files && files[0]) {
            if (files[0].type.startsWith('image/')) {
                onFileSelect(files[0]);
            } else {
                setError('Apenas arquivos de imagem são permitidos.');
                setTimeout(() => setError(null), 3000); // Auto-clear error
            }
        }
    }, [onFileSelect]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (e.dataTransfer.files) {
            handleFileChange(e.dataTransfer.files);
        }
    }, [handleFileChange]);

    const handleClear = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onFileSelect(null);
    };
    
    const borderColor = error
        ? 'border-red-500'
        : isDraggingOver
        ? 'border-blue-500 bg-blue-500/10'
        : 'border-gray-600 hover:border-blue-500';

    return (
        <div className="flex flex-col items-center gap-2 w-full">
            <h4 className="font-semibold text-gray-300 text-sm">{label}</h4>
            <label
                htmlFor={`upload-${label.replace(/\s+/g, '-')}`}
                className={`relative group w-full aspect-square bg-gray-900/50 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all ${borderColor}`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
                onDrop={handleDrop}
            >
                {imageUrl ? (
                    <>
                        <img src={imageUrl} alt={label} className="w-full h-full object-contain p-1 rounded-md" />
                        <button 
                            onClick={handleClear} 
                            className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            aria-label="Remover imagem"
                        >
                            <CloseIcon className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <div className="text-center text-gray-500 p-2 pointer-events-none">
                        <UploadIcon className="w-8 h-8 mx-auto" />
                        <span className="text-xs mt-1 block">Clique ou arraste</span>
                    </div>
                )}
                <input
                    id={`upload-${label.replace(/\s+/g, '-')}`}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files)}
                />
            </label>
            {error && <p className="text-xs text-red-400 w-full text-center px-1 h-4">{error}</p>}
            {imageFile && !error && (
                 <p className="text-xs text-gray-400 w-full text-center truncate px-1 h-4" title={imageFile.name}>
                    {imageFile.name}
                </p>
            )}
        </div>
    );
};

export default ImageDropzone;