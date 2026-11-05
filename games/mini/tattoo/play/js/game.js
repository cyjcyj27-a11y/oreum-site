// 게임 진행: 오프닝 → 손님(주문서) → 타투(선 → 색) / 피어싱 → 정산 → 상점 → 다음 손님 … → 엔딩
(function () {
  const G = (window.GAME = {});
  const D = DATA;
  const KEY = 'tattoo.save';
  const def = () => ({ cust: 0, coins: 0, gear: { machine: 0, needle: 0, lamp: 0, rest: 0, gel: 0 }, items: { cream: 0, candy: 0 }, dex: {}, pdex: {}, stats: { lines: 0, offs: 0, blows: 0, spills: 0, pierced: 0, perfect: 0, ouch: 0, earned: 0, fails: 0, done: 0 }, how: false, done: false, started: false });
  let S;
  try { S = Object.assign(def(), JSON.parse(localStorage.getItem(KEY) || '{}')); ['gear', 'items', 'stats'].forEach((k) => (S[k] = Object.assign(def()[k], S[k]))); } catch (e) { S = def(); }
  G.S = S;
  G.save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  G.reset = () => { const how = S.how; Object.keys(S).forEach((k) => delete S[k]); Object.assign(S, def()); S.how = how; G.save(); G.polas = []; try { localStorage.removeItem('tattoo.pola'); } catch (e) {} };
  const GK = { vFast: 'machine', smudge: 'machine', lineR: 'needle', lineHit: 'needle', slip: 'needle', brushR: 'needle', brushHit: 'needle', expo: 'lamp', stencil: 'lamp', flinch: 'rest', wipeFade: 'gel' };
  const gv = (k) => D.GEAR[k][S.gear[GK[k]]];
  G.gv = gv;
  G.light = () => { RND.salonLight(gv('expo')); RND.ring.visible = S.gear.lamp >= 2; };
  try { G.polas = JSON.parse(localStorage.getItem('tattoo.pola') || '[]'); } catch (e) { G.polas = []; }

  G.mode = 'title';
  let cust = null, queue = [], step = null, pat = 100, patMax = 100, spent = 0, cream = false, clearT = -1;
  const tally = { off: 0, blow: 0, spill: 0, crook: 0, ouch: 0, perfect: 0, pierced: 0 };
  G.wipeMode = false;
  G.color = 'k';

  // ---------- 손님 ----------
  G.startCustomer = function (i) {
    cust = G.cust = D.customer(i);
    ARM.build(cust); EAR.build(cust);
    patMax = document.body.classList.contains('touch') ? 160 : 100;
    pat = patMax; spent = 0; cream = false; clearT = -1;
    Object.keys(tally).forEach((k) => (tally[k] = 0));
    queue = cust.tat.map((j) => ({ k: 'tat', job: j })).concat(cust.pie.length ? [{ k: 'pie' }] : []);
    G.jobsDone = [];
    G.mode = 'order'; S.started = true; S.cust = i; G.save();
    G.light(); RND.scene = RND.studio;
    showArm(true); frameArm(cust.tat[0] || { x: 0, s: 0, w: 4 });
    UI.order(cust); UI.hud();
  };
  G.beginWork = function () { if (G.mode !== 'order') return; nextStep(); };
  function nextStep() {
    step = queue.shift();
    if (!step) { clearT = 0.6; G.mode = 'tat'; return; }
    if (step.k === 'tat') {
      const P = ARM.startJob(step.job, { lineR: gv('lineR') });
      P.phase = 'line'; step.P = P;
      showArm(true); frameArm(step.job);
      G.mode = 'tat'; G.setWipe(false); flinch.reset();
      UI.work(step); UI.hud();
    } else {
      showArm(false); EAR.addMarks(cust.pie); frameEar();
      G.mode = 'pie'; G.setWipe(false); breath.t = 0;
      UI.work(step); UI.hud();
    }
  }
  function showArm(on) { ARM.g.visible = on; EAR.g.visible = !on; RND.rest.visible = on; RND.tray.visible = on; ARM.placeMachine(null); EAR.placeNeedle(null); }

  // ---------- 카메라 ----------
  const cam = { tgt: new THREE.Vector3(), dist: 20, tdist: 20, rx: 0, ry: 0, trx: 0, try_: 0, mode: 'arm', base: 20 };
  function fitDist(size) { const c = RND.camera, f = Math.tan((c.fov * Math.PI) / 360); return (size / 2) / f / Math.min(1, c.aspect); }
  function frameArm(job) {
    const p = ARM.surf(job.x, job.s, new THREE.Vector3());
    cam.tgt.copy(p); cam.mode = 'arm'; cam.base = fitDist(job.w * 1.42 + 1.7); cam.dist = cam.tdist = cam.base; cam.rx = cam.trx = 0; cam.ry = cam.try_ = 0;
  }
  function frameEar() {
    EAR.g.position.set(0, 0, 0); EAR.g.updateMatrixWorld(true);
    cam.tgt.copy(EAR.ear.localToWorld(new THREE.Vector3(1.25, 0.1, 0))); cam.mode = 'ear'; cam.base = fitDist(8.6); cam.dist = cam.tdist = cam.base; cam.rx = cam.trx = 0; cam.ry = cam.try_ = 0;
  }
  G.reframe = () => { if (step && step.k === 'tat') frameArm(step.job); else if (step && step.k === 'pie') frameEar(); };
  function updCam(dt) {
    const k = Math.min(1, dt * 9); cam.dist += (cam.tdist - cam.dist) * k; cam.rx += (cam.trx - cam.rx) * k; cam.ry += (cam.try_ - cam.ry) * k;
    const c = RND.camera;
    if (cam.mode === 'arm') {
      // 위에서 내려다봄, 팔꿈치가 화면 위. rx = 팔을 굴려 보기(옆으로), ry = 앞뒤 기울기
      c.up.set(-1, 0, 0);
      const dir = new THREE.Vector3(Math.sin(cam.ry), Math.cos(cam.rx) * Math.cos(cam.ry), -Math.sin(cam.rx) * Math.cos(cam.ry));
      c.position.copy(cam.tgt).addScaledVector(dir, cam.dist); c.lookAt(cam.tgt);
    } else {
      c.up.set(0, 1, 0);
      const dir = new THREE.Vector3(Math.cos(cam.rx) * Math.cos(cam.ry), Math.sin(cam.ry) + 0.06, -Math.sin(cam.rx) * Math.cos(cam.ry) + 0.18).normalize();
      c.position.copy(cam.tgt).addScaledVector(dir, cam.dist); c.lookAt(cam.tgt);
    }
    if (cam.mode === 'arm') RND.key.position.set(cam.tgt.x - 10, cam.tgt.y + 40, cam.tgt.z + 14); else RND.key.position.set(cam.tgt.x + 26, cam.tgt.y + 24, cam.tgt.z + 16);
    RND.key.target.position.copy(cam.tgt);
  }
  G.orbit = function (dx, dy) { cam.trx = Math.max(-0.55, Math.min(0.55, cam.trx + dx * 0.004)); cam.try_ = Math.max(-0.35, Math.min(0.35, cam.try_ + dy * 0.004)); };
  G.zoom = function (f) { cam.tdist = Math.max(cam.base * 0.5, Math.min(cam.base * 1.7, cam.tdist * f)); };

  // ---------- 움찔(징조 0.9초 → 휙) ----------
  const flinch = {
    t: 0, gap: 10, state: 'calm', off: new THREE.Vector3(), vel: new THREE.Vector3(), tgt: new THREE.Vector3(),
    reset() { this.t = 0; this.gap = this.next(); this.state = 'calm'; this.off.set(0, 0, 0); this.vel.set(0, 0, 0); this.tgt.set(0, 0, 0); },
    next() { return (cust.flinchGap / gv('flinch')) * (0.7 + Math.random() * 0.6); },
  };
  function updFlinch(dt) {
    const f = flinch; f.t += dt;
    if (f.state === 'calm' && f.t > f.gap - 0.9) { f.state = 'omen'; SND.inhale(); }
    if (f.state === 'omen' && f.t > f.gap) {
      f.state = 'jerk'; f.jt = 0;
      const a = cust.flinchAmp * gv('flinch');
      f.tgt.set((Math.random() - 0.5) * a * 0.8, 0.05, (Math.random() < 0.5 ? -1 : 1) * a * (0.7 + Math.random() * 0.5));
      if (needle.on && needle.last) { tally.ouch++; S.stats.ouch++; hurt(8 * cust.pain * (cream ? 0.5 : 1), true); }
      else UI.praise(L('움찔!', 'Flinch!'), '', 'snap', innerWidth / 2, innerHeight * 0.3);
    }
    if (f.state === 'jerk') { f.jt += dt; if (f.jt > 0.12) f.tgt.set(0, 0, 0); if (f.jt > 0.9) { f.state = 'calm'; f.t = 0; f.gap = f.next(); } }
    // 스프링(휙 갔다 천천히 돌아옴)
    const k = f.state === 'jerk' && f.jt < 0.12 ? 900 : 60, c = f.state === 'jerk' && f.jt < 0.12 ? 40 : 14;
    f.vel.x += ((f.tgt.x - f.off.x) * k - f.vel.x * c) * dt; f.vel.y += ((f.tgt.y - f.off.y) * k - f.vel.y * c) * dt; f.vel.z += ((f.tgt.z - f.off.z) * k - f.vel.z * c) * dt;
    f.off.addScaledVector(f.vel, dt);
    const tr = f.state === 'omen' ? Math.sin(performance.now() / 1000 * 70) * 0.018 : 0;
    ARM.g.position.set(f.off.x + tr, f.off.y + Math.sin(performance.now() / 1000 * 1.3) * 0.02, f.off.z + tr * 0.6);
    ARM.g.scale.y = f.state === 'omen' ? 1.012 : 1;
  }

  // ---------- 바늘(타투) ----------
  const needle = { on: false, px: 0, py: 0, last: null, vS: 0, anchor: null, dwell: 0, offRun: 0, offCounted: false, wrongRun: 0, spillRun: 0, hover: null };
  G.needleDown = function (x, y) {
    if (G.mode !== 'tat' || !step || step.k !== 'tat' || clearT >= 0 || UI.paused()) return false;
    const h = ARM.hit(x, y); if (!h) return false;
    needle.on = true; needle.px = x; needle.py = y; needle.last = null; needle.vS = 0; needle.anchor = null; needle.dwell = 0;
    SND.machine(true); return true;
  };
  G.needleMove = function (x, y) { needle.px = x; needle.py = y; };
  G.needleUp = function () { needle.on = false; needle.last = null; SND.machine(false); SND.skin(false); };
  G.hover = function (x, y) { needle.hover = [x, y]; };
  function updNeedle(dt) {
    const P = step && step.P; if (!P) return;
    const t = performance.now() / 1000;
    if (!needle.on) {
      // PC: 손 위에 머신만 떠 있음(돌지 않음)
      if (needle.hover && !G.wipeMode && !document.body.classList.contains('touch')) { const h = ARM.hit(needle.hover[0], needle.hover[1]); ARM.placeMachine(h ? h.p.clone().addScaledVector(h.n, 0.25) : null, false, t); } else ARM.placeMachine(null);
      return;
    }
    const h = ARM.hit(needle.px, needle.py);
    if (!h) { needle.last = null; ARM.placeMachine(null); SND.skin(false); return; }
    ARM.placeMachine(h.p, true, t); SND.skin(true);
    const cur = { s: h.s, x: h.x };
    // 살에 닿아 있는 동안 아픔
    const zone = 1 + 0.6 * Math.max(0, Math.min(1, (cur.x - 3) / 8));
    pat -= 1.5 * cust.pain * zone * (cream ? 0.4 : 1) * dt;
    if (!needle.last) { needle.last = cur; needle.anchor = { s: cur.s, x: cur.x }; needle.dwell = 0; stamp(cur, cur, 0); return; }
    const d = Math.hypot(cur.s - needle.last.s, cur.x - needle.last.x);
    needle.vS += (d / Math.max(dt, 1e-3) - needle.vS) * Math.min(1, dt * 12);
    // 한 자리에 오래 → 번짐
    if (Math.hypot(cur.s - needle.anchor.s, cur.x - needle.anchor.x) > 0.09) { needle.anchor = { s: cur.s, x: cur.x }; needle.dwell = 0; }
    else { needle.dwell += dt; if (needle.dwell > 0.6) { needle.dwell = -0.4; ARM.blowout(cur.s, cur.x); tally.blow++; S.stats.blows++; hurt(4 * cust.pain, false); UI.praise(L('번짐', 'BLOWOUT'), '-' + D.MISS.blow, 'minus', needle.px, needle.py); SND.bad(); } }
    stamp(needle.last, cur, d);
    needle.last = cur;
    UI.prog();
  }
  // 폰은 손가락이라 여유를 화면 px 로 잡음(11/5 사장님 "모바일에서 그리니까 안끝나": 폰은 PC 의 절반인 3.8px 뿐이라 떨림 10px 면 세 바퀴에 88%, 여섯 바퀴 넘게 걸림)
  const FINGER_HIT = 10, FINGER_SLIP = 16;
  function lineMargin() {
    const hit = gv('lineHit'), slip = gv('slip');
    if (!document.body.classList.contains('touch')) return { hit, slip };
    const c = RND.camera, k = innerHeight / (2 * Math.tan((c.fov * Math.PI) / 360) * cam.dist); // 살갗 1cm 가 화면 몇 px 인지
    return { hit: Math.min(0.24, hit * Math.max(1, FINGER_HIT / k / D.GEAR.lineHit[0])), slip: Math.min(0.45, slip * Math.max(1, FINGER_SLIP / k / D.GEAR.slip[0])) };
  }
  // from → to 사이를 0.025cm 마다 찍음
  function stamp(a, b, d) {
    const P = step.P, n = Math.max(1, Math.ceil(d / 0.025)), fast = needle.vS > gv('vFast'), keep = fast ? Math.max(0.12, 1 - (needle.vS - gv('vFast')) / gv('vFast')) : 1;
    const color = P.phase === 'color', mg = lineMargin();
    for (let i = 1; i <= n; i++) {
      const t = i / n, s = a.s + (b.s - a.s) * t, x = a.x + (b.x - a.x) * t, stepL = d / n;
      if (Math.random() < 0.05 * gv('smudge')) ARM.smudge(s, x, color ? 0.8 : 1);
      if (!color) {
        const near = ARM.near(s, x, 0.5);
        ARM.inkDot(s, x, gv('lineR'), fast && Math.random() > keep, mg.hit);
        if (near > mg.slip) { needle.offRun += stepL; if (needle.offRun > 0.22 && !needle.offCounted) { needle.offCounted = true; tally.off++; S.stats.offs++; UI.praise(L('삐끗', 'SLIP'), '-' + D.MISS.off, 'minus', needle.px, needle.py); SND.bad(); } }
        else if (near < mg.slip - 0.05) { needle.offRun = 0; needle.offCounted = false; }
      } else {
        const r = ARM.colorDot(s, x, gv('brushR'), G.color, gv('brushHit'));
        if (r.wrong) { needle.wrongRun += stepL; if (needle.wrongRun > 0.45) { needle.wrongRun = 0; tally.spill++; S.stats.spills++; UI.praise(L('다른 색', 'WRONG INK'), '-' + D.MISS.spill, 'minus', needle.px, needle.py); SND.bad(); } }
        else if (r.out && ARM.near(s, x, 0.5) > gv('brushR') + 0.08) { needle.spillRun += stepL; if (needle.spillRun > 0.45) { needle.spillRun = 0; tally.spill++; S.stats.spills++; UI.praise(L('삐져나감', 'OUTSIDE'), '-' + D.MISS.spill, 'minus', needle.px, needle.py); SND.bad(); } }
      }
    }
    if (!color && ARM.lineCov() >= 0.965) lineDone();
    if (color) {
      let all = true;
      // 전체가 97% 를 넘으면 남은 칸은 마저 채움(가장자리 몇 점 때문에 안 끝나는 일 없게, 10/24 사장님 "어케해야끝나?")
      const tn = P.regions.reduce((a, r) => a + r.n, 0), tc = P.regions.reduce((a, r) => a + (r.done ? r.n : Math.min(r.n, r.cov)), 0), net = tc >= tn * 0.97;
      P.regions.forEach((R) => { if (R.done) return; if (net || R.cov >= Math.ceil(R.n * 0.9) - 2) { ARM.finishRegion(R); SND.coin(); UI.markCaps(); } else all = false; });
      if (all) jobDone();
    }
  }
  function lineDone() {
    const P = step.P; ARM.finishLine(); S.stats.lines++;
    G.needleUp();
    if (P.regions.length && P.regions.some((r) => !r.done)) {
      P.phase = 'color'; G.color = P.regions.find((r) => !r.done).f; ARM.tint();
      UI.praise(L('라인 끝!', 'LINES DONE!'), L('이제 색', 'Now color'), 'perfect', innerWidth / 2, innerHeight * 0.35); SND.clear();
      UI.work(step);
    } else jobDone();
  }
  function jobDone() {
    const P = step.P; G.needleUp(); ARM.closeJob(); ARM.flush(0);
    S.dex[P.job.id] = (S.dex[P.job.id] || 0) + 1; S.stats.done++;
    G.jobsDone.push(P.job);
    pola(P);
    UI.praise(L('완성!', 'DONE!'), '', 'perfect', innerWidth / 2, innerHeight * 0.35); SND.clear();
    G.mode = 'wait'; step.P = P; frameArm(P.job);
    UI.prog(); // 획을 대자마자 끝나면 숫자가 94% 로 남던 것
    showDone();
    G.save();
  }
  // 완성한 그림을 가운데 두고 한 번 보여 준 뒤 NEXT 로 넘어감(10/31)
  function showDone() { ARM.placeMachine(null); EAR.placeNeedle(null); setTimeout(() => { if (G.mode === 'wait') UI.done(true); }, 700); }
  G.doneNext = function () { if (G.mode !== 'wait') return; UI.done(false); nextStep(); };
  // 폴라로이드 한 장(살결 위 잉크 그림)
  function pola(P) {
    try {
      const c = RND.cv2(150, 150), g = c.getContext('2d'); g.fillStyle = cust.skin; g.fillRect(0, 0, 150, 150);
      const m = P.side * 0.12 * P.px; g.drawImage(P.outC, m, m, P.W - m * 2, P.H - m * 2, 0, 0, 150, 150);
      G.polas.push({ id: P.job.id, src: c.toDataURL('image/jpeg', 0.72) }); if (G.polas.length > 40) G.polas.shift();
      localStorage.setItem('tattoo.pola', JSON.stringify(G.polas));
    } catch (e) {}
  }

  // ---------- 닦기 ----------
  G.setWipe = function (on) { G.wipeMode = on; if (on) G.needleUp(); UI.wipe(on); };
  let wipeLast = null;
  G.wipeAt = function (x, y) {
    if (G.mode !== 'tat') return; const h = ARM.hit(x, y); if (!h) { wipeLast = null; return; }
    if (!wipeLast || Math.hypot(h.s - wipeLast.s, h.x - wipeLast.x) > 0.25) { ARM.wipe(h.s, h.x, gv('wipeFade')); SND.wipe(); wipeLast = { s: h.s, x: h.x }; }
  };
  G.wipeEnd = () => (wipeLast = null);

  // ---------- 피어싱 ----------
  const breath = { t: 0, inh: true };
  function updBreath(dt) {
    breath.t += dt * cust.breath;
    const ph = (breath.t % 3.4) / 3.4, inh = ph < 0.45;
    if (inh !== breath.inh) { breath.inh = inh; if (inh) SND.inhale(); else SND.exhale(); UI.breath(inh); }
    const y = inh ? Math.sin((ph / 0.45) * Math.PI / 2) : Math.cos(((ph - 0.45) / 0.55) * Math.PI / 2);
    EAR.g.position.y = y * 0.22; EAR.g.rotation.x = -y * 0.02;
  }
  let pierce = null;
  G.pierceDown = function (x, y) {
    if (G.mode !== 'pie' || clearT >= 0 || UI.paused() || pierce) return false;
    const h = EAR.hit(x, y); if (!h) return false;
    let best = null, bd = 0.6; EAR.marks.forEach((m) => { if (m.done) return; const d = m.p.distanceTo(h.p); if (d < bd) { bd = d; best = m; } });
    if (!best) return false;
    pierce = { m: best, aim: bd, p: h.p.clone(), n: h.n.clone(), k: 0, sx: x, sy: y, moved: 0, x, y };
    EAR.placeNeedle(pierce.p, pierce.n, 0); SND.ui(); return true;
  };
  G.pierceMove = function (x, y) { if (!pierce) return; pierce.moved = Math.max(pierce.moved, Math.hypot(x - pierce.sx, y - pierce.sy)); pierce.x = x; pierce.y = y; };
  G.pierceUp = function () {
    if (!pierce) return;
    if (pierce.k < 1) { hurt(4 * cust.pain, false); UI.praise(L('다시', 'AGAIN'), '', 'snap', pierce.x, pierce.y); EAR.placeNeedle(null); }
    pierce = null; UI.grip(null);
  };
  function updPierce(dt) {
    if (!pierce) return;
    pierce.k += dt / 0.85; pat -= 3 * cust.pain * (cream ? 0.4 : 1) * dt;
    EAR.placeNeedle(pierce.p, pierce.n, Math.min(1, pierce.k));
    UI.grip(pierce.x, pierce.y, Math.min(1, pierce.k), breath.inh ? 0.8 : 0);
    if (pierce.k < 1) return;
    const crook = pierce.moved > 26, inh = breath.inh;
    const m = pierce.m; m.done = true; tally.pierced++; S.stats.pierced++;
    S.pdex[m.id] = (S.pdex[m.id] || 0) + 1;
    let word, cls, sub = '';
    if (inh) { tally.ouch++; S.stats.ouch++; hurt(14 * cust.pain * (cream ? 0.5 : 1), true); }
    if (pierce.aim < 0.11 && !crook && !inh) { word = 'PERFECT'; cls = 'perfect'; tally.perfect++; S.stats.perfect++; }
    else if (pierce.aim < 0.26 && !crook) { word = 'NICE'; cls = 'nice'; }
    else { word = L('삐뚤', 'CROOKED'); cls = 'minus'; sub = '-' + D.MISS.crook; tally.crook++; }
    EAR.addJewel(m, D.PIERCE[m.id].gem, cls === 'minus');
    EAR.placeNeedle(null); UI.grip(null);
    UI.praise(word, sub, cls, pierce.x, pierce.y); SND.pierce(cls === 'perfect');
    pierce = null; G.save();
    if (EAR.marks.every((q) => q.done)) { G.mode = 'wait'; frameEar(); showDone(); }
  }

  // ---------- 인내심 ----------
  function hurt(n, big) { pat = Math.max(0, pat - n); if (big) { SND.ouch(n > 10); UI.ouch(); } UI.hud(); }
  G.use = function (id) {
    if ((G.mode !== 'tat' && G.mode !== 'pie') || UI.paused() || !(S.items[id] > 0)) return;
    const it = D.SHOP.find((s) => s.id === id);
    if (id === 'cream') { if (cream) { SND.bad(); UI.praise(L('이미 발랐어요', 'Already on'), '', 'snap', innerWidth / 2, innerHeight * 0.4); return; } cream = true; }
    else { if (pat >= patMax - 1) { SND.bad(); UI.praise(L('인내심 가득', 'Patience full'), '', 'snap', innerWidth / 2, innerHeight * 0.4); return; } pat = Math.min(patMax, pat + it.heal); }
    S.items[id]--; spent += it.cost; SND.coin(); G.save();
    UI.praise(id === 'cream' ? L('촉촉', 'Numb') : L('냠', 'Yum'), id === 'cream' ? L('덜 아파함', 'Less pain') : L('인내심 +', 'Patience +') + it.heal, 'nice', innerWidth / 2, innerHeight * 0.4); UI.hud();
  };

  // ---------- 정산 ----------
  function finishCustomer() {
    const rows = [];
    cust.tat.forEach((t) => rows.push({ ko: FLASH.D[t.id].ko + (t.col ? '' : L(' (선만)', ' (lines)')), en: FLASH.D[t.id].en, v: D.priceTat(t) }));
    if (tally.pierced) rows.push({ ko: '피어싱 ' + tally.pierced + ' × ' + D.PRICE_PIE, en: 'Piercing ' + tally.pierced + ' × ' + D.PRICE_PIE, v: tally.pierced * D.PRICE_PIE });
    const miss = [['off', '삐끗', 'Slips'], ['blow', '번짐', 'Blowouts'], ['spill', '색 실수', 'Ink misses'], ['crook', '삐뚤', 'Crooked']];
    miss.forEach(([k, ko, en]) => { if (tally[k]) rows.push({ ko: ko + ' ' + tally[k] + ' × -' + D.MISS[k], en: en + ' ' + tally[k] + ' × -' + D.MISS[k], v: -tally[k] * D.MISS[k], neg: 1 }); });
    const m = tally.off + tally.blow + tally.spill + tally.crook;
    const tip = m > 4 ? 1000 : m >= 2 ? 2000 : m === 1 ? 3000 : tally.ouch ? 10000 : Math.random() < 0.2 ? 100000 : 50000;
    rows.push({ ko: '팁', en: 'Tip', v: tip, jack: tip >= 50000 });
    const total = rows.reduce((a, r) => a + r.v, 0);
    S.coins = Math.max(0, S.coins + total); S.stats.earned += total;
    S.cust = Math.min(D.COUNT - 1, cust.i + 1);
    if (cust.last) { S.done = true; G.save(); G.ending(); return; }
    G.save(); G.mode = 'result'; SND.clear();
    UI.result({ n: cust.i + 1, rows, total, tip });
    if (tip >= 50000) setTimeout(() => SND.gold(), 300);
  }
  function fail() {
    const back = spent; S.coins += back; spent = 0;
    G.mode = 'over'; G.needleUp(); if (pierce) { pierce = null; EAR.placeNeedle(null); UI.grip(null); } S.stats.fails++; G.save(); SND.fail(); UI.over(back); UI.hud();
  }
  G.next = () => G.startCustomer(S.cust);
  G.retry = () => G.startCustomer(cust.i);

  // ---------- 오프닝 ----------
  let opT = 0, opCues = {};
  G.opening = function () { G.mode = 'opening'; opT = 0; opCues = {}; RND.scene = RND.front; UI.show('opening'); SND.ensure(); SND.startBgm(); };
  function updOpening(dt) {
    // 셔터 올리는 부분은 뺐음(10/24): 장면 시계를 1.7초 앞당겨 네온부터 시작
    opT += dt; RND.frontAt(opT + 1.7, dt);
    if (opT > 1.2 && !opCues.l) { opCues.l = 1; SND.neon(); }
    if (opT > 1.6 && !opCues.b) { opCues.b = 1; SND.blower(); }
    if (opT > 3.3 && !opCues.f) { opCues.f = 1; UI.fade(1); }
    if (opT > 3.9) G.afterOpening();
  }
  G.skipOpening = function () { if (G.mode === 'opening' && opT < 3.3) { opT = 3.3; opCues = { l: 1, b: 1 }; } };
  G.afterOpening = function () {
    if (G.mode !== 'opening') return;
    G.mode = 'wait'; UI.fade(0); UI.show('play');
    if (S.done) { S.cust = 0; S.done = false; }
    G.startCustomer(Math.min(S.cust, D.COUNT - 1));
    if (!S.how) UI.openHow(true);
  };

  // ---------- 엔딩: 마지막 손님 팔을 천천히 돌려 봄 ----------
  let endT = 0;
  G.ending = function () { G.mode = 'ending'; endT = 0; G.needleUp(); showArm(true); cam.mode = 'arm'; ARM.surf(1, 0, cam.tgt); cam.base = fitDist(22); cam.tdist = cam.base; SND.fanfare(); UI.show('ending'); };
  function updEnding(dt) { endT += dt; cam.trx = Math.sin(endT * 0.5) * 0.4; if (endT > 1.6 && !G._endShown) { G._endShown = true; UI.endingCard(); } }

  // ---------- 고리 ----------
  let lastT = performance.now();
  G.tick = function (dt) {
    const t = performance.now() / 1000;
    if (G.mode === 'title') RND.frontIdle(t);
    else if (G.mode === 'opening') updOpening(dt);
    else {
      const playing = (G.mode === 'tat' || G.mode === 'pie') && !UI.paused();
      if (playing) {
        if (clearT >= 0) { clearT -= dt; if (clearT < 0) { clearT = -1; finishCustomer(); } }
        else {
          pat -= cust.drain * dt;
          if (G.mode === 'tat' && step && step.k === 'tat') { updFlinch(dt); updNeedle(dt); }
          if (G.mode === 'pie') { updBreath(dt); updPierce(dt); }
          if (pat <= 0) { pat = 0; fail(); }
        }
        UI.pat(pat / patMax);
      }
      if (G.mode === 'ending') updEnding(dt);
      updCam(dt);
      if (!G.noRender) ARM.flush(gv('stencil'));
    }
    if (!G.noRender) RND.render();
  };
  function loop(now) { const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; G.tick(dt); requestAnimationFrame(loop); }
  G.info = () => ({ pat, patMax, mode: G.mode, step: step && step.k, phase: step && step.P && step.P.phase, cov: ARM.lineCov(), tally: Object.assign({}, tally), cust: cust && cust.i, breath: breath.inh, flinch: flinch.state });
  G.patience = () => pat / patMax;
  G.step = () => step;
  G._fill = () => { pat = patMax; };
  G.boot = function () {
    RND.init(document.getElementById('cv'));
    ARM.init(RND.studio); EAR.init(RND.studio);
    RND.resize();
    requestAnimationFrame(loop);
  };
  window.__tt = { G, D, RND, ARM, EAR, tick: (n) => { for (let i = 0; i < (n || 1); i++) G.tick(1 / 60); } };
})();
