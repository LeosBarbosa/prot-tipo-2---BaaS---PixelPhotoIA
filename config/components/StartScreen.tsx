/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useCallback } from 'react';
import LazyIcon from './LazyIcon';

interface StartScreenProps {
  onFileSelect: (file: File) => void;
  onCancel?: () => void; // Optional cancel callback for modal context
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect, onCancel }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelection = useCallback((files: FileList | null) => {
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(e.target.files);
  }, [handleFileSelection]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    handleFileSelection(e.dataTransfer.files);
  }, [handleFileSelection]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full max-w-3xl mx-auto text-center flex flex-col items-center justify-center p-4">
      <button
        type="button"
        onClick={handleClick}
        className={`relative block w-full p-10 md:p-16 border border-gray-700/80 rounded-3xl cursor-pointer transition-all duration-300 ease-in-out overflow-hidden bg-gray-900/40 hover:border-blue-500/60 group ${ isDraggingOver ? 'border-blue-500 ring-4 ring-blue-500/20' : '' }`}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
        onDrop={handleDrop}
      >
        <div className={`absolute inset-0 transition-opacity duration-300 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 opacity-0 ${isDraggingOver ? 'opacity-100' : 'group-hover:opacity-50'}`}></div>
    
        <div className={`relative flex flex-col items-center gap-4 text-gray-400 pointer-events-none transition-transform duration-300 ${isDraggingOver ? 'scale-105' : 'group-hover:scale-105'}`}>
            <div className="relative w-20 h-20 flex items-center justify-center bg-gray-800/50 rounded-2xl border border-gray-700">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl"></div>
                <LazyIcon name="UploadIcon" className="w-10 h-10 text-gray-400 transition-colors duration-300 group-hover:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Arraste sua imagem aqui</h2>
            <p>Ou <span className="text-blue-400 font-semibold">procure em seus arquivos</span></p>
            <p className="text-xs text-gray-500 mt-2">Suporta JPG, PNG, WEBP. Tamanho máximo 25MB.</p>
        </div>
      </button>
      <input
        ref={inputRef}
        id="file-upload"
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-6 text-gray-500 hover:text-white transition-colors text-sm font-semibold"
        >
          Cancelar
        </button>
      )}
    </div>
  );
};

export default StartScreen;