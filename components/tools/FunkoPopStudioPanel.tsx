/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import * as geminiService from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { ToyIcon, DownloadIcon, BrushIcon } from '../icons';
import { dataURLtoFile } from '../../utils/imageUtils';
import CollapsibleToolPanel from '../CollapsibleToolPanel';

const funkoTypes = ['Padrão', 'Deluxe (com cenário)', 'Moment (cena épica)', 'Rides (com veículo)', 'Buddy (com companheiro)'];
const specialFinishes = ['Nenhum', 'Metálico', 'Brilhante (Glitter)', 'Aveludado (Flocked)', 'Brilha no Escuro'];


const FunkoPopStudioPanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        setError, 
        setIsLoading, 
        baseImageFile,
        setInitialImage, 
        setActiveTool 
    } = useEditor();
    
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [personImage, setPersonImage] = useState<File | null>(null);
    const [bgDescription, setBgDescription] = useState('');
    const [objectDescription, setObjectDescription] = useState('');
    const [lightingDescription, setLightingDescription] = useState('estúdio suave com luz difusa e sombras sutis');
    const [resultImage, setResultImage] = useState<string | null>(null);
    
    const [isOptionalExpanded, setIsOptionalExpanded] = useState(false);
    const [funkoType, setFunkoType] = useState('Padrão');
    const [specialFinish, setSpecialFinish] = useState('Nenhum');


    useEffect(() => {
        if (baseImageFile && !mainImage) {
            setMainImage(baseImageFile);
        }
    }, [baseImageFile, mainImage]);

    const handleMainFileSelect = (file: File | null) => {
        setMainImage(file);
        if (file) {
            setInitialImage(file);
        }
        setResultImage(null);
    };

    const handleGenerate = async () => {
        if (!mainImage) {
            setError("Por favor, carregue a imagem principal.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResultImage(null);
        
        try {
            const mainPrompt = `Instruções principais:\n- Todos os elementos (pessoa, fundo e objetos) devem ser meticulosamente representados no estilo Funko Pop, mantendo a fidelidade das cores originais (paleta RGB), expressões faciais (sorriso, olhos, etc.) e proporções do rosto e pele (textura e tons) da imagem original. Utilizar técnicas de modelagem 3D para garantir um acabamento realista.\n- Não alterar a identidade ou características principais da pessoa retratada (cabelo, marcas faciais, etc.). Detalhes como óculos ou tatuagens devem ser mantidos e estilizados no formato Funko.\n- O resultado deve parecer um colecionável Funko Pop autêntico e realista, como se tivesse acabado de sair da caixa.`;

            let adjustments = "Ajustes opcionais:\n";
            if (bgDescription.trim()) {
                adjustments += `1. [FUNDO OPCIONAL] → Substituir ou recriar o cenário no estilo Funko Pop, detalhando elementos característicos, baseado em '${bgDescription}'.\n`;
            } else {
                adjustments += `1. [FUNDO OPCIONAL] → Manter o fundo da imagem original, mas recriá-lo no estilo Funko Pop.\n`;
            }
            if (personImage) {
                adjustments += `2. [PESSOA OPCIONAL] → Adicionar no cenário a pessoa da imagem de referência secundária, também no estilo Funko Pop, mantendo coerência estética (escala, iluminação e estilo visual).\n`;
            }
            if (objectDescription.trim()) {
                adjustments += `3. [OBJETO OPCIONAL] → Incluir no ambiente um objeto no estilo Funko Pop, adicionando detalhes relevantes, como '${objectDescription}'.\n`;
            }

            let styleAndLighting = `Estilo visual: versão Funko Pop estilizada, com acabamento 3D colecionável de alta qualidade, cabeça maior em relação ao corpo (proporção 1:2), olhos característicos (grandes e redondos com brilho), e design detalhado (texturas, relevos e cores vibrantes).\nIluminação: ${lightingDescription.trim()}.`;

            if (funkoType !== 'Padrão') {
                styleAndLighting += `\nTipo: A imagem deve representar um Funko Pop do tipo '${funkoType}', o que significa que deve incluir elementos adicionais como cenários, veículos ou outros personagens para criar uma cena completa.`;
            }

            if (specialFinish !== 'Nenhum') {
                styleAndLighting += `\nAcabamento Especial: O boneco deve ter um acabamento especial do tipo '${specialFinish}'. Por exemplo, se for 'Metálico', use uma pintura com reflexos metálicos; se for 'Aveludado', adicione uma textura de pelúcia; se for 'Brilhante', adicione partículas de glitter.`;
            }

            const rules = `Regras obrigatórias:\n- A transformação deve sempre manter o estilo Funko Pop em todos os elementos, garantindo a consistência visual e a harmonia da cena.\n- Fundo, pessoa e objeto devem ser integrados como parte de uma única cena Funko, criando uma composição equilibrada e atraente.\n- O rosto e cor da pele da pessoa principal devem se manter reconhecíveis no estilo Funko, permitindo a fácil identificação da pessoa retratada.`;

            const fullPrompt = `Quero transformar a imagem principal enviada em uma versão estilizada Funko Pop.\n\n${mainPrompt}\n\n${adjustments}\n${styleAndLighting}\n\n${rules}`;

            const result = await geminiService.generateMagicMontage(mainImage, fullPrompt, personImage || undefined);
            setResultImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `funko-pop-studio-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUseInEditor = () => {
        if (!resultImage) return;
        const file = dataURLtoFile(resultImage, `funko-pop-studio-${Date.now()}.png`);
        setInitialImage(file);
        setActiveTool('adjust');
    };

    const isGenerateButtonDisabled = isLoading || !mainImage;
    
    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50 overflow-y-auto scrollbar-thin">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Estúdio Funko Pop</h3>
                    <p className="text-sm text-gray-400 mt-1">Transforme sua foto em um colecionável 3D.</p>
                </div>
                
                <ImageDropzone imageFile={mainImage} onFileSelect={handleMainFileSelect} label="Sua Foto Principal"/>

                <CollapsibleToolPanel
                    title="Ajustes Opcionais"
                    icon={<ToyIcon className="w-5 h-5" />}
                    isExpanded={isOptionalExpanded}
                    onExpandToggle={() => setIsOptionalExpanded(!isOptionalExpanded)}
                >
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Funko</label>
                            <select value={funkoType} onChange={e => setFunkoType(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-base" disabled={isLoading}>
                                {funkoTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Acabamento Especial</label>
                            <select value={specialFinish} onChange={e => setSpecialFinish(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-base" disabled={isLoading}>
                                {specialFinishes.map(finish => <option key={finish} value={finish}>{finish}</option>)}
                            </select>
                        </div>

                        <div className="border-t border-gray-600/50 my-2"></div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Descrição do Fundo</label>
                            <textarea value={bgDescription} onChange={e => setBgDescription(e.target.value)} placeholder="Ex: quarto dos anos 80 com pôsteres..." className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-base min-h-[80px]" disabled={isLoading}/>
                            <p className="mt-1 text-xs text-gray-500 px-1">Se deixado em branco, a IA usará o fundo original como inspiração.</p>
                        </div>
                         <ImageDropzone imageFile={personImage} onFileSelect={setPersonImage} label="Adicionar Pessoa (Opcional)"/>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Descrição de Objeto</label>
                            <textarea value={objectDescription} onChange={e => setObjectDescription(e.target.value)} placeholder="Ex: carrinho de bebê vintage..." className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-base min-h-[80px]" disabled={isLoading}/>
                             <p className="mt-1 text-xs text-gray-500 px-1">Adicione um objeto para seu Funko segurar ou interagir, ex: "uma guitarra vermelha".</p>
                        </div>
                    </div>
                </CollapsibleToolPanel>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Iluminação</label>
                    <textarea value={lightingDescription} onChange={e => setLightingDescription(e.target.value)} placeholder="Ex: brilho de vitrine com reflexos..." className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-base min-h-[80px]" disabled={isLoading}/>
                    <p className="mt-1 text-xs text-gray-500 px-1">Exemplo: "iluminação dramática com uma luz forte vinda de cima".</p>
                </div>

                <button onClick={handleGenerate} disabled={isGenerateButtonDisabled} className="w-full mt-auto bg-gradient-to-br from-stone-600 to-stone-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <ToyIcon className="w-5 h-5" />
                    Gerar Funko Pop
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer isLoading={isLoading} error={error} resultImage={resultImage} loadingMessage="Criando seu colecionável..."/>
                {resultImage && !isLoading && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-3 animate-fade-in">
                        <button onClick={handleDownload} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                            <DownloadIcon className="w-5 h-5" /> Baixar Imagem
                        </button>
                        <button onClick={handleUseInEditor} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                            <BrushIcon className="w-5 h-5" /> Usar no Editor
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};
export default FunkoPopStudioPanel;