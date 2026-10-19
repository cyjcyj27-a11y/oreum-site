/* HUD: 상단 알약 숫자, 무기 칸, 조준점, 번쩍, 메시지 */
window.HUD = (function(){
class HUD {
  constructor(game){ this.g=game; this.el={hp:document.getElementById('hp'),ar:document.getElementById('ar'),am:document.getElementById('am'),ammok:document.getElementById('ammok'),kr:document.getElementById('kr'),ky:document.getElementById('ky'),kb:document.getElementById('kb'),slots:document.getElementById('slots'),xh:document.getElementById('xh'),flash:document.getElementById('flash'),msg:document.getElementById('msg')}; this.hot=false; this.msgT=null; this.flashT=null; this.last={}; this.buildSlots(); }
  buildSlots(){ this.el.slots.innerHTML=''; for(const w of DATA.WEAPONS){ const d=document.createElement('div'); d.className='s'; d.textContent=w.slot; d.dataset.id=w.id; d.addEventListener('pointerdown',e=>{ this.g.weapons.select(w.id); e.preventDefault(); }); this.el.slots.appendChild(d); } }
  weapons(){ const p=this.g.player; for(const d of this.el.slots.children){ d.classList.toggle('own',!!p.weapons[d.dataset.id]); d.classList.toggle('cur',d.dataset.id===p.cur); } const w=DATA.WEAPONS.find(x=>x.id===p.cur); this.el.ammok.textContent=(L.hud&&L.hud.ammo)?(w&&w.ammo?(L.hud.ammo[w.ammo]||w.ammo.toUpperCase()):L.hud.ammo.none):(w&&w.ammo?w.ammo.toUpperCase():'AMMO'); const a=w&&w.ammo?p.ammo[w.ammo]:'-'; this.el.am.textContent=a; this.el.am.classList.toggle('low',typeof a==='number'&&a<=8); this.last.am=a; }
  update(){ const p=this.g.player; if(this.last.hp!==p.hp){ this.el.hp.textContent=p.hp; this.el.hp.classList.toggle('low',p.hp<=25); this.last.hp=p.hp; } if(this.last.ar!==p.armor){ this.el.ar.textContent=p.armor; this.last.ar=p.armor; } this.el.kr.classList.toggle('on',p.keys.R); this.el.ky.classList.toggle('on',p.keys.Y); this.el.kb.classList.toggle('on',p.keys.B); const w=DATA.WEAPONS.find(x=>x.id===p.cur); const a=w&&w.ammo?p.ammo[w.ammo]:'-'; if(this.last.am!==a){ this.el.am.textContent=a; this.el.am.classList.toggle('low',typeof a==='number'&&a<=8); this.last.am=a; } }
  hurtDir(angleRad){ const e=document.getElementById('dmgdir'); if(!e) return; e.style.transform='translate(-50%,-50%) rotate('+(-angleRad)+'rad)'; e.style.opacity='1'; clearTimeout(this.ddT); this.ddT=setTimeout(()=>{ e.style.opacity='0'; },650); }
  hitmark(kind){ const x=this.el.xh; x.classList.remove('hm','hk','hh'); void x.offsetWidth; x.classList.add(kind===2?'hk':kind===3?'hh':'hm'); clearTimeout(this.hmT); this.hmT=setTimeout(()=>x.classList.remove('hm','hk','hh'),kind===3?240:180); }   // 3=머리
  setHot(h){ if(h!==this.hot){ this.hot=h; this.el.xh.classList.toggle('hot',h); } }
  flash(kind){ const f=this.el.flash; f.className=kind==='pick'?'pick':''; f.style.opacity='1'; clearTimeout(this.flashT); this.flashT=setTimeout(()=>{ f.style.opacity='0'; },kind==='pick'?120:200); }
  msg(t){ this.el.msg.textContent=t; this.el.msg.style.opacity='1'; clearTimeout(this.msgT); this.msgT=setTimeout(()=>{ this.el.msg.style.opacity='0'; },1800); }
}
return {HUD};
})();
