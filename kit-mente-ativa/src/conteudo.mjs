// Textos e dados do kit. Edite aqui e rode `npm run build`.

export const marca = {
  nome: 'Mente Ativa',
  subtitulo: 'Coleção de Jogos e Desafios para Imprimir',
  chamada: 'Raciocínio, palavras, quebra-cabeças, dominó, xadrez e outros clássicos para jogar em família.',
};

export const sequencias = [
  ['2, 4, 6, 8, ___', '10', 'Soma 2'],
  ['3, 6, 12, 24, ___', '48', 'Dobra'],
  ['1, 4, 9, 16, ___', '25', 'Quadrados: 1², 2², 3²…'],
  ['1, 1, 2, 3, 5, 8, ___', '13', 'Soma dos dois anteriores'],
  ['100, 90, 81, 73, ___', '66', '−10, −9, −8, −7'],
  ['2, 3, 5, 7, 11, ___', '13', 'Números primos'],
  ['5, 10, 8, 16, 14, ___', '28', '×2, −2, ×2, −2…'],
  ['1, 2, 4, 7, 11, ___', '16', '+1, +2, +3, +4…'],
  ['81, 27, 9, 3, ___', '1', 'Divide por 3'],
  ['1, 3, 6, 10, 15, ___', '21', '+2, +3, +4, +5…'],
  ['2, 6, 7, 21, 22, ___', '66', '×3, +1, ×3, +1…'],
  ['50, 45, 41, 38, ___', '36', '−5, −4, −3, −2'],
  ['1, 8, 27, 64, ___', '125', 'Cubos: 1³, 2³, 3³…'],
  ['3, 5, 9, 17, 33, ___', '65', 'Dobra e tira 1'],
  ['A, C, E, G, ___', 'I', 'Pula uma letra'],
  ['Z, X, V, T, ___', 'R', 'Pula uma letra, de trás para frente'],
];

export const enigmas = [
  ['Um tijolo pesa 1 kg mais meio tijolo. Quanto pesa um tijolo inteiro?', '2 kg. Se meio tijolo pesa 1 kg, o tijolo inteiro pesa 2 kg.'],
  ['Se 5 máquinas fazem 5 peças em 5 minutos, quanto tempo 100 máquinas levam para fazer 100 peças?', '5 minutos. Cada máquina faz uma peça em 5 minutos.'],
  ['Uma vitória-régia dobra de tamanho a cada dia e cobre o lago inteiro em 30 dias. Em quantos dias cobre metade do lago?', '29 dias. No dia seguinte ela dobra e cobre o lago todo.'],
  ['Uma xícara e um pires custam R$ 11,00 juntos. A xícara custa R$ 10,00 a mais que o pires. Quanto custa o pires?', 'R$ 0,50. A xícara custa R$ 10,50, e 10,50 + 0,50 = 11,00.'],
  ['Um relógio de parede leva 5 segundos para dar as 6 badaladas das seis horas. Quanto tempo leva para dar as 12 badaladas do meio-dia?', '11 segundos. Entre 6 badaladas há 5 intervalos de 1 segundo; entre 12 há 11 intervalos.'],
  ['Numa corrida, você ultrapassa quem está em segundo lugar. Em que posição você fica?', 'Em segundo lugar.'],
  ['Um fazendeiro tinha 17 ovelhas. Todas, menos 9, fugiram. Quantas ficaram?', '9 ovelhas.'],
  ['Ana, Bruno e Carla são médico(a), professor(a) e engenheiro(a), não necessariamente nessa ordem. Ana não é médica. Carla não é professora nem médica. Qual a profissão de cada um?', 'Carla é engenheira, Ana é professora e Bruno é médico.'],
  ['Quantos meses do ano têm 28 dias?', 'Todos os 12 meses têm pelo menos 28 dias.'],
  ['Qual é o número que, multiplicado por qualquer outro, dá sempre o mesmo resultado?', 'O zero.'],
];

