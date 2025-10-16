/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// FIX: Add useState and useEffect to the React import to resolve 'Cannot find name' errors.
import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { ShirtIcon, DownloadIcon, BrushIcon, CameraIcon } from '../icons';
import { dataURLtoFile } from '../../utils/imageUtils';
import TipBox from '../common/TipBox';
import CollapsibleToolPanel from '../CollapsibleToolPanel';

const scenePresets = [
    { name: 'Nenhum (Manter Fundo Original)', value: '' },
    { name: 'Estúdio Minimalista', value: 'Em um estúdio minimalista com um fundo cinza claro e iluminação suave.' },
    { name: 'Rua de Paris à Noite', value: 'Em uma rua charmosa de Paris à noite, com as luzes da cidade desfocadas ao fundo e o chão de paralelepípedos molhado.' },
    { name: 'Praia Tropical', value: 'Em uma praia tropical de areia branca ao pôr do sol, com palmeiras e o oceano calmo ao fundo.' },
    { name: 'Floresta Encantada', value: 'Em uma floresta encantada com árvores antigas cobertas de musgo e feixes de luz solar filtrando-se através da copa das árvores.' },
    { name: 'Café Aconchegante', value: 'Sentado em um café aconchegante com interior de madeira, iluminação quente e uma janela com vista para uma rua movimentada.' }
];

const posePresets = [
    { name: 'Padrão (Em pé)', value: 'Corpo inteiro, em pé, pose de moda, olhando confiantemente para a câmera.' },
    { name: 'Andando', value: 'Andando confiantemente em direção à câmera em uma calçada da cidade, com um leve movimento no cabelo e nas roupas.' },
    { name: 'Sentado (Casual)', value: 'Sentado em uma poltrona de couro moderna, com uma perna cruzada sobre a outra, olhando relaxadamente para o lado.' },
    { name: 'Close-up (Sorrindo)', value: 'Retrato em close-up do peito para cima, com um sorriso genuíno e natural, olhando diretamente para a câmera.' },
    { name: 'Pose de Ação', value: 'Em uma pose de ação dinâmica, como se estivesse no meio de um salto ou correndo, capturando movimento e energia.' }
];


const TryOnPanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        baseImageFile,
        setInitialImage, 
        setActiveTool,
        handleVirtualTryOn,
        currentImageUrl,
    } = useEditor();
    
    const [personImage, setPersonImage] = useState<File | null>(null);
    const [clothingImage, setClothingImage] = useState<File | null>(null);
    const [shoeImage, setShoeImage] = useState<File | null>(null);

    // Estados para os prompts profissionais
    const [scenePrompt, setScenePrompt] = useState('');
    const [posePrompt, setPosePrompt] = useState('Corpo inteiro, em pé, pose de moda, olhando confiantemente para a câmera.');
    const [cameraLens, setCameraLens] = useState('lente de 50mm com abertura f/2.8 para um leve desfoque de fundo');
    const [cameraAngle, setCameraAngle] = useState('ao nível dos olhos');
    const [lightingStyle, setLightingStyle] = useState('iluminação de estúdio suave (softbox)');
    const [negativePrompt, setNegativePrompt] = useState('deformado, feio, desfigurado, mãos extras, membros extras');
    const [isOptionsExpanded, setIsOptionsExpanded] = useState(false);

    useEffect(() => {
        if (baseImageFile && !personImage) setPersonImage(baseImageFile);
    }, [baseImageFile, personImage]);
    
    const handlePersonFileSelect = (file: File | null) => {
        setPersonImage(file);
        if (file) setInitialImage(file);
    };

    const handleGenerate = async () => {
        if (!personImage || !clothingImage) return;
        handleVirtualTryOn(personImage, clothingImage, shoeImage ?? undefined, scenePrompt, posePrompt, cameraLens, cameraAngle, lightingStyle, negativePrompt);
    };

    const handleDownload = () => {
        if (!currentImageUrl) return;
        const link = document.createElement('a');
        link.href = currentImageUrl;
        link.download = `provador-virtual-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUseInEditor = () => {
        if (!currentImageUrl) return;
        const file = dataURLtoFile(currentImageUrl, `provador-virtual-${Date.now()}.png`);
        setInitialImage(file);
        setActiveTool('adjust');
    };

    const handlePresetChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value) {
            setter(value);
        }
        e.target.value = ""; // Reset select to placeholder
    };

    const isGenerateButtonDisabled = isLoading || !personImage || !clothingImage;

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50 overflow-y-auto scrollbar-thin">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Provador Virtual</h3>
                    <p className="text-sm text-gray-400 mt-1">Vista o modelo e dirija a cena como um profissional.</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                   <ImageDropzone imageFile={personImage} onFileSelect={handlePersonFileSelect} label="Sua Foto (Modelo)"/>
                   <ImageDropzone imageFile={clothingImage} onFileSelect={setClothingImage} label="Peça de Roupa"/>
                   <ImageDropzone imageFile={shoeImage} onFileSelect={setShoeImage} label="Calçado (Opcional)"/>
                </div>

                <CollapsibleToolPanel
                    title="Direção de Estúdio (Opcional)"
                    icon={<CameraIcon className="w-5 h-5" />}
                    isExpanded={isOptionsExpanded}
                    onExpandToggle={() => setIsOptionsExpanded(!isOptionsExpanded)}
                >
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Cenário</label>
                            <select onChange={handlePresetChange(setScenePrompt)} defaultValue="" className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm mb-2" disabled={isLoading}>
                                <option value="" disabled>Escolha um preset de cenário...</option>
                                {scenePresets.map(p => <option key={p.name} value={p.value}>{p.name}</option>)}
                            </select>
                            <textarea value={scenePrompt} onChange={e => setScenePrompt(e.target.value)} placeholder="Ou descreva seu próprio cenário..." className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm" rows={2} disabled={isLoading} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Pose</label>
                            <select onChange={handlePresetChange(setPosePrompt)} defaultValue="" className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm mb-2" disabled={isLoading}>
                                 <option value="" disabled>Escolha um preset de pose...</option>
                                {posePresets.map(p => <option key={p.name} value={p.value}>{p.name}</option>)}
                            </select>
                            <textarea value={posePrompt} onChange={e => setPosePrompt(e.target.value)} placeholder="Ou descreva sua própria pose..." className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm" rows={2} disabled={isLoading} />
                        </div>
                        
                        <div className="border-t border-gray-700/50 my-1"></div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Direção de Câmera</label>
                            <select value={cameraLens} onChange={e => setCameraLens(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm mb-2" disabled={isLoading}>
                                <option value="lente de 35mm com abertura f/1.8">Lente 35mm (Plano Aberto)</option>
                                <option value="lente de 50mm com abertura f/2.8 para um leve desfoque de fundo">Lente 50mm (Retrato Padrão)</option>
                                <option value="lente de 85mm com abertura f/1.4 para um fundo bem desfocado">Lente 85mm (Close-up / Bokeh)</option>
                                <option value="lente grande angular de 24mm">Lente 24mm (Grande Angular)</option>
                            </select>
                            <select value={cameraAngle} onChange={e => setCameraAngle(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm" disabled={isLoading}>
                                <option value="ao nível dos olhos">Ângulo: Nível dos Olhos</option>
                                <option value="em ângulo baixo (contrapicado)">Ângulo: de Baixo para Cima</option>
                                <option value="em ângulo alto (plongê)">Ângulo: de Cima para Baixo</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Direção de Iluminação</label>
                            <select value={lightingStyle} onChange={e => setLightingStyle(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm" disabled={isLoading}>
                                <option value="iluminação de estúdio suave (softbox)">Iluminação de Estúdio</option>
                                <option value="luz natural quente do final da tarde (golden hour)">Luz do Pôr do Sol</option>
                                <option value="iluminação dramática de alto contraste (estilo noir)">Iluminação Dramática</option>
                                <option value="luz de preenchimento suave e uniforme, sem sombras">Luz Suave e Uniforme</option>
                                <option value="iluminação de contraluz forte (rim light) para destacar a silhueta">Contraluz (Rim Light)</option>
                            </select>
                        </div>
                        
                         <div className="border-t border-gray-700/50 my-1"></div>

                        <div>
                             <label className="block text-sm font-medium text-gray-300 mb-1">Prompt Negativo</label>
                            <textarea value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm" rows={2} disabled={isLoading} />
                        </div>
                    </div>
                </CollapsibleToolPanel>
                
                <TipBox>
                    Se os campos de "Direção de Estúdio" forem preenchidos, um novo fundo será gerado. Se deixados em branco, o fundo original será mantido.
                </TipBox>
                
                <button onClick={handleGenerate} disabled={isGenerateButtonDisabled} className="w-full mt-auto bg-gradient-to-br from-pink-600 to-purple-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <ShirtIcon className="w-5 h-5" />
                    Gerar Look
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer isLoading={isLoading} error={error} resultImage={currentImageUrl} loadingMessage="Montando o estúdio e vestindo o modelo..."/>
                {currentImageUrl && !isLoading && (
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

export default TryOnPanel;