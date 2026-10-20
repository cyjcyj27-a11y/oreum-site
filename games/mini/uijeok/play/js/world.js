// 판(레벨) 지도: 방 하나 = 가로 10칸 × 세로 3층, 칸 32×56 점. 지도 글자 하나가 칸 하나.
//  ' ' 빈칸   '-' 바닥   '#' 돌벽   '^' 불 기둥(때맞춰 솟음)   'v' 죽창 구덩이   '~' 썩은 마루(무너짐)   '%' 돌절구(내려찍음)
//  '>' '<' 화살 구멍(그쪽으로 화살을 쏜다, 웅크리면 피함)
//  'A'~'D' 쇠창살 문, 'a'~'d' 그 문을 여는 발판   'E' 나가는 문   'z' 나가는 문을 여는 발판(있으면 문이 닫혀 시작)
//  '+' 작은 물약(체력 1)   '*' 큰 물약(최대 체력 +1)   '$' 보석   'Y' 칼   'S' 시작 자리
//  'G' 경비병   'K' 해골   'V' 재상   'W' 공주   (이 글자들 칸은 바닥이 있다)
(function () {
  const W = (window.WORLD = {});
  const TW = (W.TW = 32), RH = (W.RH = 56), SURF = (W.SURF = 50), RC = (W.RC = 10), RR = (W.RR = 3);
  const FLOORS = '-^v~%<>aAbBcCdDzE+*$YSGKVWr=';
  let grid = [], NC = 0, NR = 0;
  W.state = null;
  W.load = function (def) {
    NR = def.map.length; NC = Math.max(...def.map.map((s) => s.length));
    NC = Math.ceil(NC / RC) * RC; NR = Math.ceil(NR / RR) * RR;
    grid = [];
    const S = (W.state = { gates: {}, loose: {}, items: [], spawns: [], start: null, exit: null, exitPlate: false, falling: [], rubble: {}, t: 0, def, shooters: [], arrows: [] });
    for (let r = 0; r < NR; r++) {
      const row = [], src = def.map[r] || '';
      for (let c = 0; c < NC; c++) {
        let ch = src[c] || ' ';
        if ('+*$Y'.includes(ch)) { S.items.push({ c, r, k: ch, got: false }); ch = '-'; }
        if ('GKVW'.includes(ch)) { S.spawns.push({ c, r, k: ch }); ch = '-'; }
        if (ch === 'S') { S.start = { c, r }; ch = '-'; }
        if (ch === 'E') S.exit = { c, r, open: 1 };
        if (ch === 'z') S.exitPlate = true;
        if (ch >= 'A' && ch <= 'D') S.gates[c + ',' + r] = { c, r, id: ch.toLowerCase(), open: 0, timer: 0 };
        if (ch === '~') S.loose[c + ',' + r] = { c, r, shake: 0, gone: false };
        if (ch === '>' || ch === '<') S.shooters.push({ c, r, d: ch === '>' ? 1 : -1, off: (c * 0.71 + r * 0.43) % 2.2, n: -1 });
        row.push(ch);
      }
      grid.push(row);
    }
    if (S.exit && S.exitPlate) S.exit.open = 0;
    W.NC = NC; W.NR = NR; W.RX = NC / RC; W.RY = NR / RR;
    return S;
  };
  const at = (W.at = (c, r) => (r >= NR || r < 0 ? ' ' : c < 0 || c >= NC ? '#' : grid[r][c]));   // 지도 아래는 끝없는 낭떠러지
  W.setCell = (c, r, ch) => { if (c >= 0 && r >= 0 && c < NC && r < NR) grid[r][c] = ch; };
  W.solid = (c, r) => at(c, r) === '#';
  // 이 칸 바닥 위에 설 수 있나(돌벽 윗면도 바닥)
  W.floor = (c, r) => { const ch = at(c, r); if (ch === '#') return false; if (FLOORS.includes(ch)) return true; return at(c, r + 1) === '#'; };
  W.surf = (r) => r * RH + SURF;            // 층 r 바닥 높이(세계 좌표)
  W.col = (x) => Math.floor(x / TW);
  W.row = (y) => Math.floor((y - SURF + RH - 1) / RH);    // 발 높이 y 가 서 있는 층(바닥 바로 위면 그 층)
  W.gateAt = (c, r) => W.state.gates[c + ',' + r];
  // 문이 막고 있나(가로 이동). 문은 칸 가운데 세로 막대
  W.gateBlocks = (c, r) => { const g = W.gateAt(c, r); return g && g.open < 0.72; };
  W.isExit = (c, r) => W.state.exit && W.state.exit.c === c && W.state.exit.r === r;

  // 함정 시간: 가시는 2.4초마다 0.9초 솟음, 칼날은 1.8초마다 0.28초 닫힘. 칸마다 시작이 조금 다르다
  W.spikeK = (c, r, t) => { const ph = (t + c * 0.37 + r * 0.61) % 2.4; return ph < 0.12 ? ph / 0.12 : ph < 0.9 ? 1 : ph < 1.05 ? 1 - (ph - 0.9) / 0.15 : 0; };
  W.chopK = (c, r, t) => { const ph = (t + c * 0.29 + r * 0.53) % 2.2; return ph < 0.12 ? (ph / 0.12) * (ph / 0.12) : ph < 0.42 ? 1 : ph < 1.5 ? 1 - (ph - 0.42) / 1.08 : 0; };

  // 발판을 밟으면 짝 문이 열린다(열린 채 몇 초 버티고 천천히 닫힌다)
  W.press = function (c, r) {
    const ch = at(c, r), S = W.state;
    if (ch >= 'a' && ch <= 'd') {
      let any = false;
      for (const k in S.gates) { const g = S.gates[k]; if (g.id === ch) { if (g.open < 0.98 || g.timer < S.def.gateT - 0.5) any = true; g.timer = S.def.gateT || 9; g.target = 1; } }
      S.pressed = S.pressed || {}; const was = S.pressed[c + ',' + r]; S.pressed[c + ',' + r] = 0.25;
      return any && !was;
    }
    if (ch === 'z' && S.exit && !S.exit.open) { S.exit.opening = true; S.pressed = S.pressed || {}; S.pressed[c + ',' + r] = 0.25; return true; }
    return false;
  };
  W.update = function (dt) {
    const S = W.state; S.t += dt;
    // 화살: 2.2초마다 한 발, 벽·닫힌 문·지도 밖에서 사라진다
    for (const sh of S.shooters) { const n = Math.floor((S.t + sh.off) / 2.2); if (n !== sh.n) { if (sh.n >= 0) { S.arrows.push({ x: sh.c * TW + 16 + sh.d * 10, y: W.surf(sh.r) - 34, d: sh.d, r: sh.r, x0: sh.c * TW + 16 }); if (W.onShoot) W.onShoot(sh); } sh.n = n; } }
    for (let i = S.arrows.length - 1; i >= 0; i--) { const a = S.arrows[i]; a.x += a.d * 150 * dt; const c = Math.floor(a.x / TW); if (W.solid(c, a.r) || (W.gateBlocks(c, a.r) && Math.abs(a.x - (c * TW + 16)) < 4) || c < -1 || c > NC || Math.abs(a.x - a.x0) > TW * 7) S.arrows.splice(i, 1); }
    for (const k in S.gates) {
      const g = S.gates[k];
      if (g.timer > 0) { g.timer -= dt; g.open = Math.min(1, g.open + dt * 1.6); }
      else g.open = Math.max(0, g.open - dt * 0.45);
    }
    if (S.pressed) for (const k in S.pressed) { S.pressed[k] -= dt; if (S.pressed[k] <= 0) delete S.pressed[k]; }
    if (S.exit && S.exit.opening) S.exit.open = Math.min(1, S.exit.open + dt * 0.8);
    // 무너지는 바닥: 흔들리다 떨어진다
    for (const k in S.loose) {
      const L = S.loose[k];
      if (L.gone || !L.shake) continue;
      L.shake += dt;
      if (L.shake > 0.55) {
        L.gone = true; W.setCell(L.c, L.r, ' ');
        S.falling.push({ x: L.c * TW, y: W.surf(L.r), vy: 0, c: L.c });
        if (W.onLooseFall) W.onLooseFall(L);
      }
    }
    for (let i = S.falling.length - 1; i >= 0; i--) {
      const f = S.falling[i];
      f.vy = Math.min(420, f.vy + 900 * dt); const ny = f.y + f.vy * dt;
      const r0 = W.row(f.y), r1 = W.row(ny);
      let landed = false;
      for (let r = r0; r <= r1 + 1; r++) {
        if (r > W.NR + 1) break;
        if (W.surf(r) > f.y && W.surf(r) <= ny && W.floor(f.c, r)) {
          landed = true; f.y = W.surf(r);
          const ch = at(f.c, r);
          if (ch === '~') { const L = S.loose[f.c + ',' + r]; if (L && !L.gone) L.shake = Math.max(L.shake, 0.01); }
          else S.rubble[f.c + ',' + r] = true;
          if (W.onSlabLand) W.onSlabLand(f, r);
          break;
        }
      }
      if (landed || ny > W.NR * RH + 200) S.falling.splice(i, 1); else f.y = ny;
    }
  };
  W.step = function (c, r) { const L = W.state.loose[c + ',' + r]; if (L && !L.gone && !L.shake) { L.shake = 0.01; return true; } return false; };
})();