/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useEffect } from 'react';
import { useEditor } from '../context/EditorContext';
import { CloseIcon } from './icons';

interface ToolModalProps {
    title: string;
    children: React.ReactNode;
}

const ToolModal: React.FC<ToolModalProps> = ({ title, children }) => {
    const { setActiveTool } = useEditor()!;

    // Memoiza a função para evitar recriação desnecessária
    const handleClose = useCallback(() => {
        setActiveTool(null);
    }, [setActiveTool]);

    // Adiciona listener para fechar com a tecla "Esc"
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [handleClose]);

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" 
            onClick={handleClose} // Fecha ao clicar no fundo
        >
            <div 
                className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-7xl h-full flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()} // Impede que o clique dentro do modal o feche
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button 
                        onClick={handleClose} 
                        className="p-2 rounded-full hover:bg-gray-700/80 transition-colors"
                        aria-label="Fechar modal"
                    >
                        <CloseIcon className="w-6 h-6 text-gray-300" />
                    </button>
                </header>
                <div className="flex-grow overflow-y-auto relative">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Memoiza o componente para evitar re-renderizações desnecessárias
export default React.memo(ToolModal);