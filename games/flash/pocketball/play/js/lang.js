// 다른 언어판: 주소에 ?lang=en·zh·ja·pt·ru 가 있을 때만 화면 글자를 바꾼다(기억·폰 언어는 쓰지 않는다)
(function () {
  const Q = new URLSearchParams(location.search).get('lang');
  const LG = ['en', 'zh', 'ja', 'pt', 'ru'].includes(Q) ? Q : 'ko';
  window.LANG = LG;
  if (LG === 'ko') return;
  const EN = {
    '포켓볼': 'POCKET BALL', '포켓': 'POCKET ', '볼': 'BALL', '플레이': 'PLAY', '레슨': 'LESSON', '홈': 'HOME', '나': 'YOU', '상대': 'RIVAL',
    '선승': 'RACE TO',
    '동네 형': 'Guy Next Door', '알바생 지수': 'Jisu the Part Timer', '동아리 회장': 'Club President', '퇴근한 김 과장': 'Mr. Kim After Work',
    'PC방 사장님': 'PC Cafe Owner', '단골 할아버지': 'Regular Grandpa', '체대생 민호': 'Minho the Sports Major', '야간 동호회장': 'Night League Captain',
    '구청장배 우승자': 'District Cup Champ', '프로 지망생': 'Pro Hopeful', '은퇴한 프로': 'Retired Pro', '당구장 사장님': 'Pool Hall Owner',
    '당구장 사장님이 큐를 내려놓았다': 'The pool hall owner sets the cue down', '오늘부터 이 동네 1등은 나다': 'From today you are the best player in town',
    '당구대를 끌어 큐 방향을 정해요': 'Drag on the table to point the cue', '바퀴를 돌리면 조금씩 움직여요': 'Roll the wheel to aim a little at a time',
    '옆에 세운 큐 막대를 당겼다 놓으면 쳐요': 'Pull the cue bar at the side and let go to shoot', '많이 당길수록 세게 나가요': 'Pull further for a harder shot', '흰 공 단추를 누르면 회전을 줘요': 'Tap the white ball button to add spin', '당겨서 쳐요': 'PULL TO SHOOT', '끌어서 옮겨요': 'DRAG TO MOVE',
    '내 공(1~7 또는 9~15)을 다 넣고 8번을 넣으면 이겨요': 'Pocket all your balls (1 to 7 or 9 to 15), then the 8 ball to win',
    '흰 공이 빠지면 상대가 흰 공을 놓아요': 'If the cue ball drops, your rival places it anywhere',
  };
  const ZH = {
    '포켓볼': '台球 8号球', '포켓': '台球 ', '볼': '8号球', '플레이': '开始', '레슨': '教学', '홈': '首页', '나': '我', '상대': '对手',
    '동네 형': '隔壁大哥', '알바생 지수': '打工妹智秀', '동아리 회장': '社团会长', '퇴근한 김 과장': '下班的金科长',
    'PC방 사장님': '网吧老板', '단골 할아버지': '常客老大爷', '체대생 민호': '体院生民浩', '야간 동호회장': '夜场球会会长',
    '구청장배 우승자': '区长杯冠军', '프로 지망생': '职业预备生', '은퇴한 프로': '退役职业选手', '당구장 사장님': '台球厅老板',
    '당구장 사장님이 큐를 내려놓았다': '台球厅老板放下了球杆', '오늘부터 이 동네 1등은 나다': '从今天起，这片儿的第一就是我',
    '당구대를 끌어 큐 방향을 정해요': '拖动球台调整方向', '바퀴를 돌리면 조금씩 움직여요': '转动滚轮可以微调',
    '옆에 세운 큐 막대를 당겼다 놓으면 쳐요': '把旁边的球杆拉开再松手就能击球', '많이 당길수록 세게 나가요': '拉得越多力道越大', '흰 공 단추를 누르면 회전을 줘요': '点白球按钮加旋转', '당겨서 쳐요': '拉开击球', '끌어서 옮겨요': '拖动摆放',
    '내 공(1~7 또는 9~15)을 다 넣고 8번을 넣으면 이겨요': '把自己的球（1~7 或 9~15）全部打进，再打进8号球就赢',
    '흰 공이 빠지면 상대가 흰 공을 놓아요': '白球落袋，由对手摆放白球',
  };
  const JA = {
    '포켓볼': 'エイトボール', '포켓': 'エイト', '볼': 'ボール', '플레이': 'プレイ', '레슨': 'レッスン', '홈': 'ホーム', '나': '自分', '상대': '相手',
    '동네 형': '近所の兄貴', '알바생 지수': 'バイトのジス', '동아리 회장': 'サークルの会長', '퇴근한 김 과장': '仕事帰りのキム課長',
    'PC방 사장님': 'ネカフェの店長', '단골 할아버지': '常連のおじいさん', '체대생 민호': '体育大生のミンホ', '야간 동호회장': '夜リーグのキャプテン',
    '구청장배 우승자': '区長杯チャンピオン', '프로 지망생': 'プロ志望生', '은퇴한 프로': '引退したプロ', '당구장 사장님': 'ビリヤード場のオーナー',
    '당구장 사장님이 큐를 내려놓았다': 'ビリヤード場のオーナーがキューを置いた', '오늘부터 이 동네 1등은 나다': '今日からこの街のナンバーワンは俺だ',
    '당구대를 끌어 큐 방향을 정해요': '台をドラッグしてキューの向きを決めよう', '바퀴를 돌리면 조금씩 움직여요': 'ホイールを回すと少しずつ動くよ',
    '옆에 세운 큐 막대를 당겼다 놓으면 쳐요': '横のキューを引いて離すと打てるよ', '많이 당길수록 세게 나가요': '大きく引くほど強く打てるよ', '흰 공 단추를 누르면 회전을 줘요': '白い球のボタンで回転をかけよう', '당겨서 쳐요': '引いて打つ', '끌어서 옮겨요': 'ドラッグで移動',
    '내 공(1~7 또는 9~15)을 다 넣고 8번을 넣으면 이겨요': '自分の球（1~7か9~15）を全部落として、最後に8番を落とせば勝ち',
    '흰 공이 빠지면 상대가 흰 공을 놓아요': '白球が落ちたら、相手が白球を好きな所に置くよ',
  };
  const PT = {
    '포켓볼': 'SINUCA BOLA 8', '포켓': 'SINUCA ', '볼': 'BOLA 8', '플레이': 'JOGAR', '레슨': 'AULA', '홈': 'INÍCIO', '나': 'VOCÊ', '상대': 'RIVAL',
    '동네 형': 'Parça do Bairro', '알바생 지수': 'Jisu do Bico', '동아리 회장': 'Presidente do Clube', '퇴근한 김 과장': 'Gerente Kim Pós-Trampo',
    'PC방 사장님': 'Dono da Lan House', '단골 할아버지': 'Vovô Freguês', '체대생 민호': 'Minho da Ed. Física', '야간 동호회장': 'Capitão da Liga Noturna',
    '구청장배 우승자': 'Campeão da Copa do Bairro', '프로 지망생': 'Aspirante a Pro', '은퇴한 프로': 'Pro Aposentado', '당구장 사장님': 'Dono do Salão de Sinuca',
    '당구장 사장님이 큐를 내려놓았다': 'O dono do salão de sinuca largou o taco', '오늘부터 이 동네 1등은 나다': 'A partir de hoje, o melhor do bairro sou eu',
    '당구대를 끌어 큐 방향을 정해요': 'Arraste na mesa para mirar o taco', '바퀴를 돌리면 조금씩 움직여요': 'Gire a rodinha para ajustar aos poucos',
    '옆에 세운 큐 막대를 당겼다 놓으면 쳐요': 'Puxe o taco ao lado e solte para dar a tacada', '많이 당길수록 세게 나가요': 'Quanto mais puxar, mais forte a tacada', '흰 공 단추를 누르면 회전을 줘요': 'Toque no botão da bola branca para dar efeito', '당겨서 쳐요': 'PUXE E SOLTE', '끌어서 옮겨요': 'ARRASTE PARA MOVER',
    '내 공(1~7 또는 9~15)을 다 넣고 8번을 넣으면 이겨요': 'Encaçape todas as suas bolas (1 a 7 ou 9 a 15) e depois a 8 para vencer',
    '흰 공이 빠지면 상대가 흰 공을 놓아요': 'Se a branca cair, o rival coloca a bola branca onde quiser',
  };
  const RU = {
    '포켓볼': 'Бильярд «Восьмёрка»', '포켓': 'БИЛЬЯРД ', '볼': '8', '플레이': 'ИГРАТЬ', '레슨': 'УРОК', '홈': 'ДОМОЙ', '나': 'ТЫ', '상대': 'СОПЕРНИК',
    '동네 형': 'Парень с района', '알바생 지수': 'Джису с подработки', '동아리 회장': 'Глава клуба', '퇴근한 김 과장': 'Менеджер Ким после смены',
    'PC방 사장님': 'Хозяин компклуба', '단골 할아버지': 'Дед-завсегдатай', '체대생 민호': 'Спортсмен Минхо', '야간 동호회장': 'Капитан ночной лиги',
    '구청장배 우승자': 'Чемпион кубка района', '프로 지망생': 'Будущий профи', '은퇴한 프로': 'Профи на пенсии', '당구장 사장님': 'Хозяин бильярдной',
    '당구장 사장님이 큐를 내려놓았다': 'Хозяин бильярдной опустил кий', '오늘부터 이 동네 1등은 나다': 'С этого дня лучший на районе — я',
    '당구대를 끌어 큐 방향을 정해요': 'Тяни по столу, чтобы навести кий', '바퀴를 돌리면 조금씩 움직여요': 'Колесо мыши — точная наводка',
    '옆에 세운 큐 막대를 당겼다 놓으면 쳐요': 'Оттяни кий сбоку и отпусти — будет удар', '많이 당길수록 세게 나가요': 'Чем сильнее тянешь, тем мощнее удар', '흰 공 단추를 누르면 회전을 줘요': 'Кнопка с белым шаром — подкрутка', '당겨서 쳐요': 'ТЯНИ И БЕЙ', '끌어서 옮겨요': 'ПЕРЕТАЩИ',
    '내 공(1~7 또는 9~15)을 다 넣고 8번을 넣으면 이겨요': 'Забей все свои шары (1–7 или 9–15), а потом восьмёрку — и ты победил',
    '흰 공이 빠지면 상대가 흰 공을 놓아요': 'Если биток упал в лузу, соперник ставит его куда захочет',
  };
  const D = LG === 'zh' ? ZH : LG === 'ja' ? JA : LG === 'pt' ? PT : LG === 'ru' ? RU : EN;
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const RE = new RegExp(keys.map(esc).join('|'), 'g');
  const tr = (s) => {
    if (!/[가-힣]/.test(s)) return s;
    if (LG === 'zh') s = s.replace(/(\d+)회차/g, '第⁠$1⁠轮').replace(/선승 (\d+)/g, '抢$1');
    else if (LG === 'ja') s = s.replace(/(\d+)회차/g, '$1周目').replace(/선승 (\d+)/g, '$1本先取');
    else if (LG === 'pt') s = s.replace(/(\d+)회차/g, '$1ª VOLTA').replace(/선승 (\d+)/g, (m, n) => 'ATÉ ' + n + (n === '1' ? ' VITÓRIA' : ' VITÓRIAS'));
    else if (LG === 'ru') s = s.replace(/(\d+)회차/g, '$1-Й КРУГ').replace(/선승 (\d+)/g, (m, n) => 'ДО ' + n + (n % 10 === 1 && n % 100 !== 11 ? ' ПОБЕДЫ' : ' ПОБЕД'));
    else s = s.replace(/(\d+)회차/g, 'RUN $1');
    return s.replace(RE, (m) => D[m]);
  };
  window.L = tr;
  function walk(n) {
    if (n.nodeType === 3) { const t = tr(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; return; }
    if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
    for (const c of n.childNodes) walk(c);
  }
  document.documentElement.lang = { zh: 'zh-CN', ja: 'ja', pt: 'pt-BR', ru: 'ru' }[LG] || 'en';
  if (LG === 'zh') {
    // 게임 글꼴(Ttl·Ui)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ttl';src:${zf};unicode-range:${ur}}@font-face{font-family:'Ui';src:${zf};unicode-range:${ur};font-weight:700}@font-face{font-family:'Ui';src:${zf};unicode-range:${ur};font-weight:900}html[lang=zh-CN] *{word-break:normal!important}html[lang=zh-CN] .btn.wood.sm{padding-right:46px}@media (max-height:480px){html[lang=zh-CN] .btn.wood.sm{padding-right:10.5vh}}`;
    document.head.appendChild(st);
  }
  if (LG === 'ja') {
    // 게임 글꼴(Ttl·Ui)엔 가나·한자가 없다 → 같은 이름에 일본어 기기 글꼴을 그 범위로만 덧붙인다
    const jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    const ur = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ttl';src:${jf};unicode-range:${ur}}@font-face{font-family:'Ui';src:${jf};unicode-range:${ur};font-weight:700}@font-face{font-family:'Ui';src:${jf};unicode-range:${ur};font-weight:900}html[lang=ja] *{word-break:normal!important}html[lang=ja] .btn.wood.sm{padding-right:46px}@media (max-height:480px){html[lang=ja] .btn.wood.sm{padding-right:10.5vh}}`;
    document.head.appendChild(st);
  }
  if (LG === 'pt' || LG === 'ru') {
    // 게임 글꼴에 없는 악센트 라틴·키릴 글자는 기기 글꼴로 채우고, 긴 제목은 영문판처럼 줄인다
    const lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    const ur = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ttl';src:${lf};unicode-range:${ur}}@font-face{font-family:'Ui';src:${lf};unicode-range:${ur};font-weight:700}@font-face{font-family:'Ui';src:${lf};unicode-range:${ur};font-weight:900}html[lang=pt-BR] #logo,html[lang=ru] #logo{font-size:clamp(32px,10vw,120px);-webkit-text-stroke-width:7px}html[lang=pt-BR] .btn.wood.sm,html[lang=ru] .btn.wood.sm{padding-right:50px}@media (max-height:480px){html[lang=pt-BR] .btn.wood.sm,html[lang=ru] .btn.wood.sm{padding-right:11vh}}`;
    document.head.appendChild(st);
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.title = LG === 'zh' ? '台球 8号球' : LG === 'en' ? 'POCKET BALL' : D['포켓볼'];
    walk(document.body);
    new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach(walk); if (m.type === 'characterData') walk(m.target); }))
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  });
})();
