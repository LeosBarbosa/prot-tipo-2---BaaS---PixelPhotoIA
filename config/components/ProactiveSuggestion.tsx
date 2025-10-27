/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import LazyIcon from './LazyIcon';

interface ProactiveSuggestionProps {
    message: string;
    acceptLabel: string;
    onAccept: () => void;
}

const ProactiveSuggestion: React.FC<ProactiveSuggestionProps> = ({ message, acceptLabel, onAccept }) => {
    const { setProactiveSuggestion } = useEditor();
    const [isExiting, setIsExiting] = useState(false);

    const handleDismiss = () => {
        setIsExiting(true);
    };

    const handleAccept = () => {
        onAccept();
        handleDismiss();
    };

    useEffect(() => {
        if (isExiting) {
            const timer = setTimeout(() => {
                setProactiveSuggestion(null);
            }, 300); // Corresponde à duração da animação de saída
            return () => clearTimeout(timer);
        }
    }, [isExiting, setProactiveSuggestion]);

    // Auto-dismiss after some time
    useEffect(() => {
        const autoDismissTimer = setTimeout(() => {
            handleDismiss();
        }, 15000); // 15 segundos
        return () => clearTimeout(autoDismissTimer);
    }, []);

    return (
        <div
            className={`fixed bottom-6 right-6 z-[200] w-full max-w-sm rounded-xl bg-gray-800/80 backdrop-blur-md shadow-2xl border border-blue-500/30 transition-all duration-300 ${isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'} animate-zoom-rise`}
            role="alertdialog"
            aria-labelledby="suggestion-title"
            aria-describedby="suggestion-message"
        >
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-blue-400 mt-1">
                        <LazyIcon name="LightbulbIcon" className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                        <h3 id="suggestion-title" className="font-bold text-white">Assistente de IA</h3>
                        <p id="suggestion-message" className="text-sm text-gray-300 mt-1">{message}</p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-1 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                        aria-label="Dispensar sugestão"
                    >
                        <LazyIcon name="CloseIcon" className="w-5 h-5" />
                    </button>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleAccept}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                    >
                        <LazyIcon name="CheckCircleIcon" className="w-5 h-5" />
                        {acceptLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProactiveSuggestion;