/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { SparkleIcon, SwapIcon, BullseyeIcon, UserIcon, AdjustmentsHorizontalIcon } from '../icons';
import ImageDropzone from './common/ImageDropzone';
import TipBox from '../common/TipBox';
import { type DetectedObject } from '../../types';
import CollapsibleToolPanel from '../CollapsibleToolPanel';

const FaceSwapPanel: React.FC = () => {
    const {
        isLoading,
        handleDetectFaces,
        detectedObjects,
        handleSelectObject,
        handleFaceSwap,
        baseImageFile,
        setToast,
        setHighlightedObject,
        highlightedObject,
    } = useEditor();

    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [userPrompt, setUserPrompt] = useState<string>('');
    const [selectedFace, setSelectedFace] = useState<DetectedObject | null>(null);
    const [expandedStep, setExpandedStep] = useState<number>(1);

    useEffect(() => {
        if (highlightedObject && detectedObjects?.includes(highlightedObject)) {
            if (selectedFace?.box !== highlightedObject.box) {
                setSelectedFace(highlightedObject);
            }
        }
    }, [highlightedObject, detectedObjects, selectedFace]);

    useEffect(() => {
        if (!detectedObjects) {
            setSelectedFace(null);
        }
    }, [detectedObjects]);


    const handleFaceClick = (face: DetectedObject) => {
        setSelectedFace(face);
        handleSelectObject(face);
        // Move to next step automatically
        setExpandedStep(2);
    };

    const handleMouseLeaveList = () => {
        setHighlightedObject(selectedFace);
    };

    const onSwap = () => {
        if (sourceImage && selectedFace) {
            handleFaceSwap(sourceImage, userPrompt);
        } else {
            setToast({ message: "Por favor, selecione um rosto de origem e um de destino.", type: 'error' });
        }
    };
    
    const handleExpandToggle = (step: number) => {
        setExpandedStep(prev => (prev === step ? 0 : step));
    };

    const isReadyForSwap = baseImageFile && sourceImage && selectedFace;

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Troca de Rosto (Face Swap)</h3>
                <p className="text-sm text-gray-400 -mt-1">
                    Substitua um rosto na sua foto por outro.
                </p>
            </div>

            <CollapsibleToolPanel
                title="Passo 1: Selecione o rosto a substituir"
                icon={<BullseyeIcon className="w-5 h-5" />}
                isExpanded={expandedStep === 1}
                onExpandToggle={() => handleExpandToggle(1)}
            >
                {!detectedObjects ? (
                    <button
                        type="button"
                        onClick={handleDetectFaces}
                        disabled={isLoading || !baseImageFile}
                        className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <SparkleIcon className="w-5 h-5" />
                        Detetar Rostos na Imagem
                    </button>
                ) : (
                    <div className="bg-gray-900/30 p-2 rounded-lg border border-gray-700 max-h-40 overflow-y-auto" onMouseLeave={handleMouseLeaveList}>
                         <p className="text-xs text-center text-gray-400 mb-2">Clique num rosto para o selecionar.</p>
                         <ul className="flex flex-wrap gap-2 justify-center">
                             {detectedObjects.length > 0 ? detectedObjects.map((obj, i) => (
                                 <li key={`face-${i}`}>
                                     <button
                                         type="button"
                                         onClick={() => handleFaceClick(obj)}
                                         onMouseEnter={() => setHighlightedObject(obj)}
                                         className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedFace === obj ? 'bg-blue-500 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70'}`}
                                     >
                                         Rosto {i + 1}
                                     </button>
                                 </li>
                             )) : <p className="text-sm text-gray-500">Nenhum rosto detetado.</p>}
                         </ul>
                     </div>
                )}
            </CollapsibleToolPanel>
            
            <CollapsibleToolPanel
                title="Passo 2: Forneça o novo rosto"
                icon={<UserIcon className="w-5 h-5" />}
                isExpanded={expandedStep === 2}
                onExpandToggle={() => handleExpandToggle(2)}
            >
                <ImageDropzone 
                    imageFile={sourceImage}
                    onFileSelect={setSourceImage}
                    label="Imagem do Rosto de Origem"
                 />
            </CollapsibleToolPanel>

            <CollapsibleToolPanel
                title="Passo 3: Ajustes Finos (Opcional)"
                icon={<AdjustmentsHorizontalIcon className="w-5 h-5" />}
                isExpanded={expandedStep === 3}
                onExpandToggle={() => handleExpandToggle(3)}
            >
                <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="Ex: 'faça a expressão um pouco mais sorridente', 'ajuste o tom de pele para ser mais bronzeado'..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base min-h-[80px]"
                    disabled={isLoading}
                    rows={3}
                />
            </CollapsibleToolPanel>
             <TipBox>
                Para melhores resultados, use uma imagem de origem com o rosto virado para a frente e bem iluminado. A IA tentará corresponder à iluminação e ao ângulo automaticamente.
            </TipBox>

            <button
                type="button"
                onClick={onSwap}
                disabled={!isReadyForSwap || isLoading}
                className="w-full bg-gradient-to-br from-red-600 to-rose-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
            >
                <SwapIcon className="w-5 h-5" />
                Trocar Rosto
            </button>
        </div>
    );
};

export default FaceSwapPanel;
