/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { type Workflow, type WorkflowIconType } from '../../types';
import LazyIcon from './LazyIcon';

const iconMap: Record<WorkflowIconType, { name: string, className: string }> = {
    product: { name: 'SparkleIcon', className: 'text-yellow-400' },
    restore: { name: 'FaceSmileIcon', className: 'text-pink-400' },
    creative: { name: 'PaletteIcon', className: 'text-amber-400' },
    custom: { name: 'WorkflowIcon', className: 'text-blue-400' },
};

const WorkflowCard: React.FC<{ workflow: Workflow }> = ({ workflow }) => {
    const { executeWorkflow } = useEditor();
    const iconInfo = iconMap[workflow.icon];

    return (
        <div
            className="group relative bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-left transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-blue-500/10"
        >
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-gray-900/50 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-500/20">
                    <LazyIcon name={iconInfo.name} className={`w-8 h-8 ${iconInfo.className}`} />
                </div>
                <div className="flex-grow">
                    <h3 className="font-semibold text-lg text-white">{workflow.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{workflow.description}</p>
                </div>
            </div>
             <button
                onClick={() => executeWorkflow(workflow.toolIds)}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
            >
                Iniciar Fluxo de Trabalho
            </button>
        </div>
    );
};

const SavedWorkflows: React.FC = () => {
    const { savedWorkflows } = useEditor();

    if (!savedWorkflows || savedWorkflows.length === 0) {
        return null;
    }

    return (
        <div className="mb-12 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                    <LazyIcon name="WorkflowIcon" className="w-7 h-7" />
                    Seus Fluxos de Trabalho Rápidos
                </h2>
                <p className="text-gray-400 mt-1">Atalhos salvos com base no seu uso.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedWorkflows.map(workflow => (
                    <WorkflowCard key={workflow.id} workflow={workflow} />
                ))}
            </div>
        </div>
    );
};

export default SavedWorkflows;