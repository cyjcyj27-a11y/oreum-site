/* 포르투갈어(브라질)판: 주소에 ?lang=pt 가 있을 때만. en.js 다음, game.js 앞에 싣는다 */
(function(){
if (window.LD_LG !== 'pt') return;
var D = window.LD;
function put(list, key, arr){ if (list.length !== arr.length) console.warn('pt.js 길이 다름', key, list.length, arr.length); list.forEach(function(o, i){ if (arr[i] != null) o[key] = arr[i]; }); }
function lines(list, arr){ if (list.length !== arr.length) console.warn('pt.js 대사 수 다름', list.length, arr.length); list.forEach(function(q, i){ q[1] = arr[i][0]; q[2] = arr[i][1]; }); }

/* game.js 의 E('한국어', 'English') 글: 한국어 글이 열쇠 */
window.LD_T = {
  '목표 · ': 'Meta · ',
  '노가다 ': 'Obra ',
  '포장마차에서 말로 이기기': 'Vença um bate-boca no boteco',
  '신도 ': 'Fiéis ',
  '반지하 셋방 구하기': 'Alugue um porão',
  '큰 천막 세우기': 'Monte uma tenda grande',
  '상가 2층 얻기': 'Pegue uma sala no 2º andar',
  '지부 ': 'Filiais ',
  ' · 수련원': ' · Retiro',
  ' 완료': ' feito',
  '기계교 한국 지부 접수': 'Tome a filial coreana do Culto da Máquina',
  '해외 지부 ': 'Filiais no exterior ',
  ' · 대성전': ' · Grande Templo',
  '실리콘밸리': 'Vale do Silício',
  '도감 ': 'Álbum ',
  '돈 ': 'Grana ',
  '/1조': '/1T',
  '교주': 'Líder',
  '처음부터 할까요?': 'Começar do zero?',
  '새로 시작': 'Novo jogo',
  '취소': 'Cancelar',
  '상자집 수리<small>수리비</small>': 'Consertar barracos<small>pagamento</small>',
  '노가다<small>일당</small>': 'Obra<small>diária</small>',
  '연설<small>신도 모으기</small>': 'Discurso<small>ganhar fiéis</small>',
  '봉사<small>의심 -15</small>': 'Voluntariado<small>suspeita -15</small>',
  '펍<small>맥주값 1만원</small>': 'Pub<small>cerveja 10K</small>',
  '포장마차<small>술값 1만원</small>': 'Boteco<small>bebida 10K</small>',
  '모임장소': 'Sede',
  '도감': 'Álbum',
  '동네 청소 봉사 · 의심 -15': 'Limpou o bairro · Suspeita -15',
  '헌금 <b>+': 'Ofertas <b>+',
  '지부 헌금 <b>+': 'Ofertas das filiais <b>+',
  '지부 신도 <b>+': 'Fiéis das filiais <b>+',
  '신도가 신도를 데려옴': 'fiéis trazem fiéis',
  '자리 없음 ': 'Sem lugar ',
  '믿음이 식어 떠남 -': 'A fé esfriou, saíram -',
  '압수수색 · 신도 -': 'Batida policial · Fiéis -',
  ' · 돈 -': ' · Grana -',
  '기계교가 빼 감 · 신도 -': 'O Culto da Máquina roubou · Fiéis -',
  '기자 취재 · 의심 +5': 'Visita de repórter · Suspeita +5',
  '조용한 하루': 'Um dia tranquilo',
  '의심 -40': 'Suspeita -40',
  '보탠다': 'Contribuir',
  '거절': 'Recusar',
  '경찰': 'Polícia',
  '목수': 'Carpinteiro',
  '기자': 'Repórter',
  '기계교 교주': 'Líder do Culto da Máquina',
  '시간': 'Tempo',
  '못': 'Pregos',
  '반장: 똑바로 안 해!': 'Mestre de obras: Faz direito!',
  '못 ': 'Pregos ',
  '수리비': 'Pagamento',
  '일당': 'Diária',
  '믿음': 'Fé',
  '이김': 'Vitórias',
  '원샷': 'Viradas',
  '형님이 따라왔다 · 신도 +1': 'O Irmãozão te seguiu · Fiéis +1',
  '펍 손님들이 따라왔다 · 신도 +': 'Clientes do pub te seguiram · Fiéis +',
  ' · 신도 +': ' · Fiéis +',
  '술친구 · 신도 +': 'Parça de copo · Fiéis +',
  '필름이 끊겼다': 'Apagou geral',
  '어디서 연설할까요?': 'Onde vai discursar?',
  '매일 헌금 +': 'Ofertas diárias +',
  '지부 완성': 'Filial completa',
  '해외 지부 4곳부터': 'Precisa de 4 filiais no exterior',
  '지부 6곳부터': 'Precisa de 6 filiais',
  '닫기': 'Fechar',
  '차례': 'Turno',
  '신도': 'Fiéis',
  '모두': 'Todos',
  '특수': 'Especial',
  '힘 ': 'Força ',
  '손패 새로': 'Mão nova',
  '다음 카드 두 배': 'Próxima carta x2',
  '남은 차례 +2': 'Turnos +2',
  '부숨!': 'QUEBROU!',
  '쫓아냄': 'EXPULSO',
  '의심 -8': 'Suspeita -8',
  '튕김': 'BLOQUEOU',
  '넓게': 'ABERTO',
  '좁게': 'FECHADO',
  '보통': 'MÉDIO',
  '기자가 돌아갔다': 'O repórter foi embora',
  '만장일치': 'UNANIMIDADE',
  '대성공': 'SUCESSO TOTAL',
  '박수': 'APLAUSOS',
  '썰렁': 'SILÊNCIO...',
  '우리 편 ': 'Convertidos ',
  '신도 <b>+': 'Fiéis <b>+',
  ' · 모임장소를 키우세요': ' · Aumente sua sede',
  ' 지부 완성': ' · filial completa',
  '도감 <b>+': 'Álbum <b>+',
  '카드 한 장 고르기': 'Escolha uma carta',
  '넘기기': 'Pular',
  ' · 자리 ': ' · Lugares ',
  '무제한': 'Ilimitado',
  '자리 ': 'Lugares ',
  '아직 이릅니다': 'Ainda não',
  '돈이 모자랍니다': 'Grana insuficiente',
  '보유': 'COMPRADO',
  '신도 도감 ': 'Álbum de Fiéis ',
  '얼굴을 누르면 사연이 보입니다': 'Toque num rosto para ler a história',
  '번개 같은 교주': 'Líder Relâmpago',
  '망치의 교주': 'Líder do Martelo',
  '뚝심의 교주': 'Líder Persistente',
  '대기만성 교주': 'Líder Paciente',
  '러다이트교': 'IGREJA LUDITA',
  '교주 즉위': 'Coroado Líder',
  '저장': 'SALVAR',
  '사이트에서 저장할 수 있습니다': 'Dá pra salvar no site',
  '공유': 'COMPARTILHAR',
  '주소를 복사했습니다': 'Link copiado',
  '처음 화면': 'INÍCIO',
  // 배열로 넘기는 글
  '아침': 'Manhã', '낮': 'Tarde', '밤': 'Noite',
  '국내': 'Coreia', '해외': 'Exterior',
  '망치 막대가 가운데 올 때 누르면 탁! 못을 박아 돈을 법니다.': 'Toque quando a barra do martelo chegar no meio. Pá! Pregue pregos e ganhe grana.',
  '카드를 고르고 화면을 당겼다 놓으면 전단지가 날아갑니다. 머리 위 색과 같은 색을 맞히면 우리 신도가 됩니다.': 'Escolha uma carta, puxe a tela e solte para lançar panfletos. Acerte a cor que está sobre a cabeça e a pessoa vira fiel.',
  '신도가 내는 헌금으로 모임장소를 키우고 지부를 늘리세요. 바다 건너까지 퍼지면 교주가 됩니다.': 'Com as ofertas dos fiéis, aumente sua sede e abra filiais. Espalhe além-mar para virar o líder da seita.'
};

D.NEED_NAME = ['Risada', 'Raiva', 'Tristeza'];
put(D.CARDS, 'n', [
 'Piada de Tiozão', 'Causo de Cachaça', 'Xingando o Totem', 'Xingando o Robô Aspirador', 'Tapinha nas Costas', 'Macarrão de Graça',
 'Máquina Não Bebe', 'Poema Escrito por IA', 'A Traição do Autoatendimento', 'Tirania do Estacionamento Robô', 'Mãos Não Mentem', 'História da Minha Vó',
 'Show do Martelo', 'Bis', 'Música em Roda', 'O Totem Fez a Vovó Chorar', 'Máquina Não Sorri', 'Sopão pra Todos',
 'Martelada', 'Lágrimas do Irmãozão', 'Carpinteiro Dançarino', 'Milagre do Martelo', 'Unanimidade', 'Martelo de Ouro',
 'Causos da Obra', 'Imitando Robô', 'Xingando a Gravação', 'Xingando a Porta Automática', 'Uma Dose de Soju', 'Exibindo os Calos',
 'Malabarismo de Martelo', 'Um Refrão de Brega', 'Xingando o Armário de Entregas', 'Causo do App Obrigatório', 'Comida de Mãe', 'Mostrar as Palmas',
 'Vídeo do Braço Robô Pifando', 'Assalto na Loja Sem Caixa', 'A Loja de Ferragens Fechou', 'Coro da Galera', 'Turma do Amém', 'Manifesto Ludita',
 'IA Desenhou Sete Dedos', 'O Robô Caiu', 'O Chatbot Fala Besteira', 'O Robotáxi se Perdeu',
 'IA Vai Roubar Todo Emprego', 'IA Faz Entrevista', 'Não Dá pra Falar com Gente', 'Demitido por Mensagem',
 'O Dia que a Fábrica Fechou', 'A Roupa de Trabalho do Pai', 'Hoje Eu Pago', 'Meu Filho Só Fala com IA',
 'IA Escreve Romance Também', 'IA Canta Também', 'Os Caixas Sumiram', 'IA Ganhou Concurso de Arte',
 'Acharam que Meu Desenho Era IA', 'Robô na Fábrica da Minha Vida', 'Coral do Hino Operário', 'Processo de Direito Autoral de IA',
 'Greve Geral em Hollywood', 'Motoristas Vão Sumir', 'IA Virou Médico', 'Arrumei um Namorado IA',
 'A Máquina Lembra Meu Rosto', 'Ancestrais de Martelo na Mão', 'Feito à Mão', 'NO AI SLOP', 'Greve Geral Mundial',
 'GPS Me Jogou no Arrozal', 'A Caixinha de IA Não Me Entende', 'Desastre da Tradução Automática', 'Sumiram os Caixas do Banco',
 'Hospital Só Atende por App', 'A Máquina Engoliu Meu Cartão', 'Mandando Mensagem pelo Pai', 'Meu Boteco Fechou',
 'Até a Cidade pelo Extrato', 'Fotos do Voluntariado', 'Garçom Robô Derrubou a Sopa', 'Drone Entregou no Vizinho',
 'Bicos Viraram Totens', 'Táxi Só por App', 'Feira Perdeu Metade dos Clientes', 'Robô Trabalha até no Feriado',
 'A Turma do Bairro Chegou', 'União Nacional dos Peões',
 'IA Estragou Minha Selfie', 'O Gato Venceu o Robô Aspirador', 'O Tradutor Xingou', 'Nenhum Caixa no Mercado',
 'Call Center Todo de IA', 'IA Jogou Fora Meu Currículo', 'Vovó Não Sabe Usar App', 'A Livraria do Bairro Fechou',
 'Mandaram Jogar Fora a Roupa de Trabalho', 'Bazar Beneficente', 'Cantora de IA Ficou em 1º', 'O Robô Policial Caiu',
 'IA Escreve Notícia Também', 'Fábrica Funciona no Escuro', 'Cidade Mineira Ficou Vazia', 'IA Virou Professor',
 'A Turma do Sindicato Chegou', 'O Dia em que o Mundo Parou'
]);
D.CARD_FX = {all:'Atinge todos', double:'Próxima carta x2', redraw:'Mão nova', smash:'Quebra robôs', spread:'Espalha pros vizinhos', turns:'Turnos +2', calm:'Suspeita -8', kick:'Expulsa robôs e repórteres'};

put(D.FOLK, 'n', ['Vovó da Bilheteria', 'Caixa do Mercado', 'Guarda do Estacionamento', 'Tia da Limpeza', 'Tradutor', 'Taxista', 'Barista', 'Lavador de Carros', 'Soldador', 'Caixa do Banco',
 'Cobrador do Pedágio', 'Atendente de Call Center', 'Desenhista de Webtoon', 'Dono do Estúdio de Fotos', 'Dono da Locadora', 'Vovó da Livraria', 'Carteiro', 'Dono da Gráfica', 'Vovô Engraxate', 'Dono da Loja de Ferragens',
 'Ferreiro', 'Dono da Doceria de Arroz', 'Vovô do Moinho', 'Chaveiro', 'Relojoeiro', 'Vovó Cobradora de Ônibus', 'Vovó Telefonista', 'Alfaiate', 'Esfregador da Sauna', 'Barbeiro',
 'Entregador de Carvão', 'Menino do Jornal', 'Vovô do Ferro-Velho', 'Dono da Mercearia', 'Farmacêutico', 'Professor de Cursinho', 'Vovó Ascensorista', 'Costureira', 'Vovó Datilógrafa', 'Dono do Fliperama']);
put(D.FOLK, 'l', [
 'Passagem tem que ser vendida por gente pra ter carinho. A máquina nem diz boa viagem.',
 'Chegou o autoatendimento e meu lugar sumiu. Fiquei ali de pé por 30 anos.',
 'Levantar a cancela era meu trabalho. Agora ela sobe sozinha.',
 'Robô aspirador não conhece os cantos. E o canto é o mais sujo.',
 'O tradutor de graça faz tudo, então meu serviço caiu pela metade.',
 'O carro autônomo conhece o caminho, mas não conhece o passageiro.',
 'O robô do café não chama o freguês pelo nome.',
 'Minha esponja arranha menos que essas escovas giratórias.',
 'Quem soltou as faíscas fui eu, mas quem levou o prêmio foi o braço robô.',
 'Querem um app no lugar da senha de papel. E os vovôs, como ficam?',
 'O pedágio automático não sabe dizer boa viagem.',
 'A atendente de IA nunca se irrita. Por isso todo mundo se irrita mais.',
 'A IA desenha cem páginas por dia. Ninguém mais compra meus desenhos.',
 'Selfie todo mundo tira, mas ninguém fala pra você sorrir.',
 'Que saudade do tempo do "rebobine antes de devolver".',
 'Tela não tem cheiro de livro.',
 'O drone joga a carta e vai embora. Eu batia na porta.',
 'Hoje todo mundo lê na tela. Os pedidos de impressão sumiram.',
 'Ninguém mais engraxa sapato. É só tênis.',
 'Sinto falta do freguês que vinha comprar um prego e ficava falando da vida.',
 'Quem segura martelo se entende.',
 'A máquina até faz bolinho de arroz. Mas não dá um de brinde.',
 'Óleo de gergelim se espreme pelo cheiro. Óleo de fábrica não tem gosto.',
 'Toda fechadura agora é senha. Minhas chaves estão enferrujando.',
 'Todo mundo vê a hora no celular. Ninguém traz relógio pra consertar.',
 '"Pode seguir, motorista!" Ninguém mais fala isso.',
 '"Pra qual número deseja ligar?" Eu adorava dizer isso.',
 'Roupa pronta não conhece ombro. Cada ombro é diferente.',
 'Máquina de esfregar? Costas só ficam limpas na mão.',
 'A máquina de cortar cabelo não escuta o que você quer na nuca.',
 'A caldeira liga num botão, e minha carga de carvão ficou parada.',
 'Os jornais que eu jogava de madrugada, agora todo mundo lê no celular.',
 'Robô quebrado acaba vindo parar comigo. Hehe.',
 'Loja sem caixa não vende fiado.',
 'Máquina de remédio não pergunta onde dói.',
 'Aula online não te acorda quando você cochila.',
 '"Subindo." A máquina roubou essa palavra.',
 'As máquinas da fábrica costuram sozinhas. Eu só fico olhando a linha.',
 'Fui a primeira da escola de datilografia. Hoje ninguém procura datilógrafa.',
 'A criançada não conhece a sensação de pôr a ficha.'
]);
put(D.GFOLK, 'n', ['Doris da Bilheteria', 'Linda do Caixa', 'Frank do Estacionamento', 'Rosa da Limpeza', 'Claire, a Tradutora', 'Eddie, o Taxista', 'Zhang, o Barista', 'Marcus do Lava-Rápido', 'Graham, o Soldador', 'Hannah do Banco',
 'Clara do Pedágio', 'Leonie do Call Center', 'Antoine, o Cartunista', 'Pierre, o Fotógrafo', 'Ray da Locadora', 'Mathilde da Livraria', 'Ted, o Carteiro', 'Arthur da Gráfica', 'Walt, o Engraxate', 'Geoffrey das Ferragens',
 'Derek, o Ferreiro', 'Brigitte, a Padeira', 'Albert, o Moleiro', 'Dieter, o Chaveiro', 'Henri, o Relojoeiro', 'Mabel, a Cobradora', 'Greta, a Telefonista', 'Percy, o Alfaiate', 'Betty, a Massagista', 'Jean-Pierre, o Barbeiro',
 'Colin, o Mineiro', 'Tommy do Jornal', 'Bernie do Ferro-Velho', 'Gloria da Mercearia', 'Howard, o Farmacêutico', 'Lucas, o Professor', 'Helga, a Ascensorista', 'Maureen, a Costureira', 'Ingrid, a Datilógrafa', 'Danny do Fliperama']);
put(D.GFOLK, 'l', [
 'Querem que eu venda ingresso de cinema por app. Eu gostava de vender com cheiro de pipoca no ar.',
 'Chegou o autoatendimento e demitiram todos os caixas. Máquina nem pergunta como você está.',
 'O leitor de placas pegou meu emprego. Placa eu também sei ler.',
 'Vi um robô aspirador rolar escada abaixo. Eu ri. Depois chorei.',
 'Tradução automática não sabe levar uma piada. Muito menos uma francesa.',
 'Passa táxi sem volante. Quem vai contar do bairro pro passageiro agora?',
 'Robô até desenha coração no latte. Mas não tem coração ali.',
 'O lava-rápido automático quebrou um retrovisor. Eu nunca faria isso.',
 'Manchester sempre brigou com as máquinas. O avô do meu avô também.',
 'Estão fechando o caixa e empurrando um app. Pra onde vão as vovós?',
 'A cancela automática não sabe dizer tenha um bom dia.',
 'Os clientes imploram pra IA chamar uma pessoa. Essa pessoa era eu.',
 'Quadrinho de IA tem seis dedos. E ainda vende.',
 'Filme fotográfico era esperar. Hoje ninguém espera.',
 'Toda sexta à noite a loja lotava. Agora ninguém sai do sofá.',
 'O algoritmo de recomendação não conhece os livros que eu indico.',
 'O drone joga a carta e vai embora. Eu perguntava de cada família.',
 'Meu dia começava com cheiro de tinta.',
 'Todo mundo de tênis. Não sobra sapato pra engraxar.',
 'A loja de ferragens era a sala de estar do bairro. Agora todo mundo compra online.',
 'Quem segura martelo tem algo em comum. Prazer, irmão.',
 'A fábrica de pão assa dez mil por dia. A nossa é a última padaria do bairro.',
 'O moinho era o ponto de encontro da cidade. Agora toda farinha vem da fábrica.',
 'Quando a fechadura inteligente trava, eles ainda me chamam.',
 'Smartwatch quebrou, vai pro lixo. Relógio a gente conserta.',
 '"Próxima parada." Teve um tempo em que eu dizia isso com a minha voz.',
 '"Pra qual número deseja ligar?" Sinto falta de dizer isso.',
 'Terno sob medida se mede na mão. Medida de app é mentira.',
 'A cadeira de massagem não pergunta onde está travado.',
 'Barbearia é lugar de papo. Máquina não sabe bater papo.',
 'A mina fechou e só ficaram as máquinas. Nossa vila fechou junto.',
 'Eu adorava pedalar de madrugada, mas todo mundo lê notícia no celular.',
 'Montanhas de sucata de robô. O povo joga fora rapidinho.',
 'O papo no balcão era o meu negócio. Agora ninguém conversa.',
 'Se a máquina entrega o remédio, quem vai dizer beba bastante água?',
 'Tutor de IA não te acorda quando você cochila.',
 '"Subindo." A máquina roubou essa palavra.',
 'As máquinas da fábrica costuram sozinhas. Eu só olho a linha.',
 'Todo escritório fazia barulho de máquina de escrever. Agora o computador digita tudo.',
 'Jogo não era pra jogar sozinho. Era pra jogar com quem tava do lado.'
]);
put(D.TOWN, 'n', ['Mercado Tradicional', 'Bairro Universitário', 'Condomínio', 'Praça do Bairro', 'Centro Empresarial', 'Polo Industrial', 'Culto da Máquina - Coreia', 'Manchester', 'Paris', 'Berlim', 'Detroit', 'Sede do Culto da Máquina, Vale do Silício']);
put(D.BLDG, 'n', ['A Rua', 'Porão Alugado', 'Tenda Grande', 'Sala no 2º Andar', 'Centro de Retiro', 'Sede Missionária', 'Grande Templo']);
put(D.DECO, 'n', ['Cesto de Ofertas Dourado', 'Megafone', 'Emblema do Martelo de Ouro', 'Túnica Branca', 'Cofre de Dinheiro', 'Van Missionária', 'Banca de Produtos do Martelo', 'Kit de Live', 'Gráfica do Jornal da Igreja', 'Fundação de Bolsas Ludita', 'Megafone de Ouro Maciço', 'Jatinho da Igreja', 'Emissora via Satélite', 'Verba de Lobby no Congresso dos EUA', 'Equipe de Advogados']);
put(D.DECO, 'd', ['Ofertas +10%', 'Público começa mais animado +15', 'A fé esfria devagar', 'Ofertas +20%', 'Perdas em batidas pela metade', 'Fiéis por discurso +30%', 'Ofertas +30%', 'Filiais crescem mais rápido', 'Ofertas +30%', 'Suspeita sobe mais devagar', 'Força dos discursos no exterior +25%', 'Suspeita sobe mais devagar', 'Renda das filiais x2', 'Ofertas +30%', 'Sem perdas em batidas']);

lines(D.POCHA, [
 ['O que um carpinteiro sabe pra ficar falando?', 'Jesus também era carpinteiro, chefia!'],
 ['Mudar o mundo com martelo? Hahaha', 'Sem pregar um prego, casa não fica de pé!'],
 ['Quem trabalha com as mãos hoje em dia? Que cafona', 'Essas mãos cafonas construíram sua casa!'],
 ['Essa faixa na cabeça é moda?', 'É um enxuga-suor de grife!'],
 ['Robô trabalha melhor que você', 'Robô não toma uma depois do expediente!'],
 ['A IA faz tudo, pra que se matar?', 'IA não sabe o gosto do soju!'],
 ['Vai virar líder de seita, é?', 'Primeiro eu tomo esse boteco!'],
 ['Máquina nem cansa', 'Também nunca sorri!'],
 ['Um app substitui gente como você', 'App serve sua bebida, chefia?'],
 ['Com carro autônomo, nem motorista precisa', 'E quem xinga o trânsito com você?'],
 ['Nem sabe usar smartphone', 'Martelo não acaba a bateria!'],
 ['Ludita? Perderam faz duzentos anos', 'Por isso a gente voltou!'],
 ['Fiquei dez minutos na frente do totem!', 'Essa tela meu martelo quebra pra você!'],
 ['A firma colocou robôs!', 'Quando o robô entra, a gente barra!'],
 ['Pedi pra falar com gente e veio máquina de novo!', 'Botão não, queremos gente!'],
 ['O estacionamento robô não solta meu carro!', 'Cancela abre com uma martelada!'],
 ['O autoatendimento me chamou de ladrão!', 'Ladrão de verdade é a máquina que roubou nosso emprego!'],
 ['A IA pegou meu emprego!', 'O que foi tomado a gente pega de volta!'],
 ['Reprovei numa entrevista com IA!', 'O problema é máquina que não sabe ler gente!'],
 ['O gerente da fábrica só se gaba do braço robô!', 'Braço robô nem aperta mão!'],
 ['Sem app nem dá pra entrar na loja!', 'Porta foi feita pra abrir com a mão!'],
 ['Vão trocar entregador por drone!', 'Já viu drone subir escada?'],
 ['Máquina nem recebe salário!', 'Por isso só o patrão engorda!'],
 ['Um quadro de IA ganhou prêmio!', 'Nunca pegou num pincel e ganha prêmio?'],
 ['Trinta anos de trabalho sumiram da noite pro dia', 'Seus trinta anos máquina nenhuma alcança, chefia'],
 ['Como vou pagar o cursinho da minha filha?', 'Vamos achar um jeito juntos, chefia'],
 ['Agora eu não sirvo pra nada', 'Suas mãos ainda estão tão quentes'],
 ['Dizem que a máquina é melhor que eu', 'Máquina nem sabe chorar como você'],
 ['Não tenho cara pra olhar pra minha mulher', 'Hoje a bebida é por minha conta'],
 ['Pra onde eu vou a partir de amanhã?', 'Amanhã você vem comigo'],
 ['Meu filho só conversa com IA', 'Hoje eu escuto toda a sua história'],
 ['Os clientes foram todos pro app de delivery', 'O sabor da sua comida não cabe num app'],
 ['Dirigi a vida toda e agora tem carro sem motorista', 'Máquina nenhuma ganha de um veterano como você'],
 ['Colaram um aviso de falência na porta da fábrica', 'Vamos arrancar esse aviso juntos'],
 ['Só me sobraram os calos', 'Esses calos são suas medalhas'],
 ['Ninguém me escuta', 'Fala com calma, eu escuto a noite toda']
]);
lines(D.PUB, [
 ['O que um carpinteiro do Oriente faz aqui?', 'Martelo fala qualquer língua!'],
 ['Essa faixa na cabeça é de que ritual?', 'É o traje oficial da nossa igreja, pro suor!'],
 ['O robô do bairro fala inglês melhor que você', 'Robô não sabe o gosto da cerveja!'],
 ['Aqui até cerveja se pede por app', 'Eu levanto a mão e grito: mais uma!'],
 ['Ludita? Isso é do tempo do meu avô', 'Eu vim no lugar do seu avô!'],
 ['Vencer o Vale do Silício com um martelo?', 'Nunca ouviu do gigante derrubado com uma pedra?'],
 ['Dizem que a IA acerta todo dardo', 'Então manda ela pagar a conta!'],
 ['A gente nem fala a mesma língua, que discurso?', 'Megafone não precisa de intérprete!'],
 ['Um app de tradução substitui você', 'App de tradução brinda com você?'],
 ['O povo daqui ama máquina', 'Quem amava agora tá chorando!'],
 ['Líder de seita? Quantos fiéis?', 'Hoje à noite, neste pub, mais um!'],
 ['Já andou de robotáxi? É confortável', 'E não tem a quem agradecer na saída!'],
 ['A fábrica comprou um braço robô no meu lugar!', 'Esse braço eu dobro pra você!'],
 ['Nenhum caixa no supermercado!', 'Loja sem gente a gente não frequenta!'],
 ['Liga pro call center e só atende máquina!', 'Vamos gritar juntos: queremos gente!'],
 ['A IA jogou meu currículo fora sem ler!', 'Que avaliador é esse que nem lê?'],
 ['Um robotáxi pegou meu emprego!', 'Não vamos perder pra uma lata com rodas!'],
 ['A mina fechou, só ficaram as máquinas!', 'Máquina não canta música de mineiro!'],
 ['Uma cantora de IA ficou em primeiro!', 'Nunca forçou a voz e se diz cantora?'],
 ['O patrão comprou robôs e saiu de férias!', 'Por isso só o patrão engorda!'],
 ['A IA copiou o rosto dos atores!', 'Rouba o rosto, mas não rouba a atuação!'],
 ['Até notícia a IA escreve!', 'Nunca pisou no local e escreve notícia?'],
 ['O posto de autoatendimento engoliu meu cartão!', 'Máquina nem sabe pedir desculpa!'],
 ['Um drone largou uma encomenda no meu telhado!', 'Entregador de gente pelo menos toca a campainha!'],
 ['Todas as fábricas da cidade apagaram as luzes', 'A luz apagou, mas suas mãos ainda trabalham'],
 ['Dirigi ônibus a vida toda, agora não precisam de mim', 'Como uma máquina ia conhecer um veterano como você?'],
 ['Meu filho só conversa com o assistente de IA', 'Hoje eu escuto toda a sua história'],
 ['A livraria do bairro fechou', 'Cheiro de papel máquina nenhuma faz'],
 ['A vovó não sabe usar o app e não consegue ir ao médico', 'Eu mesmo levo ela lá'],
 ['Mandaram eu jogar fora a roupa de trabalho', 'Essa roupa de trabalho é sua medalha'],
 ['Agora eu não sirvo pra nada', 'Suas mãos ainda estão tão quentes'],
 ['Como vou pagar a faculdade da minha filha?', 'Vamos achar um jeito juntos'],
 ['Não tenho cara pra olhar pra minha esposa', 'Hoje a cerveja é por minha conta'],
 ['Pra onde eu vou a partir de amanhã?', 'Amanhã você vem comigo'],
 ['Nossa vila ficou vazia', 'Vamos criar de novo um lugar onde o povo se junta'],
 ['Ninguém me escuta', 'Fala com calma, eu escuto a noite toda']
]);

var FM = 'Mestre de obras', CA = 'Carpinteiro', HY = 'Irmãozão', ML = 'Líder do Culto da Máquina';
D.TALK = {
  intro: [
    ['s_boss', FM, 'Ô carpinteiro! Hoje é seu último dia nesta obra.'],
    ['h_stand', CA, 'Quê? A gente nem levantou a estrutura ainda.'],
    ['s_boss', FM, 'Ninguém mais constrói casa. A fábrica entrega elas prontas.'],
    ['s_boss', FM, 'Construir uma casa custa 150 milhões de wons. A da fábrica chega pronta por 5 milhões.'],
    ['h_stand', CA, '...Casa agora chega por entrega?'],
    ['s_boss', FM, 'Então pregue todos os pregos que quiser hoje.']
  ],
  fired: [
    ['s_boss', FM, 'Aqui sua diária. A partir de amanhã só te chamo quando tiver serviço.'],
    ['h_stand', CA, 'Por causa das casas de fábrica?'],
    ['s_boss', FM, 'As obras caíram pela metade. Você também tá quase no fim.'],
    ['h_stand', CA, '...Hoje eu preciso de uma bebida.']
  ],
  lastday: [
    ['s_boss', FM, 'Hoje acabou. Ninguém mais precisa de carpinteiro.'],
    ['h_stand', CA, 'Quantas casas eu já construí com estas mãos...'],
    ['s_boss', FM, 'Dizem que a fábrica solta cem por dia.'],
    ['h_stand', CA, 'A IA deixou todo mundo pobre.'],
    ['h_stand', CA, 'A IA roubou a esperança da classe média.'],
    ['h_stand', CA, 'Todo mundo vai ficar na miséria, morando em barraco de papelão.'],
    ['h_stand', CA, 'Temos que parar a IA!!'],
    ['h_stand', CA, '...Vou pelo menos consertar os barracos de papelão.']
  ],
  hyung: [
    ['s_hyung', HY, 'Você tem razão! A partir de hoje, eu te sigo.'],
    ['h_stand', CA, 'Eu? Por quê?'],
    ['s_hyung', HY, 'Você disse que minhas mãos ainda servem pra alguma coisa.'],
    ['s_hyung', HY, 'Amanhã vai lá no mercado e solta o verbo. O povo vai se juntar.']
  ],
  twelve: [
    ['s_hyung', HY, 'Doze pessoas! Todo mundo tá olhando pra você!'],
    ['h_stand', CA, 'Eu sou só um carpinteiro.'],
    ['s_hyung', HY, 'A rua é fria. Precisamos de um lugar pra nos reunir.'],
    ['s_hyung', HY, 'Vamos juntar umas ofertas. E o nome... que tal Ludita?']
  ],
  room: [
    ['s_hyung', HY, 'É um porão, mas é a nossa casa!'],
    ['h_up', CA, 'Primeiro, pendura um martelo na parede.'],
    ['s_hyung', HY, 'A partir de hoje, toda noite passa o cesto de ofertas!']
  ],
  rival: [
    ['s_mleader', ML, 'Acha que um martelo vai parar o futuro?'],
    ['s_mleader', ML, 'Nosso Culto da Máquina ganha mil fiéis com um único totem.'],
    ['h_point', CA, 'Esse totem eu quebro pra você.'],
    ['s_mleader', ML, 'Um botão e seus fiéis serão nossos.']
  ],
  branch: [
    ['s_hyung', HY, 'Uma sala no 2º andar! Hora de abrir filiais.'],
    ['s_hyung', HY, 'Precisamos de gente nossa em cada bairro.'],
    ['h_shout', CA, 'Bairro universitário, condomínio, praça, centro, até o polo industrial!']
  ],
  final: [
    ['s_politician', 'Deputado', 'Líder, eu tô precisando de uns votos. Haha.'],
    ['s_reporter', 'Repórter', 'Ludita... isso tá cheirando estranho.'],
    ['s_hyung', HY, 'Só falta a filial coreana do Culto da Máquina. Trazendo os fiéis de lá, o país é nosso.']
  ],
  steal: [
    ['s_mleader', ML, 'Cadastre no app e ganhe um cupom de café. Vou levar seus fiéis.']
  ],
  stealK: [
    'Cadastre no app e ganhe um cupom de café. Vou levar seus fiéis.',
    'Na nossa igreja a oferta é por Pix. Sem fila.',
    'Oração da madrugada? A gente manda só uma notificação.',
    'Primeiro mês grátis. E deixamos o cancelamento bem difícil.',
    'Convide um amigo e ganhe pontos em dobro. Seus fiéis vivem trazendo uns aos outros.',
    'A IA resume nosso sermão em 3 minutos. Quem aguenta uma hora de papo de martelo?',
    'Estamos sorteando robôs aspiradores. Tá todo mundo na fila.',
    'Sua sede nem tem Wi-Fi? A molecada tá toda com a gente.',
    'Cadastro de fiel por reconhecimento facial, num instante. Nem precisa de carimbo.',
    'Uma assinatura e as bênçãos são cobradas todo mês no automático. Prático, né?',
    'As vovós perdidas no totem? Dissemos que íamos ajudar, e elas nos seguiram.',
    'Coloquei nosso anúncio no grupo dos seus fiéis. Teve ótima resposta.'
  ],
  stealA: [
    'Wi-Fi grátis, carregador grátis. Pro povo daqui, isso basta.',
    'Não fala a língua? Nosso app de tradução fala todas.',
    'Cadastre e a primeira corrida de robotáxi é grátis. Seus fiéis já foram embora nele.',
    'Megafone? A gente manda notificação pra todos os celulares.',
    'As fábricas desta cidade funcionam no escuro. Nenhuma pessoa lá dentro.',
    'Nosso pastor de IA atende 24 horas. Você ainda precisa dormir.',
    'Primeiro mês de assinatura: zero. Ninguém sabe cancelar, então todo mundo fica.',
    'Seus fiéis postaram uma foto e a IA deixou eles bonitos. Foi só isso.'
  ],
  raid: [
    ['s_police', 'Polícia', 'Mandado de busca e apreensão.'],
    ['h_stand', CA, 'Martelo é ferramenta!']
  ],
  reporter: [
    ['s_reporter', 'Repórter', 'Pra onde vão as ofertas? Queria fazer uma matéria.']
  ],
  raidL: [
    ['Mandado de busca e apreensão.', 'Martelo é ferramenta!'],
    ['Suspeita de desvio de ofertas. Vamos ver o livro-caixa.', 'O livro-caixa é escrito à mão. Nem um centavo errado!'],
    ['Disseram que você mandou os fiéis venderem a casa e doarem?', 'Eu sou o que constrói casa pra eles!'],
    ['Denunciaram que você afasta os fiéis da família.', 'Eu disse pra largar o celular, não a família!'],
    ['Dizem que você põe os fiéis pra morar juntos e trabalhar.', 'Isso é canteiro de obra. Eles recebem diária!'],
    ['Dizem que o líder se diz deus?', 'Eu sou carpinteiro. Deus nem levanta martelo!'],
    ['Uma denúncia diz que você assustou o povo com o fim do mundo.', 'Não é o fim do mundo. São os totens que estão vindo!'],
    ['A Receita veio junto. Suspeita de sonegação.', 'Até nota fiscal eu coloco no cesto de ofertas!'],
    ['Dizem que você ampliou o prédio sem alvará.', 'Prédio meu nunca caiu!'],
    ['Você deixa o povo rezando a noite toda sem dormir?', 'Quando o sol se põe, a gente vai pro boteco!'],
    ['Recrutando escondido nas faculdades?', 'Eu ando de faixa na cabeça. Não dá pra esconder!'],
    ['Denúncia de que vocês se fingiram de grupo de voluntários.', 'A gente limpou o bairro de verdade. Vai lá ver!'],
    ['Você disse que quem sair vai ser castigado?', 'Quer sair? É só devolver o martelo!'],
    ['Suspeita de que as ofertas compraram uma casa pro líder.', 'Eu ainda durmo no chão da sede!'],
    ['Informação de que vazaram a lista de fiéis pra eleição.', 'A lista é um caderno. Escrito a lápis!'],
    ['Você disse que oração cura no lugar do hospital?', 'Eu disse pra ir ao hospital. No balcão, não no app!'],
    ['Quem quebrou o totem está aqui, não está?', 'Eu não quebrei, eu consertei!'],
    ['Uma empresa de robôs te processou por atrapalhar o negócio.', 'Manda o robô vir pessoalmente!'],
    ['Reclamações de barulho de pancada toda noite.', 'É prego entrando. É assim que a gente reza!'],
    ['Tem panfleto suspeito espalhado pelo bairro todo.', 'Lê um. Protege o seu emprego também, seu guarda!'],
    ['Uma câmera de vigilância com IA filmou este lugar.', 'Apreende essa câmera primeiro!'],
    ['Fiscalização. Todo mundo com as mãos pra cima.', 'Tá vendo os calos? São mãos de trabalhador!'],
    ['Denunciaram que você vendeu água do rio como água benta', 'Eu nunca fiz uma coisa dessas, foram os meus fiéis.....', 'Líder da Seita']
  ],
  reporterL: [
    'Pra onde vão as ofertas? Queria fazer uma matéria.',
    'Um líder de seita com martelo? Isso é furo de reportagem!',
    'Posso entrevistar alguns dos seus fiéis?',
    'O Culto da Máquina diz que vocês são uma seita falsa. Algum comentário?',
    'Recebemos denúncia de que as ruas estão cheias de gente de branco.',
    'Tem um vídeo de alguém quebrando um totem. É você, né, Líder?',
    'Tem gente dizendo que virou fiel depois de levar um panfleto na cara.',
    'Com que dinheiro você comprou o prédio da sede?',
    'As ações da empresa de robôs caíram. Tem alguma relação?',
    'Tudo bem se isso passar no jornal de hoje à noite?'
  ],
  politician: [
    ['s_politician', 'Deputado', 'Dá uma ajudinha com as ofertas e eu deixo tudo quietinho. Haha.']
  ],
  machineWin: [
    ['s_mleader', ML, 'Meus fiéis... pegaram martelos?'],
    ['h_up', CA, 'Máquina não vence gente.'],
    ['s_mleader', ML, '...Pra falar a verdade, eu também não sei usar totem.']
  ],
  abroad: [
    ['s_hyung', HY, 'Líder, chegou uma carta do outro lado do mar!'],
    ['h_stand', CA, 'É em inglês. O que diz aí?'],
    ['s_hyung', HY, 'É de Manchester. A cidade original dos luditas, que quebraram máquinas a marteladas 200 anos atrás!'],
    ['s_mleader', ML, 'Você levou a Coreia, mas a sede de verdade é o Vale do Silício. Lá tem mais IA que gente.'],
    ['h_up', CA, 'Pega o martelo. Vamos de avião.'],
    ['h_stand', CA, 'Se não entenderem a gente, o megafone fala. Carrega bem e solta tudo de uma vez.'],
    ['s_hyung', HY, 'E o Grande Templo! Vamos pôr um martelo de ouro lá no topo!']
  ],
  valleyOpen: [
    ['s_hyung', HY, 'Manchester, Paris, Berlim, Detroit! Só falta o Vale do Silício.'],
    ['s_mleader', ML, 'Os fiéis daqui nem pedem comida sem IA. Acha que tem chance?']
  ],
  valleyWin: [
    ['s_mleader', ML, 'Minha sede... todos pegaram martelos...'],
    ['h_up', CA, 'Máquina não vence gente. Em lugar nenhum.'],
    ['s_mleader', ML, '...Segredo: eu também tinha medo do meu assistente de IA.']
  ],
  ending: [
    ['s_hyung', HY, 'Líder!'],
    ['v3', 'Fiéis', 'Líder! Líder!'],
    ['h_lord', CA, 'Eu era... só um carpinteiro.'],
    ['s_hyung', HY, 'Nosso Líder fez um milagre! Todos, curvem-se!!!']
  ]
};

/* 화면(HTML) 고정 글과 글꼴 */
function page(){
  document.documentElement.lang = 'pt-BR';
  document.title = 'Igreja Ludita - De Carpinteiro a Líder de Seita';
  var md = document.querySelector('meta[name=description]'); if (md) md.content = 'Um bate-boca num boteco de rua deu ao carpinteiro desempregado seu primeiro fiel. Faça discursos, junte ofertas, aumente sua sede e vire líder de seita neste simulador de crescimento em pixel art.';
  var map = {'날 ':'Dia ', '신도 ':'Fiéis ', '돈 ':'Grana ', '믿음':'Fé', '의심':'Suspeita'};
  document.querySelectorAll('.stat').forEach(function(s){ var t = s.firstChild; if (t && t.nodeType === 3 && map[t.nodeValue] != null) t.nodeValue = map[t.nodeValue]; });
  var ids = {logo:'IGREJA LUDITA', sub:'De carpinteiro de obra a líder de seita', bStart:'JOGAR', bCont:'CONTINUAR'};
  for (var k in ids) { var e = document.getElementById(k); if (e) e.textContent = ids[k]; }
  var al = {bHelp:'Como jogar', bBgm:'Música', bSfx:'Efeitos sonoros'};
  for (var a in al) { var b = document.getElementById(a); if (b) b.setAttribute('aria-label', al[a]); }
  var rt = document.querySelector('#rotate > div'); if (rt) rt.textContent = 'Vire o celular de lado';
  var rb = document.querySelector('#rotate .btn'); if (rb) rb.textContent = 'Modo paisagem';
  // 게임 글꼴(Neo)에 악센트 붙은 라틴 글자가 없을 수 있어 시스템 글꼴을 같은 이름으로 덧댄다
  var st = document.createElement('style');
  st.textContent = "@font-face{font-family:'Neo';src:local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica');unicode-range:U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027}" +
    '.item.done .t::after{content:"Filial completa"} #how .hc{font-size:calc(var(--u)*5.6);line-height:1.3}';
  document.head.appendChild(st);
  document.body.classList.add('en');
}
window.LD_FIT();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', page); else page();
})();
