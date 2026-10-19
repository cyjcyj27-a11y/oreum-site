/* GLB 읽기·캐시·스킨 복제. 모델 파일은 assets/models/<이름>.glb (더블클릭용 .glb.js 사본은 나중에) */
window.Models = (function(){
const cache={}, loader=new (window.GLTFLoaderClass||THREE.GLTFLoader)();
function load(name){
  if(cache[name]) return cache[name];
  cache[name]=new Promise((res,rej)=>{
    const done=g=>{
      g.scene.traverse(o=>{ if(o.isMesh){ o.frustumCulled=!o.isSkinnedMesh; o.castShadow=false; o.receiveShadow=false; const m=o.material; if(m){ if(m.map){ m.map.generateMipmaps=false; m.map.minFilter=THREE.LinearFilter; m.map.anisotropy=4; } m.metalness=0; m.roughness=0.85; m.side=THREE.FrontSide; } } });
      res({scene:g.scene, clips:g.animations||[]});
    };
    const fail=e=>{ console.warn('model fail',name,e); res(null); };
    const b64=window.MODEL_DATA&&window.MODEL_DATA[name];
    if(b64){ const bin=atob(b64); const buf=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i); loader.parse(buf.buffer,'',done,fail); }
    else loader.load('assets/models/'+name+'.glb', done, undefined, fail);
  });
  return cache[name];
}
// SkeletonUtils.clone 과 같은 일 (스킨 메쉬 복제)
function cloneSkinned(source){
  const sourceLookup=new Map(), cloneLookup=new Map();
  const clone=source.clone();
  parallelTraverse(source, clone, (s,c)=>{ sourceLookup.set(c,s); cloneLookup.set(s,c); });
  clone.traverse(node=>{
    if(!node.isSkinnedMesh) return;
    const cs=node.skeleton, ss=sourceLookup.get(node).skeleton;
    const bones=ss.bones.map(b=>cloneLookup.get(b));
    node.skeleton=new THREE.Skeleton(bones, ss.boneInverses);
    node.bindMatrix.copy(sourceLookup.get(node).bindMatrix);
    node.bind(node.skeleton, node.bindMatrix);
  });
  return clone;
}
function parallelTraverse(a,b,cb){ cb(a,b); for(let i=0;i<a.children.length;i++) parallelTraverse(a.children[i],b.children[i],cb); }
// 모델을 바닥 원점·주어진 키(m)로 맞춘다
function bounds(obj){ // 스킨 메쉬는 뼈가 아직 안 움직였을 때 접히므로 기하 경계(바인드 자세)로 잰다
  obj.updateMatrixWorld(true); const inv=new THREE.Matrix4().copy(obj.matrixWorld).invert(); const box=new THREE.Box3(); const tmp=new THREE.Matrix4();
  obj.traverse(c=>{ if(c.isMesh&&c.geometry){ let b; if(c.isSkinnedMesh){ c.skeleton.update(); c.computeBoundingBox(); b=c.boundingBox.clone(); } else { if(!c.geometry.boundingBox) c.geometry.computeBoundingBox(); b=c.geometry.boundingBox.clone(); } tmp.multiplyMatrices(inv,c.matrixWorld); b.applyMatrix4(tmp); box.union(b); } });
  return box;
}
function fit(obj,height){
  const box=bounds(obj); const size=new THREE.Vector3(); box.getSize(size);
  const s=height/Math.max(0.001,size.y); obj.scale.setScalar(s);
  const c=new THREE.Vector3(); box.getCenter(c);
  obj.position.x-=c.x*s; obj.position.z-=c.z*s; obj.position.y-=box.min.y*s;
  return s;
}
function fitMax(obj,size){ // 가장 긴 변을 size 로(납작한 물건용)
  const box=bounds(obj); const sz=new THREE.Vector3(); box.getSize(sz);
  const s=size/Math.max(0.001,Math.max(sz.x,sz.y,sz.z)); obj.scale.setScalar(s);
  const c=new THREE.Vector3(); box.getCenter(c);
  obj.position.x-=c.x*s; obj.position.z-=c.z*s; obj.position.y-=box.min.y*s;
  return s;
}
function pickClip(clips,re){ return clips.find(c=>re.test(c.name)); }
return {load,cloneSkinned,fit,fitMax,bounds,pickClip};
})();
