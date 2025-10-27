/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../../context/EditorContext';
import LazyIcon from '../LazyIcon';

const PortraitsPanel: React.FC = () => {
    const { setActiveTool, isLoading } = useEditor();

    const tools = [
        {
            id: 'faceRecovery',
            name: 'Recuperação de Rosto',
            description: 'Restaura detalhes faciais e melhora a qualidade de retratos.',
            icon: 'FaceSmileIcon',
        },
        {
            id: 'aiPortraitStudio',
            name: 'Estúdio de Retrato IA',
            description: 'Transforme retratos com estilos criativos como Caricatura, Pixar, etc.',
            icon: 'SparkleIcon',
        },
        {
            id: 'confidentStudio',
            name: 'Retrato de Estúdio',
            description: 'Crie um retrato profissional e cinematográfico com um clique.',
            icon: 'UserIcon',
        }
    ];

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Retratos IA</h3>
                <p className="text-sm text-gray-400 -mt-1">
                    Acesse um conjunto de ferramentas para aprimorar retratos.
                </p>
            </div>
            
            <div className="space-y-3">
                {tools.map(tool => (
                    <button
                        key={tool.id}
                        onClick={() => setActiveTool(tool.id as any)}
                        disabled={isLoading}
                        className="w-full text-left p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors disabled:opacity-50 flex items-center gap-4"
                    >
                        <div className="p-2 bg-gray-700/50 rounded-md">
                           <LazyIcon name={tool.icon} className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-white">{tool.name}</p>
                            <p className="text-xs text-gray-400">{tool.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PortraitsPanel;