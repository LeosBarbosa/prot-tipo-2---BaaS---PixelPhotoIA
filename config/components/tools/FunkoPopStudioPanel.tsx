/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { useEditor } from '../../../context/EditorContext';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import CollapsibleToolPanel from '../CollapsibleToolPanel';
import LazyIcon from '../LazyIcon';

const funkoTypes = ['Padrão', 'Deluxe (com cenário)', 'Moment (cena épica)', 'Rides (com veículo)', 'Buddy (com companheiro)'];
const specialFinishes = ['Nenhum', 'Metálico', 'Brilhante (Glitter)', 'Aveludado (Flocked)', 'Brilha no Escuro'];


const FunkoPopStudioPanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        baseImageFile,
        setInitialImage,
        currentImageUrl,
        handleFunkoPop,
    } = useEditor();
    
    const [mainImage, setMainImage] = useState<File[]>([]);
    const [personImage, setPersonImage] = useState<File[]>([]);
    const [bgDescription, setBgDescription] = useState('');
    const [objectDescription, setObjectDescription] = useState('');
    const [lightingDescription, setLightingDescription] = useState('estúdio suave com luz difusa e sombras sutis');
    
    const [isOptionalExpanded, setIsOptionalExpanded] = useState(false);
    const [funkoType, setFunkoType] = useState('Padrão');
    const [specialFinish, setSpecialFinish] = useState('Nenhum');


    useEffect(() => {
        if (baseImageFile && mainImage.length === 0) {
            setMainImage([baseImageFile]);
        }
    }, [baseImageFile, mainImage]);

    const handleMainFileSelect = (files: File[]) => {
        setMainImage(files);
        if (files[0]) {
            setInitialImage(files[0]);
        }
    };
    
    const handleGenerate = async () => {
        const mainImageFile = mainImage[0];
        if (!mainImageFile) return;

        handleFunkoPop(
            mainImageFile, 
            personImage[0] || null, 
            bgDescription, 
            objectDescription, 
            lightingDescription, 
            funkoType, 
            specialFinish
        );
    };

    const isGenerateButtonDisabled = isLoading || mainImage.length === 0;
    
    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50 overflow-y-auto scrollbar-thin">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Estúdio Funko Pop</h3>
                    <p className="text-sm text-gray-400 mt-1">Transforme sua foto em um colecionável 3D.</p>
                </div>
                
                <ImageDropzone 
                    files={mainImage}
                    onFilesChange={handleMainFileSelect}
                    label="Sua Foto Principal"
                />

                <CollapsibleToolPanel
                    title="Ajustes Opcionais"
                    icon="ToyIcon"
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
                         <ImageDropzone 
                            files={personImage}
                            onFilesChange={setPersonImage}
                            label="Adicionar Pessoa (Opcional)"
                        />
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
                    <LazyIcon name="ToyIcon" className="w-5 h-5" />
                    Gerar Funko Pop
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                 <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={currentImageUrl}
                    loadingMessage="Criando seu Funko Pop..."
                />
            </main>
        </div>
    );
};

export default FunkoPopStudioPanel;