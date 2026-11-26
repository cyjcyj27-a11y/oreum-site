// 영문판·중국어판: 주소에 ?lang=en 또는 ?lang=zh 가 있을 때만 화면 글자를 바꾼다(기억·폰 언어는 쓰지 않는다)
(function () {
  const Q = new URLSearchParams(location.search).get('lang');
  const LG = Q === 'en' || Q === 'zh' ? Q : 'ko';
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
  const D = LG === 'zh' ? ZH : EN;
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
  document.documentElement.lang = LG === 'zh' ? 'zh-CN' : 'en';
  if (LG === 'zh') {
    // 게임 글꼴(Ui·Star)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다(영문·숫자는 원래 글꼴 그대로)
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Ui';src:${zf};unicode-range:${ur}}@font-face{font-family:'Star';src:${zf};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}`;   // keep-all 은 띄어쓰기 없는 중국어를 한 줄로 늘려 창 밖으로 밀어낸다
    document.head.appendChild(st);
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.title = LG === 'zh' ? '3D娃娃机' : 'TOY CRANE';
    walk(document.body);
    new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach(walk); if (m.type === 'characterData') walk(m.target); }))
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  });
})();
