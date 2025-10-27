/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../../context/EditorContext';
import TipBox from '../common/TipBox';
import LazyIcon from '../LazyIcon';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';

const NewAspectRatioPanel: React.FC = () => {
    const { 
        isLoading, 
        handleApplyNewAspectRatio, 
        prompt, 
        setPrompt,
        baseImageFile
    } = useEditor();
    
    const isDisabled = isLoading || !baseImageFile;

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Nova Proporção (16:9)</h3>
                <p className="text-sm text-gray-400 -mt-1">
                    Expanda sua imagem para a proporção de paisagem 16:9.
                </p>
            </div>

            <CollapsiblePromptPanel
                title="Descrição da Expansão (Opcional)"
                prompt={prompt}
                setPrompt={setPrompt}
                negativePrompt="" // Not used here but required by component
                onNegativePromptChange={() => {}} // Not used
                isLoading={isLoading}
                toolId="newAspectRatio"
                promptPlaceholder="Descreva o que adicionar no espaço expandido..."
                promptHelperText='Ex: "um céu estrelado com uma lua cheia", "continue a praia com areia e ondas".'
            />
            
            <TipBox>
                A IA irá expandir sua imagem para preencher uma tela 16:9. Descreva o que você gostaria de ver nas novas áreas para guiar a geração.
            </TipBox>

            <button
                onClick={handleApplyNewAspectRatio}
                disabled={isDisabled}
                className="w-full mt-2 bg-gradient-to-br from-indigo-600 to-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
            >
                <LazyIcon name="ExpandIcon" className="w-5 h-5" />
                Aplicar Proporção 16:9
            </button>
        </div>
    );
};

export default NewAspectRatioPanel;