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
export const promptPresets: Partial<Record<ToolId, PromptPreset[]>> = {
    // Presets para a ferramenta "Gerador de Imagens"
    imageGen: [
        {
            name: 'Estilo Cinematográfico',
            description: 'Cores quentes, iluminação dramática e desfoque de fundo suave.',
            prompt: 'Imagem com estética de filme, cores quentes e ricas, iluminação dramática com sombras profundas e realces sutis, desfoque de fundo (bokeh) suave e cremoso, proporção de tela de cinema widescreen, 8k.'
        },
        {
            name: 'Metrópole Sci-Fi',
            description: 'Arranha-céus imponentes, carros voadores e outdoors holográficos.',
            prompt: 'Uma metrópole de ficção científica expansiva com arranha-céus imponentes, carros voadores e outdoors de neon holográficos, à noite, chuva leve, estilo Blade Runner, fotorrealista, 8k.'
        },
        {
            name: 'Paisagem Natural Vibrante',
            description: 'Cores saturadas, detalhes nítidos e céu dramático.',
            prompt: 'Paisagem natural exuberante com cores vibrantes e saturadas, realce de detalhes nas texturas, céu azul saturado com nuvens dramáticas, vegetação vívida e folhagens densas, contraste acentuado entre luz e sombra, fotografia de alta resolução.'
        },
        {
            name: 'Interior Aconchegante',
            description: 'Lareira, poltronas confortáveis e uma estante de livros cheia.',
            prompt: 'O interior de uma casa de campo aconchegante com uma lareira acesa, poltronas confortáveis e uma estante de livros cheia, luz quente e suave, pintura a óleo.'
        },
        {
            name: 'Paisagem Emocional Abstrata',
            description: 'Formas suaves, cores pastel e uma atmosfera de serenidade.',
            prompt: 'Uma paisagem abstrata representando a emoção da serenidade, com formas suaves e fluidas, uma paleta de cores de azuis e verdes pastel, luz difusa, arte digital.'
        },
    ],
    // Presets para a ferramenta "Design de Personagem"
    characterDesign: [
        {
            name: 'Guerreiro da Fantasia',
            description: 'Armadura detalhada, pose heroica e fundo de castelo.',
            prompt: 'Um guerreiro humano em armadura de placas completa, segurando uma espada larga. Fundo de um castelo em ruínas ao pôr do sol. Estilo de arte conceitual de fantasia, realista.'
        },
        {
            name: 'Explorador Espacial',
            description: 'Traje futurista, capacete de vidro e planeta alienígena.',
            prompt: 'Um explorador espacial em um traje branco e laranja, capacete de vidro refletindo um planeta alienígena com duas luas. Em pé em um terreno rochoso vermelho. Estilo de ficção científica, fotorrealista.'
        },
        {
            name: 'Inventor Steampunk',
            description: 'Óculos de proteção, braço mecânico e oficina cheia de engrenagens.',
            prompt: 'Um inventor steampunk com óculos de proteção na testa, um braço mecânico de latão e roupas vitorianas, em uma oficina cheia de engrenagens e vapor, arte conceitual detalhada.'
        },
        {
            name: 'Samurai Urbano',
            description: 'Jaqueta de couro, máscara de neon e uma katana brilhante.',
            prompt: 'Um samurai urbano moderno com uma jaqueta de couro, uma máscara de neon e uma katana brilhante, em um beco escuro de uma cidade japonesa à noite.'
        }
    ],
    styledPortrait: [
        {
            name: 'Trocar Cor da Roupa',
            description: 'Muda a cor de uma peça de roupa específica.',
            prompt: 'mude a cor da jaqueta para vermelho vibrante'
        },
        {
            name: 'Adicionar Acessório',
            description: 'Adiciona um pequeno detalhe, como uma joia.',
            prompt: 'adicione um colar de prata delicado'
        },
        {
            name: 'Mudar Fundo',
            description: 'Coloca a pessoa em um novo cenário.',
            prompt: 'coloque a pessoa em um fundo de floresta enevoada'
        },
        {
            name: 'Alterar Cor do Cabelo',
            description: 'Muda a cor do cabelo, mas mantém o estilo.',
            prompt: 'mantenha o estilo do cabelo, mas mude a cor para azul elétrico'
        },
    ],
    relight: [
        {
            name: 'Hora Dourada',
            description: 'Luz quente e suave do final da tarde.',
            prompt: 'Reacenda a foto com uma luz quente e dourada de pôr do sol vindo da direita, com sombras longas e suaves.'
        },
        {
            name: 'Neon Noir',
            description: 'Luzes de neon vibrantes e sombras profundas.',
            prompt: 'Ilumine a cena com luzes de neon azuis e roxas como se estivesse em uma rua de cyberpunk, com alto contraste.'
        },
        {
            name: 'Luz de Fogueira',
            description: 'Iluminação quente e cintilante vinda de baixo.',
            prompt: 'Reacenda a cena com uma luz de fogueira quente e cintilante vinda de baixo, projetando sombras longas e dançantes para cima.'
        },
        {
            name: 'Floresta Mística',
            description: 'Brilho bioluminescente vindo da flora.',
            prompt: 'Reacenda a cena com um brilho bioluminescente vindo da flora, em tons de azul e verde, criando uma atmosfera de floresta mágica e misteriosa.'
        },
        {
            name: 'Film Noir',
            description: 'Alto contraste e sombras fortes de uma persiana.',
            prompt: 'Aplique uma iluminação de filme noir, com alto contraste, sombras fortes e bem definidas e um feixe de luz vindo de uma persiana.'
        },
        {
            name: 'Estúdio Dramático',
            description: 'Luz lateral forte para um efeito Rembrandt.',
            prompt: 'Aplique uma iluminação de estúdio dramática (Rembrandt), com uma única fonte de luz lateral forte criando um triângulo de luz na bochecha sombreada e alto contraste.'
        },
        {
            name: 'Luz Suave de Janela',
            description: 'Iluminação difusa e calma de uma janela lateral.',
            prompt: 'Reacenda a foto com uma luz suave e difusa vinda de uma grande janela lateral, criando sombras suaves e uma atmosfera calma e introspectiva.'
        },
        {
            name: 'Raios Volumétricos',
            description: 'Feixes de luz dramáticos (god rays).',
            prompt: 'Adicione raios de luz volumétricos (god rays) atravessando a cena, como se a luz do sol estivesse passando por uma janela empoeirada ou pela copa de árvores.'
        }
    ],
    aiPortraitStudio: [
        {
            name: 'Pose de Super-Herói',
            description: 'Aterrissagem em um telhado, com a cidade ao fundo.',
            prompt: 'em uma pose de aterrissagem de super-herói em um telhado, com a cidade ao fundo'
        },
        {
            name: 'Retrato Real',
            description: 'Sentado em um trono, vestindo trajes reais.',
            prompt: 'sentado em um trono ornamentado, vestindo trajes reais e segurando um cetro'
        },
        {
            name: 'Hacker Cyberpunk',
            description: 'Sala escura iluminada por telas de computador e código holográfico.',
            prompt: 'em uma sala escura iluminada por telas de computador, com código holográfico flutuando ao redor'
        },
        {
            name: 'Mago de Fantasia',
            description: 'Conjurando um feitiço com mãos brilhantes e partículas de energia.',
            prompt: 'conjurando um feitiço com as mãos brilhando, partículas de energia girando ao redor'
        }
    ],
    magicMontage: [
        {
            name: 'Adicionar Asas de Anjo',
            description: 'Adiciona asas de anjo brancas e brilhantes nas costas da pessoa.',
            prompt: 'Adicione um par de grandes asas de anjo brancas e brilhantes nas costas da pessoa. As asas devem parecer etéreas e feitas de luz.'
        },
        {
            name: 'Transformar em Estátua',
            description: 'Converte a pessoa em uma estátua de mármore clássica.',
            prompt: 'Transforme a pessoa em uma estátua de mármore branco, com textura de pedra realista. Coloque a estátua em um pedestal em um jardim de museu.'
        }
    ]
};