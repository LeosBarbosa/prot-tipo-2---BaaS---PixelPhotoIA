/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { type ToolConfig, type ToolId, type TabId } from '../types';

// This is a placeholder reconstruction based on component names and categories.
export const tools: ToolConfig[] = [
  // Generation
  { id: 'imageGen', name: 'Gerador de Imagens', description: 'Gere imagens únicas a partir de uma descrição de texto detalhada. Clique para abrir o painel de geração.', icon: 'PhotoIcon', category: 'generation', isEditingTool: false },
  { id: 'videoGen', name: 'Gerador de Vídeos', description: 'Crie vídeos curtos e animações a partir de uma descrição de texto. Clique para abrir o painel de geração de vídeo.', icon: 'CameraIcon', category: 'generation', isEditingTool: false },
  
  // Workflow
  { id: 'batchProcessing', name: 'Processamento em Lote', description: 'Aplique um conjunto de edições a várias imagens de uma só vez. Ideal para tarefas repetitivas.', icon: 'ClipboardIcon', category: 'workflow', isEditingTool: false, tag: 'new' },
  { id: 'magicWorkflow', name: 'Fluxo de Trabalho Mágico', description: "Descreva uma tarefa complexa em linguagem natural (ex: 'remover o fundo e melhorar a resolução') e a IA executará os passos para você.", icon: 'MagicWandIcon', category: 'workflow', isEditingTool: false },
  { id: 'magicScenery', name: 'Cenário Mágico', description: "Coloque um objeto de uma imagem em um novo cenário gerado por IA. Use sua localização para prompts como 'perto de mim'.", icon: 'MapPinIcon', category: 'workflow', isEditingTool: false, tag: 'new' },
  { id: 'voiceAssistant', name: 'Assistente de Voz', description: 'Controle o editor usando comandos de voz. Clique para iniciar uma sessão de edição por voz.', icon: 'MicrophoneIcon', category: 'workflow', isEditingTool: false, tag: 'tip' },


  // Editing
  { id: 'crop', name: 'Cortar e Girar', description: 'Corte, redimensione e gire sua imagem. Defina proporções personalizadas ou predefinidas como 1:1, 16:9, etc.', icon: 'CropIcon', category: 'editing', isEditingTool: true },
  { id: 'adjust', name: 'Ajustes Globais', description: 'Faça ajustes globais de cor e luz na sua imagem, como brilho, contraste, saturação e curvas de tons.', icon: 'AdjustmentsHorizontalIcon', category: 'editing', isEditingTool: true },
  { id: 'removeBg', name: 'Remover Fundo', description: 'Remova o fundo da imagem com um clique, criando um PNG com fundo transparente. Ideal para destacar objetos ou pessoas.', icon: 'ScissorsIcon', category: 'editing', isEditingTool: true },
  { id: 'objectRemover', name: 'Removedor de Objetos', description: 'Pinte sobre objetos ou pessoas indesejadas para removê-los da sua imagem. A IA preencherá o espaço de forma inteligente.', icon: 'EraserIcon', category: 'editing', isEditingTool: true },
  { id: 'clone', name: 'Clone Stamp', description: 'Copie pixels de uma área da imagem para outra. Alt/Option+clique para definir a origem, depois pinte para clonar.', icon: 'CloneIcon', category: 'editing', isEditingTool: true, tag: 'new' },
  { id: 'upscale', name: 'Melhorar Resolução', description: 'Aumente a resolução da sua imagem (2x, 4x, 8x), melhorando a qualidade e a nitidez. Ótimo para fotos de baixa resolução.', icon: 'ArrowUpOnSquareIcon', category: 'editing', isEditingTool: true },
  { id: 'photoRestoration', name: 'Restauração de Foto', description: 'Restaure fotos antigas ou danificadas. Melhora rostos, remove ruído, corrige cores e aumenta a nitidez com um único clique.', icon: 'SparkleIcon', category: 'editing', isEditingTool: true },
  { id: 'style', name: 'Estilo de Foto', description: 'Aplique estilos artísticos famosos à sua imagem, como Van Gogh, Anime, Cyberpunk, e mais.', icon: 'PaletteIcon', category: 'editing', isEditingTool: true },
  { id: 'localAdjust', name: 'Ajustes Locais', description: 'Faça ajustes de brilho, contraste e saturação em áreas específicas da imagem usando um pincel de seleção ou a seleção mágica.', icon: 'BrushIcon', category: 'editing', isEditingTool: true, tag: 'new' },
  { id: 'generativeEdit', name: 'Edição Generativa', description: "Pinte sobre uma área e descreva o que você quer adicionar, remover ou modificar. Ex: 'adicione um chapéu', 'mude a cor da camisa'.", icon: 'LayersIcon', category: 'editing', isEditingTool: true },
  { id: 'aiTextEdit', name: 'Edição Mágica por Texto', description: 'Descreva uma edição para a imagem inteira, como "adicione um filtro retrô" ou "mude a cor do céu".', icon: 'MagicWandIcon', category: 'editing', isEditingTool: true, tag: 'new' },
  { id: 'imageAnalysis', name: 'Analisar Imagem', description: 'Faça perguntas sobre sua imagem e obtenha respostas da IA.', icon: 'SearchIcon', category: 'editing', isEditingTool: true, tag: 'new' },
  { id: 'text', name: 'Adicionar Texto', description: 'Adicione e personalize texto na sua imagem. Escolha fontes, cores, tamanhos e estilos.', icon: 'TextToolIcon', category: 'editing', isEditingTool: true },
  { id: 'faceSwap', name: 'Troca de Rosto', description: 'Troque o rosto de uma pessoa na sua foto pelo rosto de outra imagem de referência.', icon: 'SwapIcon', category: 'editing', isEditingTool: true },
  { id: 'newAspectRatio', name: 'Proporção 16:9', description: 'Expanda sua imagem para a proporção de paisagem 16:9 usando IA para preencher as áreas novas.', icon: 'ExpandIcon', category: 'editing', isEditingTool: true },
  { id: 'magicMontage', name: 'Montagem Mágica', description: 'Descreva uma edição complexa, como adicionar um objeto ou mudar o cenário, e deixe a IA fazer a montagem para você.', icon: 'MagicWandIcon', category: 'editing', isEditingTool: true },
  { id: 'superResolution', name: 'Super Resolução IA', description: 'Combine um aumento de 4x na resolução com nitidez generativa para um aprimoramento de imagem significativo com um único clique.', icon: 'SparkleIcon', category: 'editing', isEditingTool: true },
  { id: 'unblur', name: 'Remover Desfoque', description: 'Corrija imagens desfocadas. Escolha entre modelos para desfoque de movimento, de lente ou foco suave.', icon: 'UnblurIcon', category: 'editing', isEditingTool: true },
  { id: 'sharpen', name: 'Nitidez', description: 'Realce detalhes e contornos com nitidez inteligente de IA, que evita a criação de artefatos visuais.', icon: 'SharpenIcon', category: 'editing', isEditingTool: true },
  { id: 'relight', name: 'Reacender', description: 'Altere a iluminação da sua foto. Descreva a fonte de luz, cor e direção para criar um novo clima.', icon: 'SunIcon', category: 'editing', isEditingTool: true },
  { id: 'portraits', name: 'Retratos IA', description: 'Acesse um conjunto de ferramentas para aprimorar retratos, como retoque facial, mudança de penteado e iluminação profissional.', icon: 'UserIcon', category: 'editing', isEditingTool: true },
  { id: 'lowPoly', name: 'Estilo Low Poly', description: "Transforme sua foto em uma arte geométrica moderna com o estilo 'Low Poly'.", icon: 'LowPolyIcon', category: 'editing', isEditingTool: true },
  { id: 'pixelArt', name: 'Pixel Art', description: 'Converta sua imagem em pixel art, com opções para ajustar o tamanho do pixel e a paleta de cores.', icon: 'PixelsIcon', category: 'editing', isEditingTool: true },
  { id: 'styleGen', name: 'Estilos Rápidos', description: 'Acesse estilos artísticos de um clique, como Low Poly e Pixel Art, para transformações rápidas.', icon: 'BrushIcon', category: 'editing', isEditingTool: true },
  { id: 'texture', name: 'Textura', description: 'Adicione texturas como grão de filme, papel ou poeira para dar um toque final à sua imagem.', icon: 'TextureIcon', category: 'editing', isEditingTool: true },
  { id: 'dustAndScratches', name: 'Poeira e Arranhões', description: 'Adicione um efeito de filme antigo à sua imagem, com granulação, poeira e arranhões gerados por IA.', icon: 'FilmGrainIcon', category: 'editing', isEditingTool: true },
  { id: 'extractArt', name: 'Extrair Arte', description: 'Transforme sua foto em um esboço de contorno em preto e branco, extraindo as linhas principais da imagem.', icon: 'BullseyeIcon', category: 'editing', isEditingTool: true },
  { id: 'neuralFilters', name: 'Filtros Neurais', description: "Experimente filtros criativos e atmosféricos, como 'Sonho' ou 'Cinemático', que usam IA para alterar o humor da sua foto.", icon: 'SparkleIcon', category: 'editing', isEditingTool: true },
  { id: 'trends', name: 'Tendências', description: "Explore e aplique estilos e efeitos populares do momento, como 'Anuário anos 90' ou 'Estilo GTA'.", icon: 'LightbulbIcon', category: 'editing', isEditingTool: true },
  { id: 'history', name: 'Histórico', description: 'Visualize e reverta para qualquer ponto do seu histórico de edições.', icon: 'ClockIcon', category: 'editing', isEditingTool: true },
];

export const toolToTabMap: Partial<Record<ToolId, TabId>> = {
  photoRestoration: 'photoRestoration',
  removeBg: 'removeBg',
  upscale: 'upscale',
  style: 'style',
  localAdjust: 'localAdjust',
};