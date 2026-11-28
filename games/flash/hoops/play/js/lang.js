// 언어: 주소에 ?lang=en 일 때만 영어, ?lang=zh 일 때만 중국어, ?lang=ja·pt·ru 일 때 일본어·포르투갈어·러시아어. 화면 글은 L(한, 영), 처음 HTML 글은 아래 표로 바꿔 끼움.
(function () {
  const EN = (window.EN = /[?&]lang=en\b/.test(location.search));
  const ZH = (window.ZH = !EN && new URLSearchParams(location.search).get('lang') === 'zh');
  // ja·pt·ru: 각 언어 표에서 한국어 문장을 열쇠로 찾고, 없으면 영어
  const Q3 = new URLSearchParams(location.search).get('lang');
  const LG3 = (window.LG3 = !EN && !ZH && ['ja', 'pt', 'ru'].includes(Q3) ? Q3 : '');
  window.JA = LG3 === 'ja'; window.PT = LG3 === 'pt'; window.RU = LG3 === 'ru';
  // 중국어: 한국어 문장을 열쇠로 찾는다
  const Z = {
    '오락실 농구': '街机投篮',
    '마지막 골대까지 넘겼다<br>오늘부터 이 오락실 1등은 나다<br><br>': '最后一个篮筐也拿下了<br>从今天起，这家街机厅我是第一<br><br>',
    '성공률 ': '命中率 ', '최고 연속 골 ': '最高连进 ', '성공률': '命中率', '최고 연속 골': '最高连进',
    '전설의 손목': '传说中的手腕', '오락실의 신': '街机之神', '동네 농구왕': '街区篮球王', '명사수': '神射手', '농구 기계 정복자': '投篮机征服者',
    '너는 몇 판까지 갈 수 있을까?': '你能打到第几关？',
    '오락실 농구 30판 다 깼다! 너도 해 봐': '街机投篮 30 关全通了！你也来试试',
  };
  const D3 = {
    ja: {
      '오락실 농구': 'ゲーセンバスケ',
      '마지막 골대까지 넘겼다<br>오늘부터 이 오락실 1등은 나다<br><br>': '最後のゴールまで決めた<br>今日からこのゲーセンの1位はオレだ<br><br>',
      '성공률 ': 'シュート率 ', '최고 연속 골 ': '最高連続ゴール ', '성공률': 'シュート率', '최고 연속 골': '最高連続ゴール',
      '전설의 손목': '伝説の手首', '오락실의 신': 'ゲーセンの神', '동네 농구왕': '町内バスケ王', '명사수': '名シューター', '농구 기계 정복자': 'バスケマシン制覇者',
      '너는 몇 판까지 갈 수 있을까?': 'キミは何ステージまで行ける？',
      '오락실 농구 30판 다 깼다! 너도 해 봐': 'ゲーセンバスケ全30ステージクリア！キミもやってみて',
    },
    pt: {
      '오락실 농구': 'Basquete de Fliperama',
      '마지막 골대까지 넘겼다<br>오늘부터 이 오락실 1등은 나다<br><br>': 'Passei até a última cesta<br>A partir de hoje, sou o número 1 deste fliperama<br><br>',
      '성공률 ': 'Precisão ', '최고 연속 골 ': 'Melhor sequência ', '성공률': 'Precisão', '최고 연속 골': 'Melhor sequência',
      '전설의 손목': 'Pulso Lendário', '오락실의 신': 'Deus do Fliperama', '동네 농구왕': 'Rei do Basquete do Bairro', '명사수': 'Mão Calibrada', '농구 기계 정복자': 'Conquistador da Máquina',
      '너는 몇 판까지 갈 수 있을까?': 'Até que fase você chega?',
      '오락실 농구 30판 다 깼다! 너도 해 봐': 'Zerei as 30 fases do Basquete de Fliperama! Tenta aí',
    },
    ru: {
      '오락실 농구': 'Аркадный баскетбол',
      '마지막 골대까지 넘겼다<br>오늘부터 이 오락실 1등은 나다<br><br>': 'Последнее кольцо покорено<br>С сегодняшнего дня я номер 1 в этом зале<br><br>',
      '성공률 ': 'Точность ', '최고 연속 골 ': 'Лучшая серия ', '성공률': 'Точность', '최고 연속 골': 'Лучшая серия',
      '전설의 손목': 'Легендарная кисть', '오락실의 신': 'Бог аркады', '동네 농구왕': 'Король дворового баскетбола', '명사수': 'Снайпер', '농구 기계 정복자': 'Покоритель автомата',
      '너는 몇 판까지 갈 수 있을까?': 'А ты до какого уровня дойдёшь?',
      '오락실 농구 30판 다 깼다! 너도 해 봐': 'Прошёл все 30 уровней «Аркадного баскетбола»! Попробуй и ты',
    },
  };
  const Z3 = LG3 ? D3[LG3] : null;
  window.L = (ko, en) => (EN ? en : ZH && Z[ko] != null ? Z[ko] : Z3 ? (Z3[ko] != null ? Z3[ko] : en) : ko);
  if (!EN && !ZH && !LG3) return;
  document.documentElement.lang = EN ? 'en' : ZH ? 'zh-CN' : LG3 === 'pt' ? 'pt-BR' : LG3;
  const TX3 = {
    ja: {
      h1: 'ボールを<b>上にはじく</b>と飛んでいくよ',
      h2: '<b>長く</b>はじくと遠くへ、<b>ななめに</b>はじくと横へ',
      h3: '40秒以内に<b>GOAL</b>のスコアを超えたらCLEAR。ラスト10秒は3点',
      save: '保存', share: '共有',
    },
    pt: {
      h1: '<b>Deslize a bola para cima</b> para arremessar',
      h2: 'Deslize <b>longo</b> vai mais longe, <b>na diagonal</b> vai para o lado',
      h3: 'Passe a pontuação <b>GOAL</b> em 40 segundos para dar CLEAR. Nos últimos 10 segundos vale 3 pontos',
      save: 'Salvar', share: 'Compartilhar',
    },
    ru: {
      h1: '<b>Смахни мяч вверх</b> — и он полетит',
      h2: '<b>Длинный</b> взмах — дальше, <b>наискось</b> — в сторону',
      h3: 'Набери больше <b>GOAL</b> за 40 секунд — и CLEAR. Последние 10 секунд — по 3 очка',
      save: 'Сохранить', share: 'Поделиться',
    },
  };
  const TX = LG3 ? TX3[LG3] : EN ? {
    h1: 'Flick the ball <b>up</b> to shoot',
    h2: '<b>Longer</b> flick goes farther, <b>angled</b> flick goes sideways',
    h3: 'Beat the <b>GOAL</b> in 40 seconds to CLEAR. Last 10 seconds = 3 points',
  } : {
    h1: '把球<b>往上一弹</b>就投出去',
    h2: '<b>弹得长</b>投得远，<b>斜着弹</b>就往旁边飞',
    h3: '40 秒内超过 <b>GOAL</b> 分数就 CLEAR。最后 10 秒每球 3 分',
  };
  if (ZH) {
    // 게임 글꼴(Ttl·Ui)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ttl';src:${zb};unicode-range:${ur}}@font-face{font-family:'Ui';src:${zb};font-weight:700;unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}`;
    document.head.appendChild(st);
  }
  if (LG3) {
    // ja: 게임 글꼴에 가나·한자가 없다 → 일본어 기기 글꼴을 그 범위로만 덧붙인다. pt·ru: 라틴 확장·키릴 범위로 기기 글꼴을 덧붙인다
    const jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    const jr = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    const lr = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    const sf = LG3 === 'ja' ? jf : lf, ur = LG3 === 'ja' ? jr : lr;
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ttl';src:${sf};unicode-range:${ur}}@font-face{font-family:'Ui';src:${sf};font-weight:700;unicode-range:${ur}}@font-face{font-family:'Led';src:${sf};unicode-range:${ur}}` + (LG3 === 'ja' ? 'html[lang=ja] *{word-break:normal!important}' : '');
    document.head.appendChild(st);
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.title = LG3 ? D3[LG3]['오락실 농구'] : EN ? 'Arcade Hoops' : '街机投篮';
    document.querySelectorAll('[data-k]').forEach((e) => { const k = e.getAttribute('data-k'); if (TX[k]) e.innerHTML = TX[k]; });
    const lt = document.getElementById('logoT'); if (lt) lt.textContent = LG3 ? D3[LG3]['오락실 농구'] : EN ? 'ARCADE HOOPS' : '街机投篮';
    if (EN) { const sm = document.querySelector('#logo small'); if (sm) sm.textContent = 'BASKETBALL'; }
    const cs = document.querySelector('#cSave span'); if (cs) cs.textContent = LG3 ? TX.save : EN ? 'SAVE' : '保存';
    const sh = document.querySelector('#cShare span'); if (sh) sh.textContent = LG3 ? TX.share : EN ? 'SHARE' : '分享';
  });
})();
