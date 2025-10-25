/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor } from '../../context/EditorContext';
import LazyIcon from '../LazyIcon';

const VoiceAssistantPanel: React.FC = () => {
    const { 
        startVoiceSession, 
        stopVoiceSession,
        voiceState,
        voiceTranscript,
    } = useEditor();

    const [isListening, setIsListening] = useState(false);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [voiceTranscript]);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopVoiceSession();
            setIsListening(false);
        } else {
            startVoiceSession();
            setIsListening(true);
        }
    }, [isListening, startVoiceSession, stopVoiceSession]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Ensure session is stopped if component unmounts while active
            if (voiceState === 'CONNECTED' || voiceState === 'CONNECTING') {
                stopVoiceSession();
            }
        };
    }, [voiceState, stopVoiceSession]);

    // Sync local listening state with global context state
    useEffect(() => {
        if (voiceState === 'CONNECTED' || voiceState === 'CONNECTING') {
            setIsListening(true);
        } else {
            setIsListening(false);
        }
    }, [voiceState]);

    const getStatusInfo = (): { text: string; color: string } => {
        switch (voiceState) {
            case 'IDLE':
                return { text: 'Inativo', color: 'text-gray-400' };
            case 'CONNECTING':
                return { text: 'Conectando...', color: 'text-yellow-400 animate-pulse' };
            case 'CONNECTED':
                return { text: 'Conectado e ouvindo...', color: 'text-green-400' };
            case 'DISCONNECTED':
                return { text: 'Desconectado', color: 'text-red-400' };
            case 'ERROR':
                return { text: 'Erro na Conexão', color: 'text-red-500' };
            default:
                return { text: 'Desconhecido', color: 'text-gray-500' };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <div className="p-4 md:p-6 flex flex-col gap-6 h-full">
            <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-200">Assistente de Voz (Beta)</h3>
                <p className="text-sm text-gray-400 mt-1">Controle o editor com sua voz.</p>
            </div>

            <div className="flex flex-col items-center gap-4">
                 <button
                    onClick={toggleListening}
                    className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ${isListening ? 'bg-red-600 shadow-lg shadow-red-500/30' : 'bg-blue-600 shadow-lg shadow-blue-500/30'}`}
                    aria-label={isListening ? 'Parar de ouvir' : 'Começar a ouvir'}
                >
                    <LazyIcon name="MicrophoneIcon" className="w-10 h-10 text-white" />
                    {isListening && <div className="absolute inset-0 rounded-full border-4 border-white/50 animate-ping"></div>}
                </button>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${statusInfo.color.startsWith('text-yellow') ? 'bg-yellow-400' : statusInfo.color.startsWith('text-green') ? 'bg-green-400' : statusInfo.color.startsWith('text-red') ? 'bg-red-400' : 'bg-gray-400'}`}></div>
                    <span className={`text-sm font-semibold ${statusInfo.color}`}>{statusInfo.text}</span>
                </div>
            </div>

            <div className="flex-grow flex flex-col bg-black/20 p-3 rounded-lg border border-gray-700/50 min-h-[200px]">
                <h4 className="text-sm font-semibold text-gray-400 mb-2 border-b border-gray-600 pb-2">Transcrição</h4>
                <div className="flex-grow overflow-y-auto scrollbar-thin pr-2 text-gray-300">
                    {voiceTranscript.length === 0 && (
                        <p className="text-sm text-gray-500">Aguardando comandos...</p>
                    )}
                    {voiceTranscript.map((entry, index) => (
                        <p key={index} className={`text-sm mb-2 animate-fade-in ${entry.source === 'user' ? 'text-blue-300' : entry.source === 'ia' ? 'text-green-300' : 'text-yellow-400'}`}>
                           <strong className="font-bold capitalize">{entry.source === 'ia' ? 'IA' : entry.source === 'user' ? 'Você' : 'Sistema'}:</strong> {entry.text}
                        </p>
                    ))}
                    <div ref={transcriptEndRef} />
                </div>
            </div>
            
            <div className="text-xs text-gray-500 p-2 bg-gray-900/40 rounded-md">
                <p className="font-bold">Comandos Sugeridos:</p>
                <ul className="list-disc list-inside ml-2">
                    <li>"Desfazer" / "Refazer"</li>
                    <li>"Deixar mais claro" / "Mais contraste"</li>
                    <li>"Aplicar estilo de anime"</li>
                    <li>"Remover o fundo"</li>
                </ul>
            </div>
        </div>
    );
};

export default VoiceAssistantPanel;