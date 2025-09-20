/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useLoadingError } from '../../context/EditorContext';
import { useMaskCanvas } from '../../hooks/useMaskCanvas';
import { generateInteriorDesign } from '../../services/geminiService';
import { dataURLtoFile } from '../../utils/imageUtils';
import Spinner from '../Spinner';
import { UploadIcon, SparkleIcon, BrushIcon } from '../icons';

const InteriorDesignPanel: React.FC = () => {
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);
    const [roomType, setRoomType] = useState<string>('Sala de Estar');
    const [roomStyle, setRoomStyle] = useState<string>('Moderno');
    const [prompt, setPrompt] = useState<string>('');
    const [brushSize, setBrushSize] = useState(40);

    const { isLoading, error, setError, setIsLoading, loadingMessage, setLoadingMessage } = useLoadingError();

    const imageRef = useRef<HTMLImageElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);

    const { maskDataUrl, startDrawing, stopDrawing, draw, clearMask } = useMaskCanvas(maskCanvasRef, brushSize);

    const imageUrl = useMemo(() => {
        if (generatedDesign) return generatedDesign;
        return uploadedImage ? URL.createObjectURL(uploadedImage) : null;
    }, [uploadedImage, generatedDesign]);

    const handleGenerate = async () => {
        if (!uploadedImage || !maskDataUrl) {
            setError("Por favor, carregue uma imagem e desenhe uma máscara sobre a área a ser alterada.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setLoadingMessage("Gerando novo design...");
        try {
            const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
            const resultDataUrl = await generateInteriorDesign(uploadedImage, maskFile, roomType, roomStyle, prompt);
            setGeneratedDesign(resultDataUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    };
    
    const handleFileSelect = useCallback((file: File) => {
      setUploadedImage(file);
      setGeneratedDesign(null);
      clearMask();
      setError(null);
    }, [clearMask, setError]);

    return (
        <div className="p-4 md:p-6 h-full flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <h2 className="text-xl font-bold text-white text-center">Controles da Reforma</h2>

                <div className="flex flex-col gap-4">
                    <label className="block text-sm font-medium text-gray-300">Tipo de Ambiente</label>
                    <select value={roomType} onChange={e => setRoomType(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base">
                        {['Sala de Estar', 'Quarto', 'Cozinha', 'Banheiro', 'Escritório', 'Sala de Jantar'].map(type => <option key={type} value={type}>{type}</option>)}
                    </select>

                    <label className="block text-sm font-medium text-gray-300">Estilo de Design</label>
                    <select value={roomStyle} onChange={e => setRoomStyle(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base">
                        {['Moderno', 'Minimalista', 'Industrial', 'Boêmio', 'Rústico', 'Contemporâneo', 'Escandinavo'].map(style => <option key={style} value={style}>{style}</option>)}
                    </select>

                    <label className="block text-sm font-medium text-gray-300">Instruções Adicionais</label>
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Ex: adicione uma planta grande, mude a cor da parede para azul..."
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base min-h-[100px]"
                        disabled={isLoading}
                    />
                    
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2"><BrushIcon className="w-5 h-5 text-gray-400" /><label htmlFor="brush-size" className="font-medium text-gray-300">Tamanho do Pincel</label></div>
                            <span className="font-mono text-gray-200">{brushSize}</span>
                        </div>
                        <input id="brush-size" type="range" min="10" max="150" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full" disabled={isLoading || !uploadedImage} />
                    </div>
                </div>

                <div className="mt-auto flex flex-col gap-2 pt-4">
                    <button onClick={handleGenerate} disabled={isLoading || !maskDataUrl} className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        <SparkleIcon className="w-5 h-5" />
                        Gerar Design
                    </button>
                    <button onClick={clearMask} disabled={isLoading || !maskDataUrl} className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm disabled:opacity-50">
                        Limpar Seleção
                    </button>
                </div>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4 relative">
                 {isLoading && (
                    <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                        <Spinner />
                        <p className="text-gray-300 text-lg font-semibold animate-pulse">{loadingMessage || 'Processando...'}</p>
                    </div>
                )}
                {!uploadedImage && (
                    <label htmlFor="interior-upload" className="text-center text-gray-400 cursor-pointer">
                        <UploadIcon className="w-12 h-12 mx-auto text-gray-500" />
                        <h3 className="mt-2 text-lg font-semibold text-white">Carregar Imagem do Ambiente</h3>
                        <p className="text-sm">Clique ou arraste um arquivo</p>
                         <input id="interior-upload" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])} />
                    </label>
                )}
                {imageUrl && (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img ref={imageRef} src={imageUrl} alt="Base" className="block max-w-full max-h-full object-contain" />
                        {!generatedDesign && (
                             <canvas
                                ref={maskCanvasRef}
                                width={imageRef.current?.naturalWidth}
                                height={imageRef.current?.naturalHeight}
                                className="absolute top-0 left-0 w-full h-full opacity-50 cursor-crosshair"
                                onMouseDown={startDrawing} onMouseUp={stopDrawing} onMouseMove={draw} onMouseLeave={stopDrawing}
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default InteriorDesignPanel;