export const cacaPalavras = [
  { tema: 'Capitais do Brasil', palavras: ['RECIFE', 'BELEM', 'NATAL', 'MANAUS', 'CUIABA', 'MACEIO', 'VITORIA', 'SALVADOR', 'CURITIBA', 'GOIANIA', 'TERESINA', 'PALMAS'] },
  { tema: 'Música brasileira', palavras: ['SAMBA', 'CHORO', 'FORRO', 'FREVO', 'BAIAO', 'MODINHA', 'SERESTA', 'VIOLAO', 'PANDEIRO', 'SANFONA', 'CAVAQUINHO', 'MARCHINHA'] },
  { tema: 'Na cozinha', palavras: ['PANELA', 'CONCHA', 'TALHER', 'FOGAO', 'CHALEIRA', 'PENEIRA', 'TRAVESSA', 'BULE', 'FRIGIDEIRA', 'COLHER', 'ESCUMADEIRA', 'ROLO'] },
  { tema: 'Ofícios de antigamente', palavras: ['ALFAIATE', 'SAPATEIRO', 'FERREIRO', 'BARBEIRO', 'LEITEIRO', 'TELEGRAFISTA', 'RELOJOEIRO', 'COSTUREIRA', 'PADEIRO', 'CARPINTEIRO', 'AMOLADOR', 'MASCATE'] },
];

export const anagramas = [
  ['Frutas', ['BANANA', 'LARANJA', 'ABACAXI', 'GOIABA', 'MORANGO']],
  ['Flores', ['MARGARIDA', 'ORQUIDEA', 'GIRASSOL', 'TULIPA', 'VIOLETA']],
  ['Países', ['PORTUGAL', 'ITALIA', 'JAPAO', 'ARGENTINA', 'ESPANHA']],
  ['Animais', ['CAVALO', 'TARTARUGA', 'PAPAGAIO', 'ELEFANTE', 'GIRAFA']],
];

export const ditados = [
  ['Quem espera', 'sempre alcança'],
  ['Água mole em pedra dura', 'tanto bate até que fura'],
  ['Quem não tem cão', 'caça com gato'],
  ['Mais vale um pássaro na mão', 'do que dois voando'],
  ['De grão em grão', 'a galinha enche o papo'],
  ['Em casa de ferreiro', 'o espeto é de pau'],
  ['Quem semeia vento', 'colhe tempestade'],
  ['Cavalo dado', 'não se olham os dentes'],
  ['Deus ajuda', 'quem cedo madruga'],
  ['Filho de peixe', 'peixinho é'],
  ['A pressa é inimiga', 'da perfeição'],
  ['Quem tem boca', 'vai a Roma'],
  ['Em boca fechada', 'não entra mosca'],
  ['Cão que ladra', 'não morde'],
  ['O seguro', 'morreu de velho'],
];

// Mate em 1: brancas jogam. As respostas são calculadas no build com chess.js.
export const mates = [
  { fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', nome: 'Mate do corredor' },
  { fen: '7k/Q7/6K1/8/8/8/8/8 w - - 0 1', nome: 'Dama e rei' },
  { fen: '6rk/6pp/7N/8/8/8/8/6K1 w - - 0 1', nome: 'Mate sufocado' },
  { fen: 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1', nome: 'Mate do pastor' },
  { fen: 'k7/7R/8/8/8/8/8/K5R1 w - - 0 1', nome: 'Escada de torres' },
  { fen: 'rnbqkbnr/ppppp2p/5p2/6p1/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1', nome: 'Mate do louco' },
];

// Equações com palitos: mova UM palito para a conta ficar certa.
export const palitos = [
  { conta: '5+7=2', resposta: '9-7=2', dica: 'Tire o palito em pé do “+” e coloque no 5, que vira 9.' },
  { conta: '6+4=4', resposta: '0+4=4', dica: 'Mova o palito do meio do 6 para o canto de cima: ele vira 0.' },
  { conta: '3+3=8', resposta: '3+5=8', dica: 'Mova um palito do segundo 3 para que ele vire 5.' },
  { conta: '8-3=3', resposta: '8-3=5', dica: 'Mova um palito do último 3 para que ele vire 5.' },
];
