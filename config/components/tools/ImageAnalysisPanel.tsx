/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useEditor } from '../../../context/EditorContext';
import LazyIcon from '../LazyIcon';
import Spinner from '../Spinner';

const ImageAnalysisPanel: React.FC = () => {
    const { 
        isLoading, 
        baseImageFile,
        handleAnalyzeImage,
    } = useEditor();
    
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');

    const handleAsk = async () => {
        if (!question.trim() || !baseImageFile) return;
        setAnswer('');
        const response = await handleAnalyzeImage(question);
        if (response) {
            setAnswer(response);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAsk();
        }
    };

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Analisar Imagem</h3>
                <p className="text-sm text-gray-400 -mt-1">
                    Faça perguntas sobre a imagem atual.
                </p>
            </div>

            <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: O que é o objeto principal? Descreva a iluminação. Que estilo de arte é este?"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base min-h-[100px]"
                disabled={isLoading}
                rows={4}
            />

            <button
                onClick={handleAsk}
                disabled={isLoading || !question.trim() || !baseImageFile}
                className="w-full bg-gradient-to-br from-blue-600 to-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:cursor-not-allowed"
            >
                <LazyIcon name="SearchIcon" className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
                {isLoading ? 'Analisando...' : 'Perguntar à IA'}
            </button>
            
            {(isLoading || answer) && (
                 <div className="mt-2 p-4 bg-gray-900/50 border border-gray-700 rounded-lg min-h-[150px]">
                    <h4 className="font-bold text-white text-md mb-2">Resposta da IA</h4>
                    {isLoading && !answer ? (
                        <div className="flex justify-center items-center py-4">
                            <Spinner />
                        </div>
                    ) : (
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{answer}</p>
                    )}
                 </div>
            )}
        </div>
    );
};

export default ImageAnalysisPanel;