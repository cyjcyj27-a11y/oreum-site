// 언어: 주소에 ?lang=en 일 때만 영어, ?lang=zh 일 때만 중국어, ?lang=ja·pt·ru 일 때 일본어·포르투갈어·러시아어.
(function () {
  const EN = (window.EN = /[?&]lang=en\b/.test(location.search));
  const Q = new URLSearchParams(location.search).get('lang');
  const ZH = (window.ZH = !EN && Q === 'zh');
  const LG = (window.LANG = EN ? 'en' : ZH ? 'zh' : ['ja', 'pt', 'ru'].includes(Q) ? Q : 'ko');
  window.LX = LG !== 'ko' && LG !== 'en'; // 사전으로 바꾸는 언어(zh·ja·pt·ru)
  // 중국어: 한국어 문장을 열쇠로 찾고, 숫자가 섞인 문장은 틀로 바꾼다
  const Z = {
    '햄스런': '仓鼠快跑', '햄스터': '仓鼠', ' 햄스터': ' 仓鼠', '처음부터': '从头开始', '처음 화면': '返回标题', '저장': '保存', '공유': '分享',
    '누르면 앞으로, 밀면 그쪽으로 콩': '点一下往前蹦，滑一下就往那边蹦',
    '해바라기씨는 볼에 넣고, 은신처에 쏟으면 내 것': '瓜子先塞进腮帮子，倒进窝里才算你的',
    '꾸물대면 고양이가 덮쳐요': '磨磨蹭蹭的话，猫咪就扑过来了',
    '↑↓←→ · WASD 이동 / M 음악 · K 효과음': '↑↓←→ · WASD 移动 / M 音乐 · K 音效',
    '아이방': '儿童房', '부엌': '厨房', '마당': '院子', '골목': '小巷', '공원': '公园',
    '골든': '金丝熊', '정글리안': '三线', '펄': '银狐', '푸딩': '布丁', '블루사파이어': '紫仓', '판다': '熊猫', '로보로프스키': '老公公', '블랙': '黑熊',
    '한 번도 안 잡힌 햄스터': '一次没被抓的仓鼠', '볼주머니 부자': '腮帮子富豪', '번개 햄스터': '闪电仓鼠', '칠전팔기 햄스터': '越挫越勇的仓鼠', '해바라기 밭에 닿은 햄스터': '抵达向日葵田的仓鼠',
    '걸린 시간': '用时', '먹은 씨': '吃掉的瓜子', '은신처에 쏟은 씨': '存进窝里的瓜子', '잡힌 횟수': '被抓次数',
    '너는 몇 번 잡히고 해바라기 밭에 닿을까?': '你要被抓几次才能到向日葵田？',
    '주소를 복사했습니다': '链接已复制',
  };
  const J = {
    '햄스런': 'ハムスラン', '햄스터': 'ハムスター', ' 햄스터': ' ハムスター', '처음부터': '最初から', '처음 화면': 'タイトルへ', '저장': '保存', '공유': 'シェア',
    '누르면 앞으로, 밀면 그쪽으로 콩': 'タップで前へ、スワイプでその方向にピョン',
    '해바라기씨는 볼에 넣고, 은신처에 쏟으면 내 것': 'ひまわりのタネはほお袋へ。巣に出せば自分のもの',
    '꾸물대면 고양이가 덮쳐요': 'もたもたしてるとネコが飛びかかってくるよ',
    '↑↓←→ · WASD 이동 / M 음악 · K 효과음': '↑↓←→ · WASD 移動 / M 音楽 · K 効果音',
    '아이방': '子ども部屋', '부엌': 'キッチン', '마당': '庭', '골목': '路地', '공원': '公園',
    '골든': 'ゴールデン', '정글리안': 'ジャンガリアン', '펄': 'パール', '푸딩': 'プディング', '블루사파이어': 'ブルーサファイア', '판다': 'パンダ', '로보로프스키': 'ロボロフスキー', '블랙': 'ブラック',
    '한 번도 안 잡힌 햄스터': '一度も捕まらなかったハムスター', '볼주머니 부자': 'ほお袋の大富豪', '번개 햄스터': 'イナズマハムスター', '칠전팔기 햄스터': '七転び八起きハムスター', '해바라기 밭에 닿은 햄스터': 'ひまわり畑にたどり着いたハムスター',
    '걸린 시간': 'かかった時間', '먹은 씨': '食べたタネ', '은신처에 쏟은 씨': '巣にためたタネ', '잡힌 횟수': '捕まった回数',
    '너는 몇 번 잡히고 해바라기 밭에 닿을까?': 'キミは何回捕まってひまわり畑にたどり着ける？',
    '주소를 복사했습니다': 'リンクをコピーしました',
  };
  const P = {
    '햄스런': 'HAMSRUN', '햄스터': 'HAMSTERS', ' 햄스터': ' HAMSTER', '처음부터': 'NOVO JOGO', '처음 화면': 'INÍCIO', '저장': 'SALVAR', '공유': 'COMPARTILHAR',
    '누르면 앞으로, 밀면 그쪽으로 콩': 'Toque pra pular pra frente, deslize pra pular pra esse lado',
    '해바라기씨는 볼에 넣고, 은신처에 쏟으면 내 것': 'Encha as bochechas de sementes e despeje no esconderijo pra ficar com elas',
    '꾸물대면 고양이가 덮쳐요': 'Se enrolar, o gato te pega',
    '↑↓←→ · WASD 이동 / M 음악 · K 효과음': '↑↓←→ · WASD mover / M música · K som',
    '아이방': 'QUARTO', '부엌': 'COZINHA', '마당': 'QUINTAL', '골목': 'BECO', '공원': 'PARQUE',
    '골든': 'DOURADO', '정글리안': 'ANÃO RUSSO', '펄': 'PÉROLA', '푸딩': 'PUDIM', '블루사파이어': 'SAFIRA', '판다': 'PANDA', '로보로프스키': 'ROBOROVSKI', '블랙': 'PRETO',
    '한 번도 안 잡힌 햄스터': 'NUNCA FOI PEGO', '볼주머니 부자': 'RICO DAS BOCHECHAS', '번개 햄스터': 'HAMSTER RELÂMPAGO', '칠전팔기 햄스터': 'HAMSTER QUE NUNCA DESISTE', '해바라기 밭에 닿은 햄스터': 'CHEGOU AOS GIRASSÓIS',
    '걸린 시간': 'TEMPO', '먹은 씨': 'SEMENTES COMIDAS', '은신처에 쏟은 씨': 'SEMENTES GUARDADAS', '잡힌 횟수': 'VEZES PEGO',
    '너는 몇 번 잡히고 해바라기 밭에 닿을까?': 'Quantas vezes você vai ser pego até chegar aos girassóis?',
    '주소를 복사했습니다': 'Link copiado',
  };
  const R = {
    '햄스런': 'HAMSRUN', '햄스터': 'ХОМЯКИ', ' 햄스터': ' ХОМЯК', '처음부터': 'ЗАНОВО', '처음 화면': 'В МЕНЮ', '저장': 'СОХРАНИТЬ', '공유': 'ПОДЕЛИТЬСЯ',
    '누르면 앞으로, 밀면 그쪽으로 콩': 'Тапни — прыг вперёд, смахни — прыг в ту сторону',
    '해바라기씨는 볼에 넣고, 은신처에 쏟으면 내 것': 'Набивай щёки семечками и высыпай в норке — тогда они твои',
    '꾸물대면 고양이가 덮쳐요': 'Будешь мешкать — кот набросится',
    '↑↓←→ · WASD 이동 / M 음악 · K 효과음': '↑↓←→ · WASD ходьба / M музыка · K звуки',
    '아이방': 'ДЕТСКАЯ', '부엌': 'КУХНЯ', '마당': 'ДВОР', '골목': 'ПЕРЕУЛОК', '공원': 'ПАРК',
    '골든': 'ЗОЛОТИСТЫЙ', '정글리안': 'ДЖУНГАРСКИЙ', '펄': 'ЖЕМЧУЖНЫЙ', '푸딩': 'ПУДИНГ', '블루사파이어': 'САПФИРОВЫЙ', '판다': 'ПАНДА', '로보로프스키': 'РОБОРОВСКИЙ', '블랙': 'ЧЁРНЫЙ',
    '한 번도 안 잡힌 햄스터': 'НИ РАЗУ НЕ ПОЙМАН', '볼주머니 부자': 'ЩЕКАСТЫЙ БОГАЧ', '번개 햄스터': 'ХОМЯК-МОЛНИЯ', '칠전팔기 햄스터': 'НЕСГИБАЕМЫЙ ХОМЯК', '해바라기 밭에 닿은 햄스터': 'ДОБРАЛСЯ ДО ПОДСОЛНУХОВ',
    '걸린 시간': 'ВРЕМЯ', '먹은 씨': 'СЪЕДЕНО СЕМЕЧЕК', '은신처에 쏟은 씨': 'СЕМЕЧЕК В НОРКЕ', '잡힌 횟수': 'СКОЛЬКО РАЗ ПОЙМАН',
    '너는 몇 번 잡히고 해바라기 밭에 닿을까?': 'Сколько раз тебя поймают по пути к подсолнухам?',
    '주소를 복사했습니다': 'Ссылка скопирована',
  };
  // 러시아어 복수형: 1 / 2~4 / 5~ 꼴
  const rp = (n, a, b, c) => { n = Math.abs(n) % 100; const d = n % 10; return n > 10 && n < 20 ? c : d === 1 ? a : d > 1 && d < 5 ? b : c; };
  const SH = /^햄스런 해바라기 밭 도착! (\S+), 씨 (\d+)개, 잡힌 횟수 (\d+)번 · (.*)$/;
  const PATS = {
    zh: [[SH, '仓鼠快跑 抵达向日葵田！$1，瓜子 $2 颗，被抓 $3 次 · $4']],
    ja: [[SH, 'ハムスラン ひまわり畑に到着！$1、タネ $2 個、捕まった回数 $3 回 · $4']],
    pt: [[SH, (m, t, s, d, n) => 'Hamsrun: cheguei aos girassóis! ' + t + ', ' + s + (+s === 1 ? ' semente, ' : ' sementes, ') + 'pego ' + d + (+d === 1 ? ' vez' : ' vezes') + ' · ' + n]],
    ru: [[SH, (m, t, s, d, n) => 'Hamsrun: добрался до подсолнухов! ' + t + ', ' + s + ' ' + rp(+s, 'семечка', 'семечки', 'семечек') + ', поймали ' + d + ' ' + rp(+d, 'раз', 'раза', 'раз') + ' · ' + n]],
  };
  const DICT = { zh: Z, ja: J, pt: P, ru: R };
  window.L = (ko, en) => {
    if (EN) return en;
    if (LG === 'ko') return ko;
    const D = DICT[LG];
    if (D[ko] != null) return D[ko];
    for (const p of PATS[LG]) if (p[0].test(ko)) return ko.replace(p[0], p[1]);
    return ZH ? ko : en;
  };
  if (EN) document.documentElement.lang = 'en';
  if (ZH) {
    document.documentElement.lang = 'zh-CN';
    // 게임 글꼴(Ttl·Ui)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ttl';src:${zb};unicode-range:${ur}}@font-face{font-family:'Ui';src:${zf};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}`;
    document.head.appendChild(st);
  }
  if (LG === 'ja') {
    document.documentElement.lang = 'ja';
    // 게임 글꼴엔 가나·한자가 없다 → 같은 이름에 일본어 기기 글꼴을 그 범위로만 덧붙인다
    const jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    const ur = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ttl';src:${jf};unicode-range:${ur}}@font-face{font-family:'Ui';src:${jf};unicode-range:${ur}}html[lang=ja] *{word-break:normal!important}`;
    document.head.appendChild(st);
  }
  if (LG === 'pt' || LG === 'ru') {
    document.documentElement.lang = LG === 'pt' ? 'pt-BR' : 'ru';
    // 악센트 라틴 글자·키릴 글자는 기기 글꼴로 채운다
    const lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    const ur = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ttl';src:${lf};unicode-range:${ur}}@font-face{font-family:'Ui';src:${lf};unicode-range:${ur}}`;
    document.head.appendChild(st);
  }
})();
