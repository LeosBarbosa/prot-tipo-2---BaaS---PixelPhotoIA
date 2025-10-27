/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import LazyIcon from './LazyIcon';

interface ToolModalProps {
    title: string;
    children: React.ReactNode;
}

const ToolModal: React.FC<ToolModalProps> = ({ title, children }) => {
    const { setActiveTool } = useEditor();

    return (
        <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setActiveTool(null)}
        >
            <div 
                className="w-full h-full max-w-7xl max-h-[95vh] bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-700 animate-zoom-rise"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                    <button onClick={() => setActiveTool(null)} className="text-gray-400 hover:text-white transition-colors">
                        <LazyIcon name="CloseIcon" className="w-6 h-6" />
                    </button>
                </header>
                <div className="flex-grow overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ToolModal;