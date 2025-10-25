/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ToolId } from '../types';

export interface PromptPreset {
    name: string;
    description: string;
    prompt: string;
}

// Central de presets de prompts profissionais, categorizados por ferramenta (ToolId)
export const promptExamples: Partial<Record<ToolId, string[]>> = {
    // Presets para a ferramenta "Gerador de Imagens"
    imageGen: [
        'Uma vasta biblioteca interior com livros que se estendem até um teto abobadado, feixes de luz empoeirados, estilo de fantasia cinematográfica, detalhado.',
        'Um close-up fotorrealista de um camaleão em um galho, com a textura da pele detalhada e um fundo de selva desfocado.',
        'Uma cidade subaquática surreal com edifícios de coral brilhantes e cardumes de peixes como veículos, arte digital.',
        'Um pôster de viagem vintage para Marte, com estilo art déco, foguetes e paisagens de rochas vermelhas.',
        'Renderização 3D de um donut de chocolate com granulado em um fundo rosa, iluminação de estúdio suave.',
        'Um astronauta cavalgando um cavalo cósmico feito de nebulosas e estrelas através da galáxia, arte digital épica, cores vibrantes, iluminação dramática.',
        'Um detetive cyberpunk solitário em uma rua encharcada de chuva, reflexos de neon no asfalto molhado, iluminação cinematográfica de alto contraste, foto de corpo inteiro, cidade futurista com carros voadores ao fundo.',
        'fotorrealista', 'pintura a óleo', 'arte conceitual', 'estilo de anime dos anos 90', 'renderização 3D', 'iluminação cinematográfica', 'luz suave da manhã', 'brilho de neon', 'contraluz dramático', 'retrato em close-up', 'vista panorâmica ampla', 'tomada de baixo ângulo',
    ],
    aiTextEdit: [
        'adicione um filtro retrô com cores desbotadas',
        'remova a pessoa no fundo',
        'mude a cor da camisa para azul',
        'faça o céu parecer um pôr do sol dramático',
        'adicione neve na cena',
        'transforme a foto em preto e branco com alto contraste',
    ],
    sketchRender: [
        'Renderização fotorrealista de um tênis esportivo, com materiais de couro e malha, em um pedestal de concreto, iluminação de estúdio.',
        'Transforme este esboço de carro em um render 3D com pintura metálica vermelha e reflexos de um ambiente urbano.',
        'Renderize este esboço de arquitetura como um edifício moderno de vidro e aço ao pôr do sol.',
        'materiais de couro', 'pintura metálica', 'vidro e aço', 'iluminação de estúdio',
    ],
    characterDesign: [
        'Um cavaleiro élfico com armadura ornamentada e uma espada mágica',
        'Uma feiticeira cibernética com cabelos roxos neon e implantes tecnológicos',
        'Um robô amigável feito de peças de sucata, com olhos grandes e expressivos',
        'em um ambiente de floresta encantada', 'em uma cidade futurista chuvosa', 'em um cenário de deserto pós-apocalíptico',
        'arte realista', 'estilo cyberpunk', 'estilo cartoon',
    ],
    videoGen: [
        'Uma tomada de drone voando sobre uma cachoeira majestosa em uma floresta tropical, cinematográfica.',
        'Um close-up de gotas de chuva caindo em uma poça em câmera lenta.',
        'Animação de um astronauta flutuando no espaço, com a Terra ao fundo.',
        'câmera lenta', 'tomada de drone', 'panorâmica', 'estilo cinematográfico',
    ],
    patternGen: [
        'Padrão sem costura de limões e folhas de laranjeira, estilo aquarela.',
        'Padrão geométrico Art Déco com linhas douradas e fundo azul marinho.',
        'Padrão de espaço fofo com planetas, estrelas e foguetes em estilo cartoon.',
        'estilo aquarela', 'geométrico', 'floral', 'abstrato',
    ],
    textEffects: [
        'Faça o texto parecer que é feito de ouro derretido com gotas.',
        'Aplique uma textura de grama realista ao texto.',
        'Transforme o texto em letras de neon rosa brilhantes.',
        'ouro derretido', 'textura de grama', 'neon brilhante', 'cromado', 'madeira',
    ],
    logoGen: [
        'Logotipo minimalista de uma montanha e um sol para uma marca de aventura.',
        'Emblema de um leão para um time de futebol, estilo moderno.',
        'Logotipo de palavra para uma cafeteria, usando uma fonte de script elegante.',
        'minimalista', 'emblema', 'geométrico', 'abstrato',
    ],
    stickerCreator: [
        'Um gato astronauta fofo em estilo anime',
        'Um emoji de café sorridente em estilo cartoon',
        'Um carro esportivo retrô com um acabamento cromado brilhante',
        'estilo fofo', 'vintage', 'neon', 'cartoon',
    ],
    model3DGen: [
        'Modelo 3D de um drone futurista com acabamento em fibra de carbono.',
        'Renderização 3D de um hambúrguer suculento em um prato.',
        'Modelo 3D de um anel de diamante com um cenário de joalheria.',
        'fibra de carbono', 'madeira polida', 'metal cromado', 'plástico translúcido',
    ],
    relight: [
        'luz quente e dourada de pôr do sol vindo da direita',
        'luzes de neon azuis e roxas',
        'iluminação de lareira suave e quente vindo de baixo',
        'iluminação de estúdio dramática (Rembrandt)',
        'luz suave e difusa vinda de uma grande janela lateral',
    ],
    generativeEdit: [
        'adicione um chapéu de pirata na cabeça da pessoa',
        'mude a cor do carro para vermelho metálico',
        'coloque um dragão voando no céu',
        'remova a pessoa no fundo',
        'adicione óculos de sol no rosto',
    ],
    magicMontage: [
        'coloque a pessoa em uma paisagem lunar com a Terra ao fundo',
        'faça a pessoa segurar um sabre de luz brilhante',
        'substitua o céu por uma galáxia de nebulosa colorida',
        'adicione asas de anjo brancas e brilhantes nas costas da pessoa',
    ],
    outpainting: [
        'continue a praia com mais areia e ondas suaves',
        'expanda o céu com nuvens dramáticas e um pôr do sol',
        'complete o resto da sala com móveis modernos',
    ],
    productPhotography: [
        'em uma mesa de mármore com uma orquídea ao lado',
        'em um fundo de rocha vulcânica com iluminação dramática',
        'em um pedestal flutuante com um fundo de gradiente vibrante',
    ],
    architecturalViz: [
        'adicione uma piscina infinita no jardim',
        'mude as paredes para concreto aparente',
        'adicione vegetação exuberante ao redor do edifício',
    ],
    interiorDesign: [
        'adicione uma estante de livros de madeira escura do chão ao teto',
        'troque o sofá por um de couro marrom e adicione uma planta grande no canto',
        'coloque um tapete persa no chão',
    ],
    bananimate: [
        'faça as nuvens se moverem lentamente pelo céu',
        'adicione vapor subindo da xícara de café',
        'faça o cabelo da pessoa balançar suavemente com o vento',
        'faça as estrelas brilharem',
    ],
    aiPortraitStudio: [
        'segurando uma guitarra elétrica e usando óculos de sol de aviador',
        'em uma cena de fantasia com um dragão no ombro',
        'vestindo um traje espacial em um cenário de ficção científica',
    ],
    styledPortrait: [
        'mantenha o cabelo curto', 'adicione um leve sorriso', 'troque a cor da camisa para verde',
        'mantenha a jaqueta de couro, mas mude a cor para vermelho',
        'adicione um colar de prata delicado',
        'mude o penteado para um coque elegante e formal',
    ],
};


