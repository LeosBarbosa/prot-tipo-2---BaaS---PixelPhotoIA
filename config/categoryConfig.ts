/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ToolCategory } from '../types';

export interface CategoryInfo {
    title: string;
    icon: string;
    colorClasses: {
        bg: string;
        text: string;
        border: string;
        shadow: string;
        glowFilter: string; // Added for icon hover effect
    };
}

export const categoryConfig: Record<ToolCategory, CategoryInfo> = {
    generation: {
        title: "Geração",
        icon: 'GenerationIcon',
        colorClasses: { 
            bg: 'bg-purple-600', 
            text: 'text-purple-400', 
            border: 'border-purple-500',
            shadow: 'hover:shadow-purple-500/10',
            glowFilter: 'group-hover:drop-shadow-[0_0_4px_rgba(192,132,252,0.7)]' // Cor: purple-400
        }
    },
    workflow: {
        title: "Fluxos de Trabalho",
        icon: 'WorkflowIcon',
        colorClasses: { 
            bg: 'bg-blue-600', 
            text: 'text-blue-400', 
            border: 'border-blue-500',
            shadow: 'hover:shadow-blue-500/10',
            glowFilter: 'group-hover:drop-shadow-[0_0_4px_rgba(96,165,250,0.7)]' // Cor: blue-400
        }
    },
    editing: {
        title: "Edição",
        icon: 'EditingIcon',
        colorClasses: { 
            bg: 'bg-teal-600', 
            text: 'text-teal-400', 
            border: 'border-teal-500',
            shadow: 'hover:shadow-teal-500/10',
            glowFilter: 'group-hover:drop-shadow-[0_0_4px_rgba(45,212,191,0.7)]' // Cor: teal-400
        }
    },
};