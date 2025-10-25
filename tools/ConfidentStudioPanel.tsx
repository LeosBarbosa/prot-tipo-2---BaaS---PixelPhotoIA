/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import TipBox from '../common/TipBox';
import LazyIcon from '../LazyIcon';

const ConfidentStudioPanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        baseImageFile,
        setInitialImage,
        currentImageUrl,
        handleConfidentStudio,
    } = useEditor();
    
    const [personImage, setPersonImage] = useState<File[]>([]);
    const [negativePrompt, setNegativePrompt] = useState('');

    useEffect(() => {
        if (baseImageFile && personImage.length === 0) {
            setPersonImage([baseImageFile]);
        }
    }, [baseImageFile, personImage]);

    const handlePersonFileSelect = (files: File[]) => {
        setPersonImage(files);
        if (files[0]) {
            setInitialImage(files[0]);
        }
    };

    const handleGenerate = async () => {
        const imageFile = personImage[0];
        if (!imageFile) return;

        const mainPrompt = `Gere um retrato de estúdio profissional e fotorrealista da pessoa na imagem fornecida, colocando-a na seguinte cena:\n\n**Instrução Crítica:** A identidade facial, cabelo, tom de pele e tipo de corpo da pessoa devem ser preservados com 100% de precisão. O resultado deve ser uma nova fotografia da *mesma pessoa*.\n\n**Detalhes da Cena:**\n- **Pose e Ação:** Sentado em uma poltrona bege moderna com pernas de madeira, ligeiramente inclinado para a frente com as mãos juntas. A pessoa deve ter um olhar intenso e confiante direcionado para a câmera.\n- **Figurino:** Camisa social azul-marinho escura com os botões de cima abertos, calças justas bege claras e mocassins pretos com solas bege.\n- **Cenário:** Fundo cinza claro minimalista com um gradiente suave.\n- **Iluminação:** Iluminação natural suave de estúdio, criando um clima cinematográfico e de editorial de moda.\n- **Câmera:** Simule uma lente de 50 mm em f/2.8, com enquadramento vertical e composição de corpo inteiro.\n\n**Qualidade:** A imagem deve ser de alta resolução (qualidade 8K), hiperdetalhada e com alto realismo.`;
        
        handleConfidentStudio(imageFile, mainPrompt, negativePrompt);
    };

    const isGenerateButtonDisabled = isLoading || personImage.length === 0;

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50 overflow-y-auto scrollbar-thin">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Retrato de Estúdio Confiante</h3>
                    <p className="text-sm text-gray-400 mt-1">Crie um retrato profissional e cinematográfico.</p>
                </div>
                
                <ImageDropzone files={personImage} onFilesChange={handlePersonFileSelect} label="Sua Foto"/>
                
                <div>
                    <label htmlFor="negative-prompt-studio" className="text-sm font-semibold text-gray-300">O que evitar (Opcional)</label>
                    <textarea id="negative-prompt-studio" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="Ex: 'óculos', 'chapéu', 'cores berrantes'..." className="mt-1 w-full bg-gray-800/50 border border-gray-600 rounded-lg p-2 text-base min-h-[60px] resize-none text-gray-300 placeholder-gray-500" disabled={isLoading} rows={2}/>
                </div>

                <TipBox>
                    Para melhores resultados, use uma foto onde seu rosto esteja claro e bem iluminado. A IA preservará sua identidade enquanto cria a nova cena.
                </TipBox>
                
                <button onClick={handleGenerate} disabled={isGenerateButtonDisabled} className="w-full mt-auto bg-gradient-to-br from-blue-600 to-sky-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <LazyIcon name="UserIcon" className="w-5 h-5" />
                    Gerar Retrato
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={currentImageUrl}
                    loadingMessage="Montando o estúdio..."
                />
            </main>
        </div>
    );
};

export default ConfidentStudioPanel;