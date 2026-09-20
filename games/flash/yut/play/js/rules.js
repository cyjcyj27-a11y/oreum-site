// 윷놀이 규칙 엔진 (화면·물리와 무관한 순수 논리. node 로도 시험한다)
// 판: 바깥 20칸(1..20, 20 = 참먹이 = 출발점 자리) + 안쪽 9칸(21..29, 23 = 방/중앙)
//   1..5  오른쪽 아래(출발) → 오른쪽 위(5, 모)
//   6..10 위쪽 → 왼쪽 위(10, 뒷모)
//   11..15 왼쪽 → 왼쪽 아래(15, 찌모)
//   16..19 아래쪽 → 오른쪽 아래(20, 참먹이 = 닿으면 바로 난다)
//   5 → 21 → 22 → 23(방) → 24 → 25 → 15   (모에 서면 지름길)
//   10 → 26 → 27 → 23(방) → 28 → 29 → 20  (뒷모에 서면 지름길)
//   23(방)에 서면 → 28 → 29 → 20
// 말 위치: 0 = 손(아직 안 나감), 1..29 = 판 위, 30 = 났다(OUT)
(function (root) {
  const OUT = 30, HAND = 0, HOME = 20;
  const NAMES = ['빽도', '도', '개', '걸', '윷', '모']; // 인덱스 = 나온 배(평평한 면) 개수, 0 = 모, 빽도는 따로
  const STEPS = { 도: 1, 개: 2, 걸: 3, 윷: 4, 모: 5, 빽도: -1 };

  // 판 좌표(정규화 -1..1). 화면·판 그림이 같이 쓴다
  const POS = {};
  (function () {
    const c = [[1, 1], [1, -1], [-1, -1], [-1, 1]]; // 0/20 오른쪽아래(x+,z+), 5 오른쪽위(x+,z-), 10 왼쪽위, 15 왼쪽아래
    // z 는 화면 아래가 + (플레이어 쪽)
    const corner = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
    for (let side = 0; side < 4; side++) {
      const a = corner[side], b = corner[(side + 1) % 4];
      for (let i = 1; i <= 5; i++) {
        const t = i / 5;
        POS[side * 5 + i] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      }
    }
    POS[23] = [0, 0];
    // 5(1,-1) → 23 → 15(-1,1)
    POS[21] = [2 / 3, -2 / 3]; POS[22] = [1 / 3, -1 / 3]; POS[24] = [-1 / 3, 1 / 3]; POS[25] = [-2 / 3, 2 / 3];
    // 10(-1,-1) → 23 → 20(1,1)
    POS[26] = [-2 / 3, -2 / 3]; POS[27] = [-1 / 3, -1 / 3]; POS[28] = [1 / 3, 1 / 3]; POS[29] = [2 / 3, 2 / 3];
    POS[0] = [1.35, 1.35]; // 손(출발 대기)
  })();

  // 첫 걸음에 갈 곳(서 있는 칸에 따라 지름길)
  function firstNext(n) {
    if (n === HAND) return 1;
    if (n === 5) return 21;
    if (n === 10) return 26;
    if (n === 23) return 28;
    return contNext(n, null);
  }
  // 이어지는 걸음(어디서 왔는지 필요: 방(23)을 지나칠 때)
  function contNext(n, from) {
    if (n === HOME) return OUT;
    if (n === OUT) return OUT;
    if (n === 23) return from === 22 ? 24 : 28;
    if (n === 25) return 15;
    if (n === 27) return 23;
    if (n === 29) return HOME;
    if (n >= 21 && n <= 28) return n + 1;
    return n + 1; // 바깥 1..19
  }
  // 뒷걸음(빽도). from = 마지막에 어디서 왔는지(없으면 바깥길 기준)
  function back(n, from) {
    if (n === HAND || n === OUT) return n;
    if (n === 1) return HAND; // 도에서 빽도 → 손으로(집에 못 들어간 것)
    if (from != null && from !== n) return from;
    if (n === 21) return 5;
    if (n === 26) return 10;
    if (n === 24) return 23;
    if (n === 28) return 23;
    if (n === 15) return 14;
    if (n === HOME) return 19;
    if (n >= 22 && n <= 29) return n - 1;
    return n - 1;
  }

  // n 칸에서 steps 만큼 갔을 때 도착 칸과 지나는 길
  function dest(n, steps, from) {
    if (steps < 0) return { to: back(n, from), path: [back(n, from)] };
    const path = [];
    let cur = n, prev = from == null ? n : from;
    for (let i = 0; i < steps; i++) {
      let nx = i === 0 ? firstNext(cur) : contNext(cur, prev);
      if (nx === HOME) nx = OUT; // 참먹이(출발 자리)에 닿으면 바로 난다
      prev = cur; cur = nx;
      path.push(cur);
      if (cur === OUT) break;
    }
    return { to: cur, path };
  }

  // 던진 결과: flats = 배(평평한 면) 위로 온 개수, backOne = 뒷도 표시 가락만 배로 왔는지
  function throwName(flats, backOne) {
    if (flats === 1 && backOne) return '빽도';
    return ['모', '도', '개', '걸', '윷'][flats];
  }

  // ---------- 게임 상태 ----------
  // teams: [{pieces:[{pos,from}], out:n}]
  function newGame(nTeams) {
    const teams = [];
    for (let t = 0; t < nTeams; t++) {
      teams.push({ pieces: [0, 1, 2, 3].map(() => ({ pos: HAND, from: null })), out: 0 });
    }
    return { teams, turn: 0, n: nTeams };
  }

  // 한 팀에서 움직일 수 있는 선택지. 같은 칸에 있는 말은 하나로 묶인다(업은 말)
  // 결과: [{piece: 대표 말 번호, ids:[말들], from, to, catch: 잡히는 팀들, stack: 업는 말 수, out}]
  function moves(g, team, name) {
    const steps = STEPS[name];
    const T = g.teams[team];
    const res = [];
    const seen = new Set();
    for (let i = 0; i < 4; i++) {
      const p = T.pieces[i];
      if (p.pos === OUT) continue;
      if (p.pos === HAND) {
        if (steps < 0) continue; // 빽도로는 새 말을 못 낸다
        if (seen.has('H')) continue; // 손에 있는 말은 하나로 취급
        seen.add('H');
      } else {
        if (seen.has(p.pos)) continue;
        seen.add(p.pos);
      }
      const d = dest(p.pos, steps, p.from);
      if (steps < 0 && d.to === p.pos) continue;
      const ids = p.pos === HAND ? [i] : T.pieces.map((q, j) => (q.pos === p.pos ? j : -1)).filter((j) => j >= 0);
      const m = { piece: i, ids, from: p.pos, to: d.to, path: d.path, catch: [], stack: 0, out: d.to === OUT };
      if (d.to !== OUT && d.to !== HAND) {
        for (let t = 0; t < g.n; t++) {
          if (t === team) continue;
          const c = g.teams[t].pieces.filter((q) => q.pos === d.to).length;
          if (c) m.catch.push({ team: t, n: c });
        }
        m.stack = T.pieces.filter((q, j) => q.pos === d.to && !ids.includes(j)).length;
      }
      res.push(m);
    }
    return res;
  }

  // 수를 적용. 돌려주는 것: { caught:true/false, out:n(난 말 수), again: 한 번 더 던지나 }
  function apply(g, team, m, name) {
    const T = g.teams[team];
    const prev = m.from;
    let caught = false;
    for (const id of m.ids) {
      const p = T.pieces[id];
      p.from = m.to === OUT ? null : (m.path.length >= 2 ? m.path[m.path.length - 2] : (m.path.length === 1 && STEPS[name] > 0 ? prev : null));
      if (STEPS[name] < 0) p.from = null;
      p.pos = m.to;
      if (m.to === OUT) T.out++;
    }
    if (m.to !== OUT && m.to !== HAND) {
      for (const c of m.catch) {
        for (const q of g.teams[c.team].pieces) if (q.pos === m.to) { q.pos = HAND; q.from = null; caught = true; }
      }
    }
    const again = caught || name === '윷' || name === '모';
    return { caught, again, won: T.out === 4 };
  }

  // 판 위에 말이 하나도 없나(빽도가 나왔을 때 그냥 넘김)
  function anyOnBoard(g, team) {
    return g.teams[team].pieces.some((p) => p.pos > HAND && p.pos < OUT);
  }

  // ---------- 상대(CPU) ----------
  // 남은 거리: 그 칸에서 나가기까지 최소 걸음 수(지름길 반영)
  const DIST = {};
  (function () {
    // 바깥길 n → OUT = 20 - n (19 → 1). 참먹이에 닿으면 바로 난다
    for (let n = 1; n <= 19; n++) DIST[n] = 20 - n;
    DIST[HOME] = 0;
    DIST[5] = 6; DIST[21] = 5; DIST[22] = 4; DIST[23] = 3; DIST[28] = 2; DIST[29] = 1; // 5→21,22,23,28,29,OUT
    DIST[24] = 7; DIST[25] = 6; // 24→25→15→16..19→OUT
    DIST[10] = 6; DIST[26] = 5; DIST[27] = 4; // 10→26,27,23,28,29,OUT
    DIST[HAND] = 20;
    DIST[OUT] = 0;
  })();

  // 상대 말이 dist 뒤에 있으면 다음 차례에 잡힐 확률(도1 개2 걸3 윷4 모5 대략)
  const HIT = { 1: 0.16, 2: 0.36, 3: 0.32, 4: 0.13, 5: 0.06 };
  function danger(g, team, node) {
    if (node <= HAND || node >= OUT) return 0;
    let d = 0;
    for (let t = 0; t < g.n; t++) {
      if (t === team) continue;
      for (const q of g.teams[t].pieces) {
        if (q.pos === OUT) continue;
        for (let s = 1; s <= 5; s++) {
          if (dest(q.pos, s, q.from).to === node) { d = Math.max(d, HIT[s] * (q.pos === HAND ? 0.7 : 1)); break; }
        }
      }
    }
    return d;
  }

  // level 1(초보)~12(고수). 초보는 잡을 기회·위험을 "못 보고" 지나치는 식으로 약하다
  function pick(g, team, name, level, rnd) {
    rnd = rnd || Math.random;
    const ms = moves(g, team, name);
    if (!ms.length) return null;
    const see = Math.min(1, 0.35 + level * 0.06); // 볼 확률
    const scored = ms.map((m) => {
      let s = 0;
      const gain = DIST[m.from] - (m.to === OUT ? 0 : DIST[m.to]);
      s += gain * 1.0 * m.ids.length;
      if (m.out) s += 6;
      if (m.catch.length && rnd() < see) s += 9 + 5 * m.catch.reduce((a, c) => a + c.n, 0);
      if (m.stack && rnd() < see) s += 2.5; // 업으면 빨라진다(위험도 커지지만)
      if (rnd() < see) s -= danger(g, team, m.to) * 14 * (m.ids.length + m.stack);
      if (m.from !== HAND && rnd() < see) s += danger(g, team, m.from) * 8 * m.ids.length; // 위험한 자리에서 벗어남
      if (m.to === 23 || m.to === 5 || m.to === 10) s += 1.5; // 지름길 입구
      if (m.from === HAND) s += 0.5; // 말 늘리기는 약간 좋게
      s += (rnd() - 0.5) * (2.6 - level * 0.18);
      return { m, s };
    });
    scored.sort((a, b) => b.s - a.s);
    return scored[0].m;
  }

  root.YUT = { OUT, HAND, HOME, POS, STEPS, NAMES, dest, throwName, newGame, moves, apply, anyOnBoard, pick, DIST, danger, firstNext, contNext, back };
})(typeof window !== 'undefined' ? window : globalThis);
