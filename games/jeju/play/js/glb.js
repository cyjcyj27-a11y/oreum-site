// GLB 로더 — three 공식 GLTFLoader(ESM, window.GLTFLoaderClass 로 노출됨) 를 쓴다.
// 스키닝(뼈+살)·애니메이션을 정석대로 처리. 쓰는 법은 예전과 동일:
//   GLB.load(url).then(root => { scene.add(root); root.userData.play('Walk'); ... mixer.update(dt) })
(function () {
  async function load(url, opt) {
    const L = new window.GLTFLoaderClass();
    const gltf = await L.loadAsync(url);
    const root = gltf.scene;
    root.traverse(o => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false;
        const m = o.material;
        if (m) {
          // Meshy GLB 는 emissiveTexture 에 베이스맵을 그대로 넣고 emissiveFactor 1 로 내보낸다 → 그림자·음영 없이 자체발광해 납작하고 너덜해 보인다. 끈다.
          if (m.emissiveMap && m.map && m.emissiveMap.image === m.map.image) { m.emissiveMap = null; m.emissive && m.emissive.setScalar(0); m.needsUpdate = true; }
          if ('specularColor' in m && m.specularColor && m.specularColor.r > 1) m.specularColor.setScalar(1);   // KHR_materials_specular 2.0 → 번들거림 정상화
          if ('specularIntensity' in m && m.specularIntensity > 1) m.specularIntensity = 1;
          for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) if (m[k]) { m[k].anisotropy = 8; m[k].needsUpdate = true; }   // 비스듬히 볼 때 뭉개짐 줄임
          if (opt && opt.clearcoat != null && 'clearcoat' in m) { m.clearcoat = opt.clearcoat; m.clearcoatRoughness = 0.1; }
          if (opt && opt.envMapIntensity != null) m.envMapIntensity = opt.envMapIntensity;
        }
      }
    });
    const clips = gltf.animations || [];
    const mixer = clips.length ? new THREE.AnimationMixer(root) : null;
    root.userData.mixer = mixer;
    root.userData.clips = clips;
    root.userData.play = (name) => { if (!mixer) return null; const c = (name && clips.find(x => x.name === name)) || clips[0]; const a = mixer.clipAction(c); a.reset().play(); return a; };
    return root;
  }

  // 차 크기·방향 맞추기: 바닥을 y=0, 가운데를 원점, 긴 쪽을 z 축, 길이를 len 미터로. (정적 모델용)
  function fitVehicle(root, len, yawFix) {
    const box = new THREE.Box3().setFromObject(root), size = new THREE.Vector3(); box.getSize(size);
    const inner = new THREE.Group(); while (root.children.length) inner.add(root.children[0]); root.add(inner);
    const c = new THREE.Vector3(); box.getCenter(c);
    inner.position.set(-c.x, -box.min.y, -c.z);
    const wrap = new THREE.Group(); wrap.add(inner); root.add(wrap);
    if (size.x > size.z) wrap.rotation.y = Math.PI / 2;
    wrap.rotation.y += yawFix || 0;
    const L = Math.max(size.x, size.z), s = len / L; wrap.scale.setScalar(s);
    return { scale: s, size };
  }

  window.GLB = { load, fitVehicle };
})();
