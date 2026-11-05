// HOW TO PLAY: 처음 START 때 한 번, 그 뒤엔 ? 단추. 칸 셋(만들기·포장·택배), 칸마다 움직이는 그림 + 짧은 글.
(function () {
  const H = (window.HOW = {});
  const css = `
#how .cells{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:6px 0 4px}
#how .cell{background:#fff;border-radius:16px;padding:8px 8px 10px;box-shadow:0 0 0 2px #ffc9da,0 3px 0 #f0b3c8}
#how svg{width:100%;height:auto;display:block;border-radius:12px;background:#fff5f0}
#how p{font-size:15px;line-height:1.35;margin-top:6px}
#how p b{font:17px 'Ttl','Ui',sans-serif;color:#d9547e;display:block;margin-bottom:2px}
#how .mal{animation:mal 1.1s cubic-bezier(.6,0,.4,1) infinite;transform-origin:80px 20px}
@keyframes mal{0%,30%{transform:rotate(-28deg)}45%{transform:rotate(6deg)}55%,100%{transform:rotate(-28deg)}}
#how .dough{animation:dough 1.1s infinite;transform-origin:60px 78px}
@keyframes dough{0%,40%{transform:scale(1,1)}47%{transform:scale(1.25,.72)}60%{transform:scale(.95,1.06)}70%,100%{transform:scale(1,1)}}
#how .ringA{animation:ringA 1.1s linear infinite;transform-origin:60px 74px}
@keyframes ringA{0%{transform:scale(1.9);opacity:.9}43%{transform:scale(1);opacity:1}44%{opacity:0}100%{opacity:0}}
#how .pc{animation:pc 1.8s cubic-bezier(.5,0,.3,1) infinite}
@keyframes pc{0%,10%{transform:translate(0,0)}45%{transform:translate(58px,-26px)}60%,100%{transform:translate(58px,-8px)}}
#how .hand{animation:pc 1.8s cubic-bezier(.5,0,.3,1) infinite}
#how .tape{animation:tape 1.6s ease-in-out infinite;transform-origin:20px 50px}
@keyframes tape{0%,10%{transform:scaleX(.02)}70%,100%{transform:scaleX(1)}}
#how .dot{animation:dot 1.6s ease-in-out infinite}
@keyframes dot{0%,10%{transform:translateX(0)}70%,100%{transform:translateX(80px)}}
@media (max-aspect-ratio:1/1){#how .cells{grid-template-columns:1fr}#how .cell{display:grid;grid-template-columns:120px 1fr;gap:10px;align-items:center;text-align:left}#how p{margin:0}}
@media (max-height:480px) and (min-aspect-ratio:1/1){#how .sheet{padding:16px 14px 12px}#how h2{font-size:26px;margin-bottom:6px}#how p{font-size:13px}}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'how'; ov.hidden = true;
  const svgMake = `<svg viewBox="0 0 120 100">
    <rect x="12" y="70" width="96" height="16" rx="6" fill="#ffe3c4"/>
    <ellipse class="ringA" cx="60" cy="74" rx="22" ry="7" fill="none" stroke="#7ff0b0" stroke-width="3"/>
    <ellipse cx="60" cy="74" rx="22" ry="7" fill="none" stroke="#ff7aa8" stroke-width="2.5"/>
    <g class="dough"><ellipse cx="60" cy="66" rx="18" ry="13" fill="#fffaf2" stroke="#ead9c2" stroke-width="2"/></g>
    <g class="mal"><rect x="76" y="14" width="8" height="40" rx="4" fill="#f3cfa6" transform="rotate(-60 80 20)"/><rect x="40" y="36" width="34" height="22" rx="8" fill="#f8dcbc" stroke="#ff9ec0" stroke-width="3"/></g></svg>`;
  const svgPack = `<svg viewBox="0 0 120 100">
    <rect x="58" y="44" width="52" height="40" rx="6" fill="#ffd6e4" stroke="#f3a9c2" stroke-width="2"/>
    <line x1="84" y1="46" x2="84" y2="82" stroke="#fff" stroke-width="3"/>
    <circle cx="71" cy="64" r="7" fill="#e9c46a" opacity=".45"/><circle cx="97" cy="64" r="7" fill="#e9c46a" opacity=".45"/>
    <rect x="12" y="66" width="34" height="18" rx="5" fill="#fff" stroke="#f3d6e1" stroke-width="2"/>
    <g class="pc"><rect x="18" y="58" width="20" height="13" rx="4" fill="#f4d98a" stroke="#d2a64e" stroke-width="2"/></g>
    <g class="hand"><path d="M40 78 l6 -14 l4 12 l-4 -2 z" fill="#ff6f9c"/></g></svg>`;
  const svgShip = `<svg viewBox="0 0 120 100">
    <rect x="20" y="40" width="80" height="44" rx="6" fill="#e9c49a" stroke="#c39566" stroke-width="2"/>
    <line x1="20" y1="50" x2="100" y2="50" stroke="#c39566" stroke-width="2"/>
    <rect class="tape" x="20" y="46" width="80" height="8" rx="2" fill="#f6dfb6" opacity=".9"/>
    <g class="dot"><circle cx="20" cy="50" r="7" fill="#ff6f9c"/><circle cx="20" cy="50" r="3" fill="#fff"/></g>
    <rect x="60" y="58" width="30" height="20" rx="3" fill="#fff"/><rect x="60" y="58" width="30" height="5" fill="#ff7aa8"/></svg>`;
  const tx = (ko, en) => L(ko, en);
  ov.innerHTML = `<div class="sheet"><h2>HOW TO PLAY</h2><div class="cells">
    <div class="cell">${svgMake}<p><b>${tx('만들기', 'MAKE')}</b>${tx('초록 고리가 겹칠 때 클릭! 송편은 꾹 누르다 초록에서 떼기', 'Click when the green ring meets! Hold songpyeon, let go on green')}</p></div>
    <div class="cell">${svgPack}<p><b>${tx('포장', 'PACK')}</b>${tx('떡을 같은 색 칸에 넣고, 뚜껑·보자기·스티커를 차례로 클릭', 'Drop ddeok on matching dots, then click lid, wrap, sticker')}</p></div>
    <div class="cell">${svgShip}<p><b>${tx('택배', 'SHIP')}</b>${tx('주문서 수만큼 아이스팩, 뽁뽁이, 테이프는 끝까지 쭉 끌기', 'Ice packs as the order says, bubble wrap, drag the tape all the way')}</p></div>
  </div><button class="btn" id="howOk">OK</button></div>`;
  document.body.appendChild(ov);
  let cb = null;
  H.open = function (done) {
    cb = done || null; ov.hidden = false; G.paused = true;
  };
  document.getElementById('howOk').onclick = () => {
    if (window.SND) SND.click();
    ov.hidden = true; G.paused = false;
    G.save.how = true; G.store();
    const f = cb; cb = null; if (f) f();
  };
  document.getElementById('tHow').onclick = (e) => { e.stopPropagation(); H.open(); };
})();
