/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useEditor } from '../../../context/EditorContext';
import TipBox from '../common/TipBox';
import ToggleSwitch from '../common/ToggleSwitch';
import LazyIcon from '../LazyIcon';

const ImageRestorePanel: React.FC = () => {
    const { isLoading, handleRestorePhoto } = useEditor();
    const [colorize, setColorize] = useState(true);

    return (
        <div className="w-full bg-gray-800/50 rounded-lg flex flex-col items-center gap-6 animate-fade-in backdrop-blur-sm">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-100">Restauração de Foto</h3>
                <p className="text-sm text-gray-400 mt-1">Motor de Restauração de Nova Geração.</p>
            </div>
            
            <div className="w-full border-t border-gray-700/50 my-2"></div>

            <p className="text-sm text-gray-300 text-center">
                Esta ferramenta unificada utiliza um modelo avançado para aumentar a resolução, nitidez, remover ruído e restaurar detalhes faciais, tudo para um resultado profissional com um único clique.
            </p>

            <div className="w-full flex items-center justify-between p-3 bg-gray-900/30 rounded-lg border border-gray-700/50">
                <label htmlFor="colorize-toggle" className="font-semibold text-gray-200 text-sm cursor-pointer">
                    Colorir foto (se P&B)
                </label>
                <ToggleSwitch id="colorize-toggle" checked={colorize} onChange={setColorize} disabled={isLoading} />
            </div>

            <button
                onClick={() => handleRestorePhoto(colorize)}
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-px active:scale-95 text-base disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <LazyIcon name="SparkleIcon" className="w-5 h-5" />
                Aprimorar Imagem
            </button>
            <TipBox>
                Este é um poderoso restaurador completo. Ele melhora rostos, remove ruído, arranhões e aumenta a nitidez com um único clique. Ative a opção "Colorir" para dar vida nova a fotos em preto e branco.
            </TipBox>
        </div>
    );
};

export default ImageRestorePanel;