// 후처리 — 장면을 HDR 버퍼에 그린 뒤 블룸·ACES 톤매핑·색보정·비네트·필름 그레인·물속 일렁임을 한 번에 입힌다 (WebGL2 아니면 그냥 그린다)
(function () {
  const P = { on: false, under: 0, t: 0, scale: 1, exposure: 1.18, bloom: 0.26, vig: 0.3, grain: 0.016, sat: 0.98, con: 1.04 };
  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const brightMat = new THREE.ShaderMaterial({ uniforms: { tex: { value: null }, thr: { value: 1.0 } }, vertexShader: VS, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D tex; uniform float thr; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tex, vUv).rgb; float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); float k = smoothstep(thr, thr + 1.2, l); gl_FragColor = vec4(c * k, 1.0); }` });
  const blurMat = new THREE.ShaderMaterial({ uniforms: { tex: { value: null }, dir: { value: new THREE.Vector2(1, 0) } }, vertexShader: VS, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tex, vUv).rgb * 0.227;
        c += (texture2D(tex, vUv + dir * 1.5).rgb + texture2D(tex, vUv - dir * 1.5).rgb) * 0.194;
        c += (texture2D(tex, vUv + dir * 3.0).rgb + texture2D(tex, vUv - dir * 3.0).rgb) * 0.121;
        c += (texture2D(tex, vUv + dir * 4.5).rgb + texture2D(tex, vUv - dir * 4.5).rgb) * 0.054;
        c += (texture2D(tex, vUv + dir * 6.0).rgb + texture2D(tex, vUv - dir * 6.0).rgb) * 0.016;
        gl_FragColor = vec4(c, 1.0); }` });
  const compMat = new THREE.ShaderMaterial({
    uniforms: { tex: { value: null }, bloom: { value: null }, exposure: { value: 1 }, bloomK: { value: 0.3 }, vig: { value: 0.3 }, grain: { value: 0.02 }, t: { value: 0 }, under: { value: 0 }, sat: { value: 1 }, con: { value: 1 } },
    vertexShader: VS, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D tex, bloom; uniform float exposure, bloomK, vig, grain, t, under, sat, con; varying vec2 vUv;
      vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
      vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec2 uv = vUv;
        if (under > 0.0) uv += vec2(sin(uv.y * 18.0 + t * 2.2), cos(uv.x * 14.0 + t * 1.7)) * 0.004 * under;
        vec2 d = uv - 0.5; float r2 = dot(d, d);
        float ca = 0.012 * r2;
        vec3 c; c.r = texture2D(tex, uv + d * ca).r; c.g = texture2D(tex, uv).g; c.b = texture2D(tex, uv - d * ca).b;
        c += texture2D(bloom, uv).rgb * bloomK;
        c = aces(c * exposure);
        c = srgb(c);
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(l), c, sat); c = (c - 0.5) * con + 0.5;
        c += vec3(-0.012, 0.0, 0.03) * (1.0 - l);
        c *= 1.0 - vig * smoothstep(0.12, 0.85, r2 * 2.2);
        c += (hash(gl_FragCoord.xy + fract(t * 7.0) * 100.0) - 0.5) * grain;
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0); }` });
  const quadScene = new THREE.Scene(), quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compMat); quad.frustumCulled = false; quadScene.add(quad);
  let R = null, rt = null, bA = null, bB = null, bw = 1, bh = 1;

  function init(renderer, touch, msaa, off) {
    R = renderer;
    if (off || !renderer.capabilities.isWebGL2) return false;
    const half = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
    const type = half ? THREE.HalfFloatType : THREE.UnsignedByteType;
    rt = new THREE.WebGLRenderTarget(4, 4, { type, samples: msaa != null ? msaa : 4, depthBuffer: true, stencilBuffer: false });
    bA = new THREE.WebGLRenderTarget(4, 4, { type }); bB = new THREE.WebGLRenderTarget(4, 4, { type });
    renderer.toneMapping = THREE.NoToneMapping;
    P.on = true; return true;
  }
  const size = new THREE.Vector2();
  function resize() {
    if (!P.on) return;
    R.getDrawingBufferSize(size); rt.setSize(Math.max(8, Math.floor(size.x * P.scale)), Math.max(8, Math.floor(size.y * P.scale)));
    bw = Math.max(1, Math.floor(size.x / 4)); bh = Math.max(1, Math.floor(size.y / 4)); bA.setSize(bw, bh); bB.setSize(bw, bh);
  }
  function pass(mat, target) { quad.material = mat; R.setRenderTarget(target); R.render(quadScene, quadCam); }
  function render(scene, camera, dt) {
    if (!P.on) { R.render(scene, camera); return; }
    P.t += dt || 0.016;
    R.setRenderTarget(rt); R.render(scene, camera);
    brightMat.uniforms.tex.value = rt.texture; pass(brightMat, bA);
    for (let i = 0; i < 2; i++) {
      blurMat.uniforms.tex.value = bA.texture; blurMat.uniforms.dir.value.set(1 / bw, 0); pass(blurMat, bB);
      blurMat.uniforms.tex.value = bB.texture; blurMat.uniforms.dir.value.set(0, 1 / bh); pass(blurMat, bA);
    }
    const u = compMat.uniforms;
    u.tex.value = rt.texture; u.bloom.value = bA.texture; u.exposure.value = P.exposure; u.bloomK.value = P.bloom; u.vig.value = P.vig; u.grain.value = P.grain; u.t.value = P.t; u.under.value = P.under; u.sat.value = P.sat; u.con.value = P.con;
    pass(compMat, null);
  }
  function setScale(s) { P.scale = Math.max(0.5, Math.min(1, Math.round(s * 100) / 100)); resize(); }
  window.POST = Object.assign(P, { init, resize, render, setScale });
})();
