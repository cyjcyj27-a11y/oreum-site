// 언어: 주소에 ?lang=en 일 때만 영어, ?lang=zh 일 때만 중국어. 화면 글은 L(한, 영)
(function () {
  const Q = new URLSearchParams(location.search).get('lang');
  const LG = (window.LANG = Q === 'en' || Q === 'zh' ? Q : 'ko');
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
  window.L = LG === 'zh' ? (ko, en) => (ZH[ko] != null ? ZH[ko] : en) : (ko, en) => (EN ? en : ko);
  if (LG === 'ko') return;
  document.documentElement.lang = EN ? 'en' : 'zh-CN';
  if (ZHL) {
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = ['Ttl', 'Px'].map((f) => "@font-face{font-family:'" + f + "';src:" + zf + ';unicode-range:' + ur + '}').join('') + 'html[lang=zh-CN] *{word-break:normal!important}';
    document.head.appendChild(st);
  }
  const TX = EN ? {
    h1: '<b>Jump</b> while running to leap far. Run off an edge and you fall',
    h2: '<b>Jump</b> under a ledge to grab it. Press <b>up</b> to climb',
    h4: 'Arrows coming? <b>↓</b> to duck',
    keys: '<b>← →</b> run · <b>↑</b> jump/climb · <b>↓</b> duck/climb down<br><b>Z</b> slash · <b>↑</b> block in a fight',
    rot: 'Turn your phone sideways',
    h3: 'When a guard <b>raises his weapon, block with ↑</b>. Then <b>attack</b>',
  } : {
    h1: '跑动中<b>跳跃</b>能跳很远。直接跑出去会掉下去',
    h2: '朝上层边缘<b>跳跃</b>就能抓住。按<b>上</b>爬上去',
    h4: '箭飞过来时按 <b>↓</b> 蹲下躲开',
    keys: '<b>← →</b> 跑 · <b>↑</b> 跳跃/攀爬 · <b>↓</b> 下蹲/下去<br><b>Z</b> 攻击 · 战斗时 <b>↑</b> 格挡',
    rot: '请把手机横过来',
    h3: '敌人<b>举起武器时按 ↑ <span style="white-space:nowrap">格挡</span></b>，然后<b>攻击</b>',
  };
  const TT = EN ? { atk: 'SLASH', jmp: 'JUMP', rot: 'LANDSCAPE' } : { atk: '攻击', jmp: '跳跃', rot: '横屏' };
  document.addEventListener('DOMContentLoaded', () => {
    document.title = EN ? 'Moonlit Outlaw' : '月光侠盗';
    document.querySelectorAll('[data-k]').forEach((e) => { const k = e.getAttribute('data-k'); if (TX[k]) e.innerHTML = TX[k]; });
    document.querySelectorAll('[data-t]').forEach((e) => { const k = e.getAttribute('data-t'); if (TT[k]) e.textContent = TT[k]; });
    const cs = document.querySelector('#cSave span'); if (cs) cs.textContent = EN ? 'SAVE' : '保存';
    const sh = document.querySelector('#cShare span'); if (sh) sh.textContent = EN ? 'SHARE' : '分享';
  });
})();
