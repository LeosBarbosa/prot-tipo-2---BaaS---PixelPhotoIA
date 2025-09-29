/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SparkleIcon, UploadIcon, SaveIcon, LayersIcon, AdjustmentsHorizontalIcon } from './icons';
import { useEditor } from '../context/EditorContext';

interface HeaderProps {
  isEditingTool: boolean;
}

const Header: React.FC<HeaderProps> = ({ isEditingTool }) => {
  const { 
    handleUploadNew, 
    currentImage, 
    handleExplicitSave,
    isLeftPanelVisible,
    setIsLeftPanelVisible,
    isRightPanelVisible,
    setIsRightPanelVisible,
  } = useEditor()!;
  
  return (
    <header className="w-full py-3 px-4 md:px-8 border-b border-gray-700 bg-gray-800/30 backdrop-blur-sm sticky top-0 z-50 flex items-center justify-between">
      <div className="flex items-center justify-center gap-3">
          <SparkleIcon className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold tracking-tight text-gray-100">
            PixelPhoto IA
          </h1>
      </div>
      <div className="flex items-center gap-2">
        {currentImage && (
          <>
            <button 
              onClick={handleExplicitSave}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors text-sm"
              title="Salvar Sessão"
              aria-label="Salvar Sessão"
            >
              <SaveIcon className="w-5 h-5" />
              <span className="hidden md:inline">Salvar Sessão</span>
            </button>
            <button 
              onClick={handleUploadNew}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors text-sm"
              title="Carregar nova imagem"
              aria-label="Carregar nova imagem"
            >
              <UploadIcon className="w-5 h-5" />
              <span className="hidden md:inline">Nova Imagem</span>
            </button>
          </>
        )}
        {isEditingTool && (
            <div className="lg:hidden flex items-center gap-2">
                <button 
                    onClick={() => {
                        const newVisibility = !isLeftPanelVisible;
                        setIsLeftPanelVisible(newVisibility);
                        if (newVisibility) {
                            setIsRightPanelVisible(false);
                        }
                    }}
                    className={`p-2 rounded-md transition-colors z-30 ${isLeftPanelVisible ? 'bg-blue-600 hover:bg-blue-500' : 'bg-white/10 hover:bg-white/20'} text-gray-200`}
                    title="Alternar lista de ferramentas"
                    aria-label="Alternar lista de ferramentas"
                    aria-pressed={isLeftPanelVisible}
                >
                    <LayersIcon className="w-5 h-5" />
                </button>
                 <button 
                    onClick={() => {
                        const newVisibility = !isRightPanelVisible;
                        setIsRightPanelVisible(newVisibility);
                        if (newVisibility) {
                            setIsLeftPanelVisible(false);
                        }
                    }}
                    className={`p-2 rounded-md transition-colors z-30 ${isRightPanelVisible ? 'bg-blue-600 hover:bg-blue-500' : 'bg-white/10 hover:bg-white/20'} text-gray-200`}
                    title="Alternar opções da ferramenta"
                    aria-label="Alternar opções da ferramenta"
                    aria-pressed={isRightPanelVisible}
                >
                    <AdjustmentsHorizontalIcon className="w-5 h-5" />
                </button>
            </div>
        )}
      </div>
    </header>
  );
};

export default Header;