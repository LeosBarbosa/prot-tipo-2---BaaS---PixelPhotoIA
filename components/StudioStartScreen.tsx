/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../context/EditorContext';
import StartScreen from './StartScreen';
import RecentTools from './RecentTools';
import SavedWorkflows from './SavedWorkflows';
import PromptSuggestions from './PromptSuggestions';
import RestoredSessionCard from './RestoredSessionCard';

const StudioStartScreen: React.FC = () => {
    const { handleFileSelect, hasRestoredSession } = useEditor();

    return (
        <div className="container mx-auto px-4 py-8 sm:py-12 animate-fade-in h-full overflow-y-auto scrollbar-thin">
            <div className="mb-12">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 text-transparent bg-clip-text animate-text-gradient-pan">
                    Dê Vida às Suas Imagens
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400 text-center mb-8 animate-fade-in-text" style={{ animationDelay: '200ms' }}>
                   Faça upload de uma foto para começar a editar ou use nossas ferramentas para criar algo novo do zero.
                </p>
                {hasRestoredSession ? (
                    <RestoredSessionCard />
                ) : (
                    <StartScreen onFileSelect={handleFileSelect} />
                )}
            </div>
            
            <div className="mt-8 space-y-12">
                <RecentTools />
                <SavedWorkflows />
                <PromptSuggestions />
            </div>
        </div>
    );
};

export default StudioStartScreen;