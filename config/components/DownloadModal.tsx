/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import LazyIcon from './LazyIcon';

const DownloadModal: React.FC = () => {
    const { 
        setIsDownloadModalOpen,
        handleDownload,
        toolHistory,
    } = useEditor();

    const [format, setFormat] = React.useState<'png' | 'jpeg'>('jpeg');
    const [quality, setQuality] = React.useState(0.92);

    const handleWorkflowExport = () => {
        const workflowData = {
            name: "Meu Fluxo de Trabalho",
            description: `Exportado em ${new Date().toLocaleString()}`,
            toolIds: toolHistory.map(item => item.toolId), // Export only the tool IDs
        };
        const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `fluxo-de-trabalho.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    return (
        <div 
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setIsDownloadModalOpen(false)}
        >
            <div 
                className="w-full max-w-md bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-700 animate-zoom-rise"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <LazyIcon name="DownloadIcon" className="w-6 h-6 text-blue-400" />
                        Exportar Imagem
                    </h2>
                    <button onClick={() => setIsDownloadModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                        <LazyIcon name="CloseIcon" className="w-6 h-6" />
                    </button>
                </header>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Formato</label>
                        <div className="flex w-full bg-gray-900/50 border border-gray-600 rounded-lg p-1">
                            <button type="button" onClick={() => setFormat('png')} className={`w-full text-center font-semibold py-2 rounded-md transition-all text-sm ${format === 'png' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>
                                PNG
                            </button>
                            <button type="button" onClick={() => setFormat('jpeg')} className={`w-full text-center font-semibold py-2 rounded-md transition-all text-sm ${format === 'jpeg' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>
                                JPEG
                            </button>
                        </div>
                    </div>
                    {format === 'jpeg' && (
                        <div className="animate-fade-in">
                            <label className="block text-sm font-medium text-gray-300 flex justify-between">
                                <span>Qualidade</span>
                                <span className="font-mono">{Math.round(quality * 100)}%</span>
                            </label>
                            <div className="relative mt-2">
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.01"
                                    value={quality}
                                    onChange={e => setQuality(parseFloat(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-400 px-1 mt-1">
                                    <span>Menor Arquivo</span>
                                    <span>Maior Qualidade</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <p className="text-xs text-gray-400 text-center">
                        {format === 'png' 
                            ? 'PNG é ideal para imagens com transparência e oferece a mais alta qualidade.'
                            : 'JPEG é ótimo para compartilhar na web, com tamanhos de arquivo menores.'
                        }
                    </p>

                    <div className="border-t border-gray-700/50 pt-4">
                        <button 
                            onClick={handleWorkflowExport}
                            disabled={toolHistory.length < 2}
                            className="w-full text-left p-3 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors disabled:opacity-50 flex items-center gap-3"
                        >
                            <LazyIcon name="WorkflowIcon" className="w-6 h-6 text-purple-400"/>
                            <div>
                                <p className="font-semibold text-white">Exportar Fluxo de Trabalho</p>
                                <p className="text-xs text-gray-400">Salve as etapas de edição como um arquivo .json.</p>
                            </div>
                        </button>
                    </div>

                </div>
                <footer className="p-4 bg-gray-900/30 border-t border-gray-700/50 flex justify-end gap-3">
                    <button onClick={() => setIsDownloadModalOpen(false)} className="bg-gray-700/60 hover:bg-gray-600/80 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                        Cancelar
                    </button>
                    <button onClick={() => handleDownload(format, quality)} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                        Baixar Imagem
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default DownloadModal;