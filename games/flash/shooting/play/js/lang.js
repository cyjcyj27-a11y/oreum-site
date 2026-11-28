// ?lang=en 일 때만 영어, ?lang=zh 중국어, ?lang=ja·pt·ru 일본어·포르투갈어·러시아어로 화면 글자를 바꾼다(사전 + MutationObserver). 캔버스 글자는 L() 로 감싼다.
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  const Q = new URLSearchParams(location.search).get('lang');
  const ZH = !EN && Q === 'zh';
  const XL = !EN && !ZH && ['ja', 'pt', 'ru'].includes(Q) ? Q : '';
  window.LANG = EN ? 'en' : ZH ? 'zh' : XL || 'ko';
  const D = {
    '야시장 사격게임': 'NIGHT MARKET SHOOTING GAME',
    '야시장 사격': 'NIGHT MARKET SHOOTING',
    '사격장': 'SHOOTING',
    '사격왕': 'CHAMPION',
    '경품 획득': 'PRIZE!',
    '상점': 'SHOP',
    '경품': 'PRIZES',
    '미션': 'MISSIONS',
    '홈': 'HOME',
    '장착': 'EQUIP',
    '사용 중': 'EQUIPPED',
    '가로로 보기': 'ROTATE',
    '처음부터': 'NEW GAME',
    '모든 기록이 지워집니다': 'All progress will be erased',
    '취소': 'CANCEL',
    '확인': 'OK',
    '쏘기': 'FIRE',
    '탄 +1': 'AMMO +1',
    '코르크총': 'Cork Gun', '장총': 'Long Rifle', '쌍발총': 'Twin Gun', '3연발': 'Triple Burst', '산탄총': 'Shotgun', '공 대포': 'Ball Cannon',
    '대왕 곰': 'KING BEAR', '곰': 'Bear', '토끼': 'Bunny', '고양이': 'Kitty', '강아지': 'Puppy', '오리': 'Duckling', '펭귄': 'Penguin', '돼지': 'Piggy', '개구리': 'Froggy', '판다': 'Panda', '여우': 'Fox', '공룡': 'Dino',
    '첫 CLEAR': 'First CLEAR', '깡통 60개': '60 Cans', '병 20개 깨기': 'Break 20 Bottles', '오리 30마리': '30 Ducks', '풍선 30개': '30 Balloons',
    '한 발에 3개': '3 in One Shot', '한 발에 6개': '6 in One Shot', '폭죽 5번': '5 Fireworks', '별 30개': '30 Stars', '별 72개': '72 Stars', '총 3자루': 'Own 3 Guns', '경품 11개': '11 Prizes',
  };
  // 중국어: 한국어 문장을 열쇠로 찾는다
  const Z = {
    '야시장 사격게임': '夜市打枪',
    '야시장 사격': '夜市打枪',
    '사격장': '射击摊',
    '사격왕': '射击王',
    '경품 획득': '获得奖品',
    '상점': '商店',
    '경품': '奖品',
    '미션': '任务',
    '홈': '首页',
    '장착': '装备',
    '사용 중': '使用中',
    '가로로 보기': '横屏玩',
    '처음부터': '从头开始',
    '모든 기록이 지워집니다': '所有记录都会被清除',
    '취소': '取消',
    '확인': '确定',
    '쏘기': '射击',
    '탄 +1': '子弹 +1',
    '코르크총': '软木塞枪', '장총': '长枪', '쌍발총': '双管枪', '3연발': '三连发', '산탄총': '霰弹枪', '공 대포': '球炮',
    '대왕 곰': '大王熊', '곰': '小熊', '토끼': '兔子', '고양이': '猫咪', '강아지': '小狗', '오리': '鸭子', '펭귄': '企鹅', '돼지': '小猪', '개구리': '青蛙', '판다': '熊猫', '여우': '狐狸', '공룡': '恐龙',
    '첫 CLEAR': '首次 CLEAR', '깡통 60개': '60个罐子', '병 20개 깨기': '打碎20个瓶子', '오리 30마리': '30只鸭子', '풍선 30개': '30个气球',
    '한 발에 3개': '一枪打倒3个', '한 발에 6개': '一枪打倒6个', '폭죽 5번': '5次烟花', '별 30개': '30颗星', '별 72개': '72颗星', '총 3자루': '拥有3把枪', '경품 11개': '11个奖品',
  };
  // 일본어·포르투갈어(브라질)·러시아어: 한국어 문장을 열쇠로 찾는다
  const J = {
    '야시장 사격게임': '夜市の射的',
    '야시장 사격': '夜市の射的',
    '사격장': '射的',
    '사격왕': '射的王',
    '경품 획득': '景品ゲット',
    '상점': 'ショップ',
    '경품': '景品',
    '미션': 'ミッション',
    '홈': 'ホーム',
    '장착': '装備',
    '사용 중': '使用中',
    '가로로 보기': '横向きで遊ぶ',
    '처음부터': '最初から',
    '모든 기록이 지워집니다': 'すべての記録が消えます',
    '취소': 'キャンセル',
    '확인': 'OK',
    '쏘기': '撃つ',
    '탄 +1': '弾 +1',
    '코르크총': 'コルク銃', '장총': 'ライフル', '쌍발총': '二連銃', '3연발': '3連射', '산탄총': 'ショットガン', '공 대포': 'ボール大砲',
    '대왕 곰': '大王グマ', '곰': 'クマ', '토끼': 'ウサギ', '고양이': 'ネコ', '강아지': 'ワンコ', '오리': 'アヒル', '펭귄': 'ペンギン', '돼지': 'ブタ', '개구리': 'カエル', '판다': 'パンダ', '여우': 'キツネ', '공룡': '恐竜',
    '첫 CLEAR': '初CLEAR', '깡통 60개': '缶60個', '병 20개 깨기': 'ビン20本を割る', '오리 30마리': 'アヒル30羽', '풍선 30개': '風船30個',
    '한 발에 3개': '1発で3個', '한 발에 6개': '1発で6個', '폭죽 5번': '花火5回', '별 30개': '星30個', '별 72개': '星72個', '총 3자루': '銃を3丁持つ', '경품 11개': '景品11個',
  };
  const P = {
    '야시장 사격게임': 'TIRO NA FEIRA NOTURNA',
    '야시장 사격': 'TIRO NA FEIRA',
    '사격장': 'TIRO',
    '사격왕': 'CAMPEÃO',
    '경품 획득': 'PRÊMIO!',
    '상점': 'LOJA',
    '경품': 'PRÊMIOS',
    '미션': 'MISSÕES',
    '홈': 'INÍCIO',
    '장착': 'EQUIPAR',
    '사용 중': 'EQUIPADO',
    '가로로 보기': 'GIRAR TELA',
    '처음부터': 'ZERAR',
    '모든 기록이 지워집니다': 'Todo o progresso será apagado',
    '취소': 'CANCELAR',
    '확인': 'OK',
    '쏘기': 'ATIRAR',
    '탄 +1': 'MUNIÇÃO +1',
    '코르크총': 'Arma de Rolha', '장총': 'Rifle Longo', '쌍발총': 'Cano Duplo', '3연발': 'Rajada Tripla', '산탄총': 'Escopeta', '공 대포': 'Canhão de Bola',
    '대왕 곰': 'URSO REI', '곰': 'Ursinho', '토끼': 'Coelhinho', '고양이': 'Gatinho', '강아지': 'Cachorrinho', '오리': 'Patinho', '펭귄': 'Pinguim', '돼지': 'Porquinho', '개구리': 'Sapinho', '판다': 'Panda', '여우': 'Raposa', '공룡': 'Dino',
    '첫 CLEAR': 'Primeiro CLEAR', '깡통 60개': '60 Latas', '병 20개 깨기': 'Quebre 20 Garrafas', '오리 30마리': '30 Patinhos', '풍선 30개': '30 Balões',
    '한 발에 3개': '3 num Tiro Só', '한 발에 6개': '6 num Tiro Só', '폭죽 5번': '5 Fogos de Artifício', '별 30개': '30 Estrelas', '별 72개': '72 Estrelas', '총 3자루': 'Tenha 3 Armas', '경품 11개': '11 Prêmios',
  };
  const R = {
    '야시장 사격게임': 'ТИР НА НОЧНОМ РЫНКЕ',
    '야시장 사격': 'ТИР НА РЫНКЕ',
    '사격장': 'ТИР',
    '사격왕': 'ЧЕМПИОН',
    '경품 획득': 'ПРИЗ!',
    '상점': 'МАГАЗИН',
    '경품': 'ПРИЗЫ',
    '미션': 'ЗАДАНИЯ',
    '홈': 'ДОМОЙ',
    '장착': 'ВЗЯТЬ',
    '사용 중': 'В РУКАХ',
    '가로로 보기': 'ПОВЕРНУТЬ',
    '처음부터': 'ЗАНОВО',
    '모든 기록이 지워집니다': 'Весь прогресс будет удалён',
    '취소': 'ОТМЕНА',
    '확인': 'ОК',
    '쏘기': 'ОГОНЬ',
    '탄 +1': 'ПАТРОНЫ +1',
    '코르크총': 'Пробковое ружьё', '장총': 'Винтовка', '쌍발총': 'Двустволка', '3연발': 'Тройной залп', '산탄총': 'Дробовик', '공 대포': 'Шаровая пушка',
    '대왕 곰': 'КОРОЛЬ-МИШКА', '곰': 'Мишка', '토끼': 'Зайка', '고양이': 'Котик', '강아지': 'Щенок', '오리': 'Утёнок', '펭귄': 'Пингвин', '돼지': 'Хрюша', '개구리': 'Лягушка', '판다': 'Панда', '여우': 'Лисичка', '공룡': 'Динозаврик',
    '첫 CLEAR': 'Первый CLEAR', '깡통 60개': '60 банок', '병 20개 깨기': 'Разбей 20 бутылок', '오리 30마리': '30 уток', '풍선 30개': '30 шариков',
    '한 발에 3개': '3 за один выстрел', '한 발에 6개': '6 за один выстрел', '폭죽 5번': '5 фейерверков', '별 30개': '30 звёзд', '별 72개': '72 звезды', '총 3자루': 'Собери 3 ружья', '경품 11개': '11 призов',
  };
  const T = ZH ? Z : XL === 'ja' ? J : XL === 'pt' ? P : XL === 'ru' ? R : D;
  const keys = Object.keys(T).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[+]/g, '[+]')).join('|'), 'g');
  window.L = (s) => ((EN || ZH || XL) && s ? String(s).replace(re, (m) => T[m]) : s);
  if (!EN && !ZH && !XL) return;
  document.documentElement.lang = ZH ? 'zh-CN' : XL === 'ja' ? 'ja' : XL === 'pt' ? 'pt-BR' : XL === 'ru' ? 'ru' : 'en';
  document.title = ZH ? '夜市打枪' : XL === 'ja' ? '夜市の射的ゲーム' : XL === 'pt' ? 'Tiro ao Alvo na Feira Noturna' : XL === 'ru' ? 'Тир на ночном рынке' : 'Night Market Shooting Game';
  if (ZH) {
    // 게임 글꼴(Round·Ria)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Round';src:${zb};unicode-range:${ur}}@font-face{font-family:'Ria';src:${zb};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}`;
    document.head.appendChild(st);
  }
  if (XL === 'ja') {
    // 게임 글꼴(Round·Ria)엔 가나·한자가 없다 → 같은 이름에 일본어 기기 글꼴을 그 범위로만 덧붙인다
    const jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    const jb = "local('Hiragino Sans W7'),local('HiraginoSans-W7'),local('Hiragino Kaku Gothic ProN W6'),local('Yu Gothic UI Bold'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('Meiryo Bold'),local('Noto Sans JP Bold'),local('Noto Sans CJK JP Bold')," + jf;
    const ur = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Round';src:${jb};unicode-range:${ur}}@font-face{font-family:'Ria';src:${jb};unicode-range:${ur}}html[lang=ja] *{word-break:normal!important}`;
    document.head.appendChild(st);
  }
  if (XL === 'pt' || XL === 'ru') {
    // 게임 글꼴에 없을 수 있는 악센트 라틴·키릴 글자만 기기 글꼴로 덧붙인다
    const lf = "local('Segoe UI Bold'),local('SegoeUI-Bold'),local('Roboto Bold'),local('Roboto-Bold'),local('Arial Bold'),local('Arial-BoldMT'),local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    const ur = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Round';src:${lf};unicode-range:${ur}}@font-face{font-family:'Ria';src:${lf};unicode-range:${ur}}`;
    document.head.appendChild(st);
  }
  const fix = (n) => { if (n.nodeType === 3) { const v = n.nodeValue, w = window.L(v); if (w !== v) n.nodeValue = w; } else if (n.nodeType === 1) n.childNodes.forEach(fix); };
  const start = () => { fix(document.body); new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach(fix); if (m.type === 'characterData') fix(m.target); })).observe(document.body, { childList: true, subtree: true, characterData: true }); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
