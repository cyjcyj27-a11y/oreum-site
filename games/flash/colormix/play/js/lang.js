// 주소에 ?lang=en 이면 영어, ?lang=zh 이면 중국어, ?lang=ja·pt·ru 이면 일본어·포르투갈어·러시아어로 화면 글자를 바꾼다(기억·폰 언어는 쓰지 않는다)
(function () {
  const Q = new URLSearchParams(location.search).get('lang');
  const EN = Q === 'en', ZH = Q === 'zh', JA = Q === 'ja', PT = Q === 'pt', RU = Q === 'ru';
  window.LANG = EN ? 'en' : ZH ? 'zh' : JA ? 'ja' : PT ? 'pt' : RU ? 'ru' : 'ko';
  if (!EN && !ZH && !JA && !PT && !RU) return;
  const DEN = {
    '색깔섞기': 'COLOR MIX', '퍼즐게임': 'PUZZLE GAME', '색깔섞기 퍼즐게임': 'Color Mix Puzzle Game',
    '도감': 'BOOK', '처음으로': 'HOME',
    '방울을 밀면 미끄러져 가다가 부딪힌 방울과 섞여요': 'Push a drop. It slides and mixes with the drop it hits.',
    '견본과 같은 색을 MOVES 안에 만들어요': 'Make the sample color within the MOVES.',
    '아래 점은 들어갈 물감이에요': 'The dots show the paints that go in.',
    '만든 색으로 그림이 칠해져요': 'Your color paints part of the picture.',
    '받은 카드는 판 옆 가방에 들어가요': 'Cards you win go into the bag.',
    '카드를 누르고 방울을 눌러 써요': 'Tap a card, then a drop.',
    '물 컵·황금 붓은 누르면 바로 써져요': 'Cups and the golden brush work at once.',
    '언덕 위 집': 'House on the Hill', '과일 그릇': 'Fruit Bowl', '바닷가 등대': 'Lighthouse', '해바라기': 'Sunflowers', '노을 지붕': 'Sunset Roof',
    '숲속 호수': 'Forest Lake', '눈 오는 마을': 'Snowy Village', '열기구': 'Balloons', '작은 항구': 'Little Harbor', '별밤': 'Starry Night',
    '빨강 튜브': 'Red Tube', '노랑 튜브': 'Yellow Tube', '파랑 튜브': 'Blue Tube', '흰색 튜브': 'White Tube', '검정 튜브': 'Black Tube',
    '큰 빨강 튜브': 'Big Red Tube', '큰 노랑 튜브': 'Big Yellow Tube', '큰 파랑 튜브': 'Big Blue Tube', '큰 흰색 튜브': 'Big White Tube', '큰 검정 튜브': 'Big Black Tube',
    '황금 빨강 튜브': 'Gold Red Tube', '황금 노랑 튜브': 'Gold Yellow Tube', '황금 파랑 튜브': 'Gold Blue Tube', '황금 흰색 튜브': 'Gold White Tube', '황금 검정 튜브': 'Gold Black Tube',
    '물 한 컵': 'Cup of Water', '물 두 컵': 'Two Cups', '물 세 컵': 'Three Cups', '물뿌리개': 'Watering Can', '황금 물통': 'Golden Jar',
    '헝겊': 'Rag', '스포이트': 'Dropper', '나이프': 'Palette Knife', '황금 붓': 'Golden Brush',
    '지우기': 'ERASE', '덜기': 'TAKE 1', '옮기기': 'MOVE', '완성': 'DONE',
  };
  // 중국어: 한국어 문장을 열쇠로 찾는다
  const DZH = {
    '색깔섞기': '调色解谜', '퍼즐게임': '混色游戏', '색깔섞기 퍼즐게임': '调色解谜',
    '도감': '图鉴', '처음으로': '返回',
    '방울을 밀면 미끄러져 가다가 부딪힌 방울과 섞여요': '推一下颜料滴，它会一路滑过去，和撞到的颜料滴混在一起',
    '견본과 같은 색을 MOVES 안에 만들어요': '在 MOVES 用完前调出和色样一样的颜色',
    '아래 점은 들어갈 물감이에요': '下面的小点是要加进去的颜料',
    '만든 색으로 그림이 칠해져요': '调出的颜色会涂到画上',
    '받은 카드는 판 옆 가방에 들어가요': '拿到的卡片会放进盘子旁边的包里',
    '카드를 누르고 방울을 눌러 써요': '先点卡片，再点颜料滴就能使用',
    '물 컵·황금 붓은 누르면 바로 써져요': '水杯和黄金画笔点一下就直接生效',
    '언덕 위 집': '山坡上的房子', '과일 그릇': '水果盘', '바닷가 등대': '海边灯塔', '해바라기': '向日葵', '노을 지붕': '晚霞屋顶',
    '숲속 호수': '林中湖泊', '눈 오는 마을': '下雪的村庄', '열기구': '热气球', '작은 항구': '小港口', '별밤': '星空夜',
    '빨강 튜브': '红颜料', '노랑 튜브': '黄颜料', '파랑 튜브': '蓝颜料', '흰색 튜브': '白颜料', '검정 튜브': '黑颜料',
    '큰 빨강 튜브': '大管红', '큰 노랑 튜브': '大管黄', '큰 파랑 튜브': '大管蓝', '큰 흰색 튜브': '大管白', '큰 검정 튜브': '大管黑',
    '황금 빨강 튜브': '金管红', '황금 노랑 튜브': '金管黄', '황금 파랑 튜브': '金管蓝', '황금 흰색 튜브': '金管白', '황금 검정 튜브': '金管黑',
    '물 한 컵': '一杯水', '물 두 컵': '两杯水', '물 세 컵': '三杯水', '물뿌리개': '洒水壶', '황금 물통': '黄金水桶',
    '헝겊': '抹布', '스포이트': '滴管', '나이프': '调色刀', '황금 붓': '黄金画笔',
    '지우기': '擦掉', '덜기': '吸一滴', '옮기기': '移动', '완성': '完成',
  };
  // 일본어
  const DJA = {
    '색깔섞기': 'いろまぜ', '퍼즐게임': 'パズルゲーム', '색깔섞기 퍼즐게임': 'いろまぜパズル',
    '도감': '図鑑', '처음으로': 'ホーム',
    '방울을 밀면 미끄러져 가다가 부딪힌 방울과 섞여요': 'しずくを押すとすべっていって、ぶつかったしずくと混ざるよ',
    '견본과 같은 색을 MOVES 안에 만들어요': 'MOVES がなくなる前に見本と同じ色を作ろう',
    '아래 점은 들어갈 물감이에요': '下の点は入れる絵の具だよ',
    '만든 색으로 그림이 칠해져요': '作った色で絵がぬられていくよ',
    '받은 카드는 판 옆 가방에 들어가요': 'もらったカードは盤の横のバッグに入るよ',
    '카드를 누르고 방울을 눌러 써요': 'カードをタップしてから、しずくをタップして使おう',
    '물 컵·황금 붓은 누르면 바로 써져요': '水のコップと金の筆はタップするとすぐ使えるよ',
    '언덕 위 집': '丘の上の家', '과일 그릇': 'くだもの皿', '바닷가 등대': '海辺の灯台', '해바라기': 'ひまわり', '노을 지붕': '夕焼けの屋根',
    '숲속 호수': '森の湖', '눈 오는 마을': '雪の降る村', '열기구': '気球', '작은 항구': '小さな港', '별밤': '星の夜',
    '빨강 튜브': '赤チューブ', '노랑 튜브': '黄チューブ', '파랑 튜브': '青チューブ', '흰색 튜브': '白チューブ', '검정 튜브': '黒チューブ',
    '큰 빨강 튜브': '大きな赤チューブ', '큰 노랑 튜브': '大きな黄チューブ', '큰 파랑 튜브': '大きな青チューブ', '큰 흰색 튜브': '大きな白チューブ', '큰 검정 튜브': '大きな黒チューブ',
    '황금 빨강 튜브': '金の赤チューブ', '황금 노랑 튜브': '金の黄チューブ', '황금 파랑 튜브': '金の青チューブ', '황금 흰색 튜브': '金の白チューブ', '황금 검정 튜브': '金の黒チューブ',
    '물 한 컵': '水1杯', '물 두 컵': '水2杯', '물 세 컵': '水3杯', '물뿌리개': 'じょうろ', '황금 물통': '金の水がめ',
    '헝겊': 'ぞうきん', '스포이트': 'スポイト', '나이프': 'ナイフ', '황금 붓': '金の筆',
    '지우기': '消す', '덜기': '1滴とる', '옮기기': '動かす', '완성': '完成',
  };
  // 포르투갈어(브라질)
  const DPT = {
    '색깔섞기': 'MISTURA', '퍼즐게임': 'DE CORES', '색깔섞기 퍼즐게임': 'Mistura de Cores',
    '도감': 'ÁLBUM', '처음으로': 'INÍCIO',
    '방울을 밀면 미끄러져 가다가 부딪힌 방울과 섞여요': 'Empurre uma gota. Ela desliza e se mistura com a gota em que bater.',
    '견본과 같은 색을 MOVES 안에 만들어요': 'Faça a cor da amostra antes de acabarem os MOVES.',
    '아래 점은 들어갈 물감이에요': 'Os pontinhos embaixo são as tintas que entram.',
    '만든 색으로 그림이 칠해져요': 'A cor que você faz pinta o quadro.',
    '받은 카드는 판 옆 가방에 들어가요': 'As cartas que você ganha vão para a bolsa ao lado.',
    '카드를 누르고 방울을 눌러 써요': 'Toque numa carta e depois numa gota.',
    '물 컵·황금 붓은 누르면 바로 써져요': 'Copos d\'água e o pincel dourado agem na hora.',
    '언덕 위 집': 'Casa na Colina', '과일 그릇': 'Fruteira', '바닷가 등대': 'Farol', '해바라기': 'Girassóis', '노을 지붕': 'Telhado ao Pôr do Sol',
    '숲속 호수': 'Lago na Floresta', '눈 오는 마을': 'Vila com Neve', '열기구': 'Balões', '작은 항구': 'Pequeno Porto', '별밤': 'Noite Estrelada',
    '빨강 튜브': 'Tubo Vermelho', '노랑 튜브': 'Tubo Amarelo', '파랑 튜브': 'Tubo Azul', '흰색 튜브': 'Tubo Branco', '검정 튜브': 'Tubo Preto',
    '큰 빨강 튜브': 'Tubão Vermelho', '큰 노랑 튜브': 'Tubão Amarelo', '큰 파랑 튜브': 'Tubão Azul', '큰 흰색 튜브': 'Tubão Branco', '큰 검정 튜브': 'Tubão Preto',
    '황금 빨강 튜브': 'Tubo de Ouro Vermelho', '황금 노랑 튜브': 'Tubo de Ouro Amarelo', '황금 파랑 튜브': 'Tubo de Ouro Azul', '황금 흰색 튜브': 'Tubo de Ouro Branco', '황금 검정 튜브': 'Tubo de Ouro Preto',
    '물 한 컵': 'Copo d\'Água', '물 두 컵': 'Dois Copos', '물 세 컵': 'Três Copos', '물뿌리개': 'Regador', '황금 물통': 'Jarro Dourado',
    '헝겊': 'Pano', '스포이트': 'Conta-gotas', '나이프': 'Espátula', '황금 붓': 'Pincel Dourado',
    '지우기': 'APAGAR', '덜기': 'TIRAR 1', '옮기기': 'MOVER', '완성': 'PRONTO',
  };
  // 러시아어
  const DRU = {
    '색깔섞기': 'СМЕШАЙ', '퍼즐게임': 'ЦВЕТА', '색깔섞기 퍼즐게임': 'Смешай цвета',
    '도감': 'АЛЬБОМ', '처음으로': 'В МЕНЮ',
    '방울을 밀면 미끄러져 가다가 부딪힌 방울과 섞여요': 'Толкни каплю. Она скользит и смешивается с каплей, в которую врежется.',
    '견본과 같은 색을 MOVES 안에 만들어요': 'Получи цвет как на образце, пока не кончились MOVES.',
    '아래 점은 들어갈 물감이에요': 'Точки снизу — краски, которые туда входят.',
    '만든 색으로 그림이 칠해져요': 'Твой цвет раскрашивает картину.',
    '받은 카드는 판 옆 가방에 들어가요': 'Полученные карты попадают в сумку рядом с полем.',
    '카드를 누르고 방울을 눌러 써요': 'Нажми на карту, потом на каплю.',
    '물 컵·황금 붓은 누르면 바로 써져요': 'Стаканы воды и золотая кисть срабатывают сразу.',
    '언덕 위 집': 'Дом на холме', '과일 그릇': 'Ваза с фруктами', '바닷가 등대': 'Маяк у моря', '해바라기': 'Подсолнухи', '노을 지붕': 'Крыша на закате',
    '숲속 호수': 'Лесное озеро', '눈 오는 마을': 'Снежная деревня', '열기구': 'Воздушные шары', '작은 항구': 'Маленькая гавань', '별밤': 'Звёздная ночь',
    '빨강 튜브': 'Красный тюбик', '노랑 튜브': 'Жёлтый тюбик', '파랑 튜브': 'Синий тюбик', '흰색 튜브': 'Белый тюбик', '검정 튜브': 'Чёрный тюбик',
    '큰 빨강 튜브': 'Большой красный', '큰 노랑 튜브': 'Большой жёлтый', '큰 파랑 튜브': 'Большой синий', '큰 흰색 튜브': 'Большой белый', '큰 검정 튜브': 'Большой чёрный',
    '황금 빨강 튜브': 'Золотой красный', '황금 노랑 튜브': 'Золотой жёлтый', '황금 파랑 튜브': 'Золотой синий', '황금 흰색 튜브': 'Золотой белый', '황금 검정 튜브': 'Золотой чёрный',
    '물 한 컵': 'Стакан воды', '물 두 컵': 'Два стакана', '물 세 컵': 'Три стакана', '물뿌리개': 'Лейка', '황금 물통': 'Золотой кувшин',
    '헝겊': 'Тряпка', '스포이트': 'Пипетка', '나이프': 'Мастихин', '황금 붓': 'Золотая кисть',
    '지우기': 'СТЕРЕТЬ', '덜기': 'МИНУС 1', '옮기기': 'ПЕРЕНОС', '완성': 'ГОТОВО',
  };
  const D = EN ? DEN : ZH ? DZH : JA ? DJA : PT ? DPT : DRU;
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\$&');
  const RE = new RegExp(keys.map(esc).join('|'), 'g');
  const tr = (s) => (/[가-힣]/.test(s) ? s.replace(RE, (m) => D[m]) : s);
  window.L = tr;
  function walk(n) {
    if (n.nodeType === 3) { const t = tr(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; return; }
    if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
    for (const c of n.childNodes) walk(c);
  }
  document.documentElement.lang = EN ? 'en' : ZH ? 'zh-CN' : JA ? 'ja' : PT ? 'pt-BR' : 'ru';
  if (ZH) {
    // 게임 글꼴(Star·Pj)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Star';src:${zf};unicode-range:${ur}}@font-face{font-family:'Pj';src:${zf};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}html[lang=zh-CN] .btn{white-space:nowrap}html[lang=zh-CN] .hd{flex-wrap:wrap;row-gap:10px}html[lang=zh-CN] .hb{margin-left:auto}`;
    document.head.appendChild(st);
  }
  if (JA) {
    // 게임 글꼴엔 가나·한자가 없다 → 같은 이름에 일본어 기기 글꼴을 그 범위로만 덧붙인다
    const jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    const ur = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Star';src:${jf};unicode-range:${ur}}@font-face{font-family:'Pj';src:${jf};unicode-range:${ur}}html[lang=ja] *{word-break:normal!important}html[lang=ja] .btn{white-space:nowrap}html[lang=ja] .hd{flex-wrap:wrap;row-gap:10px}html[lang=ja] .hb{margin-left:auto}`;
    document.head.appendChild(st);
  }
  if (PT || RU) {
    // 게임 글꼴에 없는 라틴 악센트·키릴 글자는 기기 글꼴로 채운다
    const lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    const ur = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Star';src:${lf};unicode-range:${ur}}@font-face{font-family:'Pj';src:${lf};unicode-range:${ur}}`;
    document.head.appendChild(st);
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.title = EN ? 'Color Mix Puzzle Game' : ZH ? '调色解谜' : JA ? 'いろまぜパズル' : PT ? 'Mistura de Cores' : 'Смешай цвета';
    walk(document.body);
    new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach(walk); if (m.type === 'characterData') walk(m.target); }))
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  });
})();
