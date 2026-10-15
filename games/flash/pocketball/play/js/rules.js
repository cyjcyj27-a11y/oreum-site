// 8볼 규칙(가볍게). 게임과 AI 가 같이 쓴다.
// st = { turn: 0|1, group: [null|'S'|'T', ...], brk: 브레이크 샷인가 }
(function () {
  const RU = (window.RULES = {});
  const isS = (id) => id >= 1 && id <= 7, isT = (id) => id >= 9 && id <= 15;
  RU.isS = isS; RU.isT = isT;
  RU.of = (g) => (g === 'S' ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15]);
  RU.left = (balls, g) => RU.of(g).filter((i) => balls[i].on).length;
  // 지금 처음 맞혀야 하는 공들
  RU.legal = function (balls, st, who) {
    const g = st.group[who == null ? st.turn : who];
    if (!g) { const a = []; for (let i = 1; i < 16; i++) if (i !== 8 && balls[i].on) a.push(i); return a.length ? a : [8]; }
    const mine = RU.of(g).filter((i) => balls[i].on);
    return mine.length ? mine : [8];
  };
  // 샷 판정. before = 치기 전 공(내 공이 다 들어갔었나 보려고)
  RU.judge = function (before, st, ev) {
    const me = st.turn, g = st.group[me];
    const legal = RU.legal(before, st);
    const onEight = legal.length === 1 && legal[0] === 8;
    const pk = ev.pocketed.map((p) => p.id);
    const scratch = pk.includes(0);
    const objs = pk.filter((i) => i !== 0);
    const r = { foul: false, scratch, noHit: ev.first < 0, wrong: false, win: false, lose: false, cont: false, assign: null, respot8: false, potted: objs.filter((i) => i !== 8), own: 0 };
    if (ev.first < 0) r.foul = true;
    else if (!st.brk && !legal.includes(ev.first)) { r.foul = true; r.wrong = true; }
    if (scratch) r.foul = true;
    if (pk.includes(8)) {
      if (st.brk) r.respot8 = true;
      else if (onEight && !r.foul) { r.win = true; return r; }
      else { r.lose = true; return r; }
    }
    let myG = g;
    if (!g && !st.brk && !r.foul) {
      const firstPot = objs.find((i) => i !== 8);
      if (firstPot) { myG = isS(firstPot) ? 'S' : 'T'; r.assign = myG; }
    }
    if (myG) r.own = objs.filter((i) => (myG === 'S' ? isS(i) : isT(i))).length;
    else r.own = objs.filter((i) => i !== 8).length;   // 열린 테이블(브레이크): 아무 공이나
    r.cont = !r.foul && r.own > 0;
    return r;
  };
})();
