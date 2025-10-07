/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { generateMagicMontage, validatePromptSpecificity } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { MagicWandIcon, DownloadIcon, BrushIcon, LayersIcon, FireIcon, GtaIcon, UserIcon, LineArtIcon, SunIcon, TextToolIcon } from '../icons';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import { dataURLtoFile } from '../../utils/imageUtils';
import TipBox from '../common/TipBox';

const presets = [
    {
        name: "Com Deadpool & Wolverine",
        prompt: "Foto cinematográfica hiper-realista de um jovem (da imagem enviada) tirando uma foto dos bastidores com Deadpool e Wolverine (Hugh Jackman) no set de filmagem de \"Deadpool & Wolverine\". Deadpool em traje completo vermelho e preto fazendo uma pose engraçada de sinal da paz, Hugh Jackman como Wolverine vestindo seu icônico traje amarelo e preto com garras de adamantium estendidas, ambos ao lado do homem. Fundo de set de filmagem com câmeras, equipamentos de iluminação, equipe e adereços visíveis. Ultra-detalhado, iluminação natural, alto realismo, fotografia cinematográfica 8K.",
        negativePrompt: "desfocado, anatomia distorcida, estilo de desenho animado, baixa resolução, supersaturação, rostos duplicados, membros extras.",
        icon: <UserIcon className="w-5 h-5" />
    },
    {
        name: "Fogo e Água",
        prompt: "Retrato cinematográfico hiper-realista de dois homens idênticos (baseado na foto fornecida), de costas um para o outro em perfeita simetria. O homem à esquerda está envolto em chamas crepitantes, com brasas brilhantes girando em torno de sua jaqueta de couro queimada, iluminado por uma luz laranja ardente. O homem à direita está encharcado de água em cascata, com gotas escorrendo por seu rosto e jaqueta molhada, brilhando com tons azuis gelados. No centro, onde suas costas se encontram, fogo e água colidem violentamente, criando uma explosão dramática de vapor, faíscas e gotas d'água. Ambos parecem intensos e inflexíveis, simbolizando o eterno confronto entre calor e frio. Texturas de pele ultradetalhadas, efeitos elementares realistas, fotografia de retrato cinematográfica 8K com contraste de iluminação dramático.",
        negativePrompt: "desfocado, anatomia distorcida, estilo de desenho animado ou fantasia, rostos duplicados, membros extras, mistura bagunçada, baixa resolução, supersaturação, falta de detalhes elementares.",
        icon: <FireIcon className="w-5 h-5" />
    },
    {
        name: "Estilo GTA",
        prompt: "Crie uma foto minha no estilo de ilustração do Grand Theft Auto V, agachada em uma rua ao pôr do sol, com palmeiras e o horizonte da cidade ao fundo, vestindo uma camisa de manga comprida branca, jeans escuro e tênis brancos. Adicione o logotipo do GTA V no canto superior direito. Mantenha a identidade da pessoa. A imagem deve ter cores vibrantes e ser hiper-detalhada em HD.",
        negativePrompt: "desfocado, anatomia distorcida, estilo de desenho animado, baixa resolução, supersaturação.",
        icon: <GtaIcon className="w-5 h-5" />
    },
    {
        name: "Pijama My Melody",
        prompt: "Transforme a pessoa na foto. Roupa: Pijama rosa pastel aconchegante com estampas de coelho, chinelos fofos e punhos de renda. Acessório de cabelo: Uma touca de dormir de pelúcia da My Melody com uma fita. Cenário do estúdio: Um quarto pastel dos sonhos decorado com travesseiros fofos, luzes de fada brilhantes e brinquedos de pelúcia da My Melody por toda parte. Pose: Deitada na cama abraçando um travesseiro gigante da My Melody, sorrindo suavemente.",
        negativePrompt: "desfocado, distorcido, baixa qualidade, irrealista, feio, rosto desfigurado.",
        icon: <UserIcon className="w-5 h-5" />
    },
    {
        name: "Flor de Cerejeira",
        prompt: "Edite minha foto e crie um retrato de uma menina de um ano sentada graciosamente no chão com um joelho dobrado e as mãos suavemente apoiadas no colo. Ela está descalça, com seus longos cabelos pretos cacheados naturais e soltos. Ela está usando um vestido cheio e elegante em forma de flor, feito inteiramente de delicadas flores de cerejeira roxas. Uma grande peça de cabelo de flor de cerejeira coroa sua cabeça, e ela segura um guarda-sol macio feito de flores de cerejeira inclinado levemente sobre o ombro. O fundo se mistura em tons suaves de roxo, arejado e minimalista, com texturas sutis e luz suave para um retrato de estúdio sereno e atemporal. Estilo fotorrealista de alta resolução, 8K.",
        negativePrompt: "desfocado, distorcido, cores berrantes, iluminação ruim, irrealista",
        icon: <UserIcon className="w-5 h-5" />
    },
    {
        name: "Retrato Molhado",
        prompt: "Extreme close-up, hyper-realistic, cinematic portrait of an Individual's face(same as reference image)with soaked, clinging dark hair and a wet, dewy face. Focus is critically sharp on the striking eye(same as reference). Dramatic lighting with strong catchlights and deep shadows. Very shallow depth of field (f/1.4 bokeh). Emotional, vulnerable tone. Muted dramatic colors.",
        negativePrompt: "blurry, distorted, ugly, deformed, cartoonish, low quality, artifacts, text, watermark",
        icon: <UserIcon className="w-5 h-5" />
    },
    {
        name: "Esboço Vivo",
        prompt: "Retrato surreal hiper-realista de meio corpo de um homem (foto anexa) vestindo uma camisa azul ligeiramente aberta sobre uma camiseta branca lisa. Sua metade esquerda é totalmente real, com texturas de pele naturais e dobras de tecido realistas na camisa azul, enquanto sua metade direita permanece inacabada como se desenhada em papel. A transição mostra os vincos e dobras da camisa desaparecendo gradualmente em contornos a lápis e sombreamento grosseiro, com algumas linhas de esboço se estendendo além das bordas, criando a impressão de uma obra de arte ainda em andamento. Sua mão real segura firmemente um lápis afiado, esboçando ativamente a metade ausente de seu próprio corpo e roupas, misturando o real e o desenhado. A luz azul suave de uma janela banha o lado real, adicionando um brilho atmosférico suave, enquanto o lado de papel permanece mudo em grafite pálido. O fundo é minimalista com um brilho de janela fraco, profundidade cinematográfica, lente Canon EOS R5 + RF 85mm f/1.2, profundidade de campo rasa, capturando texturas ricas de pele, tecido, grão de papel, traços de lápis e a aura calma da luz azul.",
        negativePrompt: "desfocado, borrado, estilo cartoon, cores berrantes, transição abrupta, iluminação irrealista",
        icon: <LineArtIcon className="w-5 h-5" />
    },
    {
        name: "Luz Superior",
        prompt: "Ajuste a iluminação da imagem para que a luz pareça vir de cima, criando sombras suaves e realistas sob os elementos do objeto.",
        negativePrompt: "sombras duras, múltiplas fontes de luz, iluminação plana ou frontal, superexposição, subexposição.",
        icon: <SunIcon className="w-5 h-5" />
    },
    {
        name: "Retrato Tipográfico",
        prompt: "Crie um retrato hiperdetalhado em preto e branco, com o rosto formado inteiramente por palavras motivacionais e positivas, em tipografia em negrito. As palavras devem seguir os contornos, sombras e realces do rosto de referência enviado, tornando as características faciais 99,99% idênticas às da foto de referência. Mostre apenas o rosto, sem necessidade de roupas. Use um fundo escuro para que o rosto se destaque, com palavras como \"GRATO\", \"MANTENHA-SE FORTE\", \"PENSE POSITIVO\", \"SAUDÁVEL\", \"TRABALHO DURO\", \"RELAXE\" e outras palavras positivas em inglês claramente visíveis e integradas à estrutura do rosto. Estilo tipográfico de retrato artístico, poderoso, inspirador e realista.",
        negativePrompt: "desfocado, distorcido, baixa qualidade, irrealista, feio, rosto deformado, cores.",
        icon: <TextToolIcon className="w-5 h-5" />
    },
];

const MagicMontagePanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        setError, 
        setIsLoading,
        setLoadingMessage,
        baseImageFile,
        setInitialImage,
        setActiveTool,
        setToast,
        addPromptToHistory,
    } = useEditor();
    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [secondImage, setSecondImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');

    useEffect(() => {
        if (baseImageFile && !sourceImage) {
            setSourceImage(baseImageFile);
        }
    }, [baseImageFile, sourceImage]);

    const handleSourceFileSelect = (file: File | null) => {
        setSourceImage(file);
        if (file) {
            setInitialImage(file);
        }
        setResultImage(null);
    };

    const handlePresetClick = (preset: typeof presets[0]) => {
        setPrompt(preset.prompt);
        setNegativePrompt(preset.negativePrompt);
        setToast({ message: `Preset '${preset.name}' carregado!`, type: 'info' });
    };

    const handleGenerate = async () => {
        if (!sourceImage) {
            setError("Por favor, carregue uma imagem para editar.");
            return;
        }
        if (!prompt.trim()) {
            setError("Por favor, descreva a edição desejada.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        setLoadingMessage('Analisando o prompt...');
        addPromptToHistory(prompt);

        try {
            const { isSpecific, suggestion } = await validatePromptSpecificity(prompt, 'Montagem Mágica');

            if (!isSpecific) {
                setToast({ message: suggestion, type: 'info' });
                setIsLoading(false);
                setLoadingMessage(null);
                return;
            }
            
            setLoadingMessage('Realizando a mágica...');

            let fullPrompt = prompt;
            if (secondImage) {
                fullPrompt = `Usando a primeira imagem (principal) como base e a segunda imagem (opcional) como um elemento a ser adicionado/combinado, siga estas instruções: ${prompt}`;
            }
            if (negativePrompt.trim()) {
                fullPrompt += `. Evite o seguinte: ${negativePrompt}`;
            }
            const result = await generateMagicMontage(sourceImage, fullPrompt, secondImage || undefined);
            setResultImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    };

    const handleDownload = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `montagem-magica-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUseInEditor = () => {
        if (!resultImage) return;
        const file = dataURLtoFile(resultImage, `montagem-magica-${Date.now()}.png`);
        setInitialImage(file);
        setActiveTool('adjust');
    };

    const handleCreateVariation = () => {
        if (!resultImage) return;

        const newSourceFile = dataURLtoFile(resultImage, `variation-base-${Date.now()}.png`);
        
        setSourceImage(newSourceFile);
        setSecondImage(null);
        setResultImage(null);
        setPrompt('');
        setNegativePrompt('');
        
        if (setToast) {
            setToast({
                message: "Resultado definido como imagem base. Descreva sua próxima edição.",
                type: 'info',
            });
        }
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <main className="h-3/5 md:h-auto flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4 md:order-2">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Realizando a mágica..."
                />
                {resultImage && !isLoading && (
                    <div className="mt-4 flex flex-wrap justify-center gap-3 animate-fade-in">
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            Baixar Imagem
                        </button>
                        <button
                            onClick={handleCreateVariation}
                            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            <LayersIcon className="w-5 h-5" />
                            Criar Variação
                        </button>
                        <button
                            onClick={handleUseInEditor}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                             <BrushIcon className="w-5 h-5" />
                            Usar no Editor
                        </button>
                    </div>
                )}
            </main>
            <aside className="h-2/5 md:h-auto w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50 md:order-1 overflow-y-auto scrollbar-thin">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Montagem Mágica ✨</h3>
                    <p className="text-sm text-gray-400 mt-1">Descreva qualquer edição e deixe a IA transformar sua foto.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ImageDropzone 
                        imageFile={sourceImage}
                        onFileSelect={handleSourceFileSelect}
                        label="Imagem Principal"
                    />
                    <ImageDropzone 
                        imageFile={secondImage}
                        onFileSelect={setSecondImage}
                        label="Imagem Opcional"
                    />
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2 text-center">Inspirações</h4>
                    <div className="flex flex-col gap-2">
                        {presets.map(preset => (
                            <button
                                key={preset.name}
                                type="button"
                                onClick={() => handlePresetClick(preset)}
                                disabled={isLoading}
                                className="w-full text-left p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors flex items-center gap-3"
                            >
                                <div className="text-orange-400 flex-shrink-0">{preset.icon}</div>
                                <p className="font-semibold text-white text-sm">{preset.name}</p>
                            </button>
                        ))}
                    </div>
                </div>
                
                <CollapsiblePromptPanel
                  title="Descrição da Edição"
                  prompt={prompt}
                  setPrompt={setPrompt}
                  negativePrompt={negativePrompt}
                  onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                  isLoading={isLoading}
                  toolId="magicMontage"
                  promptPlaceholder="Ex: coloque um chapéu de pirata na pessoa..."
                  promptHelperText="Seja o mais descritivo possível sobre a alteração que você deseja."
                  negativePromptHelperText="Ex: não altere a cor da camisa, evite adicionar sombras."
                />

                <TipBox>
                   Seja descritivo! Em vez de "adicione um chapéu", tente "adicione um chapéu de pirata preto com uma caveira branca". Use a imagem opcional para adicionar elementos de outra foto.
                </TipBox>
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !sourceImage || !prompt.trim()}
                    className="w-full mt-auto bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <MagicWandIcon className="w-5 h-5" />
                    Gerar Montagem
                </button>
            </aside>
        </div>
    );
};

export default MagicMontagePanel;