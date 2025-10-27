/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useEditor } from '../../../context/EditorContext';
import { useMaskCanvas } from '../../../hooks/useMaskCanvas';
import { generateInteriorDesign } from '../../../services/geminiService';
import { dataURLtoFile } from '../../../utils/imageUtils';
import PromptEnhancer from './common/PromptEnhancer';
import PromptSuggestionsDropdown from '../common/PromptSuggestionsDropdown';
import { usePromptSuggestions } from '../../../hooks/usePromptSuggestions';
import LazyIcon from '../LazyIcon';

const ArchitecturalVizPanel: React.FC = () => {
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);
    const [roomType, setRoomType] = useState<string>('Sala de Estar');
    const [roomStyle, setRoomStyle] = useState<string>('Moderno');
    const [prompt, setPrompt] = useState<string>('');
    const [brushSize, setBrushSize] = useState(40);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const { isLoading, error, setError, setIsLoading, setLoadingMessage, baseImageFile, setInitialImage, addPromptToHistory, setToast } = useEditor();
    const suggestions = usePromptSuggestions(prompt, 'architecturalViz');

    const imageRef = useRef<HTMLImageElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);

    const { maskDataUrl, startDrawing, stopDrawing, draw, clearMask } = useMaskCanvas(maskCanvasRef, brushSize);
    
    useEffect(() => {
        setShowSuggestions(suggestions.length > 0);
    }, [suggestions]);

    const handleSelectSuggestion = (suggestion: string) => {
        setPrompt(suggestion);
        setShowSuggestions(false);
    };

    const imageUrl = useMemo(() => {
        if (generatedDesign) return generatedDesign;
        return uploadedImage ? URL.createObjectURL(uploadedImage) : null;
    }, [uploadedImage, generatedDesign]);

    useEffect(() => {
        if (baseImageFile && !uploadedImage) {
            setUploadedImage(baseImageFile);
        }
    }, [baseImageFile, uploadedImage]);


    const handleGenerate = async () => {
        if (!uploadedImage || !maskDataUrl) {
            setError("Por favor, carregue uma imagem e desenhe uma máscara sobre a área a ser alterada.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setLoadingMessage("Gerando novo design...");
        addPromptToHistory(prompt);
        try {
            const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
            const resultDataUrl = await generateInteriorDesign(uploadedImage, maskFile, roomType, roomStyle, prompt, setToast);
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
      setInitialImage(file);
    }, [clearMask, setError, setInitialImage]);

    const handleUseAsNewBase = useCallback(() => {
        if (!generatedDesign) return;
        const newBaseImageFile = dataURLtoFile(generatedDesign, 'design-iteration.png');
        handleFileSelect(newBaseImageFile);
    }, [generatedDesign, handleFileSelect]);

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <h2 className="text-xl font-bold text-white text-center">Controles</h2>
                 <div className="flex flex-col gap-4">
                    <label className="block text-sm font-medium text-gray-300">Tipo de Ambiente</label>
                    <select value={roomType} onChange={e => setRoomType(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base">
                        {['Sala de Estar', 'Quarto', 'Cozinha', 'Banheiro', 'Escritório', 'Fachada Externa', 'Jardim'].map(type => <option key={type} value={type}>{type}</option>)}
                    </select>

                    <label className="block text-sm font-medium text-gray-300">Estilo de Design</label>
                    <select value={roomStyle} onChange={e => setRoomStyle(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base">
                        {['Moderno', 'Minimalista', 'Industrial', 'Contemporâneo', 'Sustentável', 'Clássico'].map(style => <option key={style} value={style}>{style}</option>)}
                    </select>

                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Instruções Adicionais</label>
                        <div className="relative">
                            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} onFocus={() => setShowSuggestions(suggestions.length > 0)} placeholder="Ex: adicione uma janela grande..." className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 pr-12 text-base min-h-[100px]" disabled={isLoading}/>
                            <PromptEnhancer prompt={prompt} setPrompt={setPrompt} toolId="architecturalViz" />
                        </div>
                        {showSuggestions && (
                            <PromptSuggestionsDropdown
                                suggestions={suggestions}
                                onSelect={handleSelectSuggestion}
                                searchTerm={prompt}
                            />
                        )}
                        <p className="mt-1 text-xs text-gray-500 px-1">Exemplos: "adicione uma grande janela com vista para o oceano", "troque o piso por madeira de carvalho claro".</p>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2"><LazyIcon name="BrushIcon" className="w-5 h-5 text-gray-400" /><label htmlFor="brush-size" className="font-medium text-gray-300">Tamanho do Pincel</label></div>
                            <span className="font-mono text-gray-200">{brushSize}</span>
                        </div>
                        <input id="brush-size" type="range" min="10" max="150" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full" disabled={isLoading || !uploadedImage} />
                    </div>
                </div>

                <div className="mt-auto flex flex-col gap-2 pt-4">
                    <button onClick={handleGenerate} disabled={isLoading || !maskDataUrl} className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        <LazyIcon name="SparkleIcon" className="w-5 h-5" />
                        {generatedDesign ? 'Gerar Outra Variação' : 'Gerar Design'}
                    </button>
                    {generatedDesign && !isLoading && (
                        <div className="animate-fade-in border-t border-gray-700/50 pt-3 mt-1 flex flex-col gap-2">
                            <p className="text-xs text-center text-gray-400">Continue a editar a partir do novo design ou gere outra variação com as mesmas configurações.</p>
                            <button onClick={handleUseAsNewBase} className="w-full bg-gradient-to-br from-green-600 to-teal-500 text-white font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50">
                                Aceitar e Editar a Partir Daqui
                            </button>
                        </div>
                    )}
                    <button onClick={clearMask} disabled={isLoading || !maskDataUrl} className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm disabled:opacity-50">
                        Limpar Seleção
                    </button>
                </div>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4 relative">
                {error && !isLoading && (
                    <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in p-4">
                        <div className="text-center text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                            <h3 className="font-bold text-red-300">Ocorreu um Erro</h3>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}
                {!uploadedImage && (
                    <label htmlFor="arch-upload" className="text-center text-gray-400 cursor-pointer">
                        <LazyIcon name="UploadIcon" className="w-12 h-12 mx-auto text-gray-500" />
                        <h3 className="mt-2 text-lg font-semibold text-white">Carregar Imagem</h3>
                        <p className="text-sm">Clique ou arraste um arquivo</p>
                         <input id="arch-upload" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])} />
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

export default ArchitecturalVizPanel;