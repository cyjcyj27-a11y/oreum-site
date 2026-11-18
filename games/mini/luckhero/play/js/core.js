// 운빨용사 규칙: 저장, 한 판(런) 진행, 전투(카드·주사위·잎·적 행동). 그림은 main.js.
(function () {
  const D = window.DATA, C = D.CARDS;
  const G = (window.G = {});
  const rnd = (G.rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1)));
  const pick = (G.pick = (arr) => arr[Math.floor(Math.random() * arr.length)]);
  const shuffle = (G.shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; });

  // ───── 시간·기다리기(그림 고리에서 시간이 흐른다) ─────
  G.time = 0; G.waits = [];
  G.wait = (ms) => new Promise((res) => G.waits.push({ t: G.time + ms, res }));
  G.tickTime = (dt) => {
    G.time += dt;
    const due = G.waits.filter((w) => w.t <= G.time); G.waits = G.waits.filter((w) => w.t > G.time);
    due.forEach((w) => w.res());
  };

  // ───── 저장 ─────
  const MK = 'luckhero.meta', RK = 'luckhero.run';
  function freshMeta() { return { bank: 0, up: { hp: 0, blk: 0, gold: 0, leaf: 0, rare: 0, draw: 0 }, seen: { c: {}, r: {}, m: {} }, how: 0, runs: 0, wins: 0, ends: 0, trueEnd: 0, best: 0 }; }
  G.meta = freshMeta();
  try { const s = JSON.parse(localStorage.getItem(MK) || 'null'); if (s) G.meta = Object.assign(freshMeta(), s, { up: Object.assign(freshMeta().up, s.up || {}), seen: Object.assign(freshMeta().seen, s.seen || {}) }); } catch (e) { }
  G.saveMeta = () => { try { localStorage.setItem(MK, JSON.stringify(G.meta)); } catch (e) { } };
  G.saveRun = () => { try { if (G.run) localStorage.setItem(RK, JSON.stringify(G.run)); else localStorage.removeItem(RK); } catch (e) { } };
  G.loadRun = () => { try { return JSON.parse(localStorage.getItem(RK) || 'null'); } catch (e) { return null; } };
  G.see = (kind, id) => { if (!G.meta.seen[kind][id]) { G.meta.seen[kind][id] = 1; G.saveMeta(); } };
  G.dexPct = () => {
    const s = G.meta.seen, a = D.DEXCARDS.filter((k) => s.c[k]).length + Object.keys(D.RELICS).filter((k) => s.r[k]).length + D.DEXMON.filter((k) => s.m[k]).length;
    const all = D.DEXCARDS.length + Object.keys(D.RELICS).length + D.DEXMON.length;
    return { a, all, pct: Math.floor((a / all) * 100) };
  };

  // ───── 한 판 시작 ─────
  G.newRun = () => {
    const u = G.meta.up;
    G.run = {
      hp: 62 + u.hp * 6, max: 62 + u.hp * 6, coins: 30 + u.gold * 20, deck: D.STARTER.slice(), relics: [],
      act: 0, floor: 1, doors: null, gachaN: 0, stats: { jack: 0, crit: 0, miss: 0, kills: 0, rolls: 0, ms: 0, maxHit: 0 },
    };
    G.run.deck.forEach((k) => G.see('c', k));
    G.makeDoors();
    G.meta.runs++; G.saveMeta(); G.saveRun();
  };
  G.has = (r) => G.run && G.run.relics.includes(r);
  G.FLOORS = 7;
  G.makeDoors = () => {
    const R = G.run, f = R.floor;
    let d;
    if (f === 1) d = ['fight'];
    else if (f === G.FLOORS) d = ['boss'];
    else if (f === G.FLOORS - 1) d = ['rest', 'gacha'];
    else {
      const pool = [['fight', 40], ['event', 18], ['gacha', 13], ['rest', 9], ['elite', f >= 3 ? 12 : 0], ['chest', 8]];
      d = [];
      let guard = 0;
      while (d.length < 3 && guard++ < 50) {
        let tot = pool.reduce((s, p) => s + p[1], 0), r = Math.random() * tot, k = pool[0][0];
        for (const p of pool) { if ((r -= p[1]) < 0) { k = p[0]; break; } }
        if (!d.includes(k) || (k === 'fight' && d.filter((x) => x === 'fight').length < 2 && guard > 20)) d.push(k);
      }
      if (!d.includes('fight') && !d.includes('elite')) d[0] = 'fight';
    }
    R.doors = d;
  };
  G.nextFloor = () => {
    const R = G.run;
    R.floor++;
    if (R.floor > G.FLOORS) { R.act++; R.floor = 1; R.hp = R.max; }
    G.makeDoors(); G.saveRun();
  };

  // 카드 보상
  G.rareChance = (base) => base + G.meta.up.rare * 0.05;
  G.rollCard = (rch) => (Math.random() < rch ? pick(D.RARE) : pick(D.COMMON));
  G.cardChoices = (n, rch) => {
    const out = [];
    let g = 0;
    while (out.length < n && g++ < 60) { const c = G.rollCard(rch); if (!out.includes(c)) out.push(c); }
    out.forEach((k) => G.see('c', k));
    return out;
  };
  G.rollRelic = () => {
    const left = Object.keys(D.RELICS).filter((r) => !G.run.relics.includes(r));
    return left.length ? pick(left) : null;
  };
  G.gainRelic = (r) => { if (!r) return; G.run.relics.push(r); G.see('r', r); if (r === 'bag') { } };
  G.gainCoins = (n) => { const v = Math.round(n * (G.has('tooth') ? 1.5 : 1)); G.run.coins += v; return v; };

  // ───── 전투 ─────
  G.B = null;
  G.startBattle = (kind) => {
    const R = G.run, act = D.ACTS[R.act];
    let ids;
    if (kind === 'boss') ids = [act.boss];
    else if (kind === 'elite') ids = [pick(act.elite)];
    else ids = pick(R.floor <= 2 && R.act === 0 ? act.easy : R.floor <= 2 ? act.easy.concat(act.hard.slice(0, 1)) : act.hard);
    const sc = 1 + 0.035 * (R.floor - 1);
    const foes = ids.map((id, i) => {
      const m = D.MON[id], hp = Math.round(rnd(m.hp[0], m.hp[1]) * (m.boss ? 1 : sc));
      G.see('m', id);
      return { id, m, hp, max: hp, blk: 0, st: { str: 0, weak: 0, vuln: 0, poi: 0 }, i: m.boss ? 0 : rnd(0, 1), slot: i, n: ids.length, flash: 0, lunge: 0, dead: 0, hurtT: 0, phase: Math.random() * 6 };
    });
    const u = G.meta.up;
    G.B = {
      kind, foes, draw: shuffle(R.deck.slice()), hand: [], disc: [], exh: [], turn: 0, over: false,
      p: { blk: 0, en: 3, enMax: 3, leaves: 0, need: G.has('pot') ? 3 : 4, bonus: 0, turnBonus: 0, floor3: 0, six: G.has('silver') ? 1 : 0, ctr: 0, st: { str: 0, weak: 0, vuln: 0, poi: 0 }, pw: {}, revived: 0 },
    };
    G.p = G.B.p;
    G.p.leaves = Math.min(G.p.need, (G.has('rabbit') ? 2 : 0) + u.leaf);
    foes.forEach((f) => G.planIntent(f));
    return G.B;
  };
  G.planIntent = (f) => { f.intent = f.m.ai(f.i); };
  G.alive = (f) => f && f.hp > 0 && G.B.foes.includes(f);
  G.firstFoe = () => G.B.foes.find((f) => f.hp > 0);
  G.liveFoes = () => G.B.foes.filter((f) => f.hp > 0);

  G.draw = (n) => {
    const B = G.B;
    for (let i = 0; i < n; i++) {
      if (B.hand.length >= 10) break;
      if (!B.draw.length) { if (!B.disc.length) break; B.draw = shuffle(B.disc); B.disc = []; }
      const c = B.draw.pop();
      B.hand.push({ id: c, uid: Math.random(), x: 60, y: 400, a: 0, s: 0.6 });
      G.see('c', c);
    }
    SFX.play('card');
  };

  G.startTurn = async () => {
    const B = G.B; if (!B || B.over) return; const p = B.p;
    B.turn++;
    if (!p.pw.barricade) p.blk = 0; p.ctr = 0; p.turnBonus = 0;
    p.en = p.enMax + (B.turn === 1 && G.has('horse') ? 1 : 0);
    if (B.turn === 1 && G.meta.up.blk) p.blk += G.meta.up.blk * 4;
    if (p.pw.stance) p.blk += p.pw.stance;
    if (p.st.poi > 0) { await G.hurtPlayer(p.st.poi, null, true); p.st.poi--; if (G.B.over) return; }
    if (p.pw.charm) await G.leaf(p.pw.charm);
    let n = 5 + (G.has('bag') ? 1 : 0) + (B.turn === 1 ? G.meta.up.draw : 0);
    G.draw(n);
    G.ui && G.ui.turnBanner && G.ui.turnBanner(true);
  };

  // 주사위 굴리기: 결과 숫자(1~7)
  G.roll = () => {
    const p = G.p;
    if (p.leaves >= p.need) { p.leaves = 0; return 7; }
    let r;
    if (p.six > 0) { p.six--; r = 6; }
    else {
      r = rnd(1, 6);
      if (p.pw.double) r = Math.max(r, rnd(1, 6));
      if (r === 1 && p.pw.goddess) r = rnd(1, 6);
    }
    if (r < 6) r = Math.min(6, r + p.bonus + p.turnBonus);
    p.bonus = 0;
    if (p.floor3) { r = Math.max(r, 3); p.floor3 = 0; }
    return r;
  };
  G.mult = (r) => (r === 1 ? 0 : r === 7 ? 3 : r === 6 ? 2 : 1);

  G.canPlay = (c) => {
    const k = C[c.id];
    return !G.B.over && G.p.en >= k.cost;
  };

  // 카드 쓰기
  G.play = async (hc, target) => {
    const B = G.B; if (!B) return false; const p = B.p, k = C[hc.id];
    if (!G.canPlay(hc)) { SFX.play('deny'); return false; }
    p.en -= k.cost;
    const idx = B.hand.indexOf(hc); if (idx >= 0) B.hand.splice(idx, 1);
    G.ui.flyCard(hc);
    SFX.play('card');
    if (k.tgt && !G.alive(target)) target = G.firstFoe();
    await G.wait(140);
    if (k.dice) {
      const r = G.roll(), m = G.mult(r);
      G.run.stats.rolls++;
      await G.ui.rollDie(r);
      if (r === 1) {
        G.run.stats.miss++;
        G.ui.miss();
        await G.leaf(1);
        if (G.has('bug')) G.heal(2);
        if (p.pw.grit) G.status(p, 'str', p.pw.grit);
        if (p.pw.omen) G.block(p.pw.omen);
        if (G.has('ring')) await G.hitAll(5, 1);
        if (k.miss) await k.miss(G);
      } else {
        if (r >= 6) {
          G.run.stats.crit++;
          if (r === 7) { G.run.stats.jack++; await G.ui.jackpot(); if (G.has('star')) { G.heal(8); p.en += 1; } }
          else G.ui.crit();
          if (p.pw.eye) G.draw(p.pw.eye);
          if (p.pw.fever) { p.en += p.pw.fever; G.ui.float(G.ui.heroX(), 100, T('에너지 +', 'ENERGY +') + p.pw.fever, '#ff9a3a'); }
          if (G.has('tarot')) G.block(5);
          if (G.has('cat')) { G.gainCoins(4); SFX.play('coin'); G.ui.float(G.ui.heroX(), 120, '+4', '#ffcc3a'); }
        }
        await k.run(G, r, m, target);
      }
    } else {
      if (k.type !== 'atk') G.ui.cardPop(k);
      await k.run(G, 0, 1, target);
    }
    if (G.B !== B) return true;
    if (k.type === 'power') { } else if (k.ex) B.exh.push(hc.id); else B.disc.push(hc.id);
    await G.checkWin();
    return true;
  };

  G.leaf = async (n) => {
    const p = G.p, was = p.leaves;
    p.leaves = Math.min(p.need, p.leaves + n);
    if (p.leaves > was) { SFX.play('leaf'); G.ui.leafPop(was, p.leaves); }
    if (p.leaves >= p.need && was < p.need) G.ui.jackReady();
  };
  G.block = (n) => { n = Math.max(0, Math.floor(n)); if (!n) return; G.p.blk += n; SFX.play('block'); G.ui.float(G.ui.heroX(), 150, '+' + n, '#9ad8ff', 'shield'); G.ui.blockFx && G.ui.blockFx(); };
  G.heal = (n) => { n = Math.floor(n); if (n <= 0) return; const R = G.run; const v = Math.min(n, R.max - R.hp); R.hp += v; SFX.play('heal'); G.ui.float(G.ui.heroX(), 130, '+' + n, '#7ce86a'); G.ui.sparkle(G.ui.heroX(), 150, '#7ce86a'); };
  G.selfHurt = (n) => { const R = G.run; R.hp = Math.max(1, R.hp - n); SFX.play('hurt'); G.ui.heroHurt(n); };
  G.status = (t, s, n) => {
    if (t === G.p) { G.p.st[s] = (G.p.st[s] || 0) + n; G.ui.float(G.ui.heroX(), 120, s === 'str' ? T('힘 +', 'STR +') + n : '', '#ffcc3a'); SFX.play('leaf'); return; }
    if (!G.alive(t)) return;
    t.st[s] += n; SFX.play(s === 'poi' ? 'poison' : 'block');
    const lab = { poi: T('독', 'Poison'), weak: T('약화', 'Weak'), vuln: T('취약', 'Vulnerable') }[s];
    G.ui.float(G.ui.foeX(t), G.ui.foeTop(t) + 10, lab + ' ' + n, s === 'poi' ? '#7ce86a' : '#e8b8ff');
  };

  // 적에게 피해: 들어간 체력 피해를 돌려준다
  G.hit = async (t, dmg, raw, gap) => {
    if (!G.alive(t)) t = G.firstFoe(); if (!t) return 0;
    const p = G.p;
    if (!raw) dmg += p.st.str;
    if (p.st.weak > 0) dmg *= 0.75;
    if (t.st.vuln > 0) dmg *= 1.5;
    dmg = Math.max(0, Math.floor(dmg));
    G.ui.heroLunge();
    await G.wait(70);
    let left = dmg;
    if (t.blk > 0) { const b = Math.min(t.blk, left); t.blk -= b; left -= b; if (b) SFX.play('block'); }
    t.hp = Math.max(0, t.hp - left);
    G.run.stats.maxHit = Math.max(G.run.stats.maxHit, dmg);
    G.ui.foeHit(t, dmg, left);
    if (t.hp <= 0) G.killFoe(t);
    await G.wait(gap || 170);
    return left;
  };
  G.hitAll = async (dmg, raw) => {
    const fs = G.liveFoes(); if (!fs.length) return;
    G.ui.heroLunge();
    await G.wait(70);
    const p = G.p;
    for (const t of fs) {
      let d = dmg + (raw ? 0 : p.st.str);
      if (p.st.weak > 0) d *= 0.75;
      if (t.st.vuln > 0) d *= 1.5;
      d = Math.floor(d);
      let left = d; if (t.blk > 0) { const b = Math.min(t.blk, left); t.blk -= b; left -= b; }
      t.hp = Math.max(0, t.hp - left);
      G.run.stats.maxHit = Math.max(G.run.stats.maxHit, d);
      G.ui.foeHit(t, d, left);
      if (t.hp <= 0) G.killFoe(t);
    }
    await G.wait(220);
  };
  G.killFoe = (t) => { if (t.deadMark) return; t.deadMark = 1; t.dead = 0.001; G.run.stats.kills++; SFX.play('bighit'); G.ui.burst(G.ui.foeX(t), G.ui.foeMidY(t), t.m.boss ? 60 : 24); };
  G.flip = async (t) => {
    const heads = Math.random() < 0.5;
    await G.ui.coinFlip(heads);
    if (heads) await G.hit(t, 16); else await G.leaf(2);
  };
  G.storm = async () => {
    const n = G.p.leaves; G.p.leaves = 0;
    if (!n) { G.ui.float(G.ui.heroX(), 120, T('잎 없음', 'No leaves'), '#b4a68e'); return; }
    G.ui.cloverStorm(n);
    await G.wait(380);
    await G.hitAll(8 * n);
  };

  G.checkWin = async () => {
    const B = G.B;
    if (!B || B.over) return true;
    if (G.liveFoes().length) return false;
    B.over = true;
    await G.wait(650);
    G.ui.victory();
    return true;
  };

  // 플레이어가 맞음
  G.hurtPlayer = async (dmg, foe, pure) => {
    const B = G.B; if (!B || !G.run) return; const p = B.p, R = G.run;
    if (!pure) {
      if (foe) { dmg += foe.st.str; if (foe.st.weak > 0) dmg *= 0.75; }
      if (p.st.vuln > 0) dmg *= 1.5;
    }
    dmg = Math.max(0, Math.floor(dmg));
    let left = dmg;
    if (!pure && p.blk > 0) { const b = Math.min(p.blk, left); p.blk -= b; left -= b; if (b) SFX.play('block'); }
    R.hp = Math.max(0, R.hp - left);
    G.ui.heroHit(dmg, left, pure);
    if (foe && !pure && (p.pw.thorns || p.ctr) && G.alive(foe)) {
      const back = (p.pw.thorns || 0) + p.ctr;
      foe.hp = Math.max(0, foe.hp - back); G.ui.foeHit(foe, back, back);
      if (foe.hp <= 0) G.killFoe(foe);
    }
    if (R.hp <= 0) {
      if (p.pw.phoenix && !p.revived) { p.revived = 1; await G.wait(300); R.hp = Math.ceil(R.max / 2); G.ui.revive(); SFX.play('heal'); }
      else { B.over = true; await G.wait(700); G.ui.defeat(); }
    }
  };

  // 적 차례
  G.enemyTurn = async () => {
    const B = G.B; if (!B) return; const p = B.p;
    const gone = () => G.B !== B || B.over;
    // 손에 남은 저주
    const jinx = B.hand.filter((h) => h.id === 'jinx').length;
    B.disc.push(...B.hand.map((h) => h.id)); B.hand = [];
    if (jinx) { await G.hurtPlayer(2 * jinx, null, true); if (B.over) return; }
    if (p.st.weak > 0) p.st.weak--;
    if (p.st.vuln > 0) p.st.vuln--;
    await G.wait(260);
    for (const f of B.foes.slice()) {
      if (gone()) return;
      if (f.hp <= 0) continue;
      f.blk = 0;
      if (f.st.poi > 0) {
        f.hp = Math.max(0, f.hp - f.st.poi); G.ui.foeHit(f, f.st.poi, f.st.poi, 'poi'); SFX.play('poison'); f.st.poi--;
        if (f.hp <= 0) { G.killFoe(f); await G.wait(300); if (await G.checkWin()) return; continue; }
        await G.wait(260);
      }
      await G.act(f);
      if (B.over) return;
      if (f.st.weak > 0) f.st.weak--;
      if (f.st.vuln > 0) f.st.vuln--;
      f.i++; G.planIntent(f);
      await G.wait(200);
    }
    if (gone()) return;
    if (await G.checkWin()) return;
    await G.startTurn();
  };
  G.act = async (f) => {
    const o = f.intent, B = G.B; if (!B) return; const p = B.p, R = G.run;
    const attack = async (v, x) => {
      for (let i = 0; i < (x || 1); i++) {
        G.ui.foeLunge(f); SFX.play('hit'); await G.wait(110);
        await G.hurtPlayer(v, f); if (B.over) return;
        await G.wait(150);
      }
    };
    if (o.def) { f.blk += o.def; SFX.play('block'); G.ui.float(G.ui.foeX(f), G.ui.foeTop(f), '+' + o.def, '#9ad8ff', 'shield'); }
    switch (o.k) {
      case 'atk': await attack(o.v, o.x); break;
      case 'def': f.blk += o.v; SFX.play('block'); G.ui.float(G.ui.foeX(f), G.ui.foeTop(f), '+' + o.v, '#9ad8ff', 'shield'); await G.wait(300); break;
      case 'str': f.st.str += o.v; SFX.play('roar'); G.ui.float(G.ui.foeX(f), G.ui.foeTop(f), T('힘 +', 'STR +') + o.v, '#ff8a7a'); G.ui.foeLunge(f, 1); await G.wait(400); break;
      case 'weak': case 'vuln': p.st[o.k] += o.v; SFX.play('poison'); G.ui.float(G.ui.heroX(), 120, (o.k === 'weak' ? T('약화', 'Weak') : T('취약', 'Vulnerable')) + ' ' + o.v, '#e8b8ff'); G.ui.foeLunge(f, 1); await G.wait(400); break;
      case 'poi': p.st.poi += o.v; SFX.play('poison'); G.ui.float(G.ui.heroX(), 120, T('독', 'Poison') + ' ' + o.v, '#7ce86a'); G.ui.foeLunge(f, 1); await G.wait(400); break;
      case 'steal': { const v = Math.min(R.coins, o.v); R.coins -= v; G.ui.foeLunge(f); SFX.play('coin'); G.ui.stealCoins(f, v); f.stolen = (f.stolen || 0) + v; await G.wait(350); break; }
      case 'curse': for (let i = 0; i < o.v; i++) B.disc.push('jinx'); SFX.play('poison'); G.ui.float(G.ui.heroX(), 120, T('불운 카드 +', 'Jinx +') + o.v, '#a86ae8'); G.ui.foeLunge(f, 1); await G.wait(450); break;
      case 'dice': {
        const r = rnd(1, 6);
        await G.ui.rollDie(r, f);
        if (r === 1) { G.ui.foeMiss(f); await G.wait(500); }
        else await attack(o.v * r, 1);
        break;
      }
    }
    if (B.over) return;
    if (o.atk) await attack(o.atk, 1);
    if (B.over) return;
    if (o.heal && f.hp > 0) { const v = Math.min(o.heal, f.max - f.hp); f.hp += v; G.ui.float(G.ui.foeX(f), G.ui.foeTop(f), '+' + o.heal, '#7ce86a'); }
  };

  // 적 행동 미리보기(머리 위 숫자)
  G.intentDmg = (f, base) => {
    let d = base + f.st.str;
    if (f.st.weak > 0) d *= 0.75;
    if (G.p.st.vuln > 0) d *= 1.5;
    return Math.floor(d);
  };

  // 전투 끝 보상
  G.battleReward = () => {
    const B = G.B, R = G.run;
    let coins = B.kind === 'boss' ? rnd(55, 65) : B.kind === 'elite' ? rnd(28, 36) : rnd(10, 17);
    coins += B.foes.reduce((s, f) => s + (f.stolen || 0), 0);
    const got = G.gainCoins(coins);
    const cards = G.cardChoices(3, G.rareChance(B.kind === 'boss' ? 0.5 : B.kind === 'elite' ? 0.25 : 0.1));
    let relic = null;
    if (B.kind === 'elite' || B.kind === 'boss') { relic = G.rollRelic(); G.gainRelic(relic); }
    return { coins: got, cards, relic };
  };

  // 판 끝: 남은 코인을 은행에
  G.endRun = (won) => {
    const R = G.run; if (!R) return 0;
    const add = R.coins + (R.act * G.FLOORS + R.floor) * 3 + (won ? 150 : 0);
    G.meta.bank += add;
    if (won) G.meta.wins++;
    G.meta.best = Math.max(G.meta.best, R.act * G.FLOORS + R.floor);
    G.saveMeta();
    G.lastRun = R; G.run = null; G.saveRun();
    return add;
  };
})();
