// 화면 글·창: 상단바, 큰 글자, 떠오르는 +1, START·HOW·햄스터·GAME OVER·THE END.
(function () {
  const UI = (window.UI = {});
  const $ = (id) => document.getElementById(id);
  const S = () => GAME.S;
  let openId = null, after = null;

  function lang() { document.querySelectorAll('[data-ko]').forEach((e) => { e.textContent = window.EN ? e.dataset.en : e.dataset.ko; }); }
  function show(id) { ['cont', 'how', 'shop', 'over', 'end'].forEach((k) => { $(k).hidden = k !== id; }); openId = id; }
  function hide() { if (openId) $(openId).hidden = true; if (openId === 'how') HOW.stop(); openId = null; }
  UI.sheetOpen = () => !!openId;

  UI.init = function () {
    lang();
    $('tBgm').classList.toggle('off', !SND.bgm); $('tSfx').classList.toggle('off', !SND.sfx);
    const tap = (id, f) => $(id).addEventListener('click', (e) => { e.stopPropagation(); SND.unlock(); SND.tap(); f(); });
    tap('bStart', () => { if (S().save.stage > 0) { $('bContT').textContent = 'STAGE ' + (S().save.stage + 1); show('cont'); } else go(0, true); });
    tap('bCont', () => { hide(); go(S().save.stage, false); });
    tap('bNew', () => { hide(); S().save.stage = 0; GAME.persist(); go(0, true); });
    tap('bShop', () => UI.shop());
    tap('bOShop', () => UI.shop());
    tap('bShopX', () => { hide(); if (after) { const f = after; after = null; f(); } });
    tap('bHowOk', () => { hide(); S().save.how = true; GAME.persist(); if (after) { const f = after; after = null; f(); } else if (S().mode === 'pause') S().mode = 'play'; });
    tap('tHelp', () => { if (S().mode === 'play') S().mode = 'pause'; UI.how(); });
    tap('tBgm', () => UI.toggleBgm());
    tap('tSfx', () => UI.toggleSfx());
    tap('bRetry', () => { hide(); GAME.reset(); GAME.startStage(Math.min(S().stage, DATA.STAGES - 1), false); playing(true); });
    tap('bHome', () => UI.title());
    tap('bEndHome', () => UI.title());
    tap('bSave', () => CARD.save());
    tap('bShare', () => CARD.share());
    // 창 바깥 누르면 닫기(설명·햄스터만)
    ['how', 'shop'].forEach((k) => $(k).addEventListener('click', (e) => { if (e.target === $(k)) { if (k === 'how') $('bHowOk').click(); else $('bShopX').click(); } }));
  };
  function playing(on) { document.body.classList.toggle('playing', on); $('hud').hidden = !on; $('title').hidden = on; }
  function go(stage, fresh) {
    const start = () => { GAME.reset(); GAME.startStage(stage, fresh); playing(true); };
    if (!S().save.how) { after = start; UI.how(); } else start();
  }
  UI.title = function () { hide(); playing(false); GAME.reset(); GAME.toTitle(); };
  UI.how = function () { show('how'); HOW.start(); };
  UI.enter = function () { const b = { cont: 'bCont', how: 'bHowOk', shop: 'bShopX', over: 'bRetry', end: 'bEndHome' }[openId]; if (b) $(b).click(); };
  UI.esc = function () { if (openId === 'how') $('bHowOk').click(); else if (openId === 'shop') $('bShopX').click(); else if (openId === 'cont') hide(); };
  UI.toggleBgm = function () { SND.setBgm(!SND.bgm); $('tBgm').classList.toggle('off', !SND.bgm); };
  UI.toggleSfx = function () { SND.setSfx(!SND.sfx); $('tSfx').classList.toggle('off', !SND.sfx); };

  UI.hud = function () {
    const s = S(), st = Math.min(s.stage, DATA.STAGES - 1);
    $('sSt').textContent = s.final ? 'GOAL' : (st + 1) + '/' + DATA.STAGES;
    $('sZn').textContent = s.final ? '' : DATA.name(DATA.stage(st).zone);
    $('sCk').textContent = s.cheek + '/' + DATA.CHEEK;
    $('sMt').firstChild.style.width = (s.cheek / DATA.CHEEK * 100) + '%';
    $('sMt').classList.toggle('full', s.cheek >= DATA.CHEEK);
    $('sBk').textContent = s.save.bank;
  };
  UI.banner = function (a, b, cl) {
    const bn = $('banner'); $('bnA').textContent = a; $('bnB').textContent = b || '';
    bn.hidden = false; bn.className = cl ? 'cl' : ''; void bn.offsetWidth; bn.classList.add('go');
  };
  const v3 = new THREE.Vector3();
  UI.float = function (x, y, z, txt, cls) {
    v3.set(x, y, z).project(WORLD.camera);
    const d = document.createElement('div'); d.className = 'fl ' + (cls || ''); d.textContent = txt;
    d.style.left = ((v3.x + 1) / 2 * innerWidth) + 'px'; d.style.top = ((1 - v3.y) / 2 * innerHeight) + 'px';
    document.body.appendChild(d); setTimeout(() => d.remove(), 850);
  };
  UI.toast = function (t) { const e = $('toast'); e.textContent = t; e.hidden = false; clearTimeout(UI._tt); UI._tt = setTimeout(() => { e.hidden = true; }, 1600); };

  UI.over = function () {
    const s = S();
    $('oSt').textContent = 'STAGE ' + (Math.min(s.stage, DATA.STAGES - 1) + 1) + ' · ' + DATA.name(DATA.stage(Math.min(s.stage, DATA.STAGES - 1)).zone);
    $('oBk').textContent = s.save.bank;
    show('over');
  };
  UI.end = async function () {
    show('end'); $('endImg').removeAttribute('src');
    const url = await CARD.make();
    if (url) $('endImg').src = url;
  };

  // ---------- 햄스터 고르기·사기 ----------
  UI.shop = function () {
    if (S().mode === 'play') S().mode = 'pause';
    if (openId === 'over') after = () => show('over');
    else if (S().mode === 'pause') after = () => { S().mode = 'play'; };
    else after = null;
    show('shop'); drawShop();
  };
  function drawShop() {
    const sv = S().save, gd = $('grid'); gd.innerHTML = ''; $('shBank').textContent = sv.bank;
    DATA.BREEDS.forEach((b) => {
      const own = sv.owned.includes(b.id), el = document.createElement('div');
      el.className = 'cell' + (sv.sel === b.id ? ' sel' : '') + (own ? '' : ' lock') + (!own && sv.bank < b.price ? ' poor' : '');
      const c = document.createElement('canvas'); c.width = c.height = 240; el.appendChild(c);
      const paint = () => { const g = c.getContext('2d'); g.clearRect(0, 0, 240, 240); HAM2D.draw(g, 120, 124, 2.5, b, 0.3); };
      paint(); PORT.get('ham', b, paint); // 사진이 늦게 나오면 다시 그림
      const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = DATA.name(b); el.appendChild(nm);
      const pr = document.createElement('div'); pr.className = 'pr';
      if (own) pr.textContent = sv.sel === b.id ? 'ON' : '';
      else pr.innerHTML = '<span class="seedI g"></span>' + b.price;
      el.appendChild(pr);
      el.addEventListener('click', () => {
        SND.unlock();
        if (own) { sv.sel = b.id; SND.tap(); }
        else if (sv.bank >= b.price) { sv.bank -= b.price; sv.owned.push(b.id); sv.sel = b.id; SND.gold(); }
        else { SND.full(); return; }
        GAME.persist(); GAME.makeHamster(); UI.hud(); drawShop();
      });
      gd.appendChild(el);
    });
  }
})();
