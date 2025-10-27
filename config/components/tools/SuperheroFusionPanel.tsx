/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../../context/EditorContext';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { dataURLtoFile } from '../../../utils/imageUtils';
import TipBox from '../common/TipBox';
// FIX: Correct import path for LazyIcon
import LazyIcon from '../LazyIcon';

interface Hero {
    id: string;
    name: string;
    imageUrl: string;
}

const popularHeroes: Hero[] = [
    { id: 'superman', name: 'Superman', imageUrl: 'https://storage.googleapis.com/maker-studio-tools-us-east1/assets/superhero_superman.webp' },
    { id: 'batman', name: 'Batman', imageUrl: 'https://storage.googleapis.com/maker-studio-tools-us-east1/assets/superhero_batman.webp' },
    { id: 'wonder-woman', name: 'Wonder Woman', imageUrl: 'https://storage.googleapis.com/maker-studio-tools-us-east1/assets/superhero_wonder_woman.webp' },
    { id: 'iron-man', name: 'Iron Man', imageUrl: 'https://storage.googleapis.com/maker-studio-tools-us-east1/assets/superhero_iron_man.webp' },
    { id: 'captain-america', name: 'Captain America', imageUrl: 'https://storage.googleapis.com/maker-studio-tools-us-east1/assets/superhero_captain_america.webp' },
    { id: 'thor', name: 'Thor', imageUrl: 'https://storage.googleapis.com/maker-studio-tools-us-east1/assets/superhero_thor.webp' },
];

const SuperheroFusionPanel: React.FC = () => {
    const { 
        baseImageFile,
        setInitialImage, 
        setActiveTool,
        isLoading,
        error,
        setError,
        // FIX: Property 'handleSuperheroFusion' does not exist on type 'EditorContextType'. This will be added to the context.
        handleSuperheroFusion,
        currentImageUrl,
        setLoadingMessage,
    } = useEditor();
    
    const [personImage, setPersonImage] = useState<File | null>(null);
    const [heroImage, setHeroImage] = useState<File | null>(null);

    const resultImage = currentImageUrl;

    useEffect(() => {
        if (baseImageFile && !personImage) {
            setPersonImage(baseImageFile);
        }
    }, [baseImageFile, personImage]);
    
    const handlePersonFileSelect = (files: File[]) => {
        const file = files[0] || null;
        setPersonImage(file);
        if (file) {
            setInitialImage(file);
        }
    };
    
    const handleHeroSelect = async (hero: Hero) => {
        if (isLoading) return;
        setLoadingMessage('Carregando imagem do herói...');
        setError(null);
        try {
            const response = await fetch(hero.imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `${hero.id}.jpg`, { type: blob.type });
            setHeroImage(file);
        } catch (err) {
            setError("Não foi possível carregar a imagem do herói.");
        } finally {
            setLoadingMessage(null);
        }
    };

    const handleGenerate = async () => {
        if (!personImage || !heroImage) {
            setError("Por favor, carregue sua foto e a foto de referência do herói.");
            return;
        }
        await handleSuperheroFusion(personImage, heroImage);
    };

    const isGenerateButtonDisabled = isLoading || !personImage || !heroImage;

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50 overflow-y-auto scrollbar-thin">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Fusão de Super-Herói</h3>
                    <p className="text-sm text-gray-400 mt-1">Transforme-se no seu herói favorito.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <ImageDropzone files={personImage ? [personImage] : []} onFilesChange={handlePersonFileSelect} label="Sua Foto"/>
                    <ImageDropzone files={heroImage ? [heroImage] : []} onFilesChange={(files) => setHeroImage(files[0] || null)} label="Foto do Herói"/>
                </div>
                
                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2 text-center">Ou escolha uma referência</h4>
                    <div className="grid grid-cols-3 gap-2">
                        {popularHeroes.map(hero => (
                            <button
                                key={hero.id}
                                onClick={() => handleHeroSelect(hero)}
                                disabled={isLoading}
                                className={`relative group aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${heroImage?.name.startsWith(hero.id) ? 'border-blue-500 scale-105' : 'border-transparent hover:border-gray-500'}`}
                                title={hero.name}
                            >
                                <img src={hero.imageUrl} alt={hero.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                                <p className="absolute bottom-1 left-0 right-0 text-white text-xs font-bold text-center drop-shadow-md p-1 bg-black/20">{hero.name}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <TipBox>
                    Para melhores resultados, use uma foto sua com o rosto bem iluminado e virado para a frente. A IA preservará sua identidade facial.
                </TipBox>
                
                <button onClick={handleGenerate} disabled={isGenerateButtonDisabled} className="w-full mt-auto bg-gradient-to-br from-red-600 to-blue-600 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <LazyIcon name="SuperheroIcon" className="w-5 h-5" />
                    Gerar Fusão
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer isLoading={isLoading} error={error} resultImage={resultImage} loadingMessage="Realizando a fusão heroica..."/>
            </main>
        </div>
    );
};

export default SuperheroFusionPanel;
