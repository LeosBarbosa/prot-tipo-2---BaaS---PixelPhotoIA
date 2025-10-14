/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../context/EditorContext';
import { EyeIcon, SplitScreenIcon, WorkflowIcon } from './icons';

const FooterActions: React.FC = React.memo(() => {
    const {
        currentImageUrl,
        originalImageUrl,
        resetHistory,
        setIsComparisonModalOpen,
        isInlineComparisonActive,
        setIsInlineComparisonActive,
        toolHistory,
        setIsSaveWorkflowModalOpen,
    } = useEditor()!;
    
    const isCompareDisabled = !originalImageUrl || originalImageUrl === currentImageUrl;

    return (
        <footer className="p-4 border-t border-gray-700/50 bg-gray-900/50 flex flex-col items-center justify-center gap-4 mt-auto flex-shrink-0">
            {/* Controles de Histórico */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                <button onClick={resetHistory} disabled={isCompareDisabled} className={`text-center bg-transparent border border-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed`}>Resetar</button>
                <button 
                    onClick={() => setIsInlineComparisonActive(!isInlineComparisonActive)}
                    disabled={isCompareDisabled}
                    className={`p-2 rounded-md transition-colors ${isInlineComparisonActive ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700/60 hover:bg-gray-600/80'} text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Alternar comparação lado a lado"
                    aria-label="Alternar comparação lado a lado"
                    aria-pressed={isInlineComparisonActive}
                >
                    <SplitScreenIcon className="w-5 h-5" />
                </button>
                 <button 
                    onClick={() => setIsSaveWorkflowModalOpen(true)}
                    disabled={toolHistory.length < 2}
                    className="p-2 rounded-md bg-gray-700/60 hover:bg-gray-600/80 text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Salvar como Fluxo de Trabalho"
                    aria-label="Salvar como Fluxo de Trabalho"
                >
                    <WorkflowIcon className="w-5 h-5" />
                </button>
            </div>
            
            {/* Ação de Comparação */}
            <button
                onClick={() => setIsComparisonModalOpen(true)}
                disabled={isCompareDisabled}
                className="w-full max-w-xs text-center font-semibold py-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2 bg-blue-600/20 border border-blue-500/50 text-blue-300 hover:bg-blue-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <EyeIcon className="w-5 h-5" />
                Comparar Original
            </button>
        </footer>
    );
});

export default FooterActions;