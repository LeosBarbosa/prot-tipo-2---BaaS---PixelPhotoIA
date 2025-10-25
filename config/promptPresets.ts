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
            name: 'Fotografia Macro',
            description: 'Detalhes extremos de um objeto pequeno, como uma gota de chuva.',
            prompt: 'Fotografia macro fotorrealista de uma gota de chuva em uma folha, refletindo o ambiente ao redor, detalhes extremos, 8k.'
        },
        {
            name: 'Cenário de Anime',
            description: 'Cena de uma cidade japonesa à noite, no estilo Studio Ghibli.',
            prompt: 'Cenário de anime de uma rua tranquila de Tóquio à noite, com cerejeiras em flor e lanternas de papel brilhantes, estilo Studio Ghibli.'
        },
        {
            name: 'Veículo Steampunk',
            description: 'Dirigível complexo sobre uma cidade vitoriana.',
            prompt: 'Um dirigível steampunk complexo voando sobre uma cidade vitoriana, com engrenagens de latão, vapor e iluminação quente do pôr do sol, arte conceitual detalhada.'
        },
        {
            name: 'Interior Aconchegante',
            description: 'Lareira, poltronas confortáveis e uma estante de livros cheia.',
            prompt: 'O interior de uma casa de campo aconchegante com uma lareira acesa, poltronas confortáveis e uma estante de livros cheia, luz quente e suave, pintura a óleo.'
        },
        {
            name: 'Planeta Alienígena',
            description: 'Um cenário de outro mundo com flora e fauna exóticas.',
            prompt: 'Um planeta alienígena com flora bioluminescente, duas luas no céu e montanhas flutuantes. Iluminação etérea e misteriosa, arte conceitual, fotorrealista, 8k.'
        },
        {
            name: 'Floresta Encantada',
            description: 'Uma floresta mágica cheia de luzes e criaturas místicas.',
            prompt: 'Uma floresta encantada à noite, com cogumelos brilhantes, um rio cintilante e vaga-lumes dançantes. Estilo de pintura a óleo de fantasia, iluminação suave e mágica.'
        },
        {
            name: 'Grifo Majestoso',
            description: 'Uma criatura mítica combinando um leão e uma águia.',
            prompt: 'Um grifo majestoso com penas de águia dourada e corpo de leão branco, pousado no topo de uma montanha com um céu dramático ao fundo. Fotografia de fantasia, iluminação épica do nascer do sol.'
        },
        {
            name: 'Explosão de Cores',
            description: 'Uma composição abstrata com formas fluidas e cores vibrantes.',
            prompt: 'Uma explosão de cores abstrata e fluida, com formas orgânicas e texturas complexas. Renderização 3D, estilo de arte generativa, vibrante e dinâmico.'
        },
    ],
    // Presets para a ferramenta "Design de Personagem"
    characterDesign: [
        {
            name: 'Cavaleiro Élfico',
            description: 'Armadura detalhada, pose heroica e fundo de castelo.',
            prompt: 'Um cavaleiro élfico nobre e vigilante, com armadura de prata ornamentada com filigranas de folhas e uma longa capa verde-musgo. Ele segura uma espada longa e curva que brilha com uma luz fraca e azul. Personalidade: sereno mas pronto para a batalha. Fundo de um castelo em ruínas coberto de hera ao pôr do sol. Estilo de arte conceitual de fantasia, realista e detalhado.'
        },
        {
            name: 'Feiticeira Cibernética',
            description: 'Cabelo neon, implantes tecnológicos e cidade chuvosa.',
            prompt: 'Uma feiticeira cibernética rebelde e enigmática, com cabelo roxo neon e implantes tecnológicos brilhantes em seu rosto. Ela está conjurando um feitiço holográfico complexo em uma cidade futurista e chuvosa, com reflexos de neon no asfalto molhado. Vestuário: jaqueta de couro preta com gola alta e detalhes luminosos. Estilo cyberpunk, fotorrealista.'
        },
        {
            name: 'Robô Amigável',
            description: 'Feito de sucata, com olhos grandes e expressivos.',
            prompt: 'Um robô amigável e curioso, construído com peças de sucata reaproveitadas. Seu corpo é assimétrico, mas seus olhos são grandes e expressivos, brilhando com uma luz azul calorosa. Ele está em um cenário de deserto pós-apocalíptico, oferecendo uma pequena flor verde que cresceu em uma bota velha a uma criatura lagarto.'
        },
        {
            name: 'Animal Místico',
            description: 'Uma criatura fantástica em um ambiente mágico.',
            prompt: 'Uma raposa mística e sábia, cujo pelo parece ser feito de estrelas e nebulosas. Seus múltiplos rabos deixam um rastro de poeira estelar cintilante. A raposa está sentada em uma floresta bioluminescente à noite, olhando para o espectador com olhos inteligentes. Estilo de pintura a óleo de fantasia, etéreo e mágico.'
        },
        {
            name: 'Pirata Espacial',
            description: 'Casaco longo, tapa-olho tecnológico e nave espacial ao fundo.',
            prompt: 'Um capitão pirata espacial carismático e perigoso, com um casaco longo de couro, um tapa-olho tecnológico brilhante e uma pistola laser na cintura. Ele tem um sorriso malicioso e uma cicatriz no queixo. Ele está no convés de sua nave espacial, com uma nebulosa colorida visível através do painel de visualização. Arte de ficção científica, estilo de capa de livro.'
        },
        {
            name: 'Detetive Steampunk',
            description: 'Sobretudo, chapéu-coco e engrenagens de latão.',
            prompt: 'Um detetive particular em um mundo steampunk. Ele usa um sobretudo, um chapéu-coco e óculos com lentes de engrenagem. Ele segura uma lupa ornamentada de latão, investigando uma pista em uma rua de paralelepípedos iluminada por lampiões a gás. Fumaça e vapor sobem dos bueiros. Estilo de arte detalhado com foco em texturas de latão e couro.'
        },
        {
            name: 'Guerreira Tribal Futurista',
            description: 'Pintura facial, armadura tecnológica e fundo de selva neon.',
            prompt: 'Uma guerreira tribal futurista com pintura facial brilhante e uma armadura que combina elementos orgânicos com tecnologia avançada. Ela segura uma lança de energia e tem uma expressão feroz. O cenário é uma selva alienígena com plantas de neon e criaturas estranhas ao fundo. Estilo de arte de ficção científica vibrante e dinâmico.'
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
            name: 'Mudar Penteado',
            description: 'Altera o penteado da pessoa, mantendo as características.',
            prompt: 'mude o penteado para um coque elegante e formal'
        },
        {
            name: 'Mudar Fundo',
            description: 'Coloca a pessoa em um novo cenário.',
            prompt: 'coloque a pessoa em um fundo de floresta enevoada'
        },
        {
            name: 'Maquiagem Artística',
            description: 'Aplica uma maquiagem criativa no rosto.',
            prompt: 'adicione uma maquiagem artística com glitter dourado ao redor dos olhos'
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
            prompt: 'Ilumine a cena com luzes de neon azuis e roxas como se estivesse em uma rua de cyberpunk, com alto contraste e reflexos em superfícies molhadas.'
        },
        {
            name: 'Luz de Fogueira',
            description: 'Iluminação quente e cintilante vinda de baixo.',
            prompt: 'Reacenda a cena com uma luz de fogueira quente e cintilante vinda de baixo, projetando sombras longas e dançantes para cima.'
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
            name: 'Palco de Show',
            description: 'Holofote forte vindo de cima, como em um palco.',
            prompt: 'Ilumine o sujeito com um holofote forte vindo de cima, como se estivesse em um palco, com o fundo escuro.'
        },
        {
            name: 'Raios Volumétricos',
            description: 'Feixes de luz dramáticos (god rays).',
            prompt: 'Adicione raios de luz volumétricos (god rays) atravessando a cena, como se a luz do sol estivesse passando por uma janela empoeirada ou pela copa de árvores.'
        },
        {
            name: 'Luz Subaquática',
            description: 'Luz cáustica e ondulante, como sob a água.',
            prompt: 'Reacenda a cena com uma luz cáustica e ondulante, como se a luz do sol estivesse se filtrando através da água, em tons de ciano e azul.'
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
            name: 'Piloto de Corrida',
            description: 'Com macacão de corrida e carro de F1 ao fundo.',
            prompt: 'vestindo um macacão de corrida e capacete, com um carro de Fórmula 1 desfocado ao fundo'
        },
        {
            name: 'Hacker Cyberpunk',
            description: 'Sala escura iluminada por telas de computador e código holográfico.',
            prompt: 'em uma sala escura iluminada por telas de computador, com código holográfico flutuando ao redor'
        },
        {
            name: 'Chef de Cozinha',
            description: 'Com dólmã branco em uma cozinha profissional.',
            prompt: 'vestindo um dólmã branco e chapéu de chef, em uma cozinha de restaurante profissional e movimentada'
        },
        {
            name: 'Mago de Fantasia',
            description: 'Conjurando um feitiço com mãos brilhantes e partículas de energia.',
            prompt: 'conjurando um feitiço com as mãos brilhando, partículas de energia girando ao redor'
        },
        {
            name: 'Retrato de Negócios',
            description: 'Terno elegante, escritório moderno e iluminação profissional.',
            prompt: 'Um retrato de negócios profissional, com a pessoa vestindo um terno elegante em um escritório moderno e desfocado ao fundo. Iluminação de estúdio suave e corporativa.'
        },
        {
            name: 'Selfie com Heróis',
            description: 'Uma selfie divertida com seus super-heróis favoritos.',
            prompt: 'Uma selfie casual e divertida tirada com Superman e Mulher-Maravilha. Todos estão sorrindo, com uma cidade metropolitana ao fundo.'
        },
        {
            name: 'Pintura Clássica',
            description: 'Um retrato a óleo no estilo dos mestres do Renascimento.',
            prompt: 'Transforme a pessoa em uma pintura a óleo do século 18, no estilo de Rembrandt. A pessoa deve usar trajes da época, com iluminação dramática de chiaroscuro e um fundo escuro e texturizado.'
        },
        {
            name: 'Guerreiro de Fantasia',
            description: 'Armadura épica em um cenário de castelo medieval.',
            prompt: 'Um guerreiro de fantasia com armadura de batalha completa, segurando uma espada, em frente a um castelo medieval em um dia de tempestade.'
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