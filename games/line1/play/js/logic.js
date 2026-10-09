// 1호선 빌런 규칙: 길찾기(흐름장), 장비, 빌런 능력, 정차·물결, 판
(function () {
  'use strict';
  var D = L1_DATA, M = L1_MAP, MW = M.MW, MH = M.MH, N = MW * MH;
  var G = window.G = {
    stage: 1, zone: 0, map: null, towers: {}, enemies: [], proj: [], fx: [], puddles: [],
    coins: 0, warn: 0, slot: 0, nslot: 5, phase: 'title', spd: 1, paused: false,
    tool: null, sel: null, t: 0, shake: 0, flash: 0, spawnQ: [], fields: {}, caught: 0, escaped: 0,
    doors: 0, scroll: 0, vel: 1, cards: {}, seen: {}, lives: 5, vetUsed: false
  };
  function idx(x, y) { return y * MW + x; }
  function passBase(i) { var c = G.map.g[i]; return c === '.' || c === ',' || c === 'S' || c === 'E'; }
  function C(id) { return G.cards[id] || 0; }

  // 흐름장: 연결문(E)까지 남은 거리. norm(장비 막힘), fly(장비 무시), big(펜스는 비싸게 부수고 지나감)
  function field(mode) {
    var d = new Float32Array(N).fill(Infinity), q = [];
    G.map.exits.forEach(function (e) { var i = idx(e[0], e[1]); d[i] = 0; q.push(i); });
    while (q.length) {
      var bi = 0; for (var k = 1; k < q.length; k++) if (d[q[k]] < d[q[bi]]) bi = k;
      var i = q[bi]; q[bi] = q[q.length - 1]; q.pop();
      var x = i % MW, y = (i / MW) | 0, nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var n = 0; n < 4; n++) {
        var nx = x + nb[n][0], ny = y + nb[n][1]; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
        var j = idx(nx, ny); if (!passBase(j)) continue;
        var tw = G.towers[j], cost = 1;
        if (tw && mode !== 'fly') { if (mode === 'big' && tw.type === 'fence') cost = 7; else continue; }
        if (d[i] + cost < d[j]) { d[j] = d[i] + cost; q.push(j); }
      }
    }
    return d;
  }
  function refield() { G.fields.norm = field('norm'); G.fields.fly = field('fly'); G.fields.big = field('big'); }
  function fieldOf(e) { var k = D.ENEMIES[e.type]; return k.fly ? G.fields.fly : k.smash ? G.fields.big : G.fields.norm; }

  // 놓을 수 있나: 바닥이고, 비었고, 빌런이 없고, 놓아도 모든 문에서 길이 남는가
  function canBuild(x, y) {
    if (x < 0 || y < 0 || x >= MW || y >= MH) return false;
    var i = idx(x, y); if (G.map.g[i] !== '.' || G.towers[i]) return false;
    for (var k = 0; k < G.enemies.length; k++) { var e = G.enemies[k]; if (e.state !== 'run' || D.ENEMIES[e.type].fly) continue; if (e.ci === i || e.ni === i) return false; }
    G.towers[i] = { type: 'fence' }; var f = field('norm'); delete G.towers[i];
    for (k = 0; k < G.map.spawns.length; k++) { var s = G.map.spawns[k]; if (!isFinite(f[idx(s[0], s[1])])) return false; }
    for (k = 0; k < G.enemies.length; k++) { e = G.enemies[k]; if (e.state === 'run' && !D.ENEMIES[e.type].fly && !isFinite(f[e.ci])) return false; }
    return true;
  }
  function unlocked(type) { return D.TOWERS[type].st <= G.stage; }
  function cost(type) { var c = D.TOWERS[type].cost; if (type === 'fence' && C('free')) return 0; if (type === 'gongik') c -= 5 * C('cheap'); return c; }
  function fenceHp(lv) { return [3, 5, 8][lv] + C('fence'); }
  function build(type, x, y) {
    var def = D.TOWERS[type], cs = cost(type); if (!unlocked(type) || G.coins < cs || !canBuild(x, y)) return false;
    var i = idx(x, y);
    G.towers[i] = { type: type, lv: 0, x: x, y: y, i: i, cd: 0.3, dir: 0, act: 0, hp: type === 'fence' ? fenceHp(0) : 0, spent: cs, ang: Math.random() * 6.28, stun: 0 };
    G.coins -= cs; refield(); return true;
  }
  function upCost(tw) { var u = D.TOWERS[tw.type].up; if (tw.lv >= u.length) return 0; if (C('vet') && !G.vetUsed) return 1; return Math.max(1, Math.round(u[tw.lv] * (1 - 0.08 * C('upg')))); }
  function upgrade(tw) { var c = upCost(tw); if (!c || G.coins < c) return false; if (C('vet') && !G.vetUsed) { G.vetUsed = true; c = 0; } G.coins -= c; tw.spent += c; tw.lv++; if (tw.type === 'fence') tw.hp = fenceHp(tw.lv); return true; }
  function sellVal(tw) { return Math.floor(tw.spent * (0.7 + 0.1 * C('refund'))); }
  function sell(tw) { G.coins += sellVal(tw); delete G.towers[tw.i]; refield(); if (G.sel === tw) G.sel = null; }
  var LVD = [1, 1.7, 2.6], LVR = [0, 0.35, 0.7], LVC = [1, 0.88, 0.76];
  // 둘레 빌런의 방해: 스피커폰(사거리), 확성기(공격 느림)
  function near(e, x, y, r) { var dx = e.x - x, dy = e.y - y; return dx * dx + dy * dy <= r * r; }
  function auraOn(tw, kind) {
    var cx = tw.x + 0.5, cy = tw.y + 0.5, best = 0;
    for (var k = 0; k < G.enemies.length; k++) {
      var e = G.enemies[k], d = D.ENEMIES[e.type]; if (e.state !== 'run') continue;
      var a = d.aura || (d.demon && e.mode === kind ? kind : 0); if (a !== kind) continue;
      var r = d.ar || 2.6; if (near(e, cx, cy, r)) best = Math.max(best, d.boss ? 2 : 1);
    }
    return best;
  }
  function range(tw) {
    var b = (D.TOWERS[tw.type].r + LVR[tw.lv]) * (1 + 0.06 * C('range'));
    if (tw.type !== 'cctv' && tw.type !== 'announce' && auraOn(tw, 'noise')) b *= 0.75;
    return b;
  }
  function towerMul(tw) {
    var m = 1 + 0.15 * C('all');
    if (tw.type === 'staff') m *= 1 + 0.12 * C('staff');
    if (tw.type === 'gongik') m *= 1 + 0.15 * C('gongik');
    if (tw.type === 'guard') m *= 1 + 0.12 * C('guard');
    if (tw.type === 'police') m *= 1 + 0.12 * C('police');
    return m;
  }

  // 장비 기절: 한 번 풀리면 2.5초 면역(냄새·단소·똥이 겹쳐 계속 멈추지 않게)
  function stunT(tw, t) { if (tw.imm > 0) return; tw.stun = Math.max(tw.stun || 0, t); tw.imm = t + 2.5; }

  // 빌런
  function spawn(type, si, at) {
    var def = D.ENEMIES[type], s = G.map.spawns[si % G.map.spawns.length];
    var hp = def.hp * (def.boss && !def.group ? D.bossMul(G.stage) : D.hpMul(G.stage) * (def.group ? D.BBZ[D.zoneOf(G.stage)] * D.BB : 1));
    var x = at ? at.x : s[0] + 0.5, y = at ? at.y : s[1] + 0.5;
    var e = { type: type, hp: hp, max: hp, x: x, y: y, ci: at ? at.ci : idx(s[0], s[1]), ni: -1, dir: s && s[1] === 0 ? 0 : 1, face: 2, fr: Math.random() * 4, slow: 0, state: 'run', t: 0, hit: 0, id: Math.random(),
      v: (si * 7 + (Math.random() * 4 | 0)) % 4, act: 0, actT: 2 + Math.random() * 3, napped: false, fainted: false, picnicked: false, mode: 'hush', modeT: 0, mark: 0 };
    G.enemies.push(e); G.seen[type] = 1; return e;
  }
  function nextCell(e) {
    var f = fieldOf(e), x = e.ci % MW, y = (e.ci / MW) | 0, best = -1, bd = f[e.ci], alt = [];
    var nb = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    for (var n = 0; n < 4; n++) {
      var nx = x + nb[n][0], ny = y + nb[n][1]; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      var j = idx(nx, ny); if (f[j] < bd - 0.01) { bd = f[j]; best = j; }
      if (isFinite(f[j]) && f[j] <= f[e.ci] + 0.01 && G.map.g[j] !== 'S') alt.push(j);
    }
    // 취객은 가끔 옆으로 샌다
    if (D.ENEMIES[e.type].zig && alt.length && Math.random() < 0.35) return alt[(Math.random() * alt.length) | 0];
    return best;
  }
  function targetable(e) { return e.state === 'run'; }
  function hurt(e, dmg, src) {
    if (e.state !== 'run') return;
    var def = D.ENEMIES[e.type];
    if (src && src.dodge && def.slip && Math.random() < def.slip) { G.fx.push({ k: 'miss', x: e.x, y: e.y - 1.2, t: 0, life: 0.6 }); return; }
    var m = 1;
    if (e.mark > 0) m *= 1 + D.TOWERS.cctv.mark + 0.1 * C('cctv');
    if (def.rage) m *= src && (src.type === 'guard' || src.type === 'police') ? 1.6 : 0.6;
    if (e.act > 0 && (def.nap || def.faint)) m *= 0.5;
    if (def.boss) m *= 1 + 0.25 * C('boss');
    if (src && src.type === 'police' && def.boss) m *= D.TOWERS.police.boss;
    // 쩍벌남 옆은 가려져서 덜 맞는다
    if (!def.wall) for (var k = 0; k < G.enemies.length; k++) { var o = G.enemies[k]; if (o !== e && o.state === 'run' && D.ENEMIES[o.type].wall && near(o, e.x, e.y, 1.2)) { m *= 0.7; break; } }
    if (C('crit') && Math.random() < 0.1 * C('crit')) { m *= 2; G.fx.push({ k: 'crit', x: e.x, y: e.y - 1.4, t: 0, life: 0.6 }); }
    e.hp -= dmg * m; e.hit = 0.12;
    if (src && src.slow) e.slow = Math.max(e.slow, src.slow);
    // 드러누운 아저씨: 반쯤 맞으면 한 번 드러눕는다
    if (def.nap && !e.napped && e.hp < e.max * 0.5 && e.hp > 0) { e.napped = true; e.act = 3; e.hp = Math.min(e.max, e.hp + e.max * 0.25); G.fx.push({ k: 'zzz', x: e.x, y: e.y - 1, t: 0, life: 3 }); AU.play('snore'); }
    if (def.faint && !e.fainted && e.hp < e.max * 0.3 && e.hp > 0) { e.fainted = true; e.act = 2; AU.play('thud'); }
    if (e.hp <= 0) {
      e.state = 'caught'; e.t = 0; var pay = Math.round(def.pay * (1 + 0.1 * C('catch')) * (G.incomeMul || 1)); G.coins += pay; G.caught++;
      G.fx.push({ k: 'coin', x: e.x, y: e.y - 0.6, t: 0, life: 0.9, v: pay });
      G.dex = G.dex || {}; G.dex[e.type] = 1;
      AU.play(def.boss ? 'bossdown' : 'cuff');
      if (def.boss) { G.shake = 0.5; G.flash = 0.3; G.fx.push({ k: 'stamp', x: e.x, y: e.y - 1.2, t: 0, life: 1.8 }); }
    }
  }
  function escape(e) {
    var def = D.ENEMIES[e.type];
    e.state = 'esc'; e.t = 0; G.escaped++;
    G.warn = Math.min(G.lives, G.warn + (def.boss ? (def.bw || G.lives) : 1));
    G.flash = 0.45; G.shake = 0.35; AU.play('complain');
    G.fx.push({ k: 'complain', x: e.x - 1, y: e.y - 1.2, t: 0, life: 1.2 });
    if (G.warn >= G.lives) setTimeout(function () { if (G.phase === 'wave') L1.fail(); }, 700);
  }
  function stepEnemy(e, dt) {
    if (e.state !== 'run') { e.t += dt; return; }
    var def = D.ENEMIES[e.type];
    if (e.hit > 0) e.hit -= dt;
    if (e.slow > 0) e.slow -= dt;
    if (e.mark > 0) e.mark -= dt;
    if (e.swing > 0) e.swing -= dt;
    // 멈춰 서는 동작들(드러눕기·쓰러짐·물건 펼치기·회 먹기·술판)
    if (e.act > 0) {
      e.act -= dt;
      if (def.eat || def.picnic) e.hp = Math.min(e.max, e.hp + e.max * 0.07 * dt);
      return;
    }
    e.actT -= dt;
    if (def.stall && e.actT <= 0) { e.actT = 4 + Math.random() * 2; e.act = 1.5; e.actK = 'stall'; G.fx.push({ k: 'goods', x: e.x, y: e.y, t: 0, life: 1.5 }); AU.play('hawk'); return; }
    if (def.eat && e.actT <= 0) { e.actT = 6; e.act = 2; e.actK = 'eat'; AU.play('slurp'); return; }
    if (def.picnic && !e.picnicked && e.x > 7.5 && e.x < 11.5 && e.y > 2 && e.y < 10) { e.picnicked = true; e.act = 4; e.actK = 'sit'; AU.play('cheers'); return; }
    // 냄새 구름: 둘레 장비가 잠깐 멈칫
    if (def.smell && e.actT <= 0) { e.actT = 4; G.fx.push({ k: 'smell', x: e.x, y: e.y - 0.4, t: 0, life: 1.2 }); for (var k in G.towers) { var tw = G.towers[k]; if (tw.type !== 'fence' && near(e, tw.x + 0.5, tw.y + 0.5, 1.6)) stunT(tw, 1); } }
    // 강아지 똥: 바닥에 떨어지면 둘레 장비가 질겁해 잠깐 멈춘다
    if (def.poop && e.actT <= 0) { e.actT = 5; G.puddles.push({ k: 'poop', x: e.x + (e.face === 3 ? 0.4 : -0.4), y: e.y, r: 0, t: 0, life: 7 }); for (var k3 in G.towers) { var t3 = G.towers[k3]; if (t3.type !== 'fence' && near(e, t3.x + 0.5, t3.y + 0.5, 1.4)) stunT(t3, 1.5); } AU.play('plop'); }
    // 단소: 둘레 장비를 때려 기절
    if ((def.stun || (def.demon && e.mode === 'stun')) && e.actT <= 0) {
      e.actT = 2.5; var hitAny = false;
      for (var k2 in G.towers) { var t2 = G.towers[k2]; if (t2.type !== 'fence' && near(e, t2.x + 0.5, t2.y + 0.5, 1.5) && !(t2.imm > 0)) { stunT(t2, 2); hitAny = true; G.fx.push({ k: 'stunhit', x: t2.x + 0.5, y: t2.y, t: 0, life: 0.5 }); } }
      if (hitAny) { AU.play('danso'); e.swing = 0.3; }
    }
    // 비둘기 왕: 비둘기를 부른다
    if ((def.summon || (def.demon && e.mode === 'summon')) && e.actT <= 0) { e.actT = 4; for (var s = 0; s < 2; s++) spawn('pigeon', 0, { x: e.x + (s ? 0.3 : -0.3), y: e.y, ci: e.ci }); AU.play('coo'); }
    // 대악마: 4초마다 기술을 바꾼다
    if (def.demon) { e.modeT -= dt; if (e.modeT <= 0) { e.modeT = 4; e.mi = (e.mi || 0) + 1; e.mode = ['hush', 'haste', 'stun', 'summon'][e.mi % 4]; e.actT = 0.3; G.fx.push({ k: 'aura', x: e.x, y: e.y, t: 0, life: 0.8 }); } }
    // 펜스 부수기
    if (e.smash > 0) {
      e.smash -= dt; e.fr += dt * 6;
      if (e.smash <= 0) {
        var dtw = G.towers[e.ni];
        if (dtw && dtw.type === 'fence') {
          dtw.hp--; G.shake = 0.12; AU.play('bang');
          G.fx.push({ k: 'dust', x: dtw.x + 0.5, y: dtw.y + 0.5, t: 0, life: 0.4 });
          if (dtw.hp <= 0) { delete G.towers[e.ni]; if (G.sel === dtw) G.sel = null; refield(); AU.play('break'); } else e.smash = 0.6;
        }
      }
      return;
    }
    if (e.ni < 0 || e.ni === e.ci) { e.ni = nextCell(e); if (e.ni < 0) { if (G.map.g[e.ci] === 'E') escape(e); return; } }
    var tw3 = G.towers[e.ni];
    if (tw3 && !def.fly) {
      if (def.smash && tw3.type === 'fence') { if (Math.abs(e.x - (e.ci % MW + 0.5)) + Math.abs(e.y - ((e.ci / MW | 0) + 0.5)) < 0.08) { e.smash = 0.6; return; } }
      else { e.ni = nextCell(e); return; }
    }
    var tx = e.ni % MW + 0.5, ty = (e.ni / MW | 0) + 0.5;
    var haste = 1;
    for (var h = 0; h < G.enemies.length; h++) { var o = G.enemies[h], od = D.ENEMIES[o.type]; if (o === e || o.state !== 'run') continue; if ((od.aura === 'haste' || (od.demon && o.mode === 'haste')) && near(o, e.x, e.y, od.ar || 2.6)) { haste = od.boss ? 1.45 : 1.3; break; } }
    var sp = def.sp * (e.slow > 0 ? 0.55 : 1) * haste * (1 - (e.anSlow || 0));
    var dx = tx - e.x, dy = ty - e.y, d = Math.sqrt(dx * dx + dy * dy), mv = sp * dt;
    if (Math.abs(dx) > Math.abs(dy)) { e.dir = dx > 0 ? 2 : 3; e.face = e.dir; } else e.dir = dy > 0 ? 0 : 1;
    e.fr += dt * sp * 7;
    if (d <= mv) {
      e.x = tx; e.y = ty; e.ci = e.ni;
      if (G.map.g[e.ci] === 'E') { escape(e); return; }
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
    if (tw.imm > 0) tw.imm -= dt;
    if (tw.stun > 0) { tw.stun -= dt; return; }
    if (tw.type === 'fence') return;
    tw.ang += dt;
    if (tw.type === 'cctv' || tw.type === 'announce') return;
    var hush = auraOn(tw, 'hush');
    tw.cd -= dt * (1 + 0.06 * C('rate')) / (hush ? (hush > 1 ? 1.5 : 1.35) : 1); if (tw.cd > 0) return;
    var tgt = pickTarget(tw, range(tw)); if (!tgt) return;
    faceTo(tw, tgt); tw.act = 0.28; tw.cd = def.cd * LVC[tw.lv];
    var dmg = def.dmg * LVD[tw.lv] * towerMul(tw), src = { type: tw.type };
    if (tw.type === 'gongik') { hurt(tgt, dmg, src); G.fx.push({ k: 'swing', x: tgt.x, y: tgt.y - 0.6, t: 0, life: 0.25, c: '#ff7a3a' }); AU.play('swish'); }
    else if (tw.type === 'staff') { G.proj.push({ k: 'note', x: tw.x + 0.5, y: tw.y + 0.1, e: tgt, sp: 8, dmg: dmg, t: 0, src: { type: 'staff', dodge: 1 } }); AU.play('whistle'); }
    else if (tw.type === 'guard') { hurt(tgt, dmg, src); tgt.slow = Math.max(tgt.slow, 0.6); G.fx.push({ k: 'grab', x: tgt.x, y: tgt.y - 0.7, t: 0, life: 0.35 }); AU.play('grab'); }
    else if (tw.type === 'police') { G.proj.push({ k: 'cuff', x: tw.x + 0.5, y: tw.y + 0.2, e: tgt, sp: 9, dmg: dmg, t: 0, src: { type: 'police', dodge: 1 } }); AU.play('throw'); }
    else if (tw.type === 'cleaner') { G.proj.push({ k: 'water', x: tw.x + 0.5, y: tw.y + 0.3, sx: tw.x + 0.5, sy: tw.y + 0.3, tx: tgt.x + (tgt.x - tw.x - 0.5) * 0.15, ty: tgt.y, t: 0, dur: 0.5, dmg: dmg, area: (def.area + tw.lv * 0.2) * (1 + 0.1 * C('mop')) }); AU.play('splash'); }
  }
  function stepProj(p, dt) {
    p.t += dt;
    if (p.k === 'note' || p.k === 'cuff') {
      var e = p.e, dx = e.x - p.x, dy = (e.y - 0.4) - p.y, d = Math.sqrt(dx * dx + dy * dy), mv = p.sp * dt;
      if (e.state !== 'run' || d <= mv) { if (e.state === 'run') hurt(e, p.dmg, p.src); p.dead = true; return; }
      p.x += dx / d * mv; p.y += dy / d * mv;
    } else if (p.k === 'water') {
      var u = Math.min(1, p.t / p.dur); p.x = p.sx + (p.tx - p.sx) * u; p.y = p.sy + (p.ty - p.sy) * u - Math.sin(u * Math.PI) * 1.1;
      if (u >= 1) {
        p.dead = true; G.puddles.push({ x: p.tx, y: p.ty, r: p.area, t: 0, life: 2.2 });
        G.enemies.forEach(function (e) { if (e.state !== 'run' || D.ENEMIES[e.type].bird) return; if (near(e, p.tx, p.ty, p.area)) hurt(e, p.dmg, { type: 'cleaner', slow: 1.2 }); });
        AU.play('mop');
      }
    }
  }

  // 정차와 물결: 역에 서면 문이 열리고 빌런이 탄다. 다 타면 문이 닫히고 떠난다
  function station(slot) { var z = G.zone, st = D.STATIONS[z], l = (G.stage - 1) % 10; if (G.stage === D.STAGES && slot === G.nslot - 1) return '신창'; return st[(l + slot) % st.length]; }
  function startWave() {
    if (G.phase !== 'build') return;
    G.phase = 'wave';
    var grp = G.waves[G.slot], q = [], si = 0;
    grp.forEach(function (gp, gi) {
      var t0 = 2.2 + gi * 2.2, def = D.ENEMIES[gp[0]];
      var n = def.group ? def.group : gp[1];
      for (var k = 0; k < n; k++) q.push({ at: t0 + k * (def.group ? 0.5 : gp[2]) + (def.boss && !def.group ? 6 : 0), type: gp[0], si: (si++ * 7 + gi * 3 + k), gk: def.group ? k + 1 : 0 });
    });
    q.sort(function (a, b) { return a.at - b.at; });
    G.spawnQ = q; G.waveT = 0; G.lastAt = q.length ? q[q.length - 1].at : 0; G.warnStart = G.warn; AU.play('arrive');
  }
  function waveDone() {
    if (G.warn === G.warnStart) { G.fx.push({ k: 'nice', x: 10, y: 5.6, t: 0, life: 1.3 }); AU.play('nice'); }
    G.slot++;
    if (G.slot >= G.nslot) { L1.clear(); return; }
    G.phase = 'build'; G.coins += Math.round((30 + G.slot * 8 + 10 * C('stop') + 30 * C('night')) * (G.incomeMul || 1));
    AU.play('depart');
  }
  function step(dt) {
    if (G.phase !== 'wave' && G.phase !== 'build') return;
    G.t += dt;
    // 열차: 정차 중엔 서고(문 열림), 아니면 달린다
    var stopping = G.phase === 'wave' && G.waveT < G.lastAt + 1.6;
    var tv = stopping ? 0 : 1; G.vel += (tv - G.vel) * Math.min(1, dt * (stopping ? 2.2 : 0.9));
    G.scroll += G.vel * dt * 150;
    var td = stopping && G.vel < 0.08 && G.waveT > 1.4 ? 1 : 0; G.doors += (td - G.doors) * Math.min(1, dt * 5);
    if (G.phase === 'wave') {
      if (G.doors > 0.5 && !G.doorSnd) { G.doorSnd = 1; AU.play('dooropen'); }
      if (G.doors < 0.5 && G.doorSnd) { G.doorSnd = 0; AU.play('doorclose'); }
      G.waveT += dt;
      while (G.spawnQ.length && G.spawnQ[0].at <= G.waveT && G.doors > 0.7) { var s = G.spawnQ.shift(), ne = spawn(s.type, s.si); if (s.gk) { ne.v = (s.gk - 1) % 4; ne.lead = s.gk === 1; } }
      if (G.spawnQ.length && G.doors <= 0.7 && G.waveT > 2.2) G.waveT = Math.min(G.waveT, G.spawnQ[0].at);
    }
    // 안내방송(감속)·CCTV(표식)
    G.enemies.forEach(function (e) { e.anSlow = 0; });
    for (var k in G.towers) {
      var tw = G.towers[k]; if (tw.stun > 0) continue;
      if (tw.type === 'announce') { var r = range(tw), sl = (D.TOWERS.announce.slow + 0.08 * C('slow')) * (1 + tw.lv * 0.15); G.enemies.forEach(function (e) { if (e.state === 'run' && near(e, tw.x + 0.5, tw.y + 0.5, r)) e.anSlow = Math.max(e.anSlow, Math.min(0.7, sl)); }); }
      else if (tw.type === 'cctv') { var rc = range(tw); G.enemies.forEach(function (e) { if (e.state === 'run' && near(e, tw.x + 0.5, tw.y + 0.5, rc)) { if (!(e.mark > 0)) G.fx.push({ k: 'found', x: e.x, y: e.y - 1, t: 0, life: 0.5 }); e.mark = 0.3; } }); }
    }
    G.enemies.forEach(function (e) { stepEnemy(e, dt); });
    for (k in G.towers) stepTower(G.towers[k], dt);
    G.proj.forEach(function (p) { stepProj(p, dt); }); G.proj = G.proj.filter(function (p) { return !p.dead; });
    G.puddles.forEach(function (c) { c.t += dt; G.enemies.forEach(function (e) { if (e.state === 'run' && !D.ENEMIES[e.type].bird && near(e, c.x, c.y, c.r)) e.slow = Math.max(e.slow, 0.3); }); });
    G.puddles = G.puddles.filter(function (c) { return c.t < c.life; });
    G.enemies = G.enemies.filter(function (e) { return !(e.state !== 'run' && e.t > 1.0); });
    G.fx.forEach(function (f) { f.t += dt; }); G.fx = G.fx.filter(function (f) { return f.t < f.life; });
    if (G.shake > 0) G.shake -= dt; if (G.flash > 0) G.flash -= dt;
    if (G.phase === 'wave' && !G.spawnQ.length && !G.enemies.length && G.warn < G.lives && G.waveT > G.lastAt + 1) waveDone();
  }

  function newStage(s, cards) {
    G.stage = s; G.zone = D.zoneOf(s); G.cards = cards || G.cards || {};
    G.map = L1_MAP.bake(G.zone);
    G.towers = {}; G.enemies = []; G.proj = []; G.fx = []; G.puddles = [];
    G.coins = D.startCoins(s) + 40 * C('coin') + 150 * C('bonus');
    G.lives = D.LIVES + C('life'); G.warn = 0; G.slot = 0; G.waves = D.waves(s); G.nslot = G.waves.length;
    G.phase = 'build'; G.sel = null; G.tool = 'staff'; G.caught = 0; G.escaped = 0; G.spawnQ = []; G.vetUsed = false;
    G.doors = 0; G.vel = 1; G.doorSnd = 0; G.dex = {};
    refield();
  }
  window.L1L = { newStage: newStage, step: step, build: build, canBuild: canBuild, upgrade: upgrade, upCost: upCost, sell: sell, sellVal: sellVal, cost: cost, range: range, startWave: startWave, unlocked: unlocked, targetable: targetable, idx: idx, LVR: LVR, refield: refield, spawn: spawn, station: station, fieldOf: fieldOf };
})();
