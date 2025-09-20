/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { UploadIcon } from './icons';

interface StartScreenProps {
  onFileSelect: (file: File) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileSelection = (files: FileList | null) => {
    if (files && files[0]) {
      setSelectedFile(files[0]);
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

  const handleReset = () => {
    setSelectedFile(null);
    // Reset the input field value to allow re-selecting the same file
    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  };

  if (selectedFile && previewUrl) {
    return (
      <div className="w-full max-w-3xl mx-auto text-center flex flex-col items-center justify-center p-4 animate-fade-in">
        <h2 className="text-3xl font-bold text-white mb-4">Imagem Pronta para Edição</h2>
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-2xl p-6 flex flex-col items-center gap-4">
          <img src={previewUrl} alt="Preview" className="max-h-60 w-auto rounded-lg shadow-lg" />
          <p className="font-mono text-sm bg-gray-700/50 px-3 py-1 rounded-md text-gray-300 truncate w-full" title={selectedFile.name}>
            {selectedFile.name}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
            <button
              onClick={handleReset}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Trocar Imagem
            </button>
            <button
              onClick={() => onFileSelect(selectedFile)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Iniciar Edição
            </button>
          </div>
        </div>
      </div>
    );
  }

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
    </div>
  );
};

export default StartScreen;