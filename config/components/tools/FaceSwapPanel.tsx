/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useMemo } from 'react';
import { useEditor } from '../../../context/EditorContext';
import ImageDropzone from './common/ImageDropzone';
import LazyIcon from '../LazyIcon';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import { dataURLtoFile } from '../../../utils/imageUtils';
import { type DetectedObject, type ImageLayer } from '../../../types';
import Spinner from '../Spinner';
import ComparisonSlider from '../ComparisonSlider';

const FaceSwapPanel: React.FC = () => {
    const {
        isLoading,
        handleFaceSwap,
        handleDetectFaces,
        detectedObjects,
        setDetectedObjects,
        activeLayerId,
        layers,
        commitChange,
        setToast,
        setIsEditCompleted,
        imgRef,
        currentImageUrl,
    } = useEditor();
    
    const [selectedTargetFace, setSelectedTargetFace] = useState<DetectedObject | null>(null);
    const [sourceImage, setSourceImage] = useState<File[]>([]);
    
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [blendIntensity, setBlendIntensity] = useState(100);

    useEffect(() => {
        // Limpar o estado quando a camada ativa mudar
        return () => {
            if (setDetectedObjects) setDetectedObjects(null);
        };
    }, [activeLayerId, setDetectedObjects]);

    const activeLayer = layers.find(l => l.id === activeLayerId);
    const isImageLayerActive = activeLayer?.type === 'image';

    const handleGenerate = async () => {
        const sourceFile = sourceImage[0];
        if (!sourceFile || !selectedTargetFace) return;
        
        try {
            const resultUrl = await handleFaceSwap(sourceFile, selectedTargetFace, prompt, negativePrompt);
            if (resultUrl) {
                setPreviewUrl(resultUrl);
            }
        } catch(e) {
            // O erro já é tratado e exibido por um toast no serviço/contexto
            console.error(e);
        }
    };
    
    const handleApply = async () => {
        if (!previewUrl || !activeLayer || activeLayer.type !== 'image' || !currentImageUrl) return;

        const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = src;
        });
        
        try {
            const [originalImg, swappedImg] = await Promise.all([loadImage(currentImageUrl), loadImage(previewUrl)]);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setToast({ message: 'Erro ao criar canvas para mesclagem.', type: 'error' });
                return;
            }

            canvas.width = originalImg.naturalWidth;
            canvas.height = originalImg.naturalHeight;
            
            ctx.drawImage(originalImg, 0, 0);

            ctx.globalAlpha = blendIntensity / 100;
            ctx.drawImage(swappedImg, 0, 0, originalImg.naturalWidth, originalImg.naturalHeight);
            ctx.globalAlpha = 1.0;

            const finalDataUrl = canvas.toDataURL('image/png');
            const finalFile = dataURLtoFile(finalDataUrl, `swapped-blended-${(activeLayer as ImageLayer).file.name}`);
            
            const newLayers = layers.map(layer => {
                if (layer.id === activeLayerId) {
                    return { ...layer, file: finalFile };
                }
                return layer;
            });

            commitChange(newLayers, activeLayerId, 'faceSwap', { prompt, negativePrompt, blend: blendIntensity });
            setToast({ message: 'Troca de rosto aplicada com sucesso!', type: 'success' });
            setIsEditCompleted(true);
            resetFlow();

        } catch (e) {
            console.error("Error blending images:", e);
            setToast({ message: 'Erro ao processar a mesclagem da imagem.', type: 'error' });
        }
    };

    const resetFlow = () => {
        if (setDetectedObjects) setDetectedObjects(null);
        setSelectedTargetFace(null);
        setSourceImage([]);
        setPreviewUrl(null);
        setPrompt('');
        setNegativePrompt('');
        setBlendIntensity(100);
    };

    const faceThumbnails = useMemo(() => {
        if (!detectedObjects || !imgRef.current) return [];
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return [];

        return detectedObjects.map(face => {
            const { box } = face;
            const x = box.x_min * image.naturalWidth;
            const y = box.y_min * image.naturalHeight;
            const width = (box.x_max - box.x_min) * image.naturalWidth;
            const height = (box.y_max - box.y_min) * image.naturalHeight;
            
            const padding = width * 0.2;
            const sx = Math.max(0, x - padding);
            const sy = Math.max(0, y - padding);
            const sWidth = width + padding * 2;
            const sHeight = height + padding * 2;

            canvas.width = sWidth;
            canvas.height = sHeight;
            ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
            return { dataUrl: canvas.toDataURL(), face };
        });
    }, [detectedObjects, imgRef, currentImageUrl]);

    if (!isImageLayerActive) {
        return <p className="text-center text-gray-400 p-4">Selecione uma camada de imagem para usar esta ferramenta.</p>;
    }
    
    if (previewUrl && currentImageUrl) {
        return (
            <div className="w-full flex flex-col gap-4 animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-200 text-center">Pré-visualização e Refinamento</h3>
                
                <div className="relative aspect-video bg-black/20 rounded-md">
                   <ComparisonSlider originalSrc={currentImageUrl} modifiedSrc={previewUrl} opacity={blendIntensity} mode="opacity" />
                </div>

                <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                    <h4 className="font-bold text-white text-md mb-2">Refinamento Manual</h4>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-300 flex justify-between">
                            <span>Intensidade da Mesclagem</span>
                            <span className="text-white font-mono">{blendIntensity}%</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={blendIntensity}
                            onChange={(e) => setBlendIntensity(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-2">
                    <button onClick={resetFlow} disabled={isLoading} className="w-full bg-gray-700/60 hover:bg-gray-600/80 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                        Cancelar
                    </button>
                    <button onClick={handleApply} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center gap-2">
                        <LazyIcon name="CheckCircleIcon" className="w-5 h-5" />
                        Aceitar e Aplicar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className={`p-4 rounded-lg border ${!detectedObjects ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-900/30'}`}>
                <h3 className="font-bold text-white text-md mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-xs">1</span>
                    Detectar Rostos
                </h3>
                <p className="text-xs text-gray-400 mb-3">Primeiro, encontre os rostos na sua imagem.</p>
                <button onClick={handleDetectFaces} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm disabled:opacity-50">
                    {isLoading && !detectedObjects ? 'Detectando...' : detectedObjects ? `${detectedObjects.length} Rosto(s) Detectado(s)` : 'Detectar Rostos'}
                </button>
            </div>

            {isLoading && !detectedObjects && <div className="flex justify-center p-4"><Spinner /></div>}
            
            {detectedObjects && (
                <div className={`p-4 rounded-lg border animate-fade-in ${detectedObjects.length > 0 && !selectedTargetFace ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-900/30'}`}>
                    <h3 className="font-bold text-white text-md mb-2 flex items-center gap-2"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-xs">2</span>Selecione o Rosto Alvo</h3>
                    {detectedObjects.length === 0 ? (
                        <p className="text-sm text-center text-yellow-400 py-2">Nenhum rosto encontrado. Tente a Seleção Manual.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2 justify-center">
                            {faceThumbnails.map(({ dataUrl, face }, index) => (
                                <button key={index} onClick={() => setSelectedTargetFace(face)} className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${selectedTargetFace === face ? 'border-blue-400 scale-110 ring-2 ring-blue-400' : 'border-gray-600 hover:border-blue-500'}`}>
                                    <img src={dataUrl} alt={`Face ${index + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            <div className={`p-4 rounded-lg border ${selectedTargetFace && sourceImage.length === 0 ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-900/30'}`}>
                <h3 className="font-bold text-white text-md mb-2 flex items-center gap-2"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-xs">3</span>Forneça o Rosto Fonte</h3>
                 <ImageDropzone files={sourceImage} onFilesChange={setSourceImage} label="Imagem do Rosto Fonte"/>
                 <div className="my-2"><CollapsiblePromptPanel title="Instruções Adicionais (Opcional)" prompt={prompt} setPrompt={setPrompt} negativePrompt={negativePrompt} onNegativePromptChange={(e) => setNegativePrompt(e.target.value)} isLoading={isLoading} toolId="faceSwap" promptPlaceholder="Ex: adicione um leve sorriso..."/></div>
            </div>
            
            <button
                onClick={handleGenerate}
                disabled={isLoading || sourceImage.length === 0 || !selectedTargetFace}
                className="w-full mt-2 bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50"
            >
                <LazyIcon name="SwapIcon" className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
                {isLoading ? 'Trocando...' : 'Realizar Troca'}
            </button>
        </div>
    );
};

export default FaceSwapPanel;