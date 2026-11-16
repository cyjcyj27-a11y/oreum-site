// 소품 GLB(드릴·망치·정자) — 한 번만 읽어 두고 달라는 곳마다 사본을 준다. file:// 로 열면 <이름>.glb.js(base64) 로
(function () {
  const cache = {}, waiting = {};
  const parse = buf => new Promise((res, rej) => new window.GLTFLoaderClass().parse(buf, '', res, rej));
  function loadGLB(url) {
    if (location.protocol === 'file:') return new Promise((res, rej) => {
      const name = url.split('/').pop();
      const done = () => { const b64 = window.GLBJS && window.GLBJS[name]; if (!b64) return rej(new Error('no glbjs')); const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); window.GLBJS[name] = null; parse(u8.buffer).then(res, rej); };
      const s = document.createElement('script'); s.src = url + '.js'; s.onload = done; s.onerror = () => rej(new Error('load ' + s.src)); document.head.appendChild(s);
    });
    return fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(parse);
  }
  // get('drill.glb', {rough, metal}, fn) → fn(사본 Group). 같은 이름을 여러 곳에서 불러도 파일은 한 번만 읽는다
  function get(name, opt, fn) {
    if (typeof opt === 'function') { fn = opt; opt = {}; }
    if (cache[name]) { fn(cache[name].clone()); return; }
    if (waiting[name]) { waiting[name].push(fn); return; }
    waiting[name] = [fn];
    if (!window.GLTFLoaderClass) return;
    loadGLB('assets/models/' + name).then(g => {
      const root = g.scene;
      root.traverse(o => {
        if (!o.isMesh) return;
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        const m = o.material; m.roughness = opt.rough !== undefined ? opt.rough : 0.6; m.metalness = opt.metal !== undefined ? opt.metal : 0.15;
        if (m.map) { m.map.anisotropy = 8; m.map.needsUpdate = true; }
      });
      cache[name] = root; const fs = waiting[name]; delete waiting[name]; fs.forEach(f => f(root.clone()));
    }).catch(e => console.warn('prop', name, e));
  }
  window.PROPS = { get, loadGLB };
})();
