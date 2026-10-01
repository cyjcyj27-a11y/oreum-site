// fx.js — 떠오르는 글자, 3D 자리에 뜨는 이모지
(function () {
  const $ = id => document.getElementById(id);
  let praiseT = 0;
  function praise(text) {
    const el = $('praise');
    el.textContent = text;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    praiseT = 1.8;
  }
  const _v = new THREE.Vector3();
  function pop(text, pos) {
    const el = document.createElement('div');
    el.className = 'pop';
    el.textContent = text;
    _v.set(pos.x, pos.y + 1.9, pos.z).project(T.camera);
    el.style.left = ((_v.x + 1) / 2 * innerWidth) + 'px';
    el.style.top = ((1 - _v.y) / 2 * innerHeight) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }
  function update(dt) {
    if (praiseT > 0) { praiseT -= dt; if (praiseT <= 0) $('praise').classList.remove('on'); }
  }
  window.FX = { praise, pop, update };
})();
