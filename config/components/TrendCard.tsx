/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { type Trend } from '../../types';
import LazyIcon from './LazyIcon';

interface TrendCardProps {
  trend: Trend;
}

const TrendCard: React.FC<TrendCardProps> = ({ trend }) => {
    const { baseImageFile, handleApplyStyle, setToast, setIsEditingSessionActive, setActiveTab } = useEditor();

    const handleClick = () => {
        if (baseImageFile) {
            setIsEditingSessionActive(true);
            setActiveTab('style');
            // Give the editor a moment to open before applying the style,
            // which might rely on the editor's state.
            setTimeout(() => {
                handleApplyStyle(trend.prompt, true);
            }, 100);
        } else {
            setToast({ message: `Primeiro, carregue uma imagem para aplicar o estilo '${trend.name}'.`, type: 'info' });
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`group relative flex-shrink-0 w-64 h-40 rounded-xl p-4 text-left transition-all duration-300 transform hover:-translate-y-1 active:scale-95 shadow-lg hover:shadow-blue-500/10 overflow-hidden ${trend.bg}`}
        >
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors"></div>
            <div className="relative h-full flex flex-col justify-between">
                <div>
                    <div className="mb-2">
                        <LazyIcon name={trend.icon} className="w-8 h-8 text-white/80" />
                    </div>
                    <h3 className="font-bold text-lg text-white">{trend.name}</h3>
                </div>
                <p className="text-xs text-white/80 line-clamp-2">{trend.prompt}</p>
            </div>
        </button>
    );
};

export default TrendCard;