export const negativePromptExamples: Partial<Record<ToolId, string[]>> = {
  imageGen: [
    'texto, marca d\'água, baixa qualidade, feio, deformado',
    'mãos extras, membros faltando, desfocado',
    'cores opacas, chato, sem detalhes',
    'mal desenhado, arte ruim, amador',
  ],
  characterDesign: [
    'proporções erradas, mãos deformadas, rosto genérico',
    'fundo branco simples, pose estática',
    'roupas sem textura, sem detalhes',
  ],
  magicMontage: [
    'não altere o rosto, preserve a identidade da pessoa',
    'iluminação inconsistente, bordas de recorte visíveis',
    'resultado irrealista, estilo de colagem',
    'rosto deformado, mãos extras',
  ],
  generativeEdit: [
    'não altere o fundo, preserve o resto da imagem',
    'resultado desfocado, baixa resolução',
    'iluminação ou sombras que não correspondem',
    'feio, deformado',
  ],
  productPhotography: [
    'fundo confuso, reflexos indesejados',
    'sombras irrealistas, produto flutuando',
    'baixa resolução, textura de plástico barato',
  ],
  relight: [
    'estourado, superexposto, perda de detalhes nas altas luzes',
    'escuro demais, subexposto, perda de detalhes nas sombras',
    'cor da luz irrealista, artificial',
  ],
  outpainting: [
    'bordas visíveis, junção óbvia',
    'conteúdo repetitivo, sem criatividade',
    'inconsistente com o estilo ou iluminação original',
  ],
  styledPortrait: [
    'rosto alterado, perda de identidade, características irreconhecíveis',
    'cabelo de cor errada',
    'artefatos, fusão ruim entre o rosto e o corpo',
    'rosto deformado, feio',
  ],
  tryOn: [
    'rosto alterado, tipo de corpo alterado, tom de pele alterado',
    'roupa mal ajustada, flutuando sobre o corpo',
    'deformado, feio, desfigurado, mãos extras, membros extras',
  ],
};