/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ToolId } from '../types';

// High-quality, diverse examples to guide users and improve suggestion quality.
export const promptExamples: Partial<Record<ToolId, string[]>> = {
  imageGen: [
    'Uma vasta biblioteca interior com livros que se estendem até um teto abobadado, feixes de luz empoeirados, estilo de fantasia cinematográfica, detalhado.',
    'Um close-up fotorrealista de um camaleão em um galho, com a textura da pele detalhada e um fundo de selva desfocado.',
    'Uma cidade subaquática surreal com edifícios de coral brilhantes e cardumes de peixes como veículos, arte digital.',
    'Um pôster de viagem vintage para Marte, com estilo art déco, foguetes e paisagens de rochas vermelhas.',
    'Renderização 3D de um donut de chocolate com granulado em um fundo rosa, iluminação de estúdio suave.',
    'Um astronauta cavalgando um cavalo cósmico feito de nebulosas e estrelas através da galáxia, arte digital épica, cores vibrantes, iluminação dramática.',
    'Um detetive cyberpunk solitário em uma rua encharcada de chuva, reflexos de neon no asfalto molhado, iluminação cinematográfica de alto contraste, foto de corpo inteiro, cidade futurista com carros voadores ao fundo.',
  ],
  sketchRender: [
    'Renderização fotorrealista de um tênis esportivo, com materiais de couro e malha, em um pedestal de concreto, iluminação de estúdio.',
    'Transforme este esboço de carro em um render 3D com pintura metálica vermelha e reflexos de um ambiente urbano.',
    'Renderize este esboço de arquitetura como um edifício moderno de vidro e aço ao pôr do sol.',
  ],
  characterDesign: [
    'Um cavaleiro élfico com armadura ornamentada e uma espada mágica, em um ambiente de floresta encantada, arte realista',
    'Uma feiticeira cibernética com cabelos roxos neon e implantes tecnológicos, em uma cidade futurista chuvosa, estilo cyberpunk',
    'Um robô amigável feito de peças de sucata, com olhos grandes e expressivos, em um cenário de deserto pós-apocalíptico',
  ],
  videoGen: [
    'Uma tomada de drone voando sobre uma cachoeira majestosa em uma floresta tropical, cinematográfica.',
    'Um close-up de gotas de chuva caindo em uma poça em câmera lenta.',
    'Animação de um astronauta flutuando no espaço, com a Terra ao fundo.',
  ],
  patternGen: [
    'Padrão sem costura de limões e folhas de laranjeira, estilo aquarela.',
    'Padrão geométrico Art Déco com linhas douradas e fundo azul marinho.',
    'Padrão de espaço fofo com planetas, estrelas e foguetes em estilo cartoon.',
  ],
  textEffects: [
    'Faça o texto parecer que é feito de ouro derretido com gotas.',
    'Aplique uma textura de grama realista ao texto.',
    'Transforme o texto em letras de neon rosa brilhantes.',
  ],
  logoGen: [
    'Logotipo minimalista de uma montanha e um sol para uma marca de aventura.',
    'Emblema de um leão para um time de futebol, estilo moderno.',
    'Logotipo de palavra para uma cafeteria, usando uma fonte de script elegante.',
  ],
  stickerCreator: [
    'Um gato astronauta fofo em estilo anime com borda branca.',
    'Um emoji de café sorridente em estilo cartoon com uma caneca fumegante, borda branca espessa.',
    'Um carro esportivo retrô com um acabamento cromado brilhante, estilo de desenho animado, borda branca.',
  ],
  model3DGen: [
    'Modelo 3D de um drone futurista com acabamento em fibra de carbono.',
    'Renderização 3D de um hambúrguer suculento em um prato.',
    'Modelo 3D de um anel de diamante com um cenário de joalheria.',
  ],
  relight: [
    'Reacenda a foto com uma luz quente e dourada de pôr do sol vindo da direita.',
    'Ilumine a cena com luzes de neon azuis e roxas como se estivesse em uma rua de cyberpunk.',
    'Adicione uma iluminação de lareira suave e quente vindo de baixo.',
  ],
  generativeEdit: [
    'Adicione um chapéu de pirata na cabeça da pessoa.',
    'Mude a cor do carro para vermelho metálico.',
    'Coloque um dragão voando no céu.',
  ],
  magicMontage: [
    'Coloque a pessoa em uma paisagem lunar com a Terra ao fundo.',
    'Faça a pessoa segurar um sabre de luz brilhante.',
    'Substitua o céu por uma galáxia de nebulosa colorida.',
  ],
  outpainting: [
    'Continue a praia com mais areia e ondas suaves.',
    'Expanda o céu com nuvens dramáticas e um pôr do sol.',
    'Complete o resto da sala com móveis modernos.',
  ],
  productPhotography: [
    'Coloque este frasco de perfume em uma mesa de mármore com uma orquídea ao lado.',
    'Fotografe este relógio em um fundo de rocha vulcânica com iluminação dramática.',
    'Apresente este tênis em um pedestal flutuante com um fundo de gradiente vibrante.',
  ],
  architecturalViz: [
    'renderização de uma casa de campo moderna com paredes de vidro e piscina infinita',
    'visualização de um arranha-céu futurista em uma cidade movimentada à noite',
  ],
  interiorDesign: [
    'adicione uma estante de livros de madeira escura do chão ao teto na parede dos fundos',
    'troque o sofá por um de couro marrom e adicione uma planta grande no canto',
  ],
  bananimate: [
    'faça as nuvens se moverem lentamente pelo céu',
    'adicione vapor subindo da xícara de café',
    'faça o cabelo da pessoa balançar suavemente com o vento',
  ],
  aiPortraitStudio: [
    'segurando uma guitarra elétrica e usando óculos de sol de aviador',
    'em uma cena de fantasia com um dragão no ombro',
    'vestindo um traje espacial em um cenário de ficção científica',
  ],
  styledPortrait: [
    'mantenha a jaqueta de couro, mas mude a cor para vermelho',
    'adicione um colar de ouro sutil',
  ],
  photoStudio: [
    'local: em uma rua de Paris à noite, com as luzes da cidade desfocadas ao fundo',
    'figurino: smoking preto elegante com uma gravata borboleta',
  ],
  polaroid: [
    'faça parecer uma selfie casual em um show',
    'crie uma pose divertida como se estivessem compartilhando uma piada',
  ],
  funkoPopStudio: [
    'fundo: recrie o cenário do escritório da série The Office',
    'objeto: coloque um pequeno troféu de "Melhor Chefe do Mundo" na mão dele',
  ],
  faceSwap: [
    'faça a expressão um pouco mais sorridente',
    'ajuste o tom de pele para ser mais bronzeado',
  ]
};