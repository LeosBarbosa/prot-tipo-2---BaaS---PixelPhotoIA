/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
// FIX: Correct import path
import { useEditor } from '../../context/EditorContext';
import * as geminiService from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { ShieldCheckIcon } from '../icons';
import TipBox from '../common/TipBox';

interface Hero {
    id: string;
    name: string;
    imageUrl: string;
}

const heroes: Hero[] = [
    { id: 'superman', name: 'Superman', imageUrl: 'https://storage.googleapis.com/maker-studio-tools-us-east1/superhero/superman_ref.webp' },
    { id: 'supergirl', name: 'Supergirl', imageUrl: 'https://storage.googleapis.com/maker-studio-tools-us-east1/superhero/supergirl_ref.webp' },
];

const SuperheroFusionPanel: React.FC = () => {
    const {
        isLoading,
        error,
        setError,
        setIsLoading,
        baseImageFile,
        setInitialImage,
    } = useEditor();

    const [personImage, setPersonImage] = useState<File | null>(null);
    const [heroImage, setHeroImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [complementaryPrompt, setComplementaryPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');

    useEffect(() => {
        if (baseImageFile && !personImage) {
            setPersonImage(baseImageFile);
        }
    }, [baseImageFile, personImage]);

    const handlePersonFileSelect = (file: File | null) => {
        setPersonImage(file);
        if (file) {
            setInitialImage(file);
        }
        setResultImage(null);
    };

    const handleHeroSelect = async (hero: Hero) => {
        if (isLoading) return;
        try {
            const response = await fetch(hero.imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `${hero.id}.jpg`, { type: blob.type });
            setHeroImage(file);
        } catch (err) {
            setError("Não foi possível carregar a imagem do herói. Por favor, tente novamente ou carregue uma imagem manualmente.");
        }
    };

    const handleGenerate = async () => {
        if (!personImage || !heroImage) {
            setError("Por favor, carregue sua foto e a foto de referência do herói.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            const result = await geminiService.generateSuperheroFusion(personImage, heroImage, complementaryPrompt, negativePrompt);
            setResultImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
        }
    };

    const isGenerateButtonDisabled = isLoading || !personImage || !heroImage;

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50 overflow-y-auto scrollbar-thin">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Fusão de Super-Herói</h3>
                    <p className="text-sm text-gray-400 mt-1">Transforme-se em um herói icônico.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <ImageDropzone imageFile={personImage} onFileSelect={handlePersonFileSelect} label="Sua Foto"/>
                    <ImageDropzone imageFile={heroImage} onFileSelect={setHeroImage} label="Foto do Herói"/>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2 text-center">Ou escolha uma referência</h4>
                    <div className="flex justify-center gap-4">
                        {heroes.map(hero => (
                            <button key={hero.id} onClick={() => handleHeroSelect(hero)} disabled={isLoading} className="relative group w-24 h-32 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all" title={hero.name}>
                                <img src={hero.imageUrl} alt={hero.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                                <p className="absolute bottom-1 left-0 right-0 text-white text-xs font-bold text-center drop-shadow-md">{hero.name}</p>
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex flex-col gap-2">
                    <div>
                        <label htmlFor="complementary-prompt" className="text-sm font-semibold text-gray-300">Prompts Complementares</label>
                        <textarea 
                            id="complementary-prompt" 
                            value={complementaryPrompt} 
                            onChange={(e) => setComplementaryPrompt(e.target.value)} 
                            placeholder="Ex: adicionar um efeito de explosão ao fundo..."
                            className="mt-1 w-full bg-gray-800/50 border border-gray-600 rounded-lg p-2 text-base min-h-[60px] resize-none text-gray-300 placeholder-gray-500" 
                            disabled={isLoading}
                            rows={2}
                        />
                    </div>
                    <div>
                        <label htmlFor="negative-prompt" className="text-sm font-semibold text-gray-300">Prompts Negativos</label>
                        <textarea 
                            id="negative-prompt" 
                            value={negativePrompt} 
                            onChange={(e) => setNegativePrompt(e.target.value)} 
                            placeholder="Ex: óculos, chapéu, cores berrantes..."
                            className="mt-1 w-full bg-gray-800/50 border border-gray-600 rounded-lg p-2 text-base min-h-[60px] resize-none text-gray-300 placeholder-gray-500" 
                            disabled={isLoading}
                            rows={2}
                        />
                    </div>
                </div>

                <TipBox>
                    Para melhores resultados, use uma foto sua com o rosto bem iluminado e virado para a frente. A IA preservará sua identidade facial.
                </TipBox>

                <button onClick={handleGenerate} disabled={isGenerateButtonDisabled} className="w-full mt-auto bg-gradient-to-br from-red-600 to-yellow-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5" />
                    Gerar Fusão
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Realizando fusão heroica..."
                />
            </main>
        </div>
    );
};

export default SuperheroFusionPanel;
