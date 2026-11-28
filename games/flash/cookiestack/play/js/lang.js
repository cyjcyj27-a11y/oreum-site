// 언어: 주소에 ?lang=en 일 때만 영어, ?lang=zh 중국어, ?lang=ja·pt·ru 일본어·포르투갈어·러시아어.
(function () {
  const EN = (window.EN = /[?&]lang=en\b/.test(location.search));
  const ZH = (window.ZH = !EN && new URLSearchParams(location.search).get('lang') === 'zh');
  // 중국어: 한국어 문장을 열쇠로 찾는다
  const Z = {
    '쿠키쌓기': '饼干叠叠乐', '시작': '开始', '처음부터': '从头开始', '처음 화면': '返回标题', '저장': '保存', '공유': '分享', '복사됨': '已复制',
    '이어하기 STAGE ': '继续 STAGE ',
    '화면을 누르면 오가던 쿠키가 떨어져요': '点一下屏幕，来回移动的饼干就会掉下去',
    '삐져나온 만큼 잘려 나가요': '多出来的部分会被切掉',
    '딱 맞추면 PERFECT, 10 STAGE 위엔 달': '完美对齐就是 PERFECT，10 STAGE 之上是月亮',
    '스페이스 · 클릭 떨어뜨리기 / M 음악 · K 효과음': '空格 · 点击 放下 / M 音乐 · K 音效',
    '골목 지붕': '小巷屋顶', '참새 하늘': '麻雀天空', '구름 아래': '云层之下', '구름 위': '云层之上', '열기구 길': '热气球之路',
    '노을': '晚霞', '무지개 다리': '彩虹桥', '별밤': '星空夜', '우주': '太空', '달': '月亮',
    '한 번도 안 무너진 장인': '一次没倒的大师', 'PERFECT 장인': 'PERFECT 大师', '손끝 장인': '稳手大师', '포기를 모르는 사람': '永不放弃的人', '달까지 쌓은 사람': '叠到月亮的人',
    '쌓은 층': '层数', '최고 연속': '最高连击', '무너진 횟수': '倒塌次数', '걸린 시간 ': '用时 ',
    '너는 몇 번 무너지고 달에 닿을까?': '你要倒几次才能叠到月亮？',
  };
  // 일본어·포르투갈어(브라질)·러시아어: 중국어와 같은 열쇠
  const Q = new URLSearchParams(location.search).get('lang');
  const LG3 = (window.LG3 = !EN && !ZH && ['ja', 'pt', 'ru'].includes(Q) ? Q : '');
  window.LANG = EN ? 'en' : ZH ? 'zh' : LG3 || 'ko';
  const JA = {
    '쿠키쌓기': 'クッキー積み', '시작': 'スタート', '처음부터': '最初から', '처음 화면': 'タイトルへ', '저장': '保存', '공유': 'シェア', '복사됨': 'コピーしました',
    '이어하기 STAGE ': 'つづき STAGE ',
    '화면을 누르면 오가던 쿠키가 떨어져요': '画面をタップすると、行き来するクッキーが落ちるよ',
    '삐져나온 만큼 잘려 나가요': 'はみ出た分は切り落とされるよ',
    '딱 맞추면 PERFECT, 10 STAGE 위엔 달': 'ぴったり合わせればPERFECT、10 STAGEの上には月',
    '스페이스 · 클릭 떨어뜨리기 / M 음악 · K 효과음': 'スペース · クリック 落とす / M 音楽 · K 効果音',
    '골목 지붕': '路地の屋根', '참새 하늘': 'スズメの空', '구름 아래': '雲の下', '구름 위': '雲の上', '열기구 길': '気球の道',
    '노을': '夕焼け', '무지개 다리': '虹の橋', '별밤': '星の夜', '우주': '宇宙', '달': '月',
    '한 번도 안 무너진 장인': '一度も崩さなかった職人', 'PERFECT 장인': 'PERFECT職人', '손끝 장인': '指先の職人', '포기를 모르는 사람': 'あきらめない人', '달까지 쌓은 사람': '月まで積んだ人',
    '쌓은 층': '積んだ段', '최고 연속': '最高コンボ', '무너진 횟수': '崩れた回数', '걸린 시간 ': 'かかった時間 ',
    '너는 몇 번 무너지고 달에 닿을까?': 'キミは何回崩れて月に届く？',
  };
  const PT = {
    '쿠키쌓기': 'Torre de Cookies', '시작': 'JOGAR', '처음부터': 'NOVO', '처음 화면': 'INÍCIO', '저장': 'SALVAR', '공유': 'ENVIAR', '복사됨': 'Copiado!',
    '이어하기 STAGE ': 'CONTINUAR STAGE ',
    '화면을 누르면 오가던 쿠키가 떨어져요': 'Toque na tela para soltar o cookie que vai e vem',
    '삐져나온 만큼 잘려 나가요': 'O que sobrar pra fora é cortado',
    '딱 맞추면 PERFECT, 10 STAGE 위엔 달': 'Encaixe certinho para PERFECT, a lua fica depois do STAGE 10',
    '스페이스 · 클릭 떨어뜨리기 / M 음악 · K 효과음': 'ESPAÇO · CLIQUE soltar / M música · K sons',
    '골목 지붕': 'Telhados', '참새 하늘': 'Céu dos pardais', '구름 아래': 'Abaixo das nuvens', '구름 위': 'Acima das nuvens', '열기구 길': 'Rota dos balões',
    '노을': 'Pôr do sol', '무지개 다리': 'Ponte do arco-íris', '별밤': 'Noite estrelada', '우주': 'Espaço', '달': 'Lua',
    '한 번도 안 무너진 장인': 'Mestre que nunca caiu', 'PERFECT 장인': 'Mestre do PERFECT', '손끝 장인': 'Mãos firmes', '포기를 모르는 사람': 'Quem nunca desiste', '달까지 쌓은 사람': 'Quem empilhou até a lua',
    '쌓은 층': 'ANDARES', '최고 연속': 'MAIOR COMBO', '무너진 횟수': 'QUEDAS', '걸린 시간 ': 'Tempo ',
    '너는 몇 번 무너지고 달에 닿을까?': 'Quantas quedas até chegar à lua?',
  };
  const RU = {
    '쿠키쌓기': 'Башня из печенья', '시작': 'ИГРАТЬ', '처음부터': 'ЗАНОВО', '처음 화면': 'В МЕНЮ', '저장': 'СОХРАНИТЬ', '공유': 'ПОДЕЛИТЬСЯ', '복사됨': 'Скопировано',
    '이어하기 STAGE ': 'ПРОДОЛЖИТЬ STAGE ',
    '화면을 누르면 오가던 쿠키가 떨어져요': 'Нажми на экран, и печенька упадёт',
    '삐져나온 만큼 잘려 나가요': 'Всё, что торчит, отрезается',
    '딱 맞추면 PERFECT, 10 STAGE 위엔 달': 'Ровно в край — PERFECT, а за 10 STAGE ждёт луна',
    '스페이스 · 클릭 떨어뜨리기 / M 음악 · K 효과음': 'ПРОБЕЛ · КЛИК бросить / M музыка · K звуки',
    '골목 지붕': 'Крыши', '참새 하늘': 'Небо воробьёв', '구름 아래': 'Под облаками', '구름 위': 'Над облаками', '열기구 길': 'Путь аэростатов',
    '노을': 'Закат', '무지개 다리': 'Радужный мост', '별밤': 'Звёздная ночь', '우주': 'Космос', '달': 'Луна',
    '한 번도 안 무너진 장인': 'Мастер без падений', 'PERFECT 장인': 'Мастер PERFECT', '손끝 장인': 'Твёрдая рука', '포기를 모르는 사람': 'Тот, кто не сдаётся', '달까지 쌓은 사람': 'Покоритель луны',
    '쌓은 층': 'ЭТАЖИ', '최고 연속': 'ЛУЧШЕЕ КОМБО', '무너진 횟수': 'ПАДЕНИЯ', '걸린 시간 ': 'Время ',
    '너는 몇 번 무너지고 달에 닿을까?': 'Сколько падений до луны?',
  };
  const D3 = LG3 === 'ja' ? JA : LG3 === 'pt' ? PT : LG3 === 'ru' ? RU : null;
  window.L = (ko, en) => (EN ? en : ZH && Z[ko] != null ? Z[ko] : D3 ? (D3[ko] != null ? D3[ko] : en) : ko);
  // 러시아어 수 꼴: 1 / 2~4 / 5~
  const ruN = (n, a, b, c) => { const m = n % 100, k = n % 10; return m >= 11 && m <= 14 ? c : k === 1 ? a : k >= 2 && k <= 4 ? b : c; };
  // 엔딩 공유 글(일·포·러)
  window.SHARE3 = (mode, f, p, r, name) =>
    LG3 === 'ja' ? 'クッキー積み ' + mode + ' 月まで' + f + '段！PERFECT ' + p + '回、崩れた回数 ' + r + '回 · ' + name
    : LG3 === 'pt' ? 'Torre de Cookies ' + mode + ': ' + f + (f === 1 ? ' andar' : ' andares') + ' até a lua! ' + p + ' PERFECT, ' + r + (r === 1 ? ' queda' : ' quedas') + ' · ' + name
    : 'Башня из печенья ' + mode + ': ' + f + ' ' + ruN(f, 'этаж', 'этажа', 'этажей') + ' до луны! PERFECT: ' + p + ', ' + r + ' ' + ruN(r, 'падение', 'падения', 'падений') + ' · ' + name;
  if (EN) document.documentElement.lang = 'en';
  if (LG3) {
    document.documentElement.lang = LG3 === 'pt' ? 'pt-BR' : LG3;
    // 게임 글꼴(Ttl·Ui)엔 가나·라틴 확장·키릴 글자가 없다 → 같은 이름에 기기 글꼴을 그 범위로만 덧붙인다
    const st = document.createElement('style');
    if (LG3 === 'ja') {
      const jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
      const ur = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
      st.textContent = `@font-face{font-family:'Ttl';src:${jf};unicode-range:${ur}}@font-face{font-family:'Ui';src:${jf};unicode-range:${ur}}html[lang=ja] *{word-break:normal!important}`;
    } else {
      const lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
      const ur = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
      st.textContent = `@font-face{font-family:'Ttl';src:${lf};unicode-range:${ur}}@font-face{font-family:'Ui';src:${lf};unicode-range:${ur}}`;
    }
    document.head.appendChild(st);
  }
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
})();
