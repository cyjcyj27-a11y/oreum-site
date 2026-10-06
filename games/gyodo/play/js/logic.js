// 교도관24시 규칙: 길찾기(흐름장), 장비, 수감자, 물결, 하루
(function () {
  'use strict';
  var D = GY_DATA, M = GY_MAP, T = M.T, MW = M.MW, MH = M.MH, N = MW * MH;
  var G = window.G = {
    day: 1, zone: 0, map: null, towers: {}, enemies: [], proj: [], fx: [], clouds: [],
    coins: 0, warn: 0, slot: 0, nslot: 5, phase: 'title', spd: 1, paused: false,
    tool: null, sel: null, t: 0, shake: 0, flash: 0, night: false, spawnQ: [], fields: {}, caught: 0, escaped: 0, kingSeen: false
  };
  function idx(x, y) { return y * MW + x; }
  function passBase(i) { var c = G.map.g[i]; return c === '.' || c === ',' || c === 'S' || c === 'E'; }

  // 흐름장: 나가는 곳(E)까지 남은 거리. mode: norm(장비 막힘), tun(장비 무시), big(철문은 비싸게 지나감)
  function field(mode) {
    var d = new Float32Array(N).fill(Infinity), q = [];
    G.map.exits.forEach(function (e) { var i = idx(e[0], e[1]); d[i] = 0; q.push(i); });
    // 단순 다익스트라(칸 수가 적어 배열 정렬로 충분)
    while (q.length) {
      var bi = 0; for (var k = 1; k < q.length; k++) if (d[q[k]] < d[q[bi]]) bi = k;
      var i = q[bi]; q[bi] = q[q.length - 1]; q.pop();
      var x = i % MW, y = (i / MW) | 0;
      var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var n = 0; n < 4; n++) {
        var nx = x + nb[n][0], ny = y + nb[n][1]; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
        var j = idx(nx, ny); if (!passBase(j)) continue;
        var tw = G.towers[j], cost = 1;
        if (tw && mode !== 'tun') { if (mode === 'big' && tw.type === 'door') cost = 7; else continue; }
        if (d[i] + cost < d[j]) { d[j] = d[i] + cost; q.push(j); }
      }
    }
    return d;
  }
  function refield() { G.fields.norm = field('norm'); G.fields.tun = field('tun'); G.fields.big = field('big'); }
  function fieldOf(e) { var k = D.ENEMIES[e.type]; return k.under ? G.fields.tun : k.smash ? G.fields.big : G.fields.norm; }

  // 이 칸에 장비를 놓을 수 있나: 바닥이고, 비었고, 수감자가 없고, 놓아도 모든 문에서 길이 남는가
  function canBuild(x, y) {
    if (x < 0 || y < 0 || x >= MW || y >= MH) return false;
    var i = idx(x, y); if (G.map.g[i] !== '.' || G.towers[i]) return false;
    for (var k = 0; k < G.enemies.length; k++) { var e = G.enemies[k]; if (e.state !== 'run' || D.ENEMIES[e.type].under) continue; if (e.ci === i || e.ni === i) return false; }
    G.towers[i] = { type: 'door' }; var f = field('norm'); delete G.towers[i];
    for (k = 0; k < G.map.spawns.length; k++) { var s = G.map.spawns[k]; if (!isFinite(f[idx(s[0], s[1])])) return false; }
    for (k = 0; k < G.enemies.length; k++) { e = G.enemies[k]; if (e.state === 'run' && !D.ENEMIES[e.type].under && !isFinite(f[e.ci])) return false; }
    return true;
  }
  function unlocked(type) { return D.TOWERS[type].day <= G.day; }
  function build(type, x, y) {
    var def = D.TOWERS[type]; if (!unlocked(type) || G.coins < def.cost || !canBuild(x, y)) return false;
    var i = idx(x, y);
    G.towers[i] = { type: type, lv: 0, x: x, y: y, i: i, cd: 0.3, dir: 0, act: 0, hp: def.hp || 0, spent: def.cost, ang: Math.random() * 6.28, dog: null };
    G.coins -= def.cost; refield(); return true;
  }
  function upCost(tw) { var u = D.TOWERS[tw.type].up; return tw.lv < u.length ? u[tw.lv] : 0; }
  function upgrade(tw) { var c = upCost(tw); if (!c || G.coins < c) return false; G.coins -= c; tw.spent += c; tw.lv++; if (tw.type === 'door') tw.hp = [3, 5, 8][tw.lv]; return true; }
  function sell(tw) { G.coins += Math.floor(tw.spent * 0.7); delete G.towers[tw.i]; refield(); if (G.sel === tw) G.sel = null; }
  var LVD = [1, 1.7, 2.6], LVR = [0, 0.35, 0.7], LVC = [1, 0.88, 0.76];
  function range(tw) {
    var b = D.TOWERS[tw.type].r + LVR[tw.lv];
    if (G.night && tw.type !== 'light' && tw.type !== 'cctv' && !lit(tw.x + 0.5, tw.y + 0.5)) b *= 0.6;
    return b;
  }
  function lit(x, y) {
    for (var k in G.towers) { var t = G.towers[k]; if (t.type !== 'light') continue; var r = D.TOWERS.light.r + LVR[t.lv]; var dx = t.x + 0.5 - x, dy = t.y + 0.5 - y; if (dx * dx + dy * dy <= r * r) return true; }
    return false;
  }

  // 수감자
  function spawn(type, si) {
    var def = D.ENEMIES[type], s = G.map.spawns[si % G.map.spawns.length];
    var hp = def.hp * (type === 'king' ? D.kingMul(G.day) : D.hpMul(G.day));
    var e = { type: type, hp: hp, max: hp, x: s[0] + 0.5, y: s[1] + 0.5, ci: idx(s[0], s[1]), ni: -1, dir: 0, fr: Math.random() * 4, slow: 0, state: 'run', t: 0, rev: false, smash: 0, smoke: 0, smoked: false, hit: 0, id: Math.random() };
    G.enemies.push(e); if (type === 'king') G.kingSeen = true; return e;
  }
  function nextCell(e) {
    var f = fieldOf(e), x = e.ci % MW, y = (e.ci / MW) | 0, best = -1, bd = f[e.ci];
    var nb = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    for (var n = 0; n < 4; n++) {
      var nx = x + nb[n][0], ny = y + nb[n][1]; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      var j = idx(nx, ny); if (f[j] < bd - 0.01) { bd = f[j]; best = j; }
    }
    return best;
  }
  function targetable(e) {
    if (e.state !== 'run' || e.smoke > 0) return false;
    var d = D.ENEMIES[e.type];
    if (d.under && !e.rev && !(e.peek > 0)) return false;
    if (d.hidden && !e.rev) return false;
    return true;
  }
  function hurt(e, dmg, slow) {
    if (e.state !== 'run') return;
    e.hp -= dmg; e.hit = 0.12; if (slow) e.slow = Math.max(e.slow, slow);
    var def = D.ENEMIES[e.type];
    if (def.boss && !e.smoked && e.hp < e.max * 0.5) { e.smoked = true; e.smoke = D.KSMOKE; G.fx.push({ k: 'smoke', x: e.x, y: e.y, t: 0, life: D.KSMOKE }); AU.play('smoke'); }
    if (e.hp <= 0) {
      e.state = 'caught'; e.t = 0; G.coins += def.pay; G.caught++;
      G.fx.push({ k: 'coin', x: e.x, y: e.y - 0.6, t: 0, life: 0.9, v: def.pay });
      AU.play(def.boss ? 'bossdown' : 'cuff');
      if (def.boss) { G.shake = 0.5; G.flash = 0.3; G.fx.push({ k: 'stamp', x: e.x, y: e.y - 1.2, t: 0, life: 1.8 }); }
    }
  }
  function escape(e) {
    e.state = 'esc'; e.t = 0; G.escaped++;
    G.warn = Math.min(D.LIVES, G.warn + (D.ENEMIES[e.type].boss ? D.LIVES : 1));
    G.flash = 0.45; G.shake = 0.35; AU.play('siren');
    if (G.warn >= D.LIVES) setTimeout(function () { if (G.phase === 'wave') GY.fail(); }, 700);
  }
  function stepEnemy(e, dt) {
    if (e.state !== 'run') { e.t += dt; return; }
    var def = D.ENEMIES[e.type];
    if (e.hit > 0) e.hit -= dt;
    if (e.smoke > 0) e.smoke -= dt;
    if (e.slow > 0) e.slow -= dt;
    // 땅굴꾼은 2.4초마다 0.8초씩 고개를 내민다
    if (def.under && !e.rev) { e.pk = (e.pk || Math.random() * 2) + dt; if (e.pk > 2.4) { e.pk = 0; e.peek = 0.8; G.fx.push({ k: 'dust', x: e.x, y: e.y, t: 0, life: 0.35 }); } if (e.peek > 0) e.peek -= dt; }
    // 철문 부수기
    if (e.smash > 0) {
      e.smash -= dt; e.fr += dt * 6;
      if (e.smash <= 0) {
        var dtw = G.towers[e.ni];
        if (dtw && dtw.type === 'door') {
          dtw.hp--; G.shake = 0.12; AU.play('bang');
          G.fx.push({ k: 'dust', x: dtw.x + 0.5, y: dtw.y + 0.5, t: 0, life: 0.4 });
          if (dtw.hp <= 0) { delete G.towers[e.ni]; if (G.sel === dtw) G.sel = null; refield(); AU.play('break'); } else e.smash = 0.6;
        }
      }
      return;
    }
    if (e.ni < 0 || e.ni === e.ci) { e.ni = nextCell(e); if (e.ni < 0) { if (G.map.g[e.ci] === 'E') escape(e); return; } }
    // 길이 바뀌어 막혔으면 다시 고른다
    var tw = G.towers[e.ni];
    if (tw && !def.under) {
      if (def.smash && tw.type === 'door') { if (Math.abs(e.x - (e.ci % MW + 0.5)) + Math.abs(e.y - ((e.ci / MW | 0) + 0.5)) < 0.08) { e.smash = 0.6; return; } }
      else { e.ni = nextCell(e); return; }
    }
    var tx = e.ni % MW + 0.5, ty = (e.ni / MW | 0) + 0.5;
    var sp = def.sp * (e.slow > 0 ? 0.5 : 1) * (e.smoke > 0 ? 1.6 : 1);
    var dx = tx - e.x, dy = ty - e.y, d = Math.sqrt(dx * dx + dy * dy), mv = sp * dt;
    if (Math.abs(dx) > Math.abs(dy)) e.dir = dx > 0 ? 2 : 3; else e.dir = dy > 0 ? 0 : 1;
    e.fr += dt * sp * 7;
    if (d <= mv) {
      e.x = tx; e.y = ty; e.ci = e.ni;
      if (G.map.g[e.ci] === 'E') { escape(e); return; }
      if (G.towers[e.ci] && !def.under && !(def.smash && G.towers[e.ci].type === 'door')) { /* 밟고 있는 칸에 지어질 수 없지만 혹시 몰라 */ }
      e.ni = nextCell(e);
    } else { e.x += dx / d * mv; e.y += dy / d * mv; }
  }

  // 장비 동작
  function pickTarget(tw, r) {
    var best = null, bd = Infinity, cx = tw.x + 0.5, cy = tw.y + 0.5;
    for (var k = 0; k < G.enemies.length; k++) {
      var e = G.enemies[k]; if (!targetable(e)) continue;
      var dx = e.x - cx, dy = e.y - cy; if (dx * dx + dy * dy > r * r) continue;
      var rem = fieldOf(e)[e.ci]; if (rem < bd) { bd = rem; best = e; }
    }
    return best;
  }
  function faceTo(tw, e) { var dx = e.x - (tw.x + 0.5), dy = e.y - (tw.y + 0.5); tw.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 3) : (dy > 0 ? 0 : 1); }
  function stepTower(tw, dt) {
    var def = D.TOWERS[tw.type];
    if (tw.act > 0) tw.act -= dt;
    if (tw.type === 'cctv') { tw.ang += dt * 0.9; return; }
    if (tw.type === 'light') { tw.ang += dt * 0.7; return; }
    if (tw.type === 'door') return;
    if (tw.dog) { // 개가 달려갔다 돌아옴
      var dg = tw.dog; dg.t += dt;
      var e = dg.e, hx = tw.x + 0.5, hy = tw.y + 0.5;
      if (dg.phase === 0) {
        var tx = e.state === 'run' ? e.x : dg.lx, ty = e.state === 'run' ? e.y : dg.ly; dg.lx = tx; dg.ly = ty;
        var dx = tx - dg.x, dy = ty - dg.y, d = Math.sqrt(dx * dx + dy * dy), mv = dt * 7;
        dg.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 3) : (dy > 0 ? 0 : 1);
        if (d <= mv || dg.t > 1.2) { dg.x = tx; dg.y = ty; dg.phase = 1; if (e.state === 'run') { hurt(e, def.dmg * LVD[tw.lv], 1.4 + tw.lv * 0.4); AU.play('bark'); } }
        else { dg.x += dx / d * mv; dg.y += dy / d * mv; }
      } else {
        var dx2 = hx - dg.x, dy2 = hy - dg.y, d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2), mv2 = dt * 6;
        dg.dir = Math.abs(dx2) > Math.abs(dy2) ? (dx2 > 0 ? 2 : 3) : (dy2 > 0 ? 0 : 1);
        if (d2 <= mv2) tw.dog = null; else { dg.x += dx2 / d2 * mv2; dg.y += dy2 / d2 * mv2; }
      }
      if (tw.dog) tw.dog.fr = (tw.dog.fr || 0) + dt * 12;
      return;
    }
    tw.cd -= dt; if (tw.cd > 0) return;
    var tgt = pickTarget(tw, range(tw)); if (!tgt) return;
    faceTo(tw, tgt); tw.act = 0.25; tw.cd = def.cd * LVC[tw.lv];
    if (tw.type === 'guard') { G.proj.push({ k: 'cuff', x: tw.x + 0.5, y: tw.y + 0.2, e: tgt, sp: 9, dmg: def.dmg * LVD[tw.lv], t: 0 }); AU.play('throw'); }
    else if (tw.type === 'dog') { tw.dog = { x: tw.x + 0.5, y: tw.y + 0.5, e: tgt, t: 0, phase: 0, dir: tw.dir, lx: tgt.x, ly: tgt.y }; }
    else if (tw.type === 'riot') { G.proj.push({ k: 'gas', x: tw.x + 0.5, y: tw.y + 0.3, sx: tw.x + 0.5, sy: tw.y + 0.3, tx: tgt.x + (tgt.x - tw.x - 0.5) * 0.15, ty: tgt.y, t: 0, dur: 0.55, dmg: def.dmg * LVD[tw.lv], area: def.area + tw.lv * 0.2 }); AU.play('pop'); }
  }
  function stepProj(p, dt) {
    p.t += dt;
    if (p.k === 'cuff') {
      var e = p.e, dx = e.x - p.x, dy = (e.y - 0.4) - p.y, d = Math.sqrt(dx * dx + dy * dy), mv = p.sp * dt;
      if (e.state !== 'run' || d <= mv) { if (e.state === 'run') hurt(e, p.dmg); p.dead = true; return; }
      p.x += dx / d * mv; p.y += dy / d * mv;
    } else if (p.k === 'gas') {
      var u = Math.min(1, p.t / p.dur); p.x = p.sx + (p.tx - p.sx) * u; p.y = p.sy + (p.ty - p.sy) * u - Math.sin(u * Math.PI) * 1.2;
      if (u >= 1) {
        p.dead = true; G.clouds.push({ x: p.tx, y: p.ty, r: p.area, t: 0, life: 1.6, dps: p.dmg * 0.6 });
        G.enemies.forEach(function (e) { if (e.state !== 'run' || D.ENEMIES[e.type].under && !e.rev) return; var dx = e.x - p.tx, dy = e.y - p.ty; if (dx * dx + dy * dy <= p.area * p.area) hurt(e, p.dmg, 1.2); });
        AU.play('gas');
      }
    }
  }

  // 물결
  function startWave() {
    if (G.phase !== 'build') return;
    G.phase = 'wave'; G.night = G.slot === 5;
    var grp = G.waves[G.slot], q = [], si = 0;
    grp.forEach(function (gp, gi) {
      var t0 = gi * 2.2;
      for (var n = 0; n < gp[1]; n++) q.push({ at: t0 + n * gp[2] + (gp[0] === 'king' ? 6 : 0), type: gp[0], si: (si++ * 7 + gi * 3 + n) });
    });
    q.sort(function (a, b) { return a.at - b.at; });
    G.spawnQ = q; G.waveT = 0; AU.play('whistle');
  }
  function waveDone() {
    G.slot++;
    if (G.slot >= G.nslot) { GY.clear(); return; }
    G.phase = 'build'; G.night = G.slot === 5; G.coins += 30 + G.slot * 8;
    AU.play('bell');
  }
  function step(dt) {
    if (G.phase !== 'wave' && G.phase !== 'build') return;
    G.t += dt;
    if (G.phase === 'wave') {
      G.waveT += dt;
      while (G.spawnQ.length && G.spawnQ[0].at <= G.waveT) { var s = G.spawnQ.shift(); spawn(s.type, s.si); }
    }
    // CCTV 에 걸렸나
    var cams = [];
    var guards = [];
    for (var k in G.towers) { if (G.towers[k].type === 'cctv') cams.push(G.towers[k]); else if (G.towers[k].type === 'guard' || G.towers[k].type === 'riot') guards.push(G.towers[k]); }
    G.enemies.forEach(function (e) {
      var was = e.rev; if (was) return;
      for (var c = 0; c < cams.length; c++) { var r = D.TOWERS.cctv.r + LVR[cams[c].lv], dx = e.x - cams[c].x - 0.5, dy = e.y - cams[c].y - 0.5; if (dx * dx + dy * dy <= r * r) { e.rev = true; break; } }
      // 변장범은 교도관 바로 옆을 지나가면 들킨다
      if (!e.rev && D.ENEMIES[e.type].hidden) for (var k2 = 0; k2 < guards.length; k2++) { var gx = e.x - guards[k2].x - 0.5, gy = e.y - guards[k2].y - 0.5; if (gx * gx + gy * gy <= 1.45 * 1.45) { e.rev = true; break; } }
      if (e.rev && !was && (D.ENEMIES[e.type].under || D.ENEMIES[e.type].hidden)) { G.fx.push({ k: 'found', x: e.x, y: e.y - 1, t: 0, life: 0.8 }); AU.play('beep'); }
    });
    G.enemies.forEach(function (e) { stepEnemy(e, dt); });
    for (k in G.towers) stepTower(G.towers[k], dt);
    G.proj.forEach(function (p) { stepProj(p, dt); }); G.proj = G.proj.filter(function (p) { return !p.dead; });
    G.clouds.forEach(function (c) {
      c.t += dt;
      G.enemies.forEach(function (e) { if (e.state !== 'run') return; var dx = e.x - c.x, dy = e.y - c.y; if (dx * dx + dy * dy <= c.r * c.r) { e.hp -= c.dps * dt; e.slow = Math.max(e.slow, 0.3); if (e.hp <= 0) hurt(e, 0); } });
    });
    G.clouds = G.clouds.filter(function (c) { return c.t < c.life; });
    G.enemies = G.enemies.filter(function (e) { return !(e.state !== 'run' && e.t > 1.0); });
    G.fx.forEach(function (f) { f.t += dt; }); G.fx = G.fx.filter(function (f) { return f.t < f.life; });
    if (G.shake > 0) G.shake -= dt; if (G.flash > 0) G.flash -= dt;
    if (G.phase === 'wave' && !G.spawnQ.length && !G.enemies.length && G.warn < D.LIVES) waveDone();
  }

  function newDay(day) {
    G.day = day; G.zone = Math.min(4, Math.floor((day - 1) / 6));
    G.map = GY_MAP.bake(G.zone);
    G.towers = {}; G.enemies = []; G.proj = []; G.fx = []; G.clouds = [];
    G.coins = 260 + day * 32; G.warn = 0; G.slot = 0; G.waves = D.waves(day); G.nslot = G.waves.length;
    G.phase = 'build'; G.night = false; G.sel = null; G.tool = 'guard'; G.caught = 0; G.escaped = 0; G.spawnQ = [];
    refield();
  }
  window.GYL = { newDay: newDay, step: step, build: build, canBuild: canBuild, upgrade: upgrade, upCost: upCost, sell: sell, range: range, startWave: startWave, unlocked: unlocked, targetable: targetable, lit: lit, idx: idx, LVR: LVR, refield: refield, spawn: spawn };
})();