/* 게임 흐름: 타이틀 → HOW TO PLAY → 판 → 집계 → 다음 판 … 엔딩. 저장·설정·폰 조작 */
(function(){
const CS=2.0;
// 탄약 상자 색(무기마다 다르게, 10/19): 권총탄 노랑·기관총탄 파랑·산탄 빨강·로켓탄 주황·에너지 보라
const AMMO_COL={ammo:0x8c6b11,belt:0x1a468c,shells:0x5e100b,rockets:0x8c430e,cells:0x58238c}; /* 10/19 사장님 "검정 섞어 어둡게": 원래 색(노랑 ffc21e·파랑 2f7fff·빨강 e0261a·주황 ff7a1a·보라 a040ff)에 검정 45%, 산탄 상자는 사진이 밝아 검정 58% */
const $=id=>document.getElementById(id);
class Game {
  constructor(){
    this.canvas=$('c'); this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:false,powerPreference:'high-performance'}); this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5)); this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.scene=new THREE.Scene(); this.camera=new THREE.PerspectiveCamera(80,1,0.05,120); this.scene.add(this.camera);
    this.ambient=new THREE.AmbientLight(0xffffff,0.62); this.scene.add(this.ambient); this.handLight=new THREE.PointLight(0xffe0c0,0.9,2.5); this.handLight.position.set(0.2,0.1,-0.2); this.camera.add(this.handLight);
    this.touch=('ontouchstart' in window)||navigator.maxTouchPoints>0; if(this.touch) document.body.classList.add('touch');
    this.opts=Object.assign({blood:true,auto:false,bob:true,fov:false,sens:8},this.loadJSON('udoom.opt')||{});
    if(this.opts.autoOff1019!==1){ this.opts.auto=false; this.opts.autoOff1019=1; } /* 10/19 사장님 "폰 자동 발사를 처음부터 꺼 둬": 기본 끔, 전에 켜짐이 저장된 사람도 한 번 끔(그 뒤 설정에서 켜면 유지) */
    this.save=this.loadJSON('udoom.save');
    this.diff=(()=>{ try{ return localStorage.getItem('udoom.diff')||'normal'; }catch(e){ return 'normal'; } })(); this.playing=false; this.paused=false; this.time=0; this.level=0; this.god=false;
    this.player=new Player.Player(this); this.player.sens=this.opts.sens;
    this.hud=new HUD.HUD(this); this.weapons=new Weapons.Weapons(this); this.monsters=new Monsters.Manager(this); this.barrels=new Monsters.Barrels(this);
    this.items=[]; this.world=null; this.stats=null;
    this.player.bindInput(this.canvas);
    this.bindUI(); this.applyLang(); this.resize(); if(window.Embers) Embers.init(); window.addEventListener('resize',()=>this.resize());
    this.titleScene(); this.clock=performance.now(); this.loop=this.loop.bind(this); requestAnimationFrame(this.loop);
    this.weapons.load();
  }
  loadJSON(k){ try{ const s=localStorage.getItem(k); return s?JSON.parse(s):null; }catch(e){ return null; } }
  saveJSON(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
  applyLang(){ const T=(id,t)=>{ $(id).textContent=t; }; if(L.diff){ T('diffTtl',L.diff); T('dEasy',L.easy); T('dNormal',L.normal); T('dHard',L.hard); } const ten=$('ten'); if(ten) ten.style.display=(L.title==='UDOOM')?'none':''; if(L.hud){ const ks=document.querySelectorAll('#topbar .stat .k'); if(ks[0]) ks[0].textContent=L.hud.hp; if(ks[1]) ks[1].textContent=L.hud.ar; const tl=(id,t)=>{ const e=$(id); if(e) e.textContent=t; }; tl('lkills',L.hud.kills); tl('litems',L.hud.items); tl('lsecrets',L.hud.secrets); tl('ltime',L.hud.time); tl('lpar',L.hud.par); } { const lg=$('tlogo'); if(lg){ lg.src='assets/logo_'+(L.title==='UDOOM'?'en':'ko')+'.webp'; lg.alt=L.title==='UDOOM'?'UDOOM':'어둠 UDOOM'; } else T('ttl',L.title); } document.title=L.title; T('tsub',L.sub); T('bStart',L.start); T('bCont',L.cont); T('bOpt',L.opt); T('bLv',L.ep); T('howOk',L.ok); T('howp1',L.how1); T('howp2',L.how2); T('howp3',L.how3); T('ittl',L.clear); T('bNext',L.next); T('bRetry',L.retry); T('bHome',L.home); T('bResume',L.resume); T('bQuit',L.quit); T('bReset',L.reset); T('optTtl',L.opt); T('lvTtl',L.ep); T('o1',L.o1); T('o2',L.o2); T('o3',L.o3); T('o4',L.o4); T('o5',L.o5); $('keys').innerHTML=L.keys; T('endTtl',L.end); $('endTxt').innerHTML=L.endTxt; T('bEndHome',L.home); $('rotate').firstElementChild.textContent=L.rotate; T('rotBtn',L.rotBtn); if(this.save&&this.save.level>0) $('bCont').classList.remove('hide'); }
  resize(){ const w=window.innerWidth,h=window.innerHeight; this.renderer.setSize(w,h,false); this.camera.aspect=w/h; this.camera.fov=(this.opts.fov?95:80); this.camera.updateProjectionMatrix(); const land=w>=h; $('rotate').style.display=(this.touch&&!land)?'flex':'none'; }
  show(id){ $(id).classList.remove('hide'); } hide(id){ $(id).classList.add('hide'); }
  msg(t){ this.hud.msg(t); }
  bindUI(){
    const on=(id,f)=>$(id).addEventListener('click',e=>{ Audio3.resume(); Audio3.play('btn'); f(e); });
    on('bStart',()=>this.startNew()); on('dEasy',()=>this.chooseDiff('easy')); on('dNormal',()=>this.chooseDiff('normal')); on('dHard',()=>this.chooseDiff('hard')); on('diffX',()=>this.hide('diff')); on('bCont',()=>this.continueGame()); on('bOpt',()=>this.show('opts')); on('optX',()=>this.hide('opts'));
    on('bLv',()=>{ this.buildLvSel(); this.show('lvsel'); }); on('lvX',()=>this.hide('lvsel'));
    on('lvPill',()=>{ if(!this.playing) return; if(!this.paused) this.pause(true); this.hide('pause'); this.buildProg(); this.show('prog'); }); on('progX',()=>this.pause(false)); /* 10/19 위 판 번호 칸을 누르면 30판 전체 */
    on('howOk',()=>{ this.hide('how'); if(this.howFromGame){ this.howFromGame=false; this.pause(false); return; } this.saveJSON('udoom.how',1); this.beginLevel(this.level); });
    on('bNext',()=>{ this.hide('inter'); this.level++; if(this.level>=DATA.LEVELS){ this.show('ending'); this.saveJSON('udoom.save',Object.assign(this.snapshot(),{level:0,done:true})); return; } this.beginLevel(this.level); });
    on('bRetry',()=>{ this.hide('over'); this.beginLevel(this.level,true); }); on('bHome',()=>{ this.hide('over'); this.toTitle(); }); on('bEndHome',()=>{ this.hide('ending'); this.toTitle(); });
    on('bResume',()=>this.pause(false)); on('bQuit',()=>{ this.pause(false); this.toTitle(); });
    on('bReset',()=>{ localStorage.removeItem('udoom.save'); this.save=null; $('bCont').classList.add('hide'); this.hide('opts'); this.msg(L.reset); });
    $('tgPause').addEventListener('click',()=>{ if(this.playing) this.pause(!this.paused); });
    $('tgHow').addEventListener('click',()=>{ if(this.playing){ if(!this.paused) this.pause(true); this.hide('pause'); this.howFromGame=true; } this.drawHow(); this.show('how'); }); // 10/18: 일시정지 중에 눌러도 판 안에서 연 것으로(전엔 OK 누르면 판이 처음부터 다시 시작)
    const tb=$('tgBgm'), ts=$('tgSfx'); Audio3.init(); tb.classList.toggle('off',!Audio3.bgmOn); ts.classList.toggle('off',!Audio3.sfxOn);
    tb.addEventListener('click',()=>{ Audio3.resume(); Audio3.setBgm(!Audio3.bgmOn); tb.classList.toggle('off',!Audio3.bgmOn); }); ts.addEventListener('click',()=>{ Audio3.resume(); Audio3.setSfx(!Audio3.sfxOn); ts.classList.toggle('off',!Audio3.sfxOn); });
    const sw=(id,key)=>{ const e=$(id); e.classList.toggle('on',!!this.opts[key]); e.addEventListener('click',()=>{ this.opts[key]=!this.opts[key]; e.classList.toggle('on',!!this.opts[key]); this.saveJSON('udoom.opt',this.opts); this.resize(); }); };
    sw('swBlood','blood'); sw('swAuto','auto'); sw('swBob','bob'); sw('swFov','fov');
    $('rgSens').value=this.opts.sens; $('rgSens').addEventListener('input',e=>{ this.opts.sens=+e.target.value; this.player.sens=this.opts.sens; this.saveJSON('udoom.opt',this.opts); });
    $('rotBtn').addEventListener('click',()=>{ if(window.OL&&OL.go) OL.go(); else { const el=document.documentElement; try{ (el.requestFullscreen||el.webkitRequestFullscreen).call(el); }catch(e){} try{ screen.orientation.lock('landscape').catch(()=>{}); }catch(e){} } });
    document.addEventListener('visibilitychange',()=>{ if(document.hidden&&this.playing&&!this.paused) this.pause(true); });
  }
  onKey(e){ if(!this.playing) return; if(e.code==='Escape'){ this.pause(!this.paused); return; } if(this.paused) return; const n=parseInt(e.key); if(n>=1&&n<=6){ const w=DATA.WEAPONS.find(x=>x.slot===n); if(w) this.weapons.select(w.id); } if(e.code==='KeyE'||e.code==='Space') this.useAction(); }
  pause(v){ if(!this.playing) return; this.paused=v; if(v){ this.show('pause'); if(document.pointerLockElement) document.exitPointerLock(); } else { this.hide('pause'); this.hide('prog'); if(!this.touch) this.canvas.requestPointerLock&&this.canvas.requestPointerLock(); } }
  buildProg(){ const g=$('progGrid'); g.innerHTML=''; const n=this.level; $('progTtl').textContent='E'+(Math.floor(n/6)+1)+'M'+(n%6+1)+'  '+(L.lv[n]||''); for(let e=0;e<5;e++){ const h=document.createElement('div'); h.className='ep'; h.textContent=L.eps[e]; g.appendChild(h); for(let m=0;m<6;m++){ const i=e*6+m; const c=document.createElement('div'); c.className='c'+(i<n?' done':'')+(i===n?' cur':''); c.textContent=i+1; g.appendChild(c); } } }
  buildLvSel(){ const g=$('lvGrid'); g.innerHTML=''; const best=(this.save&&this.save.best)||0; for(let i=0;i<DATA.LEVELS;i++){ const d=document.createElement('div'); const open=i<=best; d.className='btn '+(open?'bone':''); d.style.minWidth='0'; d.style.padding='8px 4px'; d.style.fontSize='16px'; d.textContent=open?('E'+(Math.floor(i/6)+1)+'M'+(i%6+1)):L.lock; if(open) d.addEventListener('click',()=>{ Audio3.resume(); this.hide('lvsel'); this.level=i; this.player.fullReset(); if(i>0){ this.player.weapons.pistol=true; if(i>1) this.player.weapons.shotgun=true; if(i>3) this.player.weapons.chaingun=true; this.player.ammo.bullets=80; this.player.ammo.shells=16; if(i>3) this.player.ammo.belt=120; } this.beginLevel(i); }); g.appendChild(d); } }
  // ---- 타이틀 장면: 실제 1판을 만들어 카메라가 천천히 돈다 ----
  titleScene(){ this.clearLevel(); const def=DATA.levelDef(0); this.map=MapGen.gen(def); this.world=new World.World(this.scene,this.map,def.theme); this.scene.fog=new THREE.Fog(def.theme.fog,6,40); this.scene.background=new THREE.Color(def.theme.sky); FX.init(this.scene,this.world,this.opts); const r=this.map.rooms[0]; this.titleCam={x:this.map.start.x*CS,z:this.map.start.y*CS,t:0}; this.barrels.spawnAll(this.map.barrels.slice(0,3)); this.playing=false; this.show('title'); document.body.classList.remove('playing');
    // 타이틀 괴물 무리(10/17 사장님 "총이랑 괴물이라도 붙여봐"): 카메라 앞 복도에 서서 천천히 다가온다
    this.titleMons=[]; this.titleArmed=false; { const tc=this.titleCam; const zMin=r.y*CS+1.2, xMin=r.x*CS+1, xMax=(r.x+r.w)*CS-1; const list=[['zombie',-1.6,0.55],['zombie',1.2,0.05],['imp',0.2,0.0],['zombie',2.8,0.9],['pinky',-2.6,0.25]]; const zMax=tc.z-4.2;
      for(const [t,dx,dz] of list){ const z=zMin+Math.max(0,zMax-zMin)*dz, /* dz: 방 뒷벽~카메라 앞 사이 몇 할(방이 짧아 다 뒷벽에 붙던 것 10/17) */ x=Math.min(xMax,Math.max(xMin,tc.x+dx)); const m=this.monsters.spawn({type:t,x:x/CS,y:z/CS,a:0}); m.titleOnly=true; m.state='idle'; m.tZ0=zMin; this.titleMons.push(m); } } }
  // 시작하면 난이도부터 고른다(10/18). 고른 값은 저장해 계속하기·에피소드에도 쓴다
  startNew(){ this.show('diff'); }
  chooseDiff(k){ this.diff=k; try{ localStorage.setItem('udoom.diff',k); }catch(e){} this.hide('diff'); this.startNew2(); }
  startNew2(){ this.player.fullReset(); this.level=0; this.save=null; if(localStorage.getItem('udoom.how')){ this.beginLevel(0); } else { this.drawHow(); this.show('how'); this.hide('title'); } }
  continueGame(){ const s=this.save; if(!s) return this.startNew(); if(s.diff) this.diff=s.diff; this.level=s.level||0; this.player.fullReset(); Object.assign(this.player,{hp:s.hp||100,armor:s.armor||0,ammo:Object.assign({bullets:0,belt:0,shells:0,rockets:0,cells:0},s.ammo||this.player.ammo),weapons:s.weapons||{knife:true},cur:s.cur||'knife'}); this.beginLevel(this.level); }
  snapshot(){ const p=this.player; return {diff:this.diff,level:this.level,hp:Math.max(30,p.hp),armor:p.armor,ammo:p.ammo,weapons:p.weapons,cur:p.cur,best:Math.max(this.level,(this.save&&this.save.best)||0)}; }
  clearLevel(){ if(this.world){ this.world.dispose(); this.world=null; } this.monsters.clear(); this.barrels.clear(); for(const it of this.items) this.scene.remove(it.obj); this.items=[]; if(FX.clear) try{ FX.clear(); }catch(e){} }
  async beginLevel(n,retry){
    if(!this.touch&&this.canvas.requestPointerLock){ try{ const r=this.canvas.requestPointerLock(); if(r&&r.catch) r.catch(()=>{}); }catch(e){} } /* 클릭한 그 순간에 마우스 고정: 판 준비를 기다린 뒤에 부르면 브라우저가 거절함 */
    if(this.handLight){ this.handLight.color.setHex(0xffe0c0); this.handLight.intensity=0.9; this.handLight.distance=2.5; } if(window.Embers) Embers.set(false); this.titleCam=null; this.titleMons=[]; this.titleArmed=false;
    this.hide('title'); this.hide('how'); this.hide('inter'); this.hide('over'); this.hide('pause');
    this.clearLevel(); this.level=n; const def=DATA.levelDef(n); def.monsters=Math.max(3,Math.round(def.monsters*((DATA.DIFF[this.diff]||DATA.DIFF.normal).count))); if(this.diff==='easy') def.types=def.types.concat(['zombie','zombie','zombie']); /* 쉬움: 좀비를 더 자주 뽑아 핑키·임프 비중을 낮춤 */ this.def=def; this.map=MapGen.gen(def);
    this.world=new World.World(this.scene,this.map,def.theme); this.scene.fog=new THREE.Fog(def.theme.fog,5,38); this.scene.background=new THREE.Color(def.theme.sky);
    FX.init(this.scene,this.world,this.opts);
    const p=this.player; if(retry){ p.hp=100; if(this.save){ p.armor=this.save.armor||0; p.ammo=Object.assign({},this.save.ammo); p.weapons=Object.assign({},this.save.weapons); } }
    p.reset(this.map.start.x*CS,this.map.start.y*CS,this.map.start.a); p.keys={R:false,Y:false,B:false};
    this.save=this.snapshot(); this.saveJSON('udoom.save',this.save); $('bCont').classList.remove('hide');
    for(const m of this.map.monsters) this.monsters.spawn(m);
    this._barrelsP=this.barrels.spawnAll(this.map.barrels);
    this._itemsP=this.spawnItems();
    this.stats={kills:0,items:0,itemsTotal:this.items.length,secrets:this.map.secrets.length,time:0}; this.time=0;
    this.weapons.select(p.cur||'knife',true); this.hud.weapons(); this.hud.update();
    this.warming=true; const ldT=setTimeout(()=>{ $('loadingT').textContent=L.loading; this.show('loading'); },250); /* 0.25초 넘게 걸릴 때만 「불러오는 중」(빨리 끝나면 번쩍이지 않게) */ try{ await this.prewarm(n); }catch(e){} clearTimeout(ldT); this.hide('loading'); this.warming=false; if(this.level!==n) return;
    this.playing=true; this.paused=false; document.body.classList.add('playing'); Audio3.resume();
    this.msg('E'+(def.ep+1)+'M'+(def.m+1)+'  '+L.lv[n]); $('lvNow').textContent=n+1;
    if(!this.touch&&!document.pointerLockElement&&this.canvas.requestPointerLock){ try{ const r=this.canvas.requestPointerLock(); if(r&&r.catch) r.catch(()=>{}); }catch(e){} }
  }
  // 10/19 사장님 "랙 걸리네": 처음 보는 재질·이펙트가 화면에 나올 때마다 그 자리에서 셰이더를 만들며 멈췄음(실측 3.3초·0.8초·0.2초).
  // 판을 시작하기 전에(그리기 멈춤 warming) 모델이 다 뜨기를 기다렸다가, 숨은 것까지 잠깐 보이게 하고 이펙트도 한 번씩 땅속에 만들어 셰이더를 뒤에서 미리 만들고(compileAsync), 그림도 미리 올린다.
  async prewarm(lv){ const R=this.renderer; try{ await Promise.race([Promise.all([this._itemsP,this._barrelsP].concat(this.monsters.list.map(m=>m.ready))), new Promise(r=>setTimeout(r,8000))]); }catch(e){} if(this.level!==lv||!R.compileAsync) return;
    const p=this.player, x=p.x, z=p.z, y=-60; const tmp=new THREE.Mesh(new THREE.SphereGeometry(0.1,10,8),new THREE.MeshBasicMaterial({color:0xff6020})); tmp.position.set(x,y,z); this.scene.add(tmp);
    try{ FX.bulletHole(x,y,z,1,0); FX.blood(x,y,z,1,0,4); FX.gibs(x,y,z,4); FX.casing(x,y,z,1,0); FX.explosion(x,y,z,false); FX.tracer(x,y,z,x+1,y,z); FX.slash(x,y,z,1,0); }catch(e){}
    const hid=[]; this.scene.traverse(o=>{ if(!o.visible){ o.visible=true; hid.push(o); } }); let job=null;
    try{ const W=this.weapons; job=Promise.all([R.compileAsync(this.scene,this.camera)].concat(Object.values(W.models||{}).filter(o=>o&&!o.parent).map(o=>R.compileAsync(o,this.camera,this.scene)))); /* 손에 안 든 총은 장면 밖이라 따로(바꿔 들 때 멈춤) */ const seen=new Set(); this.scene.traverse(o=>{ const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[]; for(const m of ms){ for(const k of ['map','normalMap','roughnessMap','emissiveMap','alphaMap']){ const t=m[k]; if(t&&!seen.has(t)){ seen.add(t); try{ R.initTexture(t); }catch(e){} } } } }); }catch(e){}
    for(const o of hid) o.visible=false; FX.clear(); this.scene.remove(tmp);
    try{ await Promise.race([job, new Promise(r=>setTimeout(r,6000))]); }catch(e){} tmp.geometry.dispose(); tmp.material.dispose(); /* 준비가 끝난 뒤에 버림(먼저 버리면 compileAsync 가 isReady 오류로 멈춰 6초를 다 기다렸음) */ /* 완료 신호가 안 오는 브라우저(숨은 탭 등)에서 판이 영영 안 열리지 않게 최대 6초 */ }
  toTitle(){ this.playing=false; if(document.pointerLockElement) document.exitPointerLock(); this.titleScene(); }
  async spawnItems(){
    const defs=this.map.items; const colors={keyR:0xe8302a,keyY:0xf2c230,keyB:0x2f6fd6};
    const modelOf={medkit:'medkit',armor:'armor',mega:'armor',ammo:'ammo',belt:'ammo',rockets:'ammo',cells:'ammo',shells:'shells',keyR:'keycard',keyY:'keycard',keyB:'keycard',pistol:'pistol',shotgun:'shotgun',chaingun:'chaingun'};
    const sizes={medkit:0.5,armor:0.8,mega:0.9,ammo:0.5,belt:0.5,rockets:0.5,cells:0.5,shells:0.5,keyR:0.5,keyY:0.5,keyB:0.5,pistol:0.5,shotgun:1.1,chaingun:1.0,rocket:1.1,bfg:1.0};
    for(const d of defs){
      const o=new THREE.Group(); o.position.set(d.x*CS,0,d.y*CS); this.scene.add(o);
      const it={type:d.type,x:d.x*CS,z:d.y*CS,obj:o,taken:false,t:Math.random()*6,secret:!!d.secret}; this.items.push(it);
      const mn=modelOf[d.type]; const m=mn?await Models.load(mn):null;
      if(it.taken) continue;
      let mesh;
      if(m){ mesh=m.scene.clone(); Models.fitMax(mesh,sizes[d.type]||0.5); if(d.type.startsWith('key')){ mesh.traverse(c=>{ if(c.isMesh){ c.material=new THREE.MeshStandardMaterial({color:colors[d.type],emissive:colors[d.type],emissiveIntensity:0.45,roughness:0.45,metalness:0.1}); } }); mesh=this.keyDecal(mesh); /* 카드 무늬는 지우고 색만(열쇠 그림이 묻혀서) */ mesh.rotation.x=-0.4; } if(d.type==='mega'){ mesh.traverse(c=>{ if(c.isMesh){ c.material=c.material.clone(); c.material.color.setHex(0x6a8cff); } }); } if(['pistol','shotgun','chaingun'].includes(d.type)){ mesh.rotation.z=0.5; } if(AMMO_COL[d.type]){ const tint=AMMO_COL[d.type]; mesh.traverse(c=>{ if(c.isMesh&&c.material.map){ c.material=c.material.clone(); const gm=this.grayMap(c.material.map); c.material.map=gm; c.material.color.setHex(tint); c.material.emissive=new THREE.Color(tint); c.material.emissiveMap=gm; c.material.emissiveIntensity=0.22; } }); } /* 10/19 사장님 "상자 색을 다르게 하면 되잖아": 탄알 노랑·산탄 빨강(무늬는 살리고 색만) */ }
      else { const col={medkit:0xffffff,armor:0x40a040,mega:0x4060ff,ammo:0x806030,shells:0xc03030,rocket:0x804020,bfg:0x40ff40}[d.type]||colors[d.type]||0xaaaaaa; mesh=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.4,0.4),new THREE.MeshLambertMaterial({color:col})); mesh.position.y=0.2; }
      o.add(mesh); it.mesh=mesh;
      if(d.type.startsWith('key')||['pistol','shotgun','chaingun','mega'].includes(d.type)){ const pl=new THREE.PointLight(colors[d.type]||0xffd060,0.8,4); pl.position.y=0.8; o.add(pl); }
    }
  }
  pickup(it){
    const p=this.player, t=it.type; let ok=true, name=L.pick[t]||t, snd='pick';
    if(t==='medkit'){ if(p.hp>=100) ok=false; else p.hp=Math.min(100,p.hp+25); }
    else if(t==='armor'){ if(p.armor>=100) ok=false; else p.armor=100; }
    else if(t==='mega'){ if(p.armor>=200) ok=false; else p.armor=200; }
    else if(DATA.AMMO_PICK[t]){ const [k,v]=Object.entries(DATA.AMMO_PICK[t])[0]; ok=p.giveAmmo(k,v); }   /* 권총탄·기관총탄·산탄·로켓탄·에너지 */
    else if(t.startsWith('key')){ p.keys[t[3]]=true; snd='key'; }
    else if(DATA.WEAPONS.find(w=>w.id===t)){ const w=DATA.WEAPONS.find(w=>w.id===t); const had=p.weapons[t]; p.weapons[t]=true; p.giveAmmo(w.ammo, DATA.AMMO_GIVE[w.ammo]||0); snd='weapon'; if(!had) this.weapons.select(t); this.hud.weapons(); }
    if(!ok) return;
    // 줍은 물건은 장면에서 빼지 않고 숨긴다: 위에 달린 불빛이 빠지면 불빛 수가 바뀌어 셰이더를 다시 만들며 멈춘다(10/17)
    it.taken=true; it.obj.traverse(o=>{ if(o.isLight) o.intensity=0; else if(o.isMesh||o.isSprite||o.isPoints) o.visible=false; }); this.stats.items++; Audio3.play(snd); this.hud.flash('pick'); this.msg(name); this.hud.weapons();
  }
  useAction(){ const p=this.player; const f=p.forward(); const r=this.world.use(p.x,p.z,f.x,f.z,p.keys); if(!r) return; if(r.type==='door') Audio3.play('door',0.7); else if(r.type==='locked'){ this.msg(L.locked[r.lock]); Audio3.play('locked'); } else if(r.type==='secret'){ this.msg(L.secret); Audio3.play('secret'); } else if(r.type==='exit'){ this.finishLevel(); } }
  finishLevel(){ if(!this.playing) return; this.playing=false; Audio3.play('exit'); if(document.pointerLockElement) document.exitPointerLock(); const s=this.stats; const alive=this.monsters.list.length; const k=alive?Math.round(this.monsters.killed/alive*100):100; const i=s.itemsTotal?Math.round(s.items/s.itemsTotal*100):100; const sc=this.map.secrets.length?Math.round(this.world.secretsFound/this.map.secrets.length*100):100;
    $('ilv').textContent='E'+(this.def.ep+1)+'M'+(this.def.m+1)+'  '+L.lv[this.level]; const fmt=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0'); $('tp').textContent=fmt(this.def.par); $('tt').textContent=fmt(this.time);
    // 집계는 빠르게: 세 줄 거의 동시에, 0.3초 안에 끝남 (10/16 사장님 "점수 올라가는 게 너무 느려")
    const count=(el,v,ms)=>{ let c=0; const step=()=>{ c=Math.min(v,c+12); el.textContent=c+'%'; if(c<v){ Audio3.play('tally',0.4); setTimeout(step,ms); } }; step(); };
    $('tk').textContent='0%'; $('ti').textContent='0%'; $('ts').textContent='0%'; setTimeout(()=>count($('tk'),k,24),120); setTimeout(()=>count($('ti'),i,24),260); setTimeout(()=>count($('ts'),sc,24),400);
    this.save=Object.assign(this.snapshot(),{level:this.level+1,best:Math.max(this.level+1,(this.save&&this.save.best)||0)}); this.saveJSON('udoom.save',this.save);
    this.show('inter'); document.body.classList.remove('playing');
  }
  onPlayerDeath(){ this.playing=false; if(document.pointerLockElement) document.exitPointerLock(); setTimeout(()=>{ this.show('over'); document.body.classList.remove('playing'); },900); }
  onBossDead(m){ this.msg(L.boss+' DOWN'); this.hitStop(0.25); FX.shake(0.8); }
  hitStop(sec){ this.stopT=Math.max(this.stopT||0,sec); }
  // 모델 색 사진을 흑백으로 바꾼 사본(그 위에 색을 곱해 탄약 상자 색을 바꿈)
  grayMap(t){ this._gray=this._gray||new Map(); if(this._gray.has(t)) return this._gray.get(t); const im=t.image; const c=document.createElement('canvas'); c.width=im.width||512; c.height=im.height||512; const x=c.getContext('2d');
    x.filter='grayscale(1) brightness(1.5) contrast(1.1)'; x.drawImage(im,0,0,c.width,c.height); const g=new THREE.CanvasTexture(c); g.colorSpace=THREE.SRGBColorSpace; g.flipY=t.flipY; g.wrapS=t.wrapS; g.wrapT=t.wrapT; this._gray.set(t,g); return g; }
  // 10/18 사장님 "카드에 열쇠 모양을 까맣게": 카드 모델의 가장 얇은 축 앞뒤에 검은 열쇠 그림을 붙인 묶음을 돌려준다
  keyTex(){ if(this._keyTex) return this._keyTex; const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d'); x.fillStyle='#000';
    x.beginPath(); x.arc(128,72,50,0,Math.PI*2); x.arc(128,72,22,0,Math.PI*2,true); x.fill('evenodd');      // 머리(구멍 뚫린 고리)
    x.fillRect(114,112,28,118); x.fillRect(142,168,34,20); x.fillRect(142,204,26,20);                       // 막대와 이
    this._keyTex=new THREE.CanvasTexture(c); return this._keyTex; }
  keyDecal(mesh){ const h=new THREE.Group(); h.add(mesh); h.updateMatrixWorld(true); const b=new THREE.Box3().setFromObject(mesh); const sz=new THREE.Vector3(); b.getSize(sz); const ct=new THREE.Vector3(); b.getCenter(ct);
    // 카드 모델은 줄이면서 면 방향이 엉켜 검은 얼룩이 져서, 같은 크기의 깔끔한 판으로 바꾼다
    let mat0=null; mesh.traverse(c=>{ if(c.isMesh&&!mat0) mat0=c.material; }); h.remove(mesh);
    const card=new THREE.Mesh(new THREE.BoxGeometry(Math.max(sz.x,0.02),Math.max(sz.y,0.02),Math.max(sz.z,0.02)),mat0); card.position.copy(ct); h.add(card);
    const ax=sz.x<=sz.y&&sz.x<=sz.z?'x':(sz.y<=sz.z?'y':'z'); const face=ax==='x'?[sz.z,sz.y]:ax==='y'?[sz.x,sz.z]:[sz.x,sz.y]; const s=Math.min(face[0],face[1])*0.95;
    const mat=new THREE.MeshBasicMaterial({map:this.keyTex(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,side:THREE.DoubleSide});
    for(const sgn of [1,-1]){ const pl=new THREE.Mesh(new THREE.PlaneGeometry(s,s),mat); pl.position.copy(ct); pl.position[ax]+=sgn*(sz[ax]/2+0.004);
      if(ax==='x') pl.rotation.y=sgn*Math.PI/2; else if(ax==='y') pl.rotation.x=-sgn*Math.PI/2; else if(sgn<0) pl.rotation.y=Math.PI; h.add(pl); }
    return h; }
  drawHow(){ // 설명 창 세 칸: 실제 게임 그림 흉내(캔버스 애니메이션). 10/18 먹색·핏빛만, 글자는 붓 글씨(BRUSH)
    if(this.howAnim) cancelAnimationFrame(this.howAnim);
    const c1=$('how1').getContext('2d'), c2=$('how2').getContext('2d'), c3=$('how3').getContext('2d'); let t=0; const self=this;
    const bg=(c,col)=>{ c.fillStyle='#120d0c'; c.fillRect(0,0,320,240); c.fillStyle='#221a18'; c.fillRect(0,150,320,90); c.fillStyle=col||'#2b201d'; c.fillRect(40,40,240,110); };
    function frame(){ t+=1/60;
      bg(c1); c1.fillStyle='rgba(0,0,0,.6)'; c1.beginPath(); c1.arc(60,190,34,0,Math.PI*2); c1.fill(); c1.fillStyle='#b3120e'; c1.beginPath(); c1.arc(60+Math.cos(t*2)*14,190+Math.sin(t*2)*14,14,0,Math.PI*2); c1.fill(); c1.fillStyle='#fff'; c1.font='24px BRUSH,sans-serif'; c1.fillText('WASD',150,200); c1.fillText('↔',240,200); c1.strokeStyle='#c4180f'; c1.lineWidth=3; c1.beginPath(); c1.moveTo(200,120); c1.lineTo(200+Math.sin(t*3)*40,120); c1.stroke();
      bg(c2); const hot=Math.sin(t*4)>0; c2.fillStyle='#b03030'; c2.fillRect(150+Math.sin(t)*20,70,30,60); c2.strokeStyle=hot?'#ff4a2a':'#fff'; c2.lineWidth=3; c2.beginPath(); c2.moveTo(160,90); c2.lineTo(160,130); c2.moveTo(140,110); c2.lineTo(180,110); c2.stroke(); c2.fillStyle='#b3120e'; c2.beginPath(); c2.arc(270,195,28,0,Math.PI*2); c2.fill(); c2.fillStyle='#0d0a0a'; c2.font='20px BRUSH,sans-serif'; c2.textAlign='center'; c2.fillText('FIRE',270,202); c2.textAlign='left'; if(hot){ c2.fillStyle='#8a1a12'; c2.fillRect(130,160,40,10); }
      bg(c3); c3.fillStyle='#4a403c'; c3.fillRect(130,50,60,100); c3.fillStyle='#e8302a'; c3.fillRect(130,120,60,10); const kx=60+((t*40)%140); c3.fillStyle='#e8302a'; c3.fillRect(kx,170,14,22); c3.fillStyle='#2a2a30'; c3.fillRect(240,60,40,40); c3.fillStyle='#e8302a'; c3.fillRect(250,70,20,20); c3.fillStyle='#e04030'; c3.font='18px BRUSH,sans-serif'; c3.fillText('EXIT',243,112);
      self.howAnim=requestAnimationFrame(frame); }
    frame();
  }
  loop(now){
    requestAnimationFrame(this.loop);
    let dt=(now-this.clock)/1000; this.clock=now; if(dt>0.1) dt=0.1; if(dt<=0) return; dt*=(this.timeScale||1); if(this.stopT>0){ this.stopT-=dt; dt*=0.12; }
    if(this.fovPunch>0){ this.fovPunch*=Math.pow(0.002,dt); const base=(this.opts.fov?95:80); const nf=base+this.fovPunch; if(Math.abs(this.camera.fov-nf)>0.05){ this.camera.fov=nf; this.camera.updateProjectionMatrix(); } }
    const p=this.player, cam=this.camera;
    if(this.playing && !this.paused){
      this.time+=dt;
      p.update(dt); this.barrels.solidCheck(p,p.r);
      this.world.update(dt,p); this.monsters.update(dt); this.weapons.update(dt); FX.update(dt);
      // 줍기
      for(const it of this.items){ if(it.taken) continue; if(Math.hypot(it.x-p.x,it.z-p.z)<0.75){ this.pickup(it); } else if(it.mesh){ it.t+=dt; it.obj.position.y=0.08+Math.sin(it.t*2.5)*0.06; it.mesh.rotation.y+=dt*1.2; } }
      // 출구 스위치 근처에서 자동 사용(폰 친화): 패널 앞 1m
      if(this.world.exitPos && !this.world.exitUsed){ const e=this.world.exitPos; if(Math.hypot(e.x-p.x,e.z-p.z)<1.1){ this.world.exitUsed=true; this.finishLevel(); } }
      // 문·비밀: 폰에서는 걸어가 닿으면 열린다(touchDoors). 비밀 벽은 부딪히면 열림
      if(this.time%0.2<dt){ const f=p.forward(); const h=this.world.rayWall(p.x,p.z,f.x,f.z,1.0,'shot'); if(h&&this.world.cell(h.cx,h.cz)===this.map.SECRET&&p.moving){ const s=this.world.secrets.find(s=>s.x===h.cx&&s.y===h.cz); if(s&&!s.found){ s.found=true; this.world.secretsFound++; this.msg(L.secret); Audio3.play('secret'); } } }
      // 조준점이 적에 걸리는가
      const f=p.forward(); const cp=Math.cos(p.pitch); const hit=this.monsters.hitscan(p.x,p.z,p.eye,f.x*cp,Math.sin(p.pitch),f.z*cp,40,0.15); const wall=this.world.rayWall(p.x,p.z,f.x,f.z,40,'shot'); this.hud.setHot(!!hit && (!wall || hit.d<wall.d));
      // 카메라
      const bobA=(this.opts.bob!==false)?1:0; const bobY=p.moving?Math.abs(Math.sin(p.bobT))*0.05*bobA:0;
      cam.position.set(p.x, p.eye+bobY-(p.dead?1.1:0)+(p.hurtT>0?Math.sin(this.time*60)*0.01:0), p.z); const sh=FX.getShake(); const kick=this.weapons.camKick||0; cam.position.x+=(Math.random()-0.5)*sh*0.08; cam.position.y+=(Math.random()-0.5)*sh*0.08; cam.rotation.order='YXZ'; cam.rotation.set(p.pitch-(p.dead?0.5:0)+kick*0.35+(Math.random()-0.5)*sh*0.03, p.yaw+(Math.random()-0.5)*sh*0.03, p.dead?0.6:(p.moving?Math.sin(p.bobT)*0.006*bobA:0)+(Math.random()-0.5)*sh*0.02);
      this.hud.update();
      if(p.hp<=25 && this.time%1<dt) this.hud.flash('hurt');
      // 자동 저장(10초마다)
      if(this.time%10<dt){ this.save=this.snapshot(); this.saveJSON('udoom.save',this.save); }
    } else if(!this.playing && this.titleCam && this.world){
      const tc=this.titleCam; tc.t+=dt; this.world.update(dt,null); FX.update(dt);
      const drift=Math.min(1,tc.t/40); cam.position.set(tc.x+Math.sin(tc.t*0.23)*0.35, 1.58+Math.sin(tc.t*0.9)*0.02, tc.z-drift*2.0); cam.rotation.order='YXZ'; cam.rotation.set(-0.04+Math.sin(tc.t*0.5)*0.02, Math.sin(tc.t*0.17)*0.28, Math.sin(tc.t*0.31)*0.01);
      if(this.handLight){ const fl=0.32+Math.random()*0.25+(Math.sin(tc.t*7.3)>0.92?0.6:0); this.handLight.color.setHex(0xff5a28); this.handLight.intensity=fl; this.handLight.distance=4; }
      if(window.Embers) Embers.set(true);
      { const camX=cam.position.x, camZ=cam.position.z; for(const m of (this.titleMons||[])){ if(!m.model) continue; if(m.mixer){ m.mixer.update(dt); if(!m.titleStarted){ m.titleStarted=true; m.play(m.type==='imp'?'idle':'walk'); const a=m.curAct; if(a){ a.time=Math.random()*a.getClip().duration; a.timeScale=0.8+Math.random()*0.4; } } }
        // 발맞춰 나란히 걷지 않게(10/17 사장님 "걸그룹인줄"): 놈마다 속도·박자·좌우 흔들림이 다르고, 되돌아갈 때 거리도 제각각
        if(m.tSpd==null){ m.tSpd=(m.type==='pinky'?0.15:0.17)+Math.random()*0.12; m.tPh=Math.random()*6.28; m.tX=m.x; }
        if(m.type!=='imp'){ m.z+=m.tSpd*dt; m.tPh+=dt*(0.6+m.tSpd); m.x=m.tX+Math.sin(m.tPh)*0.35; if(m.z>camZ-3.4){ m.z=(m.tZ0||m.z-4)+Math.random()*0.8; m.tSpd=(m.type==='pinky'?0.15:0.17)+Math.random()*0.12; } }
        m.yaw=Math.atan2(camX-m.x,camZ-m.z)+Math.sin(m.tPh*0.7)*0.25; m.obj.position.set(m.x,m.y,m.z); m.obj.rotation.y=m.yaw; if(!m.mixer&&m.model) Monsters.gait(m,dt,true,false,false); }
        if(!this.titleArmed && this.weapons.models && this.weapons.models.shotgun){ this.weapons.curId=null; this.weapons.select('shotgun',true); this.titleArmed=true; } }
    }
    this.weapons.holder.visible=this.playing || !!(this.titleCam && this.titleArmed);
    if(!this.warming) this.renderer.render(this.scene,cam); /* 판 준비(prewarm) 중엔 그리지 않음: 그리면 그 자리에서 셰이더를 만들며 멈춤 */
  }
}
window.addEventListener('load',()=>{ window.game=new Game(); });
})();
