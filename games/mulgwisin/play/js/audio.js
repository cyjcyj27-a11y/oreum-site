/* audio.js — 웹오디오로 합성한 소리 (파일 없음, file:// 에서도 동작)
 * 밤 저수지: 물 찰랑임 + 바람 + 풀벌레. 깊은 물에선 낮은 웅웅거림, 물귀신이 오면 심장 소리·속삭임 */
(function () {
  let ctx = null, master = null, on = true, amb = null, drone = null, heart = null, heartT = null, hushOn = false, hushT = 0;
  try { on = localStorage.getItem('mulgwisin.snd') !== '0'; } catch (e) { }
  function ac() {
    if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = on ? .8 : 0; master.connect(ctx.destination); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function env(g, t, a, d, peak) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0005, t + a + d); }
  function noiseBuf(c, sec) { const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  function burst(sec, peak, a, d, type, freq, q, dest) { const c = ac(), t = c.currentTime, n = c.createBufferSource(); n.buffer = noiseBuf(c, sec); const g = c.createGain(); env(g, t, a, d, peak); const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 1; n.connect(f); f.connect(g); g.connect(dest || master); n.start(t); return { n, g, f, t, c }; }
  function tone(type, f0, f1, len, peak, a, dest) { const c = ac(), t = c.currentTime, o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + len); const g = c.createGain(); env(g, t, a || .01, len, peak); o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + len + .1); return o; }

  // 물속 — 전체를 저역 필터로 먹먹하게
  let muff = null, muffOn = false;
  function muffle(k) {
    const c = ac();
    if (!muff) { muff = c.createBiquadFilter(); muff.type = 'lowpass'; muff.frequency.value = 20000; master.disconnect(); master.connect(muff); muff.connect(c.destination); }
    if (k === muffOn) return; muffOn = k;
    muff.frequency.setTargetAtTime(k ? 380 : 20000, c.currentTime, .12);
  }

  const A = {
    get on() { return on; },
    toggle() { on = !on; try { localStorage.setItem('mulgwisin.snd', on ? '1' : '0'); } catch (e) { } if (master) master.gain.setTargetAtTime(on ? .8 : 0, ac().currentTime, .05); return on; },
    unlock() { try { ac(); A.ambient(); } catch (e) { } },
    muffle,
    // 밤 풀벌레 소리만 — 물소리·바람·깊은 물 웅웅거림은 뺐다(2026-09-15 사장님 "윙윙거리는 소리는 빼고")
    ambient() {
      if (amb) return; const c = ac(); const bus = c.createGain(); bus.connect(master);   // 고요할 때 한꺼번에 줄인다
      // 풀벌레 — 끊이지 않는 높은 삐 소리 대신, 멀리 흩어진 귀뚜라미 두 마리가 "르르" 하고 따로 운다
      // 높은 음은 부드럽게 깎고(저역 필터), 소리는 작게. 2026-09-15 사장님 "벌레 소리가 너무 날카로워"
      const soft = c.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 3000; soft.Q.value = .5; soft.connect(bus);
      const voices = [];
      for (let i = 0; i < 2; i++) {
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 2550 + i * 260 + Math.random() * 90;
        const g = c.createGain(); g.gain.value = 0;
        const pan = c.createStereoPanner ? c.createStereoPanner() : null; if (pan) pan.pan.value = i ? .7 : -.7;
        o.connect(g); if (pan) { g.connect(pan); pan.connect(soft); } else g.connect(soft); o.start();
        voices.push({ g, peak: .005 + Math.random() * .003, next: c.currentTime + Math.random() * 1.5, gap: .75 + Math.random() * .7 });
      }
      // 가끔만 운다 — 한 마리가 2~3초 울다 한참(15~35초) 조용하다. 앞으로 1.5초치를 미리 예약해 둔다
      voices.forEach(v => { v.boutEnd = -1; v.next = c.currentTime + 3 + Math.random() * 20; });
      const sing = () => { const now = c.currentTime; for (const v of voices) while (v.next < now + 1.5) {
        if (v.boutEnd < v.next) { if (v.boutEnd > 0) { v.next += 15 + Math.random() * 20; v.boutEnd = -1; continue; } v.boutEnd = v.next + 1.5 + Math.random() * 2; }
        const t = Math.max(v.next, now + .02), n = 3 + (Math.random() * 2 | 0);
        for (let k = 0; k < n; k++) { const s = t + k * .055; v.g.gain.setValueAtTime(0, s); v.g.gain.linearRampToValueAtTime(v.peak, s + .012); v.g.gain.linearRampToValueAtTime(0, s + .04); }
        v.next = t + v.gap * (.85 + Math.random() * .3);
      } };
      sing(); setInterval(sing, 500);
      // 계곡 물소리 — 낮은 웅웅거림이 안 나게 300Hz 아래는 자르고, 물 흐르는 "쏴—" 결만 남긴다. 물살이 세면 커진다
      const wn = c.createBufferSource(); wn.buffer = noiseBuf(c, 4); wn.loop = true;
      const whp = c.createBiquadFilter(); whp.type = 'highpass'; whp.frequency.value = 320;
      const wbp = c.createBiquadFilter(); wbp.type = 'bandpass'; wbp.frequency.value = 1100; wbp.Q.value = .6;
      const wlfo = c.createOscillator(); wlfo.frequency.value = .13; const wlg = c.createGain(); wlg.gain.value = 260; wlfo.connect(wlg); wlg.connect(wbp.frequency);   // 물결처럼 천천히 결이 바뀐다
      const water = c.createGain(); water.gain.value = .06;
      wn.connect(whp); whp.connect(wbp); wbp.connect(water); water.connect(bus); wn.start(); wlfo.start();
      // 돌 사이로 떨어지는 졸졸 방울 소리
      const trickle = () => { if (!hushOn && on) { const t = c.currentTime + Math.random() * .1, o = c.createOscillator(), g = c.createGain(), f0 = 700 + Math.random() * 900; o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * (1.4 + Math.random() * .5), t + .045); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.006 + Math.random() * .01, t + .006); g.gain.exponentialRampToValueAtTime(.0003, t + .07); o.connect(g); g.connect(bus); o.start(t); o.stop(t + .09); }
        setTimeout(trickle, 120 + Math.random() * 520); };
      trickle();
      amb = { bus, water };
    },
    setDeep(k) { A._deep = k; if (amb && Math.abs(k - (amb.wk || 0)) > .03) { amb.wk = k; amb.water.gain.setTargetAtTime(.06 + .1 * k, ac().currentTime, .8); } },   // 여울에선 물소리가 커진다
    // 고요 — 풀벌레·물소리가 뚝 끊긴다. 무언가 오기 직전
    hush(sec) {
      if (!amb) return; const c = ac(), t = c.currentTime; hushOn = true; clearTimeout(hushT);
      amb.bus.gain.setTargetAtTime(0, t, .15);
      hushT = setTimeout(() => A.unhush(), sec * 1000);
    },
    unhush() { if (!amb || !hushOn) return; const t = ac().currentTime; hushOn = false; clearTimeout(hushT); amb.bus.gain.setTargetAtTime(1, t, 1.0); A.setDeep(A._deep || 0); },
    // 폭우 — 프롤로그. 쏴아 하는 빗소리(높은 결만), 지붕·마당에 튀는 빗방울
    rain(onOff) {
      const c = ac(), t = c.currentTime;
      if (onOff) {
        if (A._rain) return;
        const n = c.createBufferSource(); n.buffer = noiseBuf(c, 3); n.loop = true;
        const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700;
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500;
        const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + 1.5);
        n.connect(hp); hp.connect(lp); lp.connect(g); g.connect(master); n.start();
        const drip = setInterval(() => { if (on) burst(.03, .02 + Math.random() * .03, .001, .025, 'bandpass', 2500 + Math.random() * 3500, 2); }, 70);
        A._rain = { n, g, drip };
        if (amb) amb.bus.gain.setTargetAtTime(0, t, .3);   // 풀벌레·물소리는 비에 묻힌다
      } else if (A._rain) {
        const r = A._rain; A._rain = null; clearInterval(r.drip);
        r.g.gain.setTargetAtTime(0, t, .6); r.n.stop(t + 3);
        if (amb && !hushOn) amb.bus.gain.setTargetAtTime(1, t + .8, 1.2);
      }
    },
    // 먼 천둥 — 번쩍 뒤에 우르릉
    thunder() {
      burst(.25, .3, .002, .22, 'highpass', 1800);
      setTimeout(() => { const b = burst(2.6, .42, .08, 2.4, 'lowpass', 900); b.f.frequency.exponentialRampToValueAtTime(160, b.t + 2.2); }, 380);
    },
    // 장독 안에서 두드리는 소리 — 똑… 똑똑. vol 0~1, pan -1(왼) ~ 1(오른)
    knock(vol, pan) {
      const c = ac(), p = c.createStereoPanner ? c.createStereoPanner() : null, out = c.createGain(); out.gain.value = Math.max(0, Math.min(1, vol)); if (p) { p.pan.value = pan || 0; out.connect(p); p.connect(master); } else out.connect(master);
      const hit = dly => setTimeout(() => { tone('sine', 190, 120, .09, .5, .002, out); burst(.06, .35, .001, .05, 'bandpass', 700, 2.5, out); }, dly);
      hit(0); hit(520); hit(700);
    },
    // 장독 뚜껑이 들썩 떨어진다
    lidOff() { burst(.08, .3, .002, .07, 'bandpass', 900, 2); tone('sine', 240, 160, .15, .25, .002); setTimeout(() => { burst(.12, .35, .002, .1, 'bandpass', 600, 1.5); tone('sine', 150, 90, .25, .3, .002); }, 620); },
    // 사람이 불쑥 — 쿵 하는 발소리, 숨 들이켜는 소리, 옷 스치는 소리
    jolt() { tone('sine', 95, 38, .45, .75, .002); burst(.35, .5, .002, .3, 'lowpass', 900); burst(.5, .22, .01, .45, 'bandpass', 2200, 1.2); setTimeout(() => { const b = burst(.45, .2, .05, .38, 'bandpass', 1300, 2); b.f.frequency.exponentialRampToValueAtTime(700, b.t + .4); }, 120); },
    // 머리카락이 타들어 간다
    sizzle() { const b = burst(1.4, .22, .02, 1.3, 'highpass', 2600); for (let i = 0; i < 9; i++) setTimeout(() => burst(.03, .12, .001, .025, 'bandpass', 3000 + Math.random() * 4000, 3), 80 + Math.random() * 1100); return b; },
    // 멀리서 여자가 흥얼거린다 — 단조로 내려가는 가락
    hum() {
      const c = ac(), t0 = c.currentTime, o = c.createOscillator(), o2 = c.createOscillator(); o.type = 'triangle'; o2.type = 'sine';
      // 흠 흐 흠 흠 — 네 번. 이어 부르지 않고 한 음씩 끊어 흥얼거린다. 둘째 '흐'는 짧고 옅게 흘린다
      const notes = [[196, .52], [174.61, .28], [196, .48], [164.81, .78]];
      const marks = []; { let tt = t0; for (const [f, d] of notes) { o.frequency.setTargetAtTime(f, tt, .05); o2.frequency.setTargetAtTime(f * 2.005, tt, .05); marks.push([tt, d]); tt += d + .13; } }
      const vib = c.createOscillator(); vib.frequency.value = 5.2; const vg = c.createGain(); vg.gain.value = 3.2; vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
      const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 420; f1.Q.value = 2.2;   // 입 다문 "음—" 소리
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300;
      const g2 = c.createGain(); g2.gain.value = .25; const g = c.createGain();
      const end = marks[marks.length - 1][0] + marks[marks.length - 1][1] + .35;
      g.gain.setValueAtTime(.0008, t0);
      marks.forEach(([ts, d], i) => {   // 음마다 따로 여닫는다 — 이어 놓으면 "흠—" 하나로 들린다
        const peak = i === 1 ? .055 : i === 3 ? .085 : .09;
        g.gain.setValueAtTime(.0008, ts);
        g.gain.linearRampToValueAtTime(peak, ts + Math.min(.15, d * .38));
        g.gain.setValueAtTime(peak, ts + d * .66);
        g.gain.exponentialRampToValueAtTime(.0008, ts + d);
      });
      const pan = c.createStereoPanner ? c.createStereoPanner() : null; if (pan) pan.pan.value = (Math.random() < .5 ? -1 : 1) * (.5 + Math.random() * .4);
      const dl = c.createDelay(); dl.delayTime.value = .23; const fb = c.createGain(); fb.gain.value = .38; dl.connect(fb); fb.connect(dl);   // 골짜기 메아리
      o.connect(f1); o2.connect(g2); g2.connect(f1); f1.connect(lp); lp.connect(g); const out = pan || master; g.connect(out); g.connect(dl); dl.connect(out); if (pan) pan.connect(master);
      [o, o2, vib].forEach(x => { x.start(t0); x.stop(end + 2.5); });
    },
    // 보이지 않는 발걸음 — 물이면 첨벙, 뭍이면 질척
    plop(land, k) { k = k || 1; if (land) { burst(.1, .12 * k, .004, .08, 'lowpass', 700); burst(.05, .05 * k, .002, .04, 'bandpass', 2600, 3); } else { burst(.22, .16 * k, .006, .18, 'lowpass', 1500); tone('sine', 420, 170, .09, .05 * k, .004); } },
    // 등불이 꺼졌다 켜지는 사이 — 가까워진 발소리와 잡음
    blink() { tone('sine', 72, 32, .35, .5, .002); burst(.18, .2, .002, .15, 'bandpass', 700, 1.4); burst(.22, .09, .002, .2, 'highpass', 5200); },
    // 코앞에서 솟아오른다 — 한 번에 크게
    sting() {
      const c = ac(), t = c.currentTime;
      [880, 932, 1245, 1319].forEach((f, j) => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .55, t + 1.1); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = .9; const g = c.createGain(); env(g, t, .004, 1.1, .085); o.connect(bp); bp.connect(g); g.connect(master); o.start(t); o.stop(t + 1.3); });
      tone('sine', 58, 26, 1.1, .7, .002); burst(.7, .42, .002, .6, 'highpass', 1800); A.splash(1.8);
    },
    // 심장 — 쿵, 쿵
    heart(k) {
      if (!k) { if (heartT) { clearInterval(heartT); heartT = null; } return; }
      if (heartT) return;
      const beat = () => { tone('sine', 62, 38, .16, .42, .004); setTimeout(() => tone('sine', 55, 34, .14, .3, .004), 150); };
      beat(); heartT = setInterval(beat, 640);
    },
    stroke() { burst(.18, .09, .005, .12, 'lowpass', 1800 + Math.random() * 600); },
    sprint() { burst(.25, .14, .005, .18, 'lowpass', 2400); },
    splash(size) { size = size || 1; burst(.5, .32 * Math.min(1.6, size), .01, .35 + .15 * size, 'lowpass', 2200 + 600 * size); tone('sine', 220, 70, .2, .1 * size, .005); },
    // 속삭임 — 띠 통과 잡음을 빠르게 흔든다
    whisper() {
      const c = ac(), t = c.currentTime, n = c.createBufferSource(); n.buffer = noiseBuf(c, 2); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 6; f.frequency.setValueAtTime(900, t);
      for (let i = 0; i < 9; i++) f.frequency.linearRampToValueAtTime(600 + Math.random() * 1600, t + .1 + i * .13);
      const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .15); g.gain.linearRampToValueAtTime(.06, t + .8); g.gain.linearRampToValueAtTime(0, t + 1.4);
      const p = c.createStereoPanner ? c.createStereoPanner() : null; if (p) p.pan.value = Math.random() * 2 - 1;
      n.connect(f); f.connect(g); if (p) { g.connect(p); p.connect(master); } else g.connect(master); n.start(t); n.stop(t + 1.5);
    },
    rise() { tone('sine', 180, 60, 1.2, .12, .3); burst(.6, .06, .2, .4, 'highpass', 3000); },
    // 붙잡힘 — 쾅 + 큰 물보라
    grab() { tone('sine', 90, 28, .7, .5, .003); burst(.6, .4, .01, .5, 'lowpass', 900); A.splash(1.5); },
    kick() { burst(.12, .16, .003, .09, 'lowpass', 900); tone('sine', 140, 60, .1, .12, .003); },
    pull() { tone('sawtooth', 70, 40, .5, .07, .1); },
    // 풀려남 — 위로 솟구침 + 숨 몰아쉬기
    free() { A.splash(1.8); tone('sine', 120, 480, .35, .12, .02); setTimeout(() => burst(.5, .22, .05, .4, 'bandpass', 1400, 1.5), 300); setTimeout(() => burst(.4, .16, .05, .3, 'bandpass', 1100, 1.5), 900); },
    wail() { const c = ac(), t = c.currentTime, o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(160, t + 1.6); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700; const g = c.createGain(); env(g, t, .2, 1.4, .07); o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 1.8); },
    // 가라앉음 — 방울 소리 몇 개, 아래로
    drown() { for (let i = 0; i < 7; i++) setTimeout(() => tone('sine', 900 - i * 90 + Math.random() * 200, 300, .12, .08, .005), i * 260); tone('sine', 60, 30, 2.5, .3, .05); },
    lamp() { [784, 1175].forEach((f, i) => setTimeout(() => tone('sine', f, f, .5, .12, .01), i * 90)); burst(.2, .06, .005, .15, 'lowpass', 2000); },
    miss() { tone('triangle', 330, 220, .25, .1, .01); },
    gameover() { [330, 262, 196].forEach((f, i) => setTimeout(() => tone('triangle', f, f * .9, .8, .14, .02), i * 420)); },
    // 해냈을 때 — 산사 종이 한 번 낮게 울리고 여운이 길게 깔린다. 밝은 장조 오르골은 "너무 상큼하다"(2026-09-16)
    clear() {
      const c = ac(), t = c.currentTime, lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600; lp.connect(master);
      burst(.12, .22, .002, .1, 'lowpass', 420);   // 당목이 닿는 둔한 소리
      [[82, .34, 6.5], [164.8, .16, 5], [219.5, .11, 4.2], [262.4, .07, 3.2], [331, .05, 2.4], [446, .03, 1.6]].forEach(([f, pk, len], i) => {   // 종의 비화음 배음
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f, t);
        const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .9 + i * .35; lg.gain.value = f * .004; lfo.connect(lg); lg.connect(o.frequency);   // 맥놀이 — 우웅 우웅
        const g = c.createGain(); env(g, t, .004, len, pk);
        o.connect(g); g.connect(lp); o.start(t); lfo.start(t); o.stop(t + len + .2); lfo.stop(t + len + .2);
      });
      tone('sine', 41, 40, 5.5, .16, .3);   // 밑에 깔리는 낮은 울림
    },
    // 흔적 — 오르골 몇 음이 멀리서 울린다
    memory() {   // 동생 흔적 — 태엽이 다 풀려 가는 오르골. 단조로 느리게 내려가고, 음이 늘어지고, 메아리가 남는다
      const c = ac(), t = c.currentTime, dl = c.createDelay(1.5), fb = c.createGain(), wet = c.createGain(), lp = c.createBiquadFilter();
      dl.delayTime.value = .42; fb.gain.value = .45; wet.gain.value = .5; lp.type = 'lowpass'; lp.frequency.value = 2200;
      lp.connect(master); lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(master);
      [784, 740, 622, 587, 523, 466, 392].forEach((f, i) => { const at = t + i * (.46 + i * .07), slow = 1 - i * .012;
        const o = c.createOscillator(), o2 = c.createOscillator(); o.type = 'sine'; o2.type = 'sine';
        o.frequency.setValueAtTime(f * slow, at); o.frequency.linearRampToValueAtTime(f * slow * .985, at + 1.2); o2.frequency.value = f * 2.99;
        const g = c.createGain(), g2 = c.createGain(); env(g, at, .006, 1.3, .05); env(g2, at, .003, .3, .012);
        o.connect(g); o2.connect(g2); g.connect(lp); g2.connect(lp); o.start(at); o2.start(at); o.stop(at + 1.5); o2.stop(at + .5); });
      tone('sine', 55, 49, 4.2, .12, 1.2);   // 밑에 깔리는 낮은 울림
    },
    // 풀려남 — 따뜻한 화음이 천천히 부풀었다가 번진다
    release() { const c = ac(), t = c.currentTime; [262, 330, 392, 523, 659].forEach((f, i) => { const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + 1.6 + i * .2); g.gain.linearRampToValueAtTime(.035, t + 5); g.gain.exponentialRampToValueAtTime(.0005, t + 9); o.connect(lp); lp.connect(g); g.connect(master); o.start(t); o.stop(t + 9.2); });  },
    // 소금 뿌리기 — 싸락 흩어지는 소리
    saltThrow() { burst(.35, .2, .005, .3, 'highpass', 3800); for (let i = 0; i < 6; i++) setTimeout(() => burst(.03, .07, .001, .025, 'bandpass', 5000 + Math.random() * 3000, 4), 60 + Math.random() * 280); },
    // 엔딩 — 동생의 비명. 여자아이 목소리(성대 톱니 + 입모양 공명 두 개)가 높이 치솟다가
    // 끝으로 갈수록 음이 무너지고 공명이 뒤틀려 물귀신 소리로 변한다. 약 2.6초 (2026-09-16 사장님)
    girlScream() {
      const c = ac(), t = c.currentTime, L = 2.6;
      const out = c.createGain(); out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(.22, t + .08); out.gain.setValueAtTime(.22, t + 1.6); out.gain.exponentialRampToValueAtTime(.001, t + L);
      // 뚝뚝 끊긴다 — 테이프가 씹히듯 소리가 잘렸다 이어진다. 뒤로 갈수록 잦고 길게 (2026-09-16 사장님)
      const cut = c.createGain(); cut.gain.setValueAtTime(1, t);
      for (let x = t + .18; x < t + L; ) {
        const k = (x - t) / L, on = .05 + Math.random() * (.22 - k * .16), off = .02 + Math.random() * (.04 + k * .12);
        x += on; cut.gain.setValueAtTime(0, x); x += off; cut.gain.setValueAtTime(1, x);
      }
      const shaper = c.createWaveShaper(); { const n = 512, cv = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; cv[i] = Math.tanh(x * 2.6); } shaper.curve = cv; }   // 목이 찢어지듯 거칠게
      shaper.connect(out); out.connect(cut); cut.connect(master);
      const f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), f3 = c.createBiquadFilter();
      f1.type = f2.type = f3.type = 'bandpass'; f1.Q.value = 5; f2.Q.value = 7; f3.Q.value = 9;
      f1.frequency.setValueAtTime(1050, t); f1.frequency.linearRampToValueAtTime(900, t + 1.4); f1.frequency.exponentialRampToValueAtTime(420, t + L);      // '아' 입모양이
      f2.frequency.setValueAtTime(2900, t); f2.frequency.linearRampToValueAtTime(3300, t + 1.2); f2.frequency.exponentialRampToValueAtTime(1500, t + L);   // 끝에서 일그러진다
      f3.frequency.setValueAtTime(4200, t);
      const g1 = c.createGain(), g2 = c.createGain(), g3 = c.createGain(); g1.gain.value = 1; g2.gain.value = .7; g3.gain.value = .25;
      f1.connect(g1); f2.connect(g2); f3.connect(g3); g1.connect(shaper); g2.connect(shaper); g3.connect(shaper);
      [0, 1].forEach(j => {   // 두 겹 — 살짝 어긋나 한 목소리가 둘로 갈라진 듯
        const o = c.createOscillator(); o.type = 'sawtooth';
        const f0 = 620 + j * 9;
        o.frequency.setValueAtTime(f0 * .8, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.45, t + .35); o.frequency.linearRampToValueAtTime(f0 * 1.5, t + 1.4);
        o.frequency.exponentialRampToValueAtTime(f0 * .42, t + 2.2); o.frequency.exponentialRampToValueAtTime(f0 * .26, t + L);   // 무너져 내린다
        const vib = c.createOscillator(), vg = c.createGain(); vib.frequency.setValueAtTime(6, t); vib.frequency.linearRampToValueAtTime(19 + j * 4, t + L); vg.gain.setValueAtTime(12, t); vg.gain.linearRampToValueAtTime(90, t + L);   // 떨림이 점점 거칠어진다
        vib.connect(vg); vg.connect(o.frequency);
        o.connect(f1); o.connect(f2); o.connect(f3); o.start(t); vib.start(t); o.stop(t + L + .1); vib.stop(t + L + .1);
      });
      { const b = burst(L, .08, .05, L - .1, 'bandpass', 2400, .9, cut); }   // 거친 숨 — 같이 끊긴다
    },
    // 물귀신 비명 — 찢어지는 높은 소리가 뒤틀리며 꺼진다
    shriek() {
      const c = ac(), t = c.currentTime;
      [0, 1].forEach(j => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(700 + j * 37, t); o.frequency.exponentialRampToValueAtTime(1500 + j * 90, t + .25); o.frequency.exponentialRampToValueAtTime(180, t + 1.1);
        const lfo = c.createOscillator(); lfo.frequency.value = 23 + j * 6; const lg = c.createGain(); lg.gain.value = 120; lfo.connect(lg); lg.connect(o.frequency);
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 1.2; const g = c.createGain(); env(g, t, .02, 1.05, .09);
        o.connect(f); f.connect(g); g.connect(master); o.start(t); lfo.start(t); o.stop(t + 1.2); lfo.stop(t + 1.2); });
      burst(1.0, .16, .01, .9, 'bandpass', 2600, .8);
    },
    // 깜짝 등장 — 불협 현악 찌르기 + 쾅 + 쇳소리 긁힘, 끝에 숨 들이켜기
    jump() {
      const c = ac(), t = c.currentTime;
      [311, 330, 466, 494, 622, 659, 988].forEach((f, j) => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * (1 + (j % 2 ? .012 : -.012)), t + .9);
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = .7; const g = c.createGain(); env(g, t, .003, .95, .075); o.connect(bp); bp.connect(g); g.connect(master); o.start(t); o.stop(t + 1.1); });
      tone('sine', 110, 24, 1.2, .95, .001); tone('square', 55, 30, .35, .18, .001);
      burst(.9, .55, .001, .7, 'highpass', 1400); burst(.4, .5, .001, .3, 'lowpass', 600);
      { const b = burst(1.2, .14, .02, 1.0, 'bandpass', 3800, 6); b.f.frequency.exponentialRampToValueAtTime(1200, b.t + 1.0); }   // 쇳소리 긁힘
      setTimeout(() => { const b = burst(.4, .22, .02, .3, 'bandpass', 900, 1.5); b.f.frequency.exponentialRampToValueAtTime(2800, b.t + .3); }, 60);
    },
    // 확 달려듦 — 숨 들이켜는 소리 + 쿵
    lunge() { const b = burst(.35, .3, .01, .28, 'bandpass', 900, 1.5); b.f.frequency.exponentialRampToValueAtTime(3200, b.t + .25); tone('sine', 80, 30, .5, .5, .002); setTimeout(() => A.whisper(), 120); },
    // 텐트 뒤지기 — 부스럭 세 번
    rummage() { for (let i = 0; i < 3; i++) setTimeout(() => burst(.16, .16, .01, .12, 'bandpass', 1500 + Math.random() * 1500, 1.2), i * 130); setTimeout(() => tone('triangle', 520, 520, .12, .06, .005), 420); },
    // 촛불 — 성냥 긋는 소리 + 낮은 울림
    candle() { burst(.25, .14, .005, .2, 'highpass', 2600); setTimeout(() => tone('sine', 330, 330, 1.4, .07, .2), 180); },
    // 유품 — 작은 반짝임
    // 유품을 줍는다 — 물에 빠져 죽은 사람들의 물건이라 밝은 소리를 쓰지 않는다.
    // 젖은 흙에서 쑥 뽑히는 소리 + 낮게 내려앉는 쇳소리 + 살짝 어긋난 두 음, 한 박자 뒤 등 뒤에서 새는 숨
    pick() {   // 2026-09-16 "소리가 너무 경쾌하다" — 높은 물방울·맑은 음을 빼고 낮게 가라앉는 소리만
      const c = ac(), t = c.currentTime;
      burst(.35, .26, .02, .3, 'lowpass', 380);                                          // 물속에서 둔하게 끌려 나온다
      tone('sine', 70, 38, 1.4, .34, .004);                                               // 쿵 — 가슴 밑으로 내려앉는다
      { const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07, t + .6); g.gain.exponentialRampToValueAtTime(.0005, t + 2.6); g.connect(master);
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.connect(g);
        [98, 103.8, 146.8].forEach(f => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * .97, t + 2.6); o.connect(lp); o.start(t); o.stop(t + 2.7); }); }   // 반음 어긋난 낮은 울림이 부풀었다 꺼진다
      setTimeout(() => { const b = burst(.9, .07, .3, .55, 'bandpass', 700, .9); b.f.frequency.exponentialRampToValueAtTime(260, b.t + .8); }, 450);   // 한 박자 뒤, 등 뒤에서 새는 숨
    },
    // 석등에 불 — 확 붙는 소리
    ignite() { const b = burst(.7, .22, .02, .55, 'bandpass', 500, .8); b.f.frequency.exponentialRampToValueAtTime(2200, b.t + .35); for (let i = 0; i < 5; i++) setTimeout(() => burst(.03, .08, .001, .025, 'highpass', 3000), 200 + Math.random() * 500); tone('sine', 110, 90, .6, .08, .05); },
    // 수문 바퀴 — 녹슨 쇠가 끼익
    creak() { const c = ac(), t = c.currentTime, o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(140 + Math.random() * 40, t); o.frequency.linearRampToValueAtTime(95, t + .35); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 5; const g = c.createGain(); env(g, t, .04, .32, .09); o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + .45); burst(.05, .1, .002, .04, 'bandpass', 2400, 3); },
    // 수문이 닫힘 — 쿵 + 물소리가 잦아든다
    clunk() { tone('sine', 70, 34, .9, .5, .003); burst(.5, .35, .005, .45, 'lowpass', 500); setTimeout(() => { const b = burst(1.6, .18, .05, 1.5, 'lowpass', 1800); b.f.frequency.exponentialRampToValueAtTime(200, b.t + 1.4); }, 250); },
    step() { burst(.09, .10, .003, .07, 'lowpass', 520); },
    // 소쩍새 — "소쩍" 하고 네 번 운다. 앞의 '소'는 짧게 스치고 '쩍'이 낮게 떨어진다.
    // 맑은 피리 소리라 천천히 열고(어택 .035) 높은 배음은 아주 옅게만 섞는다
    owl() {
      const c = ac();
      for (let i = 0; i < 4; i++) {
        const at = i * 1450 + (Math.random() * 90 | 0), dim = i === 3 ? .78 : 1, dt = (Math.random() - .5) * 26;
        setTimeout(() => {
          const t = ac().currentTime;
          tone('sine', 1090 + dt, 1010 + dt, .055, .017 * dim, .012);                    // 소 — 짧게 스친다
          const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(838 + dt, t + .085); o.frequency.exponentialRampToValueAtTime(788 + dt, t + .33);
          const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(1676 + dt * 2, t + .085); o2.frequency.exponentialRampToValueAtTime(1576 + dt * 2, t + .33);
          const vb = c.createOscillator(); vb.frequency.value = 6.4; const vg = c.createGain(); vg.gain.value = 4.5; vb.connect(vg); vg.connect(o.frequency);   // 아주 옅은 떨림
          const g = c.createGain(), g2 = c.createGain();
          g.gain.setValueAtTime(0, t); g2.gain.setValueAtTime(0, t);   // 소리보다 봉투를 늦게 열면 그 틈에 볼륨이 1 이라 딱 하고 튄다
          env(g, t + .085, .035, .25, .046 * dim); env(g2, t + .085, .04, .18, .007 * dim);
          const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
          o.connect(g); o2.connect(g2); g.connect(lp); g2.connect(lp); lp.connect(master);
          [o, o2, vb].forEach(x => { x.start(t); x.stop(t + .5); });
        }, at);
      }
    },
  };
  window.AUDIO = A;
})();
