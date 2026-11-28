// 영문판·중국어판·일본어판·포르투갈어판·러시아어판: 주소에 ?lang=en·zh·ja·pt·ru 가 있을 때만 화면 글자를 바꾼다(기억·폰 언어는 쓰지 않는다)
(function () {
  const Q = new URLSearchParams(location.search).get('lang');
  const LG = ['en', 'zh', 'ja', 'pt', 'ru'].includes(Q) ? Q : 'ko';
  window.LANG = LG;
  if (LG === 'ko') return;
  const EN = {
    '인형뽑기게임': 'TOY CRANE', '돈안드니까 실컷 뽑아보세요 ㅋㅋㅋ': "It's free, so grab all you want lol",
    '뽑은 인형': 'WON', '남은 인형': 'DOLLS', '도감': 'BOOK', '왼쪽': 'LEFT', '오른쪽': 'RIGHT', '앞': 'FRONT', '확대': 'ZOOM', '닫기': 'CLOSE',
    '이 게임은 무료로 뽑기가 가능합니다': 'Every try in this claw machine is free',
    '조이스틱이나 방향키로 집게를 옮겨요': 'Move the claw with the joystick or arrow keys',
    '화면을 끌면 기계가 돌아가요': 'Drag the screen to look around the machine',
    'DROP 을 누르면 집게가 내려가서 인형을 집어요': 'Press DROP and the claw goes down to grab a toy',
    'TIME 이 끝나면 저절로 내려가요': 'It drops by itself when TIME runs out',
    '구멍에 떨어지면 GET!': 'Drop it in the hole for a GET!',
    '뽑은 인형은 도감에 모이고 다 뽑으면 새로 채워져요': 'Toys you win go in the BOOK, and the machine refills when it is empty',
    '인형 100개 → 대왕 곰돌이': '100 toys → GIANT TEDDY', '대왕 곰돌이': 'GIANT TEDDY', '교환': 'TRADE', '가진 대왕 곰돌이': 'GIANT TEDDY owned', '곰': 'Bear', '토끼': 'Rabbit', '고양이': 'Cat', '강아지': 'Puppy', '오리': 'Duck', '펭귄': 'Penguin', '돼지': 'Pig', '개구리': 'Frog', '판다': 'Panda', '여우': 'Fox', '공룡': 'Dino',
  };
  const ZH = {
    '인형뽑기게임': '3D娃娃机', '돈안드니까 실컷 뽑아보세요 ㅋㅋㅋ': '不花钱，随便抓 哈哈哈',
    '뽑은 인형': '已抓到', '남은 인형': '剩余', '도감': '图鉴', '왼쪽': '左', '오른쪽': '右', '앞': '正面', '확대': '放大', '닫기': '关闭',
    '이 게임은 무료로 뽑기가 가능합니다': '这台娃娃机每次都免费',
    '조이스틱이나 방향키로 집게를 옮겨요': '用摇杆或方向键移动爪子',
    '화면을 끌면 기계가 돌아가요': '拖动画面可以转动机器',
    'DROP 을 누르면 집게가 내려가서 인형을 집어요': '按 DROP，爪子会下降抓娃娃',
    'TIME 이 끝나면 저절로 내려가요': 'TIME 用完会自动下降',
    '구멍에 떨어지면 GET!': '掉进洞口就 GET!',
    '뽑은 인형은 도감에 모이고 다 뽑으면 새로 채워져요': '抓到的娃娃会收进图鉴，抓完会重新补满',
    '인형 100개 → 대왕 곰돌이': '100个娃娃 → 巨型泰迪熊', '대왕 곰돌이': '巨型泰迪熊', '교환': '兑换', '가진 대왕 곰돌이': '拥有巨型泰迪熊', '곰': '熊', '토끼': '兔子', '고양이': '猫咪', '강아지': '小狗', '오리': '鸭子', '펭귄': '企鹅', '돼지': '小猪', '개구리': '青蛙', '판다': '熊猫', '여우': '狐狸', '공룡': '恐龙',
  };
  const JA = {
    '인형뽑기게임': 'クレーンゲーム', '돈안드니까 실컷 뽑아보세요 ㅋㅋㅋ': 'タダだから好きなだけ取っちゃって www',
    '뽑은 인형': 'ゲット', '남은 인형': '残り', '도감': '図鑑', '왼쪽': '左', '오른쪽': '右', '앞': '正面', '확대': 'ズーム', '닫기': '閉じる',
    '이 게임은 무료로 뽑기가 가능합니다': 'このクレーンゲームは何回でも無料！',
    '조이스틱이나 방향키로 집게를 옮겨요': 'スティックか矢印キーでアームを動かそう',
    '화면을 끌면 기계가 돌아가요': '画面をドラッグすると台が回るよ',
    'DROP 을 누르면 집게가 내려가서 인형을 집어요': 'DROP を押すとアームが下りてぬいぐるみをつかむよ',
    'TIME 이 끝나면 저절로 내려가요': 'TIME が切れると自動で下りるよ',
    '구멍에 떨어지면 GET!': '穴に落ちたら GET!',
    '뽑은 인형은 도감에 모이고 다 뽑으면 새로 채워져요': '取ったぬいぐるみは図鑑に集まり、全部取ると補充されるよ',
    '인형 100개 → 대왕 곰돌이': 'ぬいぐるみ100個 → ジャンボくま', '대왕 곰돌이': 'ジャンボくま', '교환': '交換', '가진 대왕 곰돌이': '持ってるジャンボくま', '곰': 'クマ', '토끼': 'ウサギ', '고양이': 'ネコ', '강아지': 'イヌ', '오리': 'アヒル', '펭귄': 'ペンギン', '돼지': 'ブタ', '개구리': 'カエル', '판다': 'パンダ', '여우': 'キツネ', '공룡': 'キョウリュウ',
  };
  const PT = {
    '인형뽑기게임': 'TOY CRANE', '돈안드니까 실컷 뽑아보세요 ㅋㅋㅋ': 'É de graça, então pega quantos quiser kkkk',
    '뽑은 인형': 'PEGOS', '남은 인형': 'RESTAM', '도감': 'ÁLBUM', '왼쪽': 'ESQ.', '오른쪽': 'DIR.', '앞': 'FRENTE', '확대': 'ZOOM', '닫기': 'FECHAR',
    '이 게임은 무료로 뽑기가 가능합니다': 'Nesta máquina, toda tentativa é grátis',
    '조이스틱이나 방향키로 집게를 옮겨요': 'Mova a garra com o joystick ou as setas',
    '화면을 끌면 기계가 돌아가요': 'Arraste a tela para girar a máquina',
    'DROP 을 누르면 집게가 내려가서 인형을 집어요': 'Aperte DROP e a garra desce para pegar um bichinho',
    'TIME 이 끝나면 저절로 내려가요': 'Quando o TIME acaba, ela desce sozinha',
    '구멍에 떨어지면 GET!': 'Caiu no buraco? GET!',
    '뽑은 인형은 도감에 모이고 다 뽑으면 새로 채워져요': 'Os bichinhos que você pega vão para o ÁLBUM, e a máquina enche de novo quando esvazia',
    '인형 100개 → 대왕 곰돌이': '100 bichinhos → MEGA URSÃO', '대왕 곰돌이': 'MEGA URSÃO', '교환': 'TROCAR', '가진 대왕 곰돌이': 'Seus MEGA URSÕES', '곰': 'Urso', '토끼': 'Coelho', '고양이': 'Gato', '강아지': 'Cachorro', '오리': 'Pato', '펭귄': 'Pinguim', '돼지': 'Porco', '개구리': 'Sapo', '판다': 'Panda', '여우': 'Raposa', '공룡': 'Dinossauro',
  };
  const RU = {
    '인형뽑기게임': 'TOY CRANE', '돈안드니까 실컷 뽑아보세요 ㅋㅋㅋ': 'Это бесплатно, так что тащи сколько хочешь ахаха',
    '뽑은 인형': 'ВЗЯТО', '남은 인형': 'ОСТАЛОСЬ', '도감': 'АЛЬБОМ', '왼쪽': 'СЛЕВА', '오른쪽': 'СПРАВА', '앞': 'ПРЯМО', '확대': 'ЗУМ', '닫기': 'ЗАКРЫТЬ',
    '이 게임은 무료로 뽑기가 가능합니다': 'В этом автомате все попытки бесплатные',
    '조이스틱이나 방향키로 집게를 옮겨요': 'Двигай клешню джойстиком или стрелками',
    '화면을 끌면 기계가 돌아가요': 'Потяни экран, чтобы повернуть автомат',
    'DROP 을 누르면 집게가 내려가서 인형을 집어요': 'Нажми DROP — клешня опустится и схватит игрушку',
    'TIME 이 끝나면 저절로 내려가요': 'Когда TIME кончится, она опустится сама',
    '구멍에 떨어지면 GET!': 'Упала в лунку — GET!',
    '뽑은 인형은 도감에 모이고 다 뽑으면 새로 채워져요': 'Пойманные игрушки попадают в АЛЬБОМ, а пустой автомат снова наполняется',
    '인형 100개 → 대왕 곰돌이': '100 игрушек → МЕГАМИШКА', '대왕 곰돌이': 'МЕГАМИШКА', '교환': 'ОБМЕН', '가진 대왕 곰돌이': 'Твои МЕГАМИШКИ', '곰': 'Мишка', '토끼': 'Зайка', '고양이': 'Котик', '강아지': 'Щенок', '오리': 'Утёнок', '펭귄': 'Пингвин', '돼지': 'Свинка', '개구리': 'Лягушка', '판다': 'Панда', '여우': 'Лисичка', '공룡': 'Динозавр',
  };
  const D = { zh: ZH, ja: JA, pt: PT, ru: RU }[LG] || EN;
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const RE = new RegExp(keys.map(esc).join('|'), 'g');
  const tr = (s) => (/[가-힣ㄱ-ㅣ]/.test(s) ? s.replace(RE, (m) => D[m]) : s);
  window.L = tr;
  function walk(n) {
    if (n.nodeType === 3) { const t = tr(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; return; }
    if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
    for (const c of n.childNodes) walk(c);
  }
  document.documentElement.lang = { zh: 'zh-CN', ja: 'ja', pt: 'pt-BR', ru: 'ru' }[LG] || 'en';
  if (LG === 'zh') {
    // 게임 글꼴(Ui·Star)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다(영문·숫자는 원래 글꼴 그대로)
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ui';src:${zf};unicode-range:${ur}}@font-face{font-family:'Star';src:${zf};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}`;   // keep-all 은 띄어쓰기 없는 중국어를 한 줄로 늘려 창 밖으로 밀어낸다
    document.head.appendChild(st);
  }
  if (LG === 'ja') {
    // 게임 글꼴(Ui·Star)엔 가나·한자가 없다 → 같은 이름에 일본어 기기 글꼴을 가나·한자 범위로만 덧붙인다
    const jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    const ur = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ui';src:${jf};unicode-range:${ur}}@font-face{font-family:'Star';src:${jf};unicode-range:${ur}}html[lang=ja] *{word-break:normal!important}`;
    document.head.appendChild(st);
  }
  if (LG === 'pt' || LG === 'ru') {
    // 게임 글꼴에 없는 악센트 라틴·키릴 글자만 기기 글꼴로 채운다
    const lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    const ur = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ui';src:${lf};unicode-range:${ur}}@font-face{font-family:'Star';src:${lf};unicode-range:${ur}}`;
    document.head.appendChild(st);
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.title = { zh: '3D娃娃机', ja: 'クレーンゲーム' }[LG] || 'TOY CRANE';
    walk(document.body);
    new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach(walk); if (m.type === 'characterData') walk(m.target); }))
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  });
})();
