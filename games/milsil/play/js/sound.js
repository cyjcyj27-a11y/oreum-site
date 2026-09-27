// 밀실 — 소리는 전부 Web Audio 로 만든다(파일 없음). SND.play('thud') / SND.bgm(true)
(function () {
  var ac = null, master, sfxG, bgmG, noiseBuf;
  var on = { sfx: true, bgm: true };
  try { on.sfx = localStorage.getItem('milsil.snd') !== '0'; on.bgm = localStorage.getItem('milsil.bgm') !== '0'; } catch (e) {}

  function init() {
    if (ac) return true;
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return false;
    ac = new C();
    master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    sfxG = ac.createGain(); sfxG.gain.value = on.sfx ? 1 : 0; sfxG.connect(master);
    bgmG = ac.createGain(); bgmG.gain.value = 0; bgmG.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    loadDoor();
    return true;
  }
  function t0() { return ac.currentTime; }
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function noise(t, dur, type, freq, q, peak, dec, dest) {
    var s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    var f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
    var g = ac.createGain(); env(g, t, 0.004, peak, dec);
    s.connect(f); f.connect(g); g.connect(dest || sfxG); s.start(t, Math.random()); s.stop(t + dur + dec + 0.1);
    return f;
  }
  function tone(t, freq, type, peak, dec, dest, a) {
    var o = ac.createOscillator(); o.type = type || 'sine'; o.frequency.value = freq;
    var g = ac.createGain(); env(g, t, a || 0.005, peak, dec);
    o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + (a || 0.005) + dec + 0.05);
    return o;
  }
  // 녹음 소리 한 번 재생
  var doorBuf = null;
  function sample(buf, t, gain) {
    var s = ac.createBufferSource(); s.buffer = buf;
    var g = ac.createGain(); g.gain.value = gain;
    s.connect(g); g.connect(sfxG); s.start(t);
  }
  function loadDoor() {
    if (doorBuf || !window.MILSIL_DOOR_MP3) return;
    var bin = atob(window.MILSIL_DOOR_MP3), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    try { ac.decodeAudioData(u.buffer, function (b) { doorBuf = b; }, function () {}); } catch (e) {}
  }
  function bell(t, f, peak, dest) {  // 괘종 소리: 어긋난 배음
    [[1, 1], [2.01, .5], [2.76, .35], [5.4, .18], [0.5, .4]].forEach(function (p) { tone(t, f * p[0], 'sine', peak * p[1], 3.2 / Math.sqrt(p[0]), dest); });
  }

  var S = {
    tick: function (t) { noise(t, .01, 'highpass', 3000, 1, .35, .03); },
    click: function (t) { noise(t, .01, 'bandpass', 2400, 3, .6, .04); tone(t, 1800, 'square', .05, .02); },
    thud: function (t) { noise(t, .05, 'lowpass', 260, 1, 1.2, .35); tone(t, 70, 'sine', .7, .3); },
    bigthud: function (t) { noise(t, .08, 'lowpass', 200, 1, 1.6, .6); tone(t, 55, 'sine', 1, .5); noise(t + .09, .03, 'bandpass', 900, 2, .4, .12); },
    rattle: function (t) { for (var i = 0; i < 5; i++) { noise(t + i * .055, .01, 'bandpass', 1500 + Math.random() * 800, 4, .7, .05); } tone(t, 120, 'triangle', .25, .15); },
    unlock: function (t) { noise(t, .01, 'bandpass', 2600, 4, .8, .05); noise(t + .12, .01, 'bandpass', 1900, 4, .9, .06); tone(t + .14, 1320, 'sine', .15, .6); tone(t + .2, 1760, 'sine', .1, .7); },
    drawer: function (t) {
      var f = noise(t, .45, 'bandpass', 500, 1.5, .5, .5); f.frequency.linearRampToValueAtTime(900, t + .45);
      noise(t + .48, .02, 'lowpass', 400, 1, .7, .15);
    },
    pickup: function (t) { [880, 1320, 1760].forEach(function (f, i) { tone(t + i * .06, f, 'triangle', .18, .35); }); },
    paper: function (t) { for (var i = 0; i < 6; i++) noise(t + i * .03 + Math.random() * .02, .02, 'highpass', 2500 + Math.random() * 2000, 1, .25, .05); },
    book: function (t) { noise(t, .03, 'lowpass', 700, 1, .9, .12); tone(t, 160, 'sine', .35, .1); },
    wrong: function (t) { for (var i = 0; i < 5; i++) { noise(t + i * .07, .03, 'lowpass', 600, 1, .7, .12); } tone(t, 90, 'sawtooth', .12, .4); },
    wind: function (t) { for (var i = 0; i < 14; i++) noise(t + i * .07, .008, 'bandpass', 3200, 6, .6, .03); },
    chime: function (t) { bell(t, 196, .32); },
    fire: function (t) { noise(t, .25, 'lowpass', 700, 1, .7, .9); },
    match: function (t) { noise(t, .12, 'highpass', 1800, 1, .7, .25); noise(t + .12, .3, 'bandpass', 700, 1, .5, .5); },
    // 문·옷장·냉장고가 열리는 소리: 녹음 파일(sounds/door.js). 못 읽었으면 아래 합성음
    creak: function (t) { if (doorBuf) { sample(doorBuf, t, .9); return; } S.synthCreak(t); },
    synthCreak: function (t) {
      var n = 34, dur = .85;
      for (var i = 0; i < n; i++) {
        var k = i / n, tt = t + dur * (k * .55 + k * k * .45);
        noise(tt, .004, 'bandpass', 1500 + 450 * Math.sin(k * 5), 22, .32 * (1 - k * .5), .02);
      }
      var o = tone(t, 980, 'triangle', .018, dur, null, .12); o.frequency.linearRampToValueAtTime(1240, t + dur * .6); o.frequency.linearRampToValueAtTime(1100, t + dur);
    },
    door: function (t) { S.creak(t); },
    swing: function (t) { noise(t, .2, 'bandpass', 400, 2, .3, .3); },
    clue: function (t) { [523, 659, 784, 1047].forEach(function (f, i) { tone(t + i * .09, f, 'triangle', .16, .9); }); },
    clear: function (t) { [392, 523, 659, 784, 1047].forEach(function (f, i) { tone(t + i * .12, f, 'triangle', .2, 1.4); tone(t + i * .12, f / 2, 'sine', .12, 1.4); }); },
    musicbox: function (t) {
      // 오르골: 높은 음이 톡톡 울리고 길게 사라진다(8초 남짓)
      var N = [76, 79, 84, 83, 79, 76, 74, 76, 79, 77, 74, 71, 72, 76, 74, 72, 71, 72];
      N.forEach(function (n, i) { var f = 440 * Math.pow(2, (n - 69) / 12), tt = t + i * .44 + (i % 3 === 2 ? .08 : 0);
        tone(tt, f, 'sine', .16, 1.4); tone(tt, f * 3.01, 'sine', .03, .35); tone(tt, f * 5.4, 'sine', .012, .15); });
    },
    // 찻물 붓기: 졸졸 흐르는 물(대역 소음이 떨린다)
    pour: function (t) {
      var f = noise(t, 1.2, 'bandpass', 1100, 3, .35, .35);
      for (var i = 0; i < 24; i++) f.frequency.setValueAtTime(900 + Math.random() * 900, t + i * .05);
      noise(t, 1.2, 'lowpass', 500, 1, .12, .3);
    },
    // 물방울 똑: 짧은 사인파가 위로 휙 올라간다
    drip: function (t) {
      var o = tone(t, 500 + Math.random() * 200, 'sine', .22, .09);
      o.frequency.exponentialRampToValueAtTime(1500 + Math.random() * 400, t + .05);
    },
    // 불에 물: 치익
    sizzle: function (t) {
      noise(t, 1.1, 'highpass', 3800, 1, .45, 1.2);
      for (var i = 0; i < 16; i++) noise(t + Math.random() * 1.4, .004, 'bandpass', 2500 + Math.random() * 2500, 6, .25, .03);
    },
    // 드라이버로 나사 돌리기: 드르륵
    screw: function (t) { for (var i = 0; i < 9; i++) noise(t + i * .045, .006, 'bandpass', 2200 + (i % 3) * 300, 8, .35, .03); },
    // 나사가 바닥에 떨어지는 쇳소리
    tink: function (t) { tone(t, 2600 + Math.random() * 800, 'sine', .12, .25); tone(t, 4100 + Math.random() * 600, 'sine', .05, .12); },
    // 성냥불이 확 붙는 소리
    whoosh: function (t) { var f = noise(t, .35, 'bandpass', 500, 1.2, .55, .45); f.frequency.linearRampToValueAtTime(1600, t + .3); },
    // 전기 불꽃 파직
    crackle: function (t) { for (var i = 0; i < 6; i++) noise(t + Math.random() * .12, .003, 'highpass', 3000 + Math.random() * 3000, 1, .5, .015); },
    spray: function (t) { noise(t, .35, 'highpass', 3500, 1, .35, .25); },
    water: function (t) { var f = noise(t, 2.2, 'bandpass', 900, .7, .5, .8); f.frequency.linearRampToValueAtTime(1300, t + 2.2); noise(t, 2.2, 'lowpass', 400, 1, .25, .8); },
    hum: function (t) { tone(t, 120, 'sawtooth', .05, 1.2, null, .3); tone(t, 240, 'sine', .04, 1.2, null, .3); noise(t, .8, 'bandpass', 3000, 8, .05, .6); },
    lamp: function (t) { noise(t, .01, 'bandpass', 3000, 5, .9, .03); noise(t + .05, .01, 'bandpass', 2000, 5, .5, .03); }
  };

  // 배경: 느린 단조 피아노(빗소리 잡음은 '윙' 소리로 들려 뺐다, 사장님 2026-09-25). 벽난로가 타면 탁탁 소리
  var rain = null, pianoT = 0, fireOn = false, fireT = 0;
  var SEQ = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]]; // Am F G E
  var MEL = [69, 72, 71, 67, 69, 64, 65, 64];
  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function piano(t, f, v) { tone(t, f, 'triangle', v, 2.4, bgmG, .01); tone(t, f * 2, 'sine', v * .25, 1.2, bgmG, .01); }
  function startRain() {
    if (rain) return;
    var s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    var f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
    var f2 = ac.createBiquadFilter(); f2.type = 'highpass'; f2.frequency.value = 300;
    var g = ac.createGain(); g.gain.value = .11;
    s.connect(f); f.connect(f2); f2.connect(g); g.connect(bgmG); s.start();
    rain = s;
  }
  var bar = 0;
  function loop() {
    if (!ac) return;
    var now = ac.currentTime;
    if (on.bgm && now > pianoT - .2) {
      var t = Math.max(now + .05, pianoT);
      var ch = SEQ[bar % 4];
      ch.forEach(function (n, i) { piano(t + i * .18, midi(n - 12), .05); });
      piano(t + 1.6, midi(MEL[(bar * 2) % 8]), .06);
      piano(t + 3.2, midi(MEL[(bar * 2 + 1) % 8]), .05);
      bar++; pianoT = t + 4.8;
    }
    // 벽난로 타닥 소리 반복은 이상하게 들려 뺐다(사장님 2026-09-25)
  }
  setInterval(loop, 60);

  window.SND = {
    unlock: function () { if (!init()) return; if (ac.state === 'suspended') ac.resume(); this.bgm(on.bgm); },
    play: function (n, delay) { if (!ac || !on.sfx || !S[n]) return; S[n](t0() + (delay || 0)); },
    bgm: function (v) { on.bgm = v; try { localStorage.setItem('milsil.bgm', v ? '1' : '0'); } catch (e) {} if (ac) bgmG.gain.setTargetAtTime(v ? .9 : 0, t0(), .3); },
    sfx: function (v) { on.sfx = v; try { localStorage.setItem('milsil.snd', v ? '1' : '0'); } catch (e) {} if (ac) sfxG.gain.setTargetAtTime(v ? 1 : 0, t0(), .05); },
    fire: function (v) { fireOn = v; },
    on: on
  };
})();
