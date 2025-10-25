/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { type Workflow, type WorkflowIconType } from '../types';
import LazyIcon from './LazyIcon';

const icons: { id: WorkflowIconType, iconName: string }[] = [
    { id: 'restore', iconName: 'FaceSmileIcon' },
    { id: 'product', iconName: 'SparkleIcon' },
    { id: 'creative', iconName: 'PaletteIcon' },
    { id: 'custom', iconName: 'WorkflowIcon' },
];

const SaveWorkflowModal: React.FC = () => {
    const { setIsSaveWorkflowModalOpen, toolHistory, addWorkflow, setToast } = useEditor()!;
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState<WorkflowIconType>('custom');
    
    const handleSave = () => {
        if (!name.trim()) {
            setToast({ message: 'Por favor, dê um nome ao seu fluxo de trabalho.', type: 'error' });
            return;
        }

        const newWorkflow: Workflow = {
            id: `user_${Date.now()}`,
            name,
            description,
            // FIX: Map over ToolHistoryItem[] to get ToolId[]
            toolIds: toolHistory.map(item => item.toolId),
            icon: selectedIcon,
            isUserDefined: true,
        };
        
        addWorkflow(newWorkflow);
        setToast({ message: 'Fluxo de trabalho salvo com sucesso!', type: 'success' });
        setIsSaveWorkflowModalOpen(false);
    };

    return (
        <div 
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setIsSaveWorkflowModalOpen(false)}
        >
            <div 
                className="w-full max-w-lg bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-700 animate-zoom-rise"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <LazyIcon name="WorkflowIcon" className="w-6 h-6 text-blue-400" />
                        Salvar Fluxo de Trabalho
                    </h2>
                    <button onClick={() => setIsSaveWorkflowModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                        <LazyIcon name="CloseIcon" className="w-6 h-6" />
                    </button>
                </header>
                <div className="p-6 space-y-4">
                    <p className="text-gray-300">Salve a sequência de ferramentas que você usou como um fluxo de trabalho rápido para uso futuro.</p>
                    
                    <div>
                        <label htmlFor="workflow-name" className="block text-sm font-medium text-gray-300 mb-1">Nome do Fluxo de Trabalho</label>
                        <input
                            id="workflow-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-base text-white"
                            placeholder="Ex: Restauração de Foto Antiga"
                        />
                    </div>

                    <div>
                        <label htmlFor="workflow-description" className="block text-sm font-medium text-gray-300 mb-1">Descrição (Opcional)</label>
                        <textarea
                            id="workflow-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-base text-white min-h-[80px]"
                            placeholder="Ex: Recupera rostos e remove ruído."
                            rows={3}
                        />
                    </div>
                    
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ícone</label>
                        <div className="flex justify-center gap-3">
                            {icons.map(({ id, iconName }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setSelectedIcon(id)}
                                    className={`p-3 rounded-lg transition-all ${selectedIcon === id ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700/50 hover:bg-gray-600/50'}`}
                                >
                                    <LazyIcon name={iconName} className="w-6 h-6" />
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
                 <footer className="p-4 bg-gray-900/30 border-t border-gray-700/50 flex justify-end gap-3">
                     <button onClick={() => setIsSaveWorkflowModalOpen(false)} className="bg-gray-700/60 hover:bg-gray-600/80 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                        Salvar Fluxo de Trabalho
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SaveWorkflowModal;