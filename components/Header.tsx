/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useEditor } from '../context/EditorContext';
import LazyIcon from './LazyIcon';

const Header: React.FC = () => {
  const { 
    handleGoHome,
    handleUploadNew, 
    handleExplicitSave,
    isLeftPanelVisible,
    setIsLeftPanelVisible,
    isRightPanelVisible,
    setIsRightPanelVisible,
    theme,
    toggleTheme,
    undo,
    redo,
    canUndo,
    canRedo,
    isEditingSessionActive,
  } = useEditor();
  
  const showEditorControls = isEditingSessionActive;

  const handleLeftPanelToggle = () => {
    const newLeftVisibility = !isLeftPanelVisible;
    setIsLeftPanelVisible(newLeftVisibility);
    if (newLeftVisibility && window.innerWidth < 1024) { // On mobile, one panel at a time
        setIsRightPanelVisible(false);
    }
  };

  const handleRightPanelToggle = () => {
      const newRightVisibility = !isRightPanelVisible;
      setIsRightPanelVisible(newRightVisibility);
      if (newRightVisibility && window.innerWidth < 1024) { // On mobile, one panel at a time
          setIsLeftPanelVisible(false);
      }
  };

  return (
    <header className="w-full py-3 px-4 md:px-8 border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 flex items-center justify-between">
      <div className="flex items-center gap-4">
          {showEditorControls && (
            <button 
              onClick={handleGoHome}
              className="flex items-center justify-center w-10 h-10 bg-gray-800/50 hover:bg-gray-700/50 text-gray-200 rounded-full transition-all duration-200 ease-in-out active:scale-90"
              title="Voltar ao Início"
              aria-label="Voltar ao Início"
            >
              <LazyIcon name="HomeIcon" className="w-5 h-5" />
            </button>
          )}
          <LazyIcon name="SparkleIcon" className="w-6 h-6 text-blue-500" />
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-gray-100">
              PixelPhoto IA
            </h1>
            <p className="text-xs font-sans text-gray-400 -mt-1">Adventure Co.</p>
          </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={toggleTheme}
          className="flex items-center justify-center w-10 h-10 bg-gray-800/50 hover:bg-gray-700/50 text-gray-200 rounded-full transition-all duration-200 ease-in-out active:scale-90"
          title="Alternar entre tema claro e escuro"
          aria-label="Alternar entre tema claro e escuro"
        >
          {theme === 'dark' ? <LazyIcon name="SunIcon" className="w-5 h-5" /> : <LazyIcon name="MoonIcon" className="w-5 h-5" />}
        </button>
        {showEditorControls && (
          <>
            {/* Undo/Redo for Desktop only */}
            <div className="hidden lg:flex items-center gap-2">
                <button 
                onClick={undo}
                disabled={!canUndo}
                className="flex items-center justify-center w-10 h-10 bg-gray-800/50 hover:bg-gray-700/50 text-gray-200 rounded-full transition-all duration-200 ease-in-out active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Desfazer"
                aria-label="Desfazer"
                >
                <LazyIcon name="UndoIcon" className="w-5 h-5" />
                </button>
                <button 
                onClick={redo}
                disabled={!canRedo}
                className="flex items-center justify-center w-10 h-10 bg-gray-800/50 hover:bg-gray-700/50 text-gray-200 rounded-full transition-all duration-200 ease-in-out active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refazer"
                aria-label="Refazer"
                >
                <LazyIcon name="RedoIcon" className="w-5 h-5" />
                </button>
            </div>
            
            {/* Save & New Image */}
            <button 
              onClick={() => handleExplicitSave()}
              className="flex items-center gap-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out active:scale-95 text-sm"
              title="Salvar Sessão"
              aria-label="Salvar Sessão"
            >
              <LazyIcon name="SaveIcon" className="w-5 h-5" />
              <span className="hidden md:inline">Salvar Sessão</span>
            </button>
            <button 
              onClick={handleUploadNew}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out active:scale-95 text-sm"
              title="Carregar nova imagem"
              aria-label="Carregar nova imagem"
            >
              <LazyIcon name="UploadIcon" className="w-5 h-5" />
              <span className="hidden md:inline">Nova Imagem</span>
            </button>
            
            {/* Panel Toggles for Desktop only */}
            <div className="hidden lg:flex items-center gap-2">
                <button 
                    onClick={handleLeftPanelToggle}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ease-in-out active:scale-90 z-30 ${isLeftPanelVisible ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-200'}`}
                    title="Alternar lista de ferramentas"
                    aria-label="Alternar lista de ferramentas"
                    aria-pressed={isLeftPanelVisible}
                >
                    <LazyIcon name="LayersIcon" className="w-5 h-5" />
                </button>
                 <button 
                    onClick={handleRightPanelToggle}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ease-in-out active:scale-90 z-30 ${isRightPanelVisible ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-200'}`}
                    title="Alternar opções da ferramenta"
                    aria-label="Alternar opções da ferramenta"
                    aria-pressed={isRightPanelVisible}
                >
                    <LazyIcon name="AdjustmentsHorizontalIcon" className="w-5 h-5" />
                </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
