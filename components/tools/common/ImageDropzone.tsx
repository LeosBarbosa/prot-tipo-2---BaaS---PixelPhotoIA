/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import LazyIcon from '../../LazyIcon';

interface ImageDropzoneProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
    label: string;
    multiple?: boolean;
    maxFiles?: number;
    tip?: string;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ 
    files, 
    onFilesChange, 
    label, 
    multiple = false, 
    maxFiles = 5,
    tip,
}) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previews, setPreviews] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const objectUrls = files.map(file => URL.createObjectURL(file));
        setPreviews(objectUrls);
        
        return () => {
            objectUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [files]);

    const handleFileSelection = useCallback((incomingFiles: FileList | null) => {
        setError(null);
        if (!incomingFiles || incomingFiles.length === 0) return;

        const imageFiles = Array.from(incomingFiles).filter(f => f.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            setError('Apenas arquivos de imagem são permitidos.');
            setTimeout(() => setError(null), 3000);
            return;
        }

        if (multiple) {
            const combined = [...files, ...imageFiles];
            const limited = combined.slice(0, maxFiles);
            onFilesChange(limited);
        } else {
            onFilesChange([imageFiles[0]]);
        }
    }, [files, maxFiles, multiple, onFilesChange]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        handleFileSelection(e.dataTransfer.files);
    }, [handleFileSelection]);
    
    const handleClick = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const handleRemove = useCallback((e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        const newFiles = files.filter((_, i) => i !== index);
        onFilesChange(newFiles);
    }, [files, onFilesChange]);

    const baseClasses = "relative group w-full aspect-square bg-gray-900/50 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all";
    const borderColor = error ? 'border-red-500' : isDraggingOver ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-blue-500';

    if (multiple) {
        return (
            <div className="w-full">
                <h4 className="font-semibold text-gray-300 text-sm mb-2 text-center">{label}</h4>
                <div className="grid grid-cols-2 gap-2">
                    {previews.map((src, index) => (
                        <div key={index} className="relative group aspect-square">
                            <img src={src} alt={`Preview ${index}`} className="w-full h-full object-contain p-1 rounded-md bg-black/20" />
                            <button 
                                onClick={(e) => handleRemove(e, index)} 
                                className="absolute top-0 right-0 m-1 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                aria-label={`Remover imagem ${index + 1}`}
                            >
                                <LazyIcon name="CloseIcon" className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {files.length < maxFiles && (
                         <button
                            type="button"
                            onClick={handleClick}
                            className={`${baseClasses} ${borderColor}`}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
                            onDrop={handleDrop}
                            aria-label={`Adicionar mais imagens para ${label}`}
                        >
                            <div className="text-center text-gray-500 p-2 pointer-events-none">
                                <LazyIcon name="UploadIcon" className="w-8 h-8 mx-auto" />
                                <span className="text-xs mt-1 block">Adicionar Mais</span>
                            </div>
                        </button>
                    )}
                </div>
                 {tip && <p className="mt-1 text-xs text-gray-500 px-1">{tip}</p>}
                <input ref={inputRef} type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleFileSelection(e.target.files)} />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-2 w-full">
            <h4 className="font-semibold text-gray-300 text-sm">{label}</h4>
            <button
                type="button"
                onClick={handleClick}
                className={`${baseClasses} ${borderColor}`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
                onDrop={handleDrop}
                aria-label={`Carregar imagem para ${label}`}
            >
                {files.length > 0 && previews[0] ? (
                    <>
                        <img src={previews[0]} alt={label} className="w-full h-full object-contain p-1 rounded-md" />
                        <button 
                            onClick={(e) => handleRemove(e, 0)} 
                            className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            aria-label="Remover imagem"
                        >
                            <LazyIcon name="CloseIcon" className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <div className="text-center text-gray-500 p-2 pointer-events-none">
                        <LazyIcon name="UploadIcon" className="w-8 h-8 mx-auto" />
                        <span className="text-xs mt-1 block">Clique ou arraste</span>
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileSelection(e.target.files)}
                />
            </button>
            {error && <p className="text-xs text-red-400 w-full text-center px-1 h-4">{error}</p>}
            {files.length > 0 && !error && (
                 <p className="text-xs text-gray-400 w-full text-center truncate px-1 h-4" title={files[0].name}>
                    {files[0].name}
                </p>
            )}
             {tip && <p className="mt-1 text-xs text-gray-500 px-1">{tip}</p>}
        </div>
    );
};

export default ImageDropzone;