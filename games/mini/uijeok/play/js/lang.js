// 언어: 주소에 ?lang=en·zh·ja·pt·ru 일 때만 그 언어. 화면 글은 L(한, 영)
(function () {
  const Q = new URLSearchParams(location.search).get('lang');
  const LG = (window.LANG = ['en', 'zh', 'ja', 'pt', 'ru'].includes(Q) ? Q : 'ko');
  const EN = (window.EN = LG === 'en');
  const ZHL = (window.ZHL = LG === 'zh');
  // 중국어: 한국어 원문을 열쇠로 찾고, 못 찾으면 영어
  const ZH = {
    '달빛 의적': '月光侠盗',
    '전설의 의적': '传说侠盗', '날랜 의적': '敏捷侠盗', '끈질긴 의적': '顽强侠盗', '넘어져도 일어나는 의적': '屡败屡战的侠盗',
    '아버지를 구했다': '救出了父亲', '걸린 시간': '用时', '쓰러짐': '倒下', '쓰러진 횟수': '倒下次数', '엽전': '铜钱', '물리친 적': '击败敌人',
    '분': '分钟', '너는 몇 번 쓰러질까?': '你会倒下几次？',
    '달빛 의적 엔딩 봤다! 너도 사또를 혼내 줘': '我通关了月光侠盗！你也来教训一下县令吧',
    '주소 복사됨': '链接已复制',
    '약과': '药果', '산삼': '野山参', '검': '剑', '공': '攻',
    '아들아': '儿啊', '와줬구나': '你来了啊', '나는 너를 믿고 있었다': '我一直相信你',
    '고약한 사또놈이 억울하게 누명을 씌웠는데': '可恶的狗县令冤枉了我', '이제 나는 너만 믿겠다': '以后我就只信你了',
    '관아 옥사': '官衙大牢', '동헌 회랑': '县衙回廊', '달밤 기와지붕': '月夜瓦顶', '읍성 성벽': '邑城城墙',
    '도깨비굴': '鬼怪洞', '깊은 도깨비굴': '鬼怪洞深处', '버려진 절': '废弃古寺', '무너진 누각': '倒塌楼阁',
    '감영 곳간': '监营粮仓', '사또의 동헌': '县令大堂',
  };
  // 일본어·포르투갈어·러시아어: 중국어와 같은 열쇠
  const JA = {
    '달빛 의적': '月夜の義賊',
    '전설의 의적': '伝説の義賊', '날랜 의적': '俊足の義賊', '끈질긴 의적': 'しぶとい義賊', '넘어져도 일어나는 의적': '七転び八起きの義賊',
    '아버지를 구했다': '父を救い出した', '걸린 시간': 'かかった時間', '쓰러짐': 'やられた数', '쓰러진 횟수': 'やられた回数', '엽전': '銅銭', '물리친 적': '倒した敵',
    '분': '分', '너는 몇 번 쓰러질까?': 'キミは何回やられるかな？',
    '달빛 의적 엔딩 봤다! 너도 사또를 혼내 줘': '月夜の義賊をクリアした！キミも悪代官をこらしめてやれ',
    '주소 복사됨': 'リンクをコピーしました',
    '약과': 'ヤックァ', '산삼': '高麗人参', '검': '剣', '공': '攻',
    '아들아': '息子よ…', '와줬구나': '来てくれたんだな', '나는 너를 믿고 있었다': 'お前を信じていたぞ',
    '고약한 사또놈이 억울하게 누명을 씌웠는데': 'あの悪代官に濡れ衣を着せられたが', '이제 나는 너만 믿겠다': 'これからはお前だけが頼りだ',
    '관아 옥사': '役所の牢獄', '동헌 회랑': '役所の回廊', '달밤 기와지붕': '月夜の瓦屋根', '읍성 성벽': '邑城の城壁',
    '도깨비굴': 'トッケビの洞窟', '깊은 도깨비굴': 'トッケビの洞窟・奥', '버려진 절': '廃寺', '무너진 누각': '崩れた楼閣',
    '감영 곳간': '監営の蔵', '사또의 동헌': '代官の屋敷',
  };
  const PT = {
    '달빛 의적': 'BANDIDO DO LUAR',
    '전설의 의적': 'BANDIDO LENDÁRIO', '날랜 의적': 'BANDIDO VELOZ', '끈질긴 의적': 'BANDIDO TEIMOSO', '넘어져도 일어나는 의적': 'BANDIDO QUE NUNCA DESISTE',
    '아버지를 구했다': 'PAI LIBERTADO', '걸린 시간': 'TEMPO', '쓰러짐': 'MORTES', '쓰러진 횟수': 'MORTES', '엽전': 'MOEDAS', '물리친 적': 'DERROTADOS',
    '분': ' min', '너는 몇 번 쓰러질까?': 'Quantas vezes você vai cair?',
    '달빛 의적 엔딩 봤다! 너도 사또를 혼내 줘': 'Zerei o Bandido do Luar! Vem dar uma lição no magistrado corrupto você também',
    '주소 복사됨': 'LINK COPIADO',
    '약과': 'BISCOITO', '산삼': 'GINSENG', '검': 'ESPADA', '공': 'A',
    '아들아': 'Meu filho...', '와줬구나': 'Você veio me buscar.', '나는 너를 믿고 있었다': 'Eu sempre acreditei em você.',
    '고약한 사또놈이 억울하게 누명을 씌웠는데': 'O magistrado perverso me acusou injustamente.', '이제 나는 너만 믿겠다': 'Agora só confio em você.',
    '관아 옥사': 'A PRISÃO', '동헌 회랑': 'SALÃO DO MAGISTRADO', '달밤 기와지붕': 'TELHADOS AO LUAR', '읍성 성벽': 'MURALHAS DA CIDADE',
    '도깨비굴': 'CAVERNA DOS GOBLINS', '깊은 도깨비굴': 'CAVERNA PROFUNDA', '버려진 절': 'TEMPLO ABANDONADO', '무너진 누각': 'PAVILHÃO EM RUÍNAS',
    '감영 곳간': 'ARMAZÉM DO GOVERNADOR', '사또의 동헌': 'O MAGISTRADO',
  };
  const RU = {
    '달빛 의적': 'ЛУННЫЙ РАЗБОЙНИК',
    '전설의 의적': 'ЛЕГЕНДАРНЫЙ РАЗБОЙНИК', '날랜 의적': 'ЛОВКИЙ РАЗБОЙНИК', '끈질긴 의적': 'УПОРНЫЙ РАЗБОЙНИК', '넘어져도 일어나는 의적': 'НЕСГИБАЕМЫЙ РАЗБОЙНИК',
    '아버지를 구했다': 'ОТЕЦ НА СВОБОДЕ', '걸린 시간': 'ВРЕМЯ', '쓰러짐': 'СМЕРТИ', '쓰러진 횟수': 'СМЕРТИ', '엽전': 'МОНЕТЫ', '물리친 적': 'ПОБЕЖДЕНО',
    '분': ' мин', '너는 몇 번 쓰러질까?': 'А сколько раз упадёшь ты?',
    '달빛 의적 엔딩 봤다! 너도 사또를 혼내 줘': 'Я прошёл «Лунного разбойника»! Проучи продажного наместника и ты',
    '주소 복사됨': 'ССЫЛКА СКОПИРОВАНА',
    '약과': 'ПЕЧЕНЬЕ', '산삼': 'ЖЕНЬШЕНЬ', '검': 'МЕЧ', '공': 'A',
    '아들아': 'Сынок...', '와줬구나': 'Ты пришёл за мной.', '나는 너를 믿고 있었다': 'Я всегда в тебя верил.',
    '고약한 사또놈이 억울하게 누명을 씌웠는데': 'Злой наместник оклеветал меня.', '이제 나는 너만 믿겠다': 'Теперь я верю только тебе.',
    '관아 옥사': 'ТЮРЬМА', '동헌 회랑': 'ЗАЛ НАМЕСТНИКА', '달밤 기와지붕': 'КРЫШИ ПОД ЛУНОЙ', '읍성 성벽': 'ГОРОДСКИЕ СТЕНЫ',
    '도깨비굴': 'ПЕЩЕРА ГОБЛИНОВ', '깊은 도깨비굴': 'ГЛУБОКАЯ ПЕЩЕРА', '버려진 절': 'ЗАБРОШЕННЫЙ ХРАМ', '무너진 누각': 'РАЗРУШЕННЫЙ ПАВИЛЬОН',
    '감영 곳간': 'АМБАР ГУБЕРНАТОРА', '사또의 동헌': 'НАМЕСТНИК',
  };
  const DIC = { zh: ZH, ja: JA, pt: PT, ru: RU }[LG];
  window.L = DIC ? (ko, en) => (DIC[ko] != null ? DIC[ko] : en) : (ko, en) => (EN ? en : ko);
  if (LG === 'ko') return;
  document.documentElement.lang = { en: 'en', zh: 'zh-CN', ja: 'ja', pt: 'pt-BR', ru: 'ru' }[LG];
  if (ZHL) {
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = ['Ttl', 'Px'].map((f) => "@font-face{font-family:'" + f + "';src:" + zf + ';unicode-range:' + ur + '}').join('') + 'html[lang=zh-CN] *{word-break:normal!important}';
    document.head.appendChild(st);
  }
  if (LG === 'ja') {
    const jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    const ur = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = ['Ttl', 'Px'].map((f) => "@font-face{font-family:'" + f + "';src:" + jf + ';unicode-range:' + ur + '}').join('') + 'html[lang=ja] *{word-break:normal!important}';
    document.head.appendChild(st);
  }
  if (LG === 'pt' || LG === 'ru') {
    // 한글 글꼴에 없는 악센트 라틴·키릴 글자는 시스템 글꼴로
    const lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    const ur = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    const st = document.createElement('style');
    st.textContent = ['Ttl', 'Px'].map((f) => "@font-face{font-family:'" + f + "';src:" + lf + ';unicode-range:' + ur + '}').join('');
    document.head.appendChild(st);
  }
  const TXS = {
    en: {
    h1: '<b>Jump</b> while running to leap far. Run off an edge and you fall',
    h2: '<b>Jump</b> under a ledge to grab it. Press <b>up</b> to climb',
    h4: 'Arrows coming? <b>↓</b> to duck',
    keys: '<b>← →</b> run · <b>↑</b> jump/climb · <b>↓</b> duck/climb down<br><b>Z</b> slash · <b>↑</b> block in a fight',
    rot: 'Turn your phone sideways',
    h3: 'When a guard <b>raises his weapon, block with ↑</b>. Then <b>attack</b>',
  },
    zh: {
    h1: '跑动中<b>跳跃</b>能跳很远。直接跑出去会掉下去',
    h2: '朝上层边缘<b>跳跃</b>就能抓住。按<b>上</b>爬上去',
    h4: '箭飞过来时按 <b>↓</b> 蹲下躲开',
    keys: '<b>← →</b> 跑 · <b>↑</b> 跳跃/攀爬 · <b>↓</b> 下蹲/下去<br><b>Z</b> 攻击 · 战斗时 <b>↑</b> 格挡',
    rot: '请把手机横过来',
    h3: '敌人<b>举起武器时按 ↑ <span style="white-space:nowrap">格挡</span></b>，然后<b>攻击</b>',
  },
    ja: {
    h1: '走りながら<b>ジャンプ</b>すると遠くまで跳べる。そのまま走り出ると落ちるよ',
    h2: '上の段に向かって<b>ジャンプ</b>するとつかまる。<b>上</b>を押すと登れるよ',
    h4: '矢が飛んできたら <b>↓</b> でしゃがんでよけよう',
    keys: '<b>← →</b> 走る · <b>↑</b> ジャンプ/登る · <b>↓</b> しゃがむ/降りる<br><b>Z</b> 攻撃 · 戦闘中 <b>↑</b> ガード',
    rot: 'スマホを横向きにしてください',
    h3: '敵が<b>武器を振り上げたら <span style="white-space:nowrap">↑でガード</span></b>、それから<b>攻撃</b>',
  },
    pt: {
    h1: '<b>Pule</b> correndo para ir longe. Se só correr para fora da borda, você cai',
    h2: '<b>Pule</b> embaixo de uma borda para se agarrar. Aperte <b>para cima</b> para subir',
    h4: 'Vem flecha? <b>↓</b> para abaixar',
    keys: '<b>← →</b> correr · <b>↑</b> pular/subir · <b>↓</b> abaixar/descer<br><b>Z</b> atacar · <b>↑</b> defender na luta',
    rot: 'Vire o celular de lado',
    h3: 'Quando o guarda <b>erguer a arma, defenda com ↑</b>. Depois <b>ataque</b>',
  },
    ru: {
    h1: '<b>Прыгай</b> на бегу, чтобы улететь далеко. Просто сбежишь с края — упадёшь',
    h2: '<b>Прыгни</b> под уступом, чтобы ухватиться. Жми <b>вверх</b>, чтобы залезть',
    h4: 'Летят стрелы? <b>↓</b> — пригнуться',
    keys: '<b>← →</b> бег · <b>↑</b> прыжок/подъём · <b>↓</b> присесть/спуститься<br><b>Z</b> удар · <b>↑</b> блок в бою',
    rot: 'Поверни телефон горизонтально',
    h3: 'Когда стражник <b>замахнётся, блокируй ↑</b>. Потом <b>бей</b>',
  },
  };
  const TX = TXS[LG];
  const TT = {
    en: { atk: 'SLASH', jmp: 'JUMP', rot: 'LANDSCAPE' }, zh: { atk: '攻击', jmp: '跳跃', rot: '横屏' },
    ja: { atk: '攻撃', jmp: 'ジャンプ', rot: '横画面にする' }, pt: { atk: 'ATACAR', jmp: 'PULAR', rot: 'GIRAR TELA' },
    ru: { atk: 'УДАР', jmp: 'ПРЫЖОК', rot: 'ПОВЕРНУТЬ' },
  }[LG];
  const TS = { en: ['SAVE', 'SHARE'], zh: ['保存', '分享'], ja: ['保存', 'シェア'], pt: ['SALVAR', 'ENVIAR'], ru: ['СОХРАНИТЬ', 'ПОДЕЛИТЬСЯ'] }[LG];
  document.addEventListener('DOMContentLoaded', () => {
    document.title = { en: 'Moonlit Outlaw', zh: '月光侠盗', ja: '月夜の義賊', pt: 'Bandido do Luar', ru: 'Лунный разбойник' }[LG];
    document.querySelectorAll('[data-k]').forEach((e) => { const k = e.getAttribute('data-k'); if (TX[k]) e.innerHTML = TX[k]; });
    document.querySelectorAll('[data-t]').forEach((e) => { const k = e.getAttribute('data-t'); if (TT[k]) e.textContent = TT[k]; });
    const cs = document.querySelector('#cSave span'); if (cs) cs.textContent = TS[0];
    const sh = document.querySelector('#cShare span'); if (sh) sh.textContent = TS[1];
  });
})();
