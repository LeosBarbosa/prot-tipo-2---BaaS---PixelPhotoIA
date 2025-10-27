/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { useEditor } from '../../../context/EditorContext';
import { type Workflow } from '../../../types';
import ImageDropzone from './common/ImageDropzone';
import LazyIcon from '../LazyIcon';
import Spinner from '../Spinner';

const predefinedWorkflows: Workflow[] = [
    { id: 'restore', name: 'Restauração de Foto', description: 'Melhora a qualidade e remove ruído.', toolIds: ['photoRestoration'], icon: 'restore' },
    { id: 'remove_bg', name: 'Remover Fundo', description: 'Cria um PNG com fundo transparente.', toolIds: ['removeBg'], icon: 'product' },
    { id: 'upscale_4x', name: 'Aumentar Resolução 4x', description: 'Aumenta o tamanho e a nitidez da imagem.', toolIds: ['upscale'], icon: 'creative' },
];

const BatchProcessingPanel: React.FC = () => {
    const { 
        handleBatchProcess,
        // FIX: Add isBatchProcessing and batchProgress to context
        isBatchProcessing,
        batchProgress,
        savedWorkflows,
        setToast,
    } = useEditor();

    const [files, setFiles] = useState<File[]>([]);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('restore');
    const [processedFiles, setProcessedFiles] = useState<{ original: string, processed: string }[]>([]);
    
    const allWorkflows = [...predefinedWorkflows, ...savedWorkflows.filter(wf => wf.isUserDefined)];

    const handleStart = () => {
        if (files.length === 0 || !selectedWorkflowId) {
            setToast({ message: "Por favor, carregue imagens e selecione um fluxo de trabalho.", type: "error" });
            return;
        }
        
        const workflow = allWorkflows.find(wf => wf.id === selectedWorkflowId);
        if (!workflow) return;

        setProcessedFiles([]); // Clear previous results
        handleBatchProcess(files, workflow.toolIds, setProcessedFiles);
    };
    
    const handleDownloadAll = () => {
        // This is a simplified download, a real implementation might use JSZip
        processedFiles.forEach((file, index) => {
            if(file.processed === 'ERROR') return;
            const link = document.createElement('a');
            link.href = file.processed;
            link.download = `processado-${files[index]?.name || index + 1}.png`;
            link.click();
        });
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Processamento em Lote</h3>
                    <p className="text-sm text-gray-400 mt-1">Aplique um fluxo de trabalho a várias imagens de uma vez.</p>
                </div>
                
                <ImageDropzone 
                    files={files}
                    onFilesChange={setFiles}
                    label="Carregar Imagens"
                    multiple
                    maxFiles={20}
                />
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Fluxo de Trabalho a Aplicar</label>
                    <select value={selectedWorkflowId} onChange={e => setSelectedWorkflowId(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base" disabled={isBatchProcessing}>
                        {allWorkflows.map(wf => (
                            <option key={wf.id} value={wf.id}>{wf.name}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleStart}
                    disabled={isBatchProcessing || files.length === 0}
                    className="w-full mt-auto bg-gradient-to-br from-blue-600 to-indigo-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <LazyIcon name="ClipboardIcon" className="w-5 h-5" />
                    Iniciar Processamento
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col p-4">
                {isBatchProcessing && (
                    <div className="m-auto text-center w-full max-w-md">
                        <Spinner />
                        <p className="mt-4 font-semibold text-lg text-gray-200">Processando...</p>
                        <p className="mt-1 text-sm text-gray-400">Imagem {batchProgress?.current} de {batchProgress?.total}</p>
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                          <div className="bg-blue-500 h-2.5 rounded-full" style={{width: `${(batchProgress?.current ?? 0) / (batchProgress?.total ?? 1) * 100}%`}}></div>
                        </div>
                    </div>
                )}
                {!isBatchProcessing && processedFiles.length > 0 && (
                     <div className="w-full h-full flex flex-col">
                        <div className="flex justify-between items-center mb-2 flex-shrink-0">
                           <h3 className="text-lg font-semibold">Resultados ({processedFiles.length})</h3>
                           <button onClick={handleDownloadAll} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-md text-sm">
                                <LazyIcon name="DownloadIcon" className="w-5 h-5"/> Baixar Tudo
                           </button>
                        </div>
                        <div className="flex-grow overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-1">
                           {processedFiles.map((file, index) => (
                               <div key={index} className="relative aspect-square group bg-gray-900/50 rounded-md">
                                    {file.processed === 'ERROR' ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-red-400 text-xs text-center p-2">
                                            <LazyIcon name="InformationCircleIcon" className="w-6 h-6 mb-1"/>
                                            <span>Falha</span>
                                        </div>
                                    ) : (
                                        <img src={file.processed} alt={`Resultado ${index+1}`} className="w-full h-full object-contain" />
                                    )}
                               </div>
                           ))}
                        </div>
                    </div>
                )}
                 {!isBatchProcessing && processedFiles.length === 0 && (
                    <div className="m-auto text-center text-gray-500">
                        <LazyIcon name="ClipboardIcon" className="w-16 h-16 mx-auto" />
                        <p className="mt-2 font-semibold">Os resultados aparecerão aqui</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default BatchProcessingPanel;