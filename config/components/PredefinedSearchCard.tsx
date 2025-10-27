/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { type PredefinedSearch } from '../../types';
import LazyIcon from './LazyIcon';

interface PredefinedSearchCardProps {
  result: PredefinedSearch;
}

const PredefinedSearchCard: React.FC<PredefinedSearchCardProps> = ({ result }) => {
    const { handlePredefinedSearchAction } = useEditor();

    return (
        <div className="max-w-2xl mx-auto mb-8 animate-zoom-rise">
            <div
                className="group relative bg-gray-800/60 border-2 border-blue-500/50 rounded-xl p-6 text-left transition-all duration-300 shadow-lg shadow-blue-500/10"
            >
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-gray-900/50 rounded-lg">
                        <LazyIcon name={result.icon} className="w-8 h-8" />
                    </div>
                    <div className="flex-grow">
                        <h3 className="font-semibold text-lg text-white">{result.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">{result.description}</p>
                    </div>
                </div>
                 <button
                    onClick={() => handlePredefinedSearchAction(result.action)}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                >
                    Iniciar Agora
                </button>
            </div>
        </div>
    );
};

export default PredefinedSearchCard;