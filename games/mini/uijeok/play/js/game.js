// 게임 본체: 왕자·적의 움직임, 함정, 방 넘기기, 입력
(function () {
  const G = (window.G = {});
  const W = WORLD, TW = W.TW, RH = W.RH;
  const P = PX.POSE;
  const RUN = 100, ACC = 760, GJ = 420, GF = 620, VMAX = 410, BWH = 6;
  const HANG_HAND = PX.fk(P.hang).fhd[1];          // 매달렸을 때 손이 발보다 얼마나 위인가(음수)
  G.HANG_HAND = HANG_HAND;
  const au = (n, v) => { if (window.AU) AU.play(n, v); };
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const cellRow = (py) => Math.floor((py + 6) / RH);

  // ---------------- 입력 ----------------
  const I = (G.I = { l: 0, r: 0, u: 0, d: 0, atk: 0, blk: 0, jmp: 0, pu: 0, pd: 0, patk: 0, pblk: 0, pjmp: 0 });
  const KEYS = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd',
    Space: 'jmp', KeyZ: 'atk', KeyJ: 'atk', ControlLeft: 'atk', ControlRight: 'atk', Enter: 'atk', KeyX: 'blk', KeyK: 'blk', ShiftLeft: 'blk', ShiftRight: 'blk' };
  G.key = function (code, down) {
    const k = KEYS[code]; if (!k) return false;
    if (down && !I[k]) { if (k === 'u') I.pu = 1; if (k === 'd') I.pd = 1; if (k === 'atk') I.patk = 1; if (k === 'blk') I.pblk = 1; if (k === 'jmp') I.pjmp = 1; }
    I[k] = down ? 1 : 0; return true;
  };
  G.press = function (k, down) {     // 터치 단추
    if (down && !I[k]) { if (k === 'u') I.pu = 1; if (k === 'd') I.pd = 1; if (k === 'atk') I.patk = 1; if (k === 'blk') I.pblk = 1; if (k === 'jmp') I.pjmp = 1; }
    I[k] = down ? 1 : 0;
  };
  const clearPress = () => { I.pu = I.pd = I.patk = I.pblk = I.pjmp = 0; };

  // ---------------- 인물 ----------------
  function actor(kind, c, r, f) {
    const look = kind === 'prince' ? PX.LOOKS.prince : kind === 'K' ? PX.LOOKS.skel : kind === 'V' ? PX.LOOKS.vizier : kind === 'W' ? PX.LOOKS.princess : G.lv.guardLook || PX.LOOKS.guard;
    return { kind, look, x: c * TW + 16, y: W.surf(r), f: f || 1, st: 'stand', t: 0, vx: 0, vy: 0, hp: 3, maxhp: 3, sword: 0, pose: P.stand, from: null, bl: 0, apex: 0, noGrab: 0, alive: true, fs: 'idle', ft: 0, tint: 0, cool: 1 };
  }
  function setSt(a, st) { if (a.st === st) return; a.from = a.pose; a.bl = 0.09; a.st = st; a.t = 0; }
  G.setSt = setSt;
  const rowOf = (a) => W.row(a.y);
  const colOf = (a) => W.col(a.x);
  const onFloor = (a) => { const r = rowOf(a); return Math.abs(a.y - W.surf(r)) < 0.5 && W.floor(colOf(a), r); };

  // 가로 이동: 돌벽·닫힌 문에서 멈춘다. 부딪히면 true
  function moveX(a, dx) {
    if (!dx) return false;
    let nx = a.x + dx, hit = false;
    const rows = a.st === 'hang' || a.st === 'climb' ? [cellRow(a.y - 4)] : [cellRow(a.y - 3), cellRow(a.y - 32)];
    const s = Math.sign(dx);
    const front = nx + s * BWH, fc = Math.floor(front / TW);
    for (const rr of rows) if (W.solid(fc, rr)) { nx = s > 0 ? fc * TW - BWH - 0.01 : (fc + 1) * TW + BWH + 0.01; hit = true; }
    for (const rr of rows) {
      const c0 = Math.floor((a.x) / TW) - 1, c1 = Math.floor((a.x) / TW) + 1;
      for (let gc = c0; gc <= c1; gc++) {
        if (!W.gateBlocks(gc, rr)) continue;
        const line = gc * TW + 16;
        if (s > 0 && a.x + BWH <= line + 0.5 && nx + BWH > line) { nx = line - BWH; hit = true; }
        if (s < 0 && a.x - BWH >= line - 0.5 && nx - BWH < line) { nx = line + BWH; hit = true; }
      }
    }
    a.x = nx; return hit;
  }
  G.moveX = moveX;
  // 앞 칸이 어떤가: 'wall' | 'edge' | 'floor'. bx = 이 칸과 앞 칸 경계
  function ahead(a, d) {
    const c = colOf(a), r = rowOf(a), nc = c + d, bx = d > 0 ? (c + 1) * TW : c * TW;
    if (W.solid(nc, r) || W.gateBlocks(nc, r) || (W.gateBlocks(c, r) && (d > 0 ? a.x < c * TW + 16 : a.x > c * TW + 16))) return { k: 'wall', bx };
    if (!W.floor(nc, r)) return { k: 'edge', bx };
    return { k: 'floor', bx };
  }
  // 바라보는 쪽으로 가장자리까지 거리(네 칸 안, 벽이 먼저면 없음)
  function edgeDist(a) {
    const c = colOf(a), r = rowOf(a);
    for (let k = 1; k <= 4; k++) {
      const nc = c + a.f * k;
      if (W.solid(nc, r) || W.gateBlocks(nc, r)) return null;
      if (!W.floor(nc, r)) { const bx = a.f > 0 ? nc * TW : (nc + 1) * TW; return Math.abs(bx - a.x); }
    }
    return null;
  }
  // 위로 뛰어 잡을 턱(앞쪽 위 칸)
  function grabAbove(a) {
    const c = colOf(a), r = rowOf(a), f = a.f;
    if (W.floor(c, r - 1) || W.solid(c, r - 1)) return null;
    const lc = c + f;
    if (!W.floor(lc, r - 1) || W.solid(lc, r - 1)) return null;
    const bx = f > 0 ? (c + 1) * TW : c * TW;
    if (Math.abs(a.x - (bx - f * 5)) > 34) return null;
    return { bx, lr: r - 1, lc };
  }
  // 아래로 내려 매달릴 수 있나(서 있는 칸 옆이 빈칸)
  function lowerSpot(a) {
    const c = colOf(a), r = rowOf(a);
    for (const d of [a.f, -a.f]) {
      const nc = c + d, bx = d > 0 ? (c + 1) * TW : c * TW;
      if (W.floor(nc, r) || W.solid(nc, r)) continue;
      if (Math.abs(a.x - bx) > 10) continue;
      return { d, bx, lr: r, lc: c };
    }
    return null;
  }
  // 떨어지는 중 앞 턱을 손으로 잡나
  function airGrab(a, prevY) {
    if (a.noGrab > 0 || a.vy <= 0) return null;
    const f = a.f, bx = Math.round(a.x / TW) * TW;
    if (Math.abs(a.x - (bx - f * 5)) > 11) return null;
    const lc = f > 0 ? bx / TW : bx / TW - 1, bc = lc - f;
    const h0 = prevY + HANG_HAND, h1 = a.y + HANG_HAND;
    for (let lr = W.row(h0) - 1; lr <= W.row(h1) + 1; lr++) {
      const s = W.surf(lr);
      if (!(h0 <= s + 2 && h1 >= s - 1)) continue;
      if (!W.floor(lc, lr) || W.solid(lc, lr)) continue;
      if (W.floor(bc, lr) || W.solid(bc, lr)) continue;
      return { bx, lr, lc };
    }
    return null;
  }
  function startHang(a, gr) {
    a.hang = gr; a.x = gr.bx - a.f * 5; a.y = W.surf(gr.lr) - HANG_HAND; a.vx = a.vy = 0; setSt(a, 'hang');
    W.step(gr.lc, gr.lr);
    au('grab');
  }
  function startAir(a, vx, vy, jump) {
    a.vx = vx; a.vy = vy; a.apex = a.y; a.jumping = jump; setSt(a, jump ? 'leap' : 'fall');
  }
  G.actor = actor;
  G.rowOf = rowOf; G.colOf = colOf; G.onFloor = onFloor;
  // ---------------- 왕자 ----------------
  function landOn(a, r) {
    a.y = W.surf(r); const drop = a.y - a.apex; a.vy = 0; a.vx = 0;
    const c = colOf(a);
    if (W.step(c, r)) au('crack');
    if (drop > 100) { kill(a, 'splat'); return; }          // 한 층 넘게 떨어지면 죽는다(매달렸다 놓는 두 층은 괜찮다)
    if (drop > 60) { setSt(a, 'landHard'); au('landHard'); G.shake = 0.2; return; }
    setSt(a, 'land'); au(drop > 40 ? 'land' : 'step');
  }
  function airStep(a, dt) {
    const g = a.jumping ? GJ : GF;
    const py = a.y;
    a.vy = Math.min(VMAX, a.vy + g * dt);
    if (moveX(a, a.vx * dt)) a.vx = 0;
    let ny = a.y + a.vy * dt;
    // 머리 박기
    if (a.vy < 0 && W.solid(colOf(a), cellRow(ny - 38))) { a.vy = 0; ny = a.y; }
    a.y = ny; if (a.y < a.apex) a.apex = a.y;
    if (a === G.pr && a.jumping) {          // 뛰어서 날아갈 때만 턱을 잡는다. 걸어 나가거나 무너져 떨어지면 그대로 떨어진다
      const gr = airGrab(a, py);
      if (gr) { startHang(a, gr); return; }
    }
    // 바닥 닿기
    if (a.vy > 0) {
      const r0 = W.row(py), r1 = W.row(a.y);
      for (let r = r0; r <= r1; r++) {
        const s = W.surf(r);
        if (py < s - 0.001 && a.y >= s) {           // 막 걸어 나간 그 바닥(py == s)에는 다시 서지 않는다
          // 발 앞뒤 3점 안에 바닥이 있으면 선다(가장자리에 걸치면 안쪽으로 당김)
          const c = colOf(a);
          if (W.floor(c, r)) { landOn(a, r); return; }
          const c2 = W.col(a.x + 3), c3 = W.col(a.x - 3);
          if (W.floor(c2, r)) { a.x = c2 * TW + 1; landOn(a, r); return; }
          if (W.floor(c3, r)) { a.x = c3 * TW + TW - 1; landOn(a, r); return; }
        }
      }
    }
    if (a.y > W.NR * RH + 80) kill(a, 'pit');
  }
  function hurt(a, n, why) {
    if (!a.alive) return;
    a.hp -= n; a.tint = 0.25;
    if (a === G.pr) { G.shake = Math.max(G.shake, 0.15); au('hurt'); if (G.onHp) G.onHp(); }
    if (a.hp <= 0) kill(a, why);
  }
  function kill(a, why) {
    if (!a.alive) return;
    a.alive = false; a.hp = 0; a.why = why; a.vx = 0; setSt(a, 'dead');
    if (a === G.pr) { au(why === 'spike' || why === 'chop' ? 'slice' : 'die'); G.shake = 0.35; if (G.onHp) G.onHp(); }
    else { au('enemyDie'); G.stats.kills++; }
  }
  G.hurt = hurt; G.kill = kill;

  // 공격 키: 칼을 뽑으며 바로 휘두른다(앞에 적이 있으면 맞는다)
  function swingNow(a) { setSt(a, 'fight'); a.fs = 'wind'; a.windT = 0.09; a.ft = 0; a.solo = 0; au('draw'); }
  function updatePrince(a, dt) {
    a.t += dt; if (a.noGrab > 0) a.noGrab -= dt;
    const dir = (I.r ? 1 : 0) - (I.l ? 1 : 0);
    const wantJump = I.pu || I.pjmp;
    const st = a.st;
    const foe = G.foe;
    if (st === 'dead') return;
    // 칼싸움 들어가기
    if (foe && a.sword && (st === 'stand' || st === 'run' || st === 'skid' || st === 'teeter' || st === 'land')) { setSt(a, 'fight'); a.fs = 'draw'; a.ft = 0; a.f = Math.sign(foe.x - a.x) || a.f; a.vx = 0; au('draw'); return; }
    if (st === 'stand' || st === 'teeter' || st === 'land' || st === 'crouch') {
      if (st === 'land' && a.t < 0.12) return;
      if (st === 'crouch') { if (!I.d) setSt(a, 'stand'); return; }
      if (I.patk && a.sword) { swingNow(a); return; }
      if (I.pd || (I.d && st !== 'teeter')) {
        const ls = lowerSpot(a);
        if (ls) { a.f = -ls.d; a.low = { x0: a.x, y0: a.y, gr: { bx: ls.bx, lr: ls.lr, lc: ls.lc } }; setSt(a, 'lower'); return; }
        setSt(a, 'crouch'); return;
      }
      if (wantJump) {
        if (dir && dir !== a.f) { a.f = dir; }
        if (dir || I.pjmp && !I.pu) { setSt(a, 'leapPrep'); a.leapV = 76; return; }
        setSt(a, 'jumpPrep'); return;
      }
      if (dir) {
        if (dir !== a.f) { setSt(a, 'turn'); return; }
        const ah = ahead(a, a.f);
        if (ah.k === 'wall' && Math.abs(ah.bx - a.x) < 7) return;          // 가장자리는 막지 않는다: 계속 누르면 떨어진다
        a.jbuf = 0; setSt(a, 'run'); return;
      }
      if (st === 'teeter' && a.t > 0.7) setSt(a, 'stand');
      return;
    }
    if (st === 'turn') { if (a.t > 0.13) { a.f = -a.f; setSt(a, dir === a.f ? 'run' : 'stand'); } return; }
    if (st === 'run') {
      if (I.patk && a.sword) { a.vx = 0; swingNow(a); return; }
      if (I.d) { a.vx = 0; setSt(a, 'crouch'); return; }
      if (wantJump) a.jbuf = 0.35;
      if (a.jbuf > 0) a.jbuf -= dt;
      if (dir !== a.f) { setSt(a, 'skid'); a.skidTurn = dir === -a.f; return; }
      a.vx = clamp(a.vx + a.f * ACC * dt, -RUN, RUN);
      const ah = ahead(a, a.f);
      // 가장자리: 미리 누른 점프면 거기서 뛴다. 아니면 그대로 달려 나가 떨어진다
      if (ah.k === 'edge') {
        const stopX = ah.bx - a.f * 3;
        if (a.jbuf > 0 && (a.f > 0 ? a.x + a.vx * dt >= stopX - 10 : a.x + a.vx * dt <= stopX + 10)) { a.jbuf = 0; startAir(a, a.f * 140, -125, true); au('jump'); return; }
        if (a.jbuf > 0) a.jbuf = Math.max(a.jbuf, 0.1);          // 가장자리까지 예약을 들고 간다
      } else if (a.jbuf > 0) {
        // 앞 세 칸 안에 가장자리가 없으면(속도가 붙었을 때) 그 자리에서 뛰고, 있으면 가장자리까지 달려가서 뛴다
        if (edgeDist(a) != null) a.jbuf = Math.max(a.jbuf, 0.1);
        else if (Math.abs(a.vx) > 70) { a.jbuf = 0; startAir(a, a.f * 140, -125, true); au('jump'); return; }
      }
      if (moveX(a, a.vx * dt)) { a.vx = 0; setSt(a, 'stand'); au('bump'); return; }
      a.runPh = (a.runPh || 0) + Math.abs(a.vx) * dt / 40;
      const c = colOf(a), r = rowOf(a);
      if (!W.floor(c, r)) { startAir(a, a.vx * 0.6, 0, false); return; }
      if (W.step(c, r)) au('crack');
      const k = Math.floor(a.runPh * 2); if (k !== a.stepK) { a.stepK = k; au('step', 0.5); }
      return;
    }
    if (st === 'skid') {
      a.vx -= Math.sign(a.vx) * 520 * dt; if (Math.abs(a.vx) < 8) a.vx = 0;
      const ah = ahead(a, a.f);
      if (ah.k === 'edge' && (a.f > 0 ? a.x + a.vx * dt > ah.bx - 3 : a.x + a.vx * dt < ah.bx + 3)) { a.x = ah.bx - a.f * 3; a.vx = 0; if (!a.skidTurn) { setSt(a, 'teeter'); au('teeter'); return; } }
      moveX(a, a.vx * dt);
      if (a.vx === 0 || a.t > 0.3) { a.vx = 0; if (a.skidTurn) setSt(a, 'turn'); else setSt(a, 'stand'); }
      return;
    }
    if (st === 'leapPrep') {
      // 가장자리 바로 앞(한 걸음 안)이면 준비하는 동안 가장자리까지 다가가서 뛴다
      const ah = ahead(a, a.f), stopX = ah.bx - a.f * 3;
      if (ah.k === 'edge' && Math.abs(stopX - a.x) < 26) a.x += clamp(stopX - a.x, -260 * dt, 260 * dt);
      if (a.t > 0.1) { startAir(a, a.f * a.leapV, -125, true); au('jump'); }
      return;
    }
    if (st === 'jumpPrep') {
      // ↑를 ←→보다 살짝 먼저 눌러도 앞으로 뛰는 점프로 바꾼다(10/20 도깨비굴 틈)
      if (dir) { a.f = dir; setSt(a, 'leapPrep'); a.leapV = 76; return; }
      if (a.t > 0.16) {
        const gr = grabAbove(a);
        if (gr) { a.jg = { x0: a.x, y0: a.y, gr }; setSt(a, 'jumpGrab'); au('jump'); }
        else { startAir(a, 0, -125, false); au('jump'); }
      }
      return;
    }
    if (st === 'jumpGrab') {
      const k = Math.min(1, a.t / 0.24), e = 1 - (1 - k) * (1 - k), gr = a.jg.gr;
      a.x = a.jg.x0 + (gr.bx - a.f * 5 - a.jg.x0) * e; a.y = a.jg.y0 + (W.surf(gr.lr) - HANG_HAND - a.jg.y0) * e;
      if (k >= 1) startHang(a, gr);
      return;
    }
    if (st === 'leap' || st === 'fall') { airStep(a, dt); return; }
    if (st === 'hang') {
      const gr = a.hang;
      if (!W.floor(gr.lc, gr.lr)) { a.noGrab = 0.3; startAir(a, 0, 0, false); return; }   // 잡은 바닥이 무너짐
      if (I.u || I.pjmp) {
        if (!W.solid(gr.lc, gr.lr - 1) || true) { a.cl = { x0: a.x, y0: a.y, x1: gr.bx + a.f * 8, y1: W.surf(gr.lr) }; setSt(a, 'climb'); au('climb'); }
        return;
      }
      if (I.pd || I.d && a.t > 0.25) { a.noGrab = 0.3; startAir(a, 0, 0, false); a.apex = a.y; return; }
      return;
    }
    if (st === 'climb') {
      const k = Math.min(1, a.t / 0.8), cl = a.cl;
      const ky = PX.ease(Math.min(1, k / 0.62)), kx = PX.ease((k - 0.3) / 0.5);
      a.x = cl.x0 + (cl.x1 - cl.x0) * kx; a.y = cl.y0 + (cl.y1 - cl.y0) * ky;
      if (k >= 1) { a.x = cl.x1; a.y = cl.y1; setSt(a, 'stand'); W.step(colOf(a), rowOf(a)); }
      return;
    }
    if (st === 'lower') {
      const k = Math.min(1, a.t / 0.55), L = a.low, gr = L.gr;
      const x1 = gr.bx - a.f * 5, y1 = W.surf(gr.lr) - HANG_HAND;
      const ky = PX.ease((k - 0.25) / 0.75), kx = PX.ease(Math.min(1, k / 0.6));
      a.x = L.x0 + (x1 - L.x0) * kx; a.y = L.y0 + (y1 - L.y0) * ky;
      if (k >= 1) { a.hang = gr; a.x = x1; a.y = y1; setSt(a, 'hang'); }
      return;
    }
    if (st === 'landHard') { if (a.t > 0.5) setSt(a, 'stand'); return; }
    if (st === 'drink') { if (a.t > 0.9) setSt(a, 'stand'); return; }
    if (st === 'victory') { if (a.t > 1.1) setSt(a, 'stand'); return; }
    if (st === 'fight') { fence(a, dt, true); return; }
  }
  // ---------------- 칼싸움(왕자·적 같이 씀) ----------------
  function setFs(a, fs) { a.from = a.pose; a.bl = 0.07; a.fs = fs; a.ft = 0; }
  function canStep(a, d) {
    const ah = ahead(a, d), nx = a.x + d * 17;
    if (ah.k === 'floor') return true;
    return d > 0 ? nx + (ah.k === 'wall' ? BWH : 3) <= ah.bx : nx - (ah.k === 'wall' ? BWH : 3) >= ah.bx;
  }
  function strikeHit(a, o) {
    if (!o) { au('swish'); return; }
    const d = o.x - a.x, dist = Math.abs(d);
    if (!o.alive || Math.sign(d) !== a.f || dist > 37 || Math.abs(o.y - a.y) > 8) { au('swish'); return; }
    if (o.fs === 'block' && o.f === -a.f) {
      setFs(a, 'parried'); o.riposte = 0.45; if (o !== G.pr) o.ft = 0.3; au('clang'); G.spark = { x: (a.x + o.x) / 2, y: a.y - 30, t: 0.18 };
      if (o === G.pr) G.stats.parries++;
      return;
    }
    au('hit');
    G.spark = { x: o.x - a.f * 2, y: a.y - 26, t: 0.12, red: 1 };
    hurt(o, 1, 'sword');
    if (o !== G.pr) o.streak = (o.streak || 0) + 1;
    if (o.alive) { setFs(o, 'hurt'); knock(o, a.f * (o.kind === 'K' ? 22 : 11)); }
    else if (o !== G.pr) { o.deadVx = a.f * 30; }
  }
  // 밀려나기: 가장자리 너머로 밀리면 떨어진다
  function knock(o, dx) {
    const ah = ahead(o, Math.sign(dx));
    moveX(o, dx);
    if (ah.k === 'edge' && (dx > 0 ? o.x > ah.bx + 2 : o.x < ah.bx - 2)) { o.fs = 'idle'; startAir(o, Math.sign(dx) * 22, -30, false); if (o !== G.pr) o.falling = true; au('fallScream'); }
  }
  function fence(a, dt, isP) {
    const o = isP ? G.foe : G.pr;
    a.ft += dt;
    if (isP && (!o || !o.alive)) {
      // 상대 없이도 공격 키로 칼을 휘두른다. 다 휘두른 뒤 잠깐 칼을 든 채 있다가, 움직이거나 1.2초 지나면 넣는다
      if (a.fs === 'idle' || a.fs === 'draw' || a.fs === 'step' || a.fs === 'block' || a.fs === 'parried' || a.fs === 'hurt') {
        a.solo = (a.solo || 0) + dt;
        if (I.patk) { setFs(a, 'wind'); a.windT = 0.07; a.solo = 0; return; }
        const d2 = (I.r ? 1 : 0) - (I.l ? 1 : 0);
        if (d2 || I.pu || I.pd || a.solo > 1.2) { a.fs = 'idle'; setSt(a, 'stand'); au('sheath'); }
        return;
      }
      a.solo = 0;
    }
    if (!isP && (!o.alive || o.st !== 'fight' && Math.abs(o.x - a.x) > 60)) {}
    if (o && (a.fs === 'idle' || a.fs === 'step' || a.fs === 'draw')) { const s = Math.sign(o.x - a.x); if (s) a.f = s; }
    const dir = isP ? (I.r ? 1 : 0) - (I.l ? 1 : 0) : 0;
    switch (a.fs) {
      case 'draw': if (a.ft > 0.22) setFs(a, 'idle'); break;
      case 'idle':
        if (isP) {
          if (I.patk) { setFs(a, 'wind'); a.windT = 0.07; }
          else if (I.pblk || I.blk || I.pu || I.u) setFs(a, 'block');
          else if (dir && canStep(a, dir) && !(dir === a.f && o && Math.abs(o.x - a.x) < 27)) { setFs(a, 'step'); a.stepD = dir; a.stepLen = dir === a.f && o ? Math.max(6, Math.min(17, Math.abs(o.x - a.x) - 26)) : 17; }
        } else brain(a, o, dt);
        break;
      case 'step': {
        const v = a.stepD * (a.stepLen || 17) / 0.24;
        if (a.ft < 0.24) { const ah = ahead(a, a.stepD); moveX(a, v * dt); if (ah.k === 'edge') a.x = a.stepD > 0 ? Math.min(a.x, ah.bx - 3) : Math.max(a.x, ah.bx + 3); }
        else setFs(a, 'idle');
        if (isP && I.patk && a.ft > 0.1) { setFs(a, 'wind'); a.windT = 0.07; }
        break;
      }
      case 'wind': if (a.ft > a.windT) { setFs(a, 'strike'); au('swish0'); strikeHit(a, o); } break;
      case 'strike': if (a.ft > 0.14) setFs(a, 'rec'); break;
      case 'rec': if (a.ft > (isP ? 0.16 : 0.26)) setFs(a, 'idle'); break;
      case 'block': if (a.ft > (isP ? 0.3 : 0.4) && !(isP && (I.blk || I.u))) setFs(a, 'idle'); if (isP && I.patk && a.ft > 0.05) { setFs(a, 'wind'); a.windT = 0.05; } break;
      case 'parried': if (a.ft > 0.32) setFs(a, 'idle'); break;
      case 'hurt': if (a.ft > 0.3) { if (!isP && Math.random() < 0.3 + a.skill.pb + (a.streak || 0) * 0.15) { setFs(a, 'block'); a.riposte = 0.5; } else setFs(a, 'idle'); } break;
    }
    if (a.riposte > 0) a.riposte -= dt;
  }
  // 적의 머리: 거리 맞추기, 칼 들기(크게 쳐들어 미리 보여 줌), 막기
  function brain(e, p, dt) {
    const dist = Math.abs(p.x - e.x), sk = e.skill;
    e.cool -= dt;
    if (p.st === 'fight' && p.fs === 'wind') {
      if (!e.decided) { e.decided = true; if (Math.random() < sk.pb + (e.riposte > 0 ? 0.25 : 0) + (e.streak || 0) * 0.15) { setFs(e, 'block'); return; } }
    } else e.decided = false;
    if (p.st !== 'fight' && p.alive && dist > 70) return;
    if (dist > 35 && canStep(e, e.f)) { setFs(e, 'step'); e.stepD = e.f; e.stepLen = Math.max(6, Math.min(17, dist - 29)); return; }
    if (dist < 25 && canStep(e, -e.f)) { setFs(e, 'step'); e.stepD = -e.f; e.stepLen = Math.max(6, Math.min(17, 31 - dist)); return; }
    if (e.riposte > 0 && dist <= 36 && p.alive && p.fs === 'parried') e.cool = 0;
    if (e.cool <= 0 && dist <= 36 && p.alive) { e.streak = 0; setFs(e, 'wind'); e.windT = sk.wind * (e.riposte > 0 ? 0.6 : 1); e.cool = sk.cool * (0.7 + Math.random() * 0.7); au('raise'); }
  }

  // ---------------- 적 ----------------
  const SKILL = [
    { pb: 0.08, wind: 0.46, cool: 1.5, hp: 2 }, { pb: 0.16, wind: 0.42, cool: 1.35, hp: 2 }, { pb: 0.24, wind: 0.38, cool: 1.2, hp: 3 },
    { pb: 0.32, wind: 0.34, cool: 1.1, hp: 3 }, { pb: 0.4, wind: 0.31, cool: 1.0, hp: 4 }, { pb: 0.48, wind: 0.29, cool: 0.95, hp: 4 },
  ];
  function lineClear(a, b) {
    if (rowOf(a) !== rowOf(b)) return false;
    const r = rowOf(a), x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x);
    for (let c = W.col(x0); c <= W.col(x1); c++) {
      if (W.solid(c, r) || !W.floor(c, r)) return false;
      if (W.gateBlocks(c, r)) { const line = c * TW + 16; if (line > x0 && line < x1) return false; }
    }
    return true;
  }
  function updateEnemy(e, dt) {
    e.t += dt;
    if (e.tint > 0) e.tint -= dt;
    const p = G.pr;
    if (e.st === 'dead') { if (e.deadVx) { moveX(e, e.deadVx * dt); e.deadVx *= 0.9; } return; }
    if (e.st === 'fall' || e.st === 'leap') {
      airStep(e, dt);
      if (e.st === 'land' || e.st === 'landHard') { const drop = e.y - e.apex; if (drop > 60 || e.kind !== 'K' && drop > 30) kill(e, 'fall'); else setSt(e, 'fight'); }
      return;
    }
    if (e.kind === 'W') return;
    // 함정은 적도 죽인다
    const c = colOf(e), r = rowOf(e), ch = W.at(c, r);
    if ((ch === '^' && W.spikeK(c, r, W.state.t) > 0.55) || ch === 'v') { kill(e, 'spike'); return; }
    if (ch === '%' && W.chopK(c, r, W.state.t) > 0.75 && Math.abs(e.x - (c * TW + 16)) < 10) { kill(e, 'chop'); return; }
    if (!W.floor(c, r)) { startAir(e, 0, 0, false); return; }
    const sees = p.alive && lineClear(e, p) && Math.abs(p.x - e.x) < 150;
    if (e.st !== 'fight') {
      if (sees) { setSt(e, 'fight'); e.fs = 'draw'; e.ft = 0; e.f = Math.sign(p.x - e.x) || e.f; au('draw'); }
      return;
    }
    if (!sees && e.fs === 'idle') { if (++e.lost > 90) { setSt(e, 'stand'); e.lost = 0; } return; }
    e.lost = 0;
    fence(e, dt, false);
  }

  // ---------------- 판 시작 ----------------
  G.stats = { deaths: 0, kills: 0, gems: 0, potions: 0, parries: 0, time: 0 };
  G.load = function (lv, keep) {
    G.lv = lv;
    // 판마다 적: 앞쪽은 포졸(방망이), 뒤쪽은 무관(갓·환도). 철릭·쾌자 색만 바꾼다
    const GL = { jail: ['guard', null], palace: ['guard', ['#6a5a8a', '#443a64', '#241e3a']], roof: ['guard', ['#3a4a5a', '#24303c', '#121820']],
      cave: ['guard', ['#6a4a3a', '#46302a', '#241812']], ruins: ['officer', ['#5ab08a', '#2f8a5a', '#185030']], temple: ['officer', null] };
    const gl = GL[lv.theme]; lv.guardLook = gl ? PX.guardLook(gl[0], gl[1]) : null;
    const S = W.load(lv);
    RND.theme = RND.THEMES[lv.theme]; RND.themeName = lv.theme; RND.invalidate();
    const pr = (G.pr = actor('prince', S.start.c, S.start.r, lv.face || 1));
    pr.maxhp = keep.maxhp; pr.hp = keep.maxhp; pr.sword = keep.sword ? 1 : 0;
    if (lv.enterFall) { pr.y = W.surf(S.start.r) - 70; startAir(pr, 0, 0, false); pr.apex = pr.y + 40; }
    G.enemies = S.spawns.map((s) => {
      const e = actor(s.k, s.c, s.r, s.c * TW + 16 > pr.x ? -1 : 1);
      const sk = SKILL[Math.min(SKILL.length - 1, (lv.skill || 0))];
      e.skill = s.k === 'V' ? { pb: 0.5, wind: 0.27, cool: 0.85, hp: 10 } : s.k === 'K' ? { pb: 0.3, wind: 0.36, cool: 1.1, hp: 10 } : sk;
      e.hp = e.maxhp = e.skill.hp; e.sword = s.k === 'W' ? 0 : 2; e.home = { x: e.x, y: e.y, f: e.f }; e.lost = 0; e.cool = 0.6;
      return e;
    });
    G.cp = { x: pr.x, y: pr.y, f: pr.f, room: null, hp: pr.hp };
    G.seenRooms = {}; G.foe = null; G.shake = 0; G.spark = null; G.exiting = 0; G.dying = 0; G.lvTime = 0;
    G.room();
  };
  G.room = function () {
    const pr = G.pr, rx = Math.floor(pr.x / (TW * W.RC)), ry = Math.floor(cellRow(pr.y - 20) / W.RR);
    if (rx !== RND.rx || ry !== RND.ry) { RND.rx = rx; RND.ry = ry; if (G.onRoom) G.onRoom(rx, ry); }
  };
  // ---------------- 함정·물건 ----------------
  const GROUNDED = { stand: 1, run: 1, skid: 1, teeter: 1, land: 1, turn: 1, fight: 1, crouch: 1, landHard: 1, jumpPrep: 1, leapPrep: 1 };
  function cellStuff(a) {
    if (!GROUNDED[a.st] || !a.alive) return;
    const c = colOf(a), r = rowOf(a), ch = W.at(c, r);
    // 밟고 선 썩은 마루가 무너지면 서 있어도 떨어진다(10/20 사장님 지적). 썩은 마루 위에 서기만 해도 흔들리기 시작
    if (!W.floor(c, r)) { startAir(a, a.vx * 0.6, 0, false); return; }
    if (ch === '~' && W.step(c, r)) au('crack');
    if ((ch === '^' && W.spikeK(c, r, W.state.t) > 0.55) || ch === 'v') { kill(a, 'spike'); return; }
    if (ch === '%' && W.chopK(c, r, W.state.t) > 0.75 && Math.abs(a.x - (c * TW + 16)) < 11) { kill(a, 'chop'); return; }
    if (W.press(c, r)) au('gate');
    for (const it of W.state.items) {
      if (it.got || it.c !== c || it.r !== r) continue;
      it.got = true;
      if (it.k === '+') { a.hp = Math.min(a.maxhp, a.hp + 1); G.stats.potions++; au('drink'); G.pop && G.pop(L('약과', '+1'), '#ff7a6a'); setSt(a, 'drink'); }
      else if (it.k === '*') { a.maxhp++; a.hp = a.maxhp; G.stats.potions++; au('lifeup'); G.pop && G.pop(L('산삼', 'LIFE UP'), '#7affa0', 1); setSt(a, 'drink'); G.flash = 0.4; }
      else if (it.k === '$') { G.stats.gems++; G.gotGems.push(G.lvIdx + ':' + c + ',' + r); au('gem'); G.pop && G.pop(L('엽전', 'COINS'), '#f0c058'); }
      else if (it.k === 'Y') { a.sword = 1; au('lifeup'); G.pop && G.pop(L('검', 'SWORD'), '#e8eef8', 1); setSt(a, 'victory'); G.flash = 0.3; }
      if (G.onHp) G.onHp();
    }
    if (W.isExit(c, r) && W.state.exit.open > 0.95 && !G.exiting && a.st !== 'fight') { G.exiting = 0.01; setSt(a, 'exitWalk'); a.vx = 0; au('door'); }
  }
  W.onSlabLand = function (f, r) {
    const p = G.pr; au('crash');
    if (p.alive && rowOf(p) === r && colOf(p) === f.c && GROUNDED[p.st]) { hurt(p, 1, 'slab'); if (p.alive) setSt(p, 'crouch'); }
    for (const e of G.enemies) if (e.alive && rowOf(e) === r && colOf(e) === f.c) hurt(e, 1, 'slab');
  };
  W.onLooseFall = () => au('crumble');
  W.onShoot = (sh) => { if (Math.floor(G.pr.x / (TW * W.RC)) === Math.floor(sh.c / W.RC) && rowOf(G.pr) >= sh.r - 3 && rowOf(G.pr) <= sh.r + 3) au('arrow'); };
  // 화살에 맞나: 의적만 맞는다(적은 제 편 함정이라 화살이 비켜 간다). 웅크리거나 매달렸으면 머리 위로 지나간다
  const LOW = { crouch: 1, landHard: 1, jumpPrep: 1, leapPrep: 1, dead: 1, hang: 1, climb: 1, lower: 1 };
  function arrowHits() {
    const S = W.state;
    for (let i = S.arrows.length - 1; i >= 0; i--) {
      const ar = S.arrows[i];
      for (const a of [G.pr]) {
        if (!a.alive || LOW[a.st] || Math.abs(a.x - ar.x) > 5) continue;
        const top = a.y - 38, bot = a.y - 12;
        if (ar.y < top || ar.y > bot) continue;
        S.arrows.splice(i, 1); hurt(a, 1, 'arrow'); if (a.alive) { a.tint = 0.25; moveX(a, ar.d * 4); } au('hit');
        break;
      }
    }
  }

  // ---------------- 한 틱 ----------------
  G.paused = false;
  G.update = function (dt) {
    const pr = G.pr; if (!pr) return;
    G.stats.time += dt; G.lvTime += dt;
    if (G.ending) G.endT = (G.endT || 0) + dt;
    W.update(dt);
    if (pr.bl > 0) pr.bl -= dt;
    if (pr.tint > 0) pr.tint -= dt;
    // 싸울 상대: 같은 층, 가까운 산 적
    let foe = null, best = 1e9;
    for (const e of G.enemies) { if (!e.alive || e.kind === 'W' || e.st !== 'fight') continue; const d = Math.abs(e.x - pr.x); if (d < 120 && d < best && lineClear(e, pr)) { best = d; foe = e; } }
    G.foe = foe;
    // 칼싸움은 지금 방 안에서: 싸움 자세인 두 사람이 밀려 옆 방으로 넘어가 싸움이 안 보이지 않게(10/20 사또 결투). 낭떠러지로 떨어지는 건 그대로
    if (foe) { const L = RND.rx * 320 + 12, R = RND.rx * 320 + 308; for (const a of [pr, foe]) if (a.alive && a.st === 'fight') { if (a.x < L) a.x = L; else if (a.x > R) a.x = R; } }
    const py = pr.y;
    updatePrince(pr, dt);
    cellStuff(pr);
    for (const e of G.enemies) if (e.alive && GROUNDED[e.st] && e.kind !== 'W' && !W.floor(colOf(e), rowOf(e))) startAir(e, e.vx * 0.6, 0, false);
    arrowHits();
    for (const e of G.enemies) { if (e.bl > 0) e.bl -= dt; updateEnemy(e, dt); }
    clearPress();
    if (pr.st === 'exitWalk') {
      const dx = (W.state.exit.c * TW + 16) - pr.x; pr.x += Math.sign(dx) * Math.min(Math.abs(dx), 40 * dt); if (Math.abs(dx) > 0.5) pr.f = Math.sign(dx);
      G.exiting += dt; if (G.exiting > 1.1 && G.onExit) { const f = G.onExit; G.onExit = null; f(); }
    }
    // 공주에게 닿으면 엔딩
    for (const e of G.enemies) if (e.kind === 'W' && pr.alive && Math.abs(e.x - pr.x) < 22 && rowOf(e) === rowOf(pr) && !G.ending) { G.ending = 1; G.endT = 0; pr.vx = 0; setSt(pr, 'stand'); e.f = Math.sign(pr.x - e.x) || 1; pr.f = -e.f; setSt(e, 'victory'); if (G.onEnding) G.onEnding(); }
    if (!pr.alive) { G.dying += dt; if (G.dying > 1.7 && G.onDeath) { G.dying = -99; G.onDeath(); } }
    // 체크포인트: 새 방에서 땅에 0.3초 서 있으면
    if (pr.alive && (pr.st === 'stand' || pr.st === 'run') && onFloor(pr)) {
      const key = RND.rx + ',' + RND.ry;
      pr.safeT = (pr.safeT || 0) + dt;
      if (!G.seenRooms[key] && pr.safeT > 0.3 && W.at(colOf(pr), rowOf(pr)) !== '~' && W.at(colOf(pr), rowOf(pr)) !== '^' && W.at(colOf(pr), rowOf(pr)) !== '%') { G.seenRooms[key] = 1; G.cp = { x: pr.x, y: pr.y, f: pr.f, hp: Math.max(pr.hp, 1) }; }
    } else pr.safeT = 0;
    G.room();
    if (G.shake > 0) G.shake -= dt;
    if (G.flash > 0) G.flash -= dt;
    if (G.spark) { G.spark.t -= dt; if (G.spark.t <= 0) G.spark = null; }
  };
  G.respawn = function () {
    const pr = G.pr, cp = G.cp;
    G.stats.deaths++;
    pr.alive = true; pr.hp = pr.maxhp; pr.x = cp.x; pr.y = cp.y; pr.f = cp.f; pr.vx = pr.vy = 0; pr.from = null; pr.bl = 0; setSt(pr, 'stand'); pr.fs = 'idle'; pr.tint = 0;
    for (const e of G.enemies) if (e.alive && e.kind !== 'W') { e.x = e.home.x; e.y = e.home.y; e.f = e.home.f; e.hp = e.maxhp; setSt(e, 'stand'); e.fs = 'idle'; e.cool = 1.2; }
    G.dying = 0; G.room(); if (G.onHp) G.onHp();
  };

  // ---------------- 자세 고르기 ----------------
  function poseOf(a) {
    const st = a.st, t = a.t;
    let p;
    switch (st) {
      case 'stand': p = a.kind === 'prince' ? P.stand : PX.mix(P.stand, { hy: -19.3, fa: 0.3, fe: 0.5, sw: 0.5 }, 0.5 + 0.5 * Math.sin(t * 2)); break;
      case 'run': p = PX.run(a.runPh || 0); break;
      case 'turn': p = PX.mix(P.stand, P.crouch, 0.25); break;
      case 'skid': p = P.skid; break;
      case 'teeter': p = PX.mix(P.teeter, P.stand, t > 0.6 ? 1 : 0.5 + 0.5 * Math.sin(t * 18) * (1 - t / 0.6)); break;
      case 'crouch': p = PX.mix(P.crouch, P.duck, Math.min(1, t / 0.08)); break;
      case 'land': p = PX.mix(P.crouch, P.stand, Math.min(1, t / 0.16)); break;
      case 'landHard': p = PX.mix(P.landHard, P.stand, PX.ease((t - 0.25) / 0.25)); break;
      case 'jumpPrep': case 'leapPrep': p = P.jumpPrep; break;
      case 'jumpGrab': p = PX.mix(P.jumpUp, P.hang, Math.min(1, t / 0.24)); break;
      case 'leap': p = a.jumping ? (a.vy < 40 ? P.leap : PX.mix(P.leap, P.crouch, Math.min(1, (a.vy - 40) / 160) * 0.6)) : P.jumpUp; break;
      case 'fall': p = PX.mix(P.fall, { fa: 2.8, ba: 2.2, fh: 0.2, bh: 0.7 }, 0.5 + 0.5 * Math.sin(t * 14)); if (a.vy < 20 && a.jumping === false && t < 0.25) p = P.jumpUp; break;
      case 'hang': p = PX.mix(P.hang, { fh: 0.3, bh: -0.25 }, 0.5 + 0.5 * Math.sin(t * 2.4)); break;
      case 'climb': p = PX.keys(PX.climbKeys, Math.min(1, t / 0.8)); break;
      case 'lower': p = PX.keys(PX.climbKeys, 1 - Math.min(1, t / 0.55)); break;
      case 'dead': p = PX.mix(P.hurt, P.dead, PX.ease(t / 0.45)); break;
      case 'drink': p = PX.mix(P.drink, P.stand, PX.ease((t - 0.6) / 0.3)); break;
      case 'victory': p = PX.mix(P.victory, P.stand, PX.ease((t - 0.8) / 0.3)); break;
      case 'exitWalk': p = PX.walk((t * 1.4) % 1); break;
      case 'fight': {
        const ft = a.ft;
        switch (a.fs) {
          case 'draw': p = PX.mix(P.stand, P.guardF, Math.min(1, ft / 0.2)); break;
          case 'step': p = PX.fenceStep(Math.min(1, ft / 0.24), a.stepD !== a.f); break;
          case 'wind': p = PX.mix(P.guardF, P.windup, PX.ease(ft / Math.max(0.05, a.windT))); break;
          case 'strike': p = PX.mix(P.windup, P.strike, Math.min(1, ft / 0.05)); break;
          case 'rec': p = PX.mix(P.strike, P.guardF, PX.ease(ft / 0.2)); break;
          case 'block': p = PX.mix(P.guardF, P.block, Math.min(1, ft / 0.05)); break;
          case 'parried': p = PX.mix(P.block, P.hurt, Math.sin(Math.min(1, ft / 0.32) * Math.PI)); break;
          case 'hurt': p = PX.mix(P.hurt, P.guardF, PX.ease(ft / 0.3)); break;
          default: p = PX.mix(P.guardF, { hy: -18.5, sw: 2.25 }, 0.5 + 0.5 * Math.sin(a.t * 3));
        }
        break;
      }
      default: p = P.stand;
    }
    if (a.bl > 0 && a.from) p = PX.mix(a.from, p, 1 - a.bl / 0.09);
    a.pose = p;
    return p;
  }
  G.poseOf = poseOf;
  function drawActor(g, a) {
    const p = poseOf(a);
    const sw = a.kind === 'prince' ? (a.st === 'fight' || a.st === 'victory' ? 2 : a.sword ? 1 : 0) : a.sword;
    const o = { look: a.look, sword: sw, t: a.t + (a.kind === 'prince' ? 0 : 3), vx: a.titleWind ? 45 : a.vx, air: a.st === 'leap' || a.st === 'fall' };
    if (a.tint > 0) o.tint = [255, 240, 220, Math.min(0.6, a.tint / 0.25 * 0.75)];
    if (a.st === 'dead' && a.kind !== 'prince') o.alpha = Math.max(0, 1 - (a.t - 1.2) / 0.6);
    if (a.st === 'exitWalk') o.alpha = Math.max(0, 1 - G.exiting / 1.0);
    if (o.alpha === 0) return;
    PX.draw(g, p, o, RND.sx(a.x), RND.sy(a.y), a.f);
    if (a.kind !== 'prince' && a.kind !== 'W' && a.alive) hpPips(g, a, o.alpha == null ? 1 : o.alpha);
  }
  // 적 체력: 머리 위 붉은 구슬(상단바 체력 구슬과 같은 모양)
  function hpPips(g, a, al) {
    const sx = RND.sx(a.x), sy = RND.sy(a.y);
    if (sx < 0 || sx > RND.VW || sy < 0 || sy > RND.VH + 20) return;      // 다른 방에 있는 적은 안 그린다
    const n = a.maxhp, w = n * 5 + 1, x0 = Math.max(2, Math.min(RND.VW - w - 2, Math.round(RND.sx(a.x) - w / 2))), y0 = Math.round(RND.sy(a.y) - 58);
    g.globalAlpha = al;
    g.fillStyle = '#1a0e12'; g.fillRect(x0, y0, w, 6);
    for (let i = 0; i < n; i++) {
      const x = x0 + 1 + i * 5, on = i < a.hp;
      g.fillStyle = on ? '#901a14' : '#3a1a18'; g.fillRect(x, y0 + 1, 4, 4);
      if (on) { g.fillStyle = '#e83a2a'; g.fillRect(x, y0 + 1, 3, 3); g.fillStyle = '#ffd0b0'; g.fillRect(x, y0 + 1, 1, 1); }
      else { g.fillStyle = '#5a2a24'; g.fillRect(x + 1, y0 + 2, 2, 2); }
    }
    g.globalAlpha = 1;
  }
  // 엔딩: 아버지 말풍선(사장님 문구 그대로, 10/20). 한 줄씩 차례로, 길이에 맞춰 오래 띄운다
  G.FATHER = [['아들아', 'My son...'], ['와줬구나', 'You came for me.'], ['나는 너를 믿고 있었다', 'I always believed in you.'],
    ['고약한 사또놈이 억울하게 누명을 씌웠는데', 'The wicked magistrate framed me.'], ['이제 나는 너만 믿겠다', 'Now I put all my trust in you.']];
  const LINE0 = 0.5, lineDur = (s) => 1.1 + s.length * 0.09;
  G.fatherTotal = () => LINE0 + G.FATHER.reduce((n, l) => n + lineDur(l[0]), 0);
  function fatherBubble(g) {
    const fa = G.enemies.find((e) => e.kind === 'W'); if (!fa) return;
    let t = (G.endT || 0) - LINE0, i = 0;
    if (t < 0) return;
    while (i < G.FATHER.length && t > lineDur(G.FATHER[i][0])) { t -= lineDur(G.FATHER[i][0]); i++; }
    if (i >= G.FATHER.length) return;
    const s = L(G.FATHER[i][0], G.FATHER[i][1]);
    // 글자는 작은 캔버스에 찍으면 ㄹ 받침이 뭉개져서, 테만 여기 그리고 글자는 큰 화면에 쓴다(main.js present)
    const S = RND.viewS || 4, PXS = 12 * Math.max(1, Math.round(8 * S / 12)), FS = PXS / S;     // 큰 화면 글자는 12의 배수(갈무리11 격자)
    g.font = FS + 'px Px,monospace';
    const tw = Math.ceil(g.measureText(s).width), w = tw + 10, h = Math.ceil(FS) + 6;
    const fx = Math.round(RND.sx(fa.x)), x0 = Math.max(2, Math.min(RND.VW - w - 2, fx - (w >> 1)));
    const y0 = Math.round(RND.sy(fa.y)) - 56 - h + (t < 0.08 ? 1 : 0);
    const tx = Math.max(x0 + 4, Math.min(x0 + w - 7, fx - 1));
    g.fillStyle = '#1a0e12'; g.fillRect(x0 + 1, y0, w - 2, h); g.fillRect(x0, y0 + 1, w, h - 2);       // 먹 테
    g.fillRect(tx - 1, y0 + h - 1, 5, 2); g.fillRect(tx, y0 + h + 1, 3, 1); g.fillRect(tx + 1, y0 + h + 2, 1, 1);
    g.fillStyle = '#f4ead2'; g.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);                                    // 한지
    g.fillRect(tx, y0 + h - 1, 3, 1); g.fillRect(tx + 1, y0 + h, 1, 1);
    g.fillStyle = '#d8c8a0'; g.fillRect(x0 + 1, y0 + h - 2, w - 2, 1);
    G.say = { s, x: x0 + 5, y: y0 + (h - FS) / 2, px: PXS };
  }
  G.draw = function (t) {
    const g = RND.g; G.say = null;
    RND.drawRoom(W.state.t, () => {
      for (const e of G.enemies) drawActor(g, e);
      drawActor(g, G.pr);
      if (G.spark) { const s = G.spark, x = RND.sx(s.x), y = RND.sy(s.y); const col = s.red ? '#ff6a4a' : '#fff6c0'; for (let i = 0; i < 6; i++) { const a = i * 1.05 + t * 7, l = 3 + (i % 2) * 3; g.fillStyle = col; g.fillRect(Math.round(x + Math.cos(a) * l), Math.round(y + Math.sin(a) * l), 1, 1); } g.fillStyle = '#fff'; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
    });
    if (G.ending) fatherBubble(g);
    if (G.flash > 0) { g.fillStyle = 'rgba(255,255,230,' + (G.flash * 1.2).toFixed(2) + ')'; g.fillRect(0, 0, RND.VW, RND.VH); }
  };
})();