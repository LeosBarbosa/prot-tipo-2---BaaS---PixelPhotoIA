/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { useEditor } from '../../../context/EditorContext';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import LazyIcon from '../LazyIcon';

interface Artist {
    id: string;
    name: string;
    imageUrl: string;
}

const popularArtists: Artist[] = [
    { id: 'taylor-swift', name: 'Taylor Swift', imageUrl: 'https://storage.googleapis.com/maker-studio-tools-us-east1/polaroid/taylor_swift.jpg' },
    { id: 'billie-eilish', name: 'Billie Eilish', imageUrl: 'https://storage.googleapis.com/maker-studio-tools-us-east1/polaroid/billie_eilish.jpg' },
    { id: 'harry-styles', name: 'Harry Styles', imageUrl: 'https://storage.googleapis.com/maker-studio-tools-us-east1/polaroid/harry_styles.jpg' },
    { id: 'the-rock', name: 'The Rock', imageUrl: 'https://storage.googleapis.com/maker-studio-tools-us-east1/polaroid/the_rock.jpg' },
];

const PolaroidPanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        setError, 
        baseImageFile,
        setInitialImage,
        handlePolaroid,
        currentImageUrl,
    } = useEditor();
    
    const [personImage, setPersonImage] = useState<File[]>([]);
    const [celebrityImage, setCelebrityImage] = useState<File[]>([]);
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
    
    const handleArtistSelect = async (artist: Artist) => {
        if (isLoading) return;
        try {
            const response = await fetch(artist.imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `${artist.id}.jpg`, { type: blob.type });
            setCelebrityImage([file]);
        } catch (err) {
            setError("Não foi possível carregar a imagem do artista. Por favor, tente novamente ou carregue uma imagem manualmente.");
        }
    };

    const handleGenerate = async () => {
        const personFile = personImage[0];
        const celebrityFile = celebrityImage[0];
        if (!personFile || !celebrityFile) {
            setError("Por favor, carregue a sua foto e a foto do artista.");
            return;
        }
        handlePolaroid(personFile, celebrityFile, negativePrompt);
    };

    const isGenerateButtonDisabled = isLoading || personImage.length === 0 || celebrityImage.length === 0;

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Polaroid com Artista IA</h3>
                    <p className="text-sm text-gray-400 mt-1">Crie uma foto sua com seu artista favorito.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <ImageDropzone 
                        files={personImage}
                        onFilesChange={handlePersonFileSelect}
                        label="Sua Foto"
                    />
                    <ImageDropzone 
                        files={celebrityImage}
                        onFilesChange={setCelebrityImage}
                        label="Foto do Artista"
                    />
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2 text-center">Ou escolha um artista popular</h4>
                    <div className="flex flex-wrap justify-center gap-2">
                        {popularArtists.map(artist => (
                            <button key={artist.id} onClick={() => handleArtistSelect(artist)} disabled={isLoading} className="relative group w-20 aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all" title={artist.name}>
                                <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                                <p className="absolute bottom-1 left-0 right-0 text-white text-[10px] font-bold text-center drop-shadow-md">{artist.name}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="negative-prompt" className="text-sm font-semibold text-gray-300">O que evitar (Opcional)</label>
                    <textarea id="negative-prompt" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="Ex: 'mãos extras', 'rosto deformado'..." className="mt-1 w-full bg-gray-800/50 border border-gray-600 rounded-lg p-2 text-base min-h-[60px] resize-none text-gray-300 placeholder-gray-500" disabled={isLoading} rows={2}/>
                    <p className="mt-1 text-xs text-gray-500 px-1">Liste o que evitar para melhorar o resultado. Ex: 'mãos extras', 'rosto duplicado'.</p>
                </div>
                
                <div className="mt-auto flex flex-col gap-3">
                    <div className="flex items-start gap-2 p-2 rounded-md bg-yellow-900/20 border border-yellow-700/30 text-yellow-300">
                        <LazyIcon name="InformationCircleIcon" className="w-5 h-5 mt-0.5 flex-shrink-0"/>
                        <p className="text-xs">O uso de imagens de celebridades pode estar sujeito a direitos de imagem. Esta ferramenta é destinada para uso pessoal e criativo.</p>
                    </div>

                    <button onClick={handleGenerate} disabled={isGenerateButtonDisabled} className="w-full bg-gradient-to-br from-stone-600 to-stone-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        <LazyIcon name="PolaroidIcon" className="w-5 h-5" />
                        Gerar Polaroid
                    </button>
                </div>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={currentImageUrl}
                    loadingMessage="Revelando sua foto..."
                />
            </main>
        </div>
    );
};

export default PolaroidPanel;