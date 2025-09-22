/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../context/EditorContext';
import { UndoIcon, RedoIcon, UploadIcon, DownloadIcon, EyeIcon, CompareArrowsIcon } from './icons';

const FooterActions: React.FC = React.memo(() => {
    const {
        handleUploadNew,
        currentImage,
        originalImage,
        canUndo,
        canRedo,
        undo,
        redo,
        resetHistory,
        setIsComparisonModalOpen,
        isGif,
        handleDownload,
    } = useEditor()!;
    
    const isCompareDisabled = !originalImage || originalImage === currentImage;
    const isDownloadDisabled = !currentImage || isGif;

    return (
        <footer className="p-4 border-t border-gray-700/50 bg-gray-900/50 flex flex-col items-center justify-center gap-4 mt-auto flex-shrink-0">
            {/* Controles de Histórico */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                <button onClick={undo} disabled={!canUndo} className={`flex items-center justify-center text-center bg-white/10 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed`} aria-label="Desfazer"><UndoIcon className="w-4 h-4 mr-2" />Desfazer</button>
                <button onClick={redo} disabled={!canRedo} className={`flex items-center justify-center text-center bg-white/10 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed`} aria-label="Refazer"><RedoIcon className="w-4 h-4 mr-2" />Refazer</button>
                <button onClick={resetHistory} disabled={isCompareDisabled} className={`text-center bg-transparent border border-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed`}>Resetar</button>
            </div>
            
            {/* Ação de Comparação */}
            <button
                onClick={() => setIsComparisonModalOpen(true)}
                disabled={isCompareDisabled}
                className="w-full max-w-xs text-center font-semibold py-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2 bg-blue-600/20 border border-blue-500/50 text-blue-300 hover:bg-blue-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Comparar antes e depois"
            >
                <CompareArrowsIcon className="w-5 h-5" />
                Comparar Antes e Depois
            </button>

            {/* Ações Principais */}
            <div className="flex w-full gap-2 mt-2">
                <button onClick={handleUploadNew} className="w-1/2 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-colors text-sm"><UploadIcon className="w-5 h-5" />Nova Imagem</button>
                <div className="w-1/2 flex gap-2" title={isGif ? "O download de GIFs editados ainda não é suportado." : ""}>
                    <button onClick={() => handleDownload('png')} disabled={isDownloadDisabled} className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-4 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                        PNG
                    </button>
                     <button onClick={() => handleDownload('jpeg')} disabled={isDownloadDisabled} className="w-full bg-gradient-to-br from-sky-600 to-sky-500 text-white font-bold py-3 px-4 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                        JPG
                    </button>
                </div>
            </div>
        </footer>
    );
});

export default FooterActions;