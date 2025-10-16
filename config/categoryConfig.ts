/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { type ToolCategory } from '../types';
import { GenerationIcon, WorkflowIcon, EditingIcon } from '../components/icons';

export interface CategoryInfo {
    title: string;
    icon: React.ReactElement<{ className?: string }>;
    colorClasses: {
        bg: string;
        text: string;
        border: string;
        shadow: string;
    };
}

export const categoryConfig: Record<ToolCategory, CategoryInfo> = {
    generation: {
        title: "Geração",
        // FIX: Replaced JSX <GenerationIcon /> with React.createElement(GenerationIcon) to fix TS error in .ts file.
        icon: React.createElement(GenerationIcon),
        colorClasses: { 
            bg: 'bg-purple-600', 
            text: 'text-purple-400', 
            border: 'border-purple-500',
            shadow: 'hover:shadow-purple-500/10'
        }
    },
    workflow: {
        title: "Fluxos de Trabalho",
        // FIX: Replaced JSX <WorkflowIcon /> with React.createElement(WorkflowIcon) to fix TS error in .ts file.
        icon: React.createElement(WorkflowIcon),
        colorClasses: { 
            bg: 'bg-blue-600', 
            text: 'text-blue-400', 
            border: 'border-blue-500',
            shadow: 'hover:shadow-blue-500/10'
        }
    },
    editing: {
        title: "Edição",
        // FIX: Replaced JSX <EditingIcon /> with React.createElement(EditingIcon) to fix TS error in .ts file.
        icon: React.createElement(EditingIcon),
        colorClasses: { 
            bg: 'bg-teal-600', 
            text: 'text-teal-400', 
            border: 'border-teal-500',
            shadow: 'hover:shadow-teal-500/10'
        }
    },
};
