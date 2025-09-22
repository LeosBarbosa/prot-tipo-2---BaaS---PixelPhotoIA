/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SparkleIcon, UploadIcon, TogglePanelsIcon } from './icons';
import { useEditor } from '../context/EditorContext';

interface HeaderProps {
  isEditingTool: boolean;
}

const Header: React.FC<HeaderProps> = ({ isEditingTool }) => {
  const { handleUploadNew, currentImage, panelsVisible, setPanelsVisible } = useEditor()!;
  
  return (
    <header className="w-full py-3 px-4 md:px-8 border-b border-gray-700 bg-gray-800/30 backdrop-blur-sm sticky top-0 z-50 flex items-center justify-between">
      <div className="flex items-center justify-center gap-3">
          <SparkleIcon className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold tracking-tight text-gray-100">
            Pixshop AI
          </h1>
      </div>
      <div className="flex items-center gap-2">
        {currentImage && (
          <button 
            onClick={handleUploadNew}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors text-sm"
            title="Carregar nova imagem"
            aria-label="Carregar nova imagem"
          >
            <UploadIcon className="w-5 h-5" />
            <span className="hidden md:inline">Nova Imagem</span>
          </button>
        )}
        {isEditingTool && (
            <button 
                onClick={() => setPanelsVisible(!panelsVisible)}
                className={`lg:hidden p-2 rounded-md transition-colors ${!panelsVisible ? 'bg-blue-600 hover:bg-blue-500' : 'bg-white/10 hover:bg-white/20'} text-gray-200`}
                title="Alternar painéis de ferramentas"
                aria-label="Alternar painéis de ferramentas"
                aria-pressed={!panelsVisible}
            >
                <TogglePanelsIcon className="w-5 h-5" />
            </button>
        )}
      </div>
    </header>
  );
};

export default Header;