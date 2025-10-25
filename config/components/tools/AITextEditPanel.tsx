/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useEditor } from '../../context/EditorContext';
import TipBox from '../common/TipBox';
import LazyIcon from '../LazyIcon';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';

const AITextEditPanel: React.FC = () => {
    const {
        isLoading,
        prompt,
        setPrompt,
        handleEditTextWithPrompt,
        baseImageFile
    } = useEditor();
    
    const [negativePrompt, setNegativePrompt] = React.useState(''); 

    const handleApply = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            handleEditTextWithPrompt(prompt);
        }
    };

    const isDisabled = isLoading || !baseImageFile || !prompt.trim();

    return (
        <form onSubmit={handleApply} className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Edição Mágica por Texto</h3>
                <p className="text-sm text-gray-400 -mt-1">
                    Descreva a edição que você quer fazer.
                </p>
            </div>

            <CollapsiblePromptPanel
                title="Descrição da Edição"
                prompt={prompt}
                setPrompt={setPrompt}
                negativePrompt={negativePrompt}
                onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                isLoading={isLoading}
                toolId="aiTextEdit"
                promptPlaceholder="Ex: adicione um filtro retrô, remova a pessoa no fundo..."
                promptHelperText="Seja descritivo. Você pode pedir para adicionar filtros, mudar cores, remover/adicionar objetos e mais."
            />
            
            <TipBox>
                Esta ferramenta usa IA para interpretar seu pedido e editar a imagem. Funciona melhor com instruções claras e diretas.
            </TipBox>

            <button
                type="submit"
                disabled={isDisabled}
                className="w-full mt-2 bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
            >
                <LazyIcon name="MagicWandIcon" className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
                {isLoading ? 'Aplicando...' : 'Aplicar Edição Mágica'}
            </button>
        </form>
    );
};

export default AITextEditPanel;