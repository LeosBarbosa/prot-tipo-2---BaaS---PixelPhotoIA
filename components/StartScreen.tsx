/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { UploadIcon } from './icons';

interface StartScreenProps {
  onFileSelect: (file: File) => void;
  onCancel?: () => void; // Optional cancel callback for modal context
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect, onCancel }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  const handleFileSelection = (files: FileList | null) => {
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    handleFileSelection(e.dataTransfer.files);
  };

  return (
    <div className="w-full max-w-3xl mx-auto text-center flex flex-col items-center justify-center p-4">
      <label
        htmlFor="file-upload"
        className={`w-full p-10 md:p-16 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ease-in-out ${
          isDraggingOver ? 'border-blue-400 bg-blue-500/10' : 'border-gray-600 hover:border-blue-500'
        }`}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4 text-gray-400 pointer-events-none">
          <UploadIcon className="w-16 h-16 text-gray-500" />
          <h2 className="text-2xl font-bold text-white">Carregue sua Imagem</h2>
          <p>Arraste e solte um arquivo aqui, ou clique para selecionar.</p>
        </div>
      </label>
      <input
        id="file-upload"
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-4 text-gray-400 hover:text-white transition-colors"
        >
          Cancelar
        </button>
      )}
    </div>
  );
};

export default StartScreen;