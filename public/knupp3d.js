/* Knupp Tênis · peças 3D da Área do Aluno (troféu das conquistas e tubo de créditos)
   Usa three.js (r128, MIT). Carregado só quando precisa. Cada cena para sozinha
   quando sai da tela (o elemento é removido da página). */
(function(){
  const T = window.THREE;
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cena(box, fov, z){
    const canvas = document.createElement('canvas'); canvas.className = 'gl3d';
    box.prepend(canvas);
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.physicallyCorrectLights = true;
    const scene = new T.Scene(), camera = new T.PerspectiveCamera(fov, 1, .1, 100);
    camera.position.set(0, 0, z);
    scene.add(new T.HemisphereLight(0xffffff, 0x203020, 1.6));
    const sol = new T.DirectionalLight(0xffffff, 3); sol.position.set(3, 5, 4); scene.add(sol);
    const verde = new T.PointLight(0x2bd576, 18, 20); verde.position.set(-3, -1, 2); scene.add(verde);
    const ajustar = () => { const w = box.clientWidth || 1, h = box.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const ro = new ResizeObserver(ajustar); ro.observe(box); ajustar();
    const c = { box, canvas, renderer, scene, camera, tick: null };
    (function loop(){
      if (!canvas.isConnected){ ro.disconnect(); renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); return; }
      if (c.tick) c.tick(); renderer.render(scene, camera); requestAnimationFrame(loop);
    })();
    return c;
  }

  function ambiente(renderer){
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
    const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(.45, '#8a9a90'); gr.addColorStop(.5, '#1a2a20'); gr.addColorStop(1, '#050805');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
    g.fillStyle = '#2bd576'; g.fillRect(40, 50, 30, 10); g.fillStyle = '#fff'; g.fillRect(150, 20, 60, 14);
    const tx = new T.CanvasTexture(cv); tx.mapping = T.EquirectangularReflectionMapping;
    const pm = new T.PMREMGenerator(renderer); const env = pm.fromEquirectangular(tx).texture; pm.dispose(); tx.dispose(); return env;
  }

  function arrasto(box, alvo, auto){
    let ativo = false, lx = 0, ly = 0; const v = { x: 0, y: auto };
    box.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; ativo = true; lx = e.clientX; ly = e.clientY; });
    const up = () => ativo = false, mv = e => { if (!ativo) return; v.y = (e.clientX - lx) * .012; v.x = (e.clientY - ly) * .008; lx = e.clientX; ly = e.clientY; };
    addEventListener('pointerup', up); addEventListener('pointermove', mv);
    return () => { if (!box.isConnected){ removeEventListener('pointerup', up); removeEventListener('pointermove', mv); return; }
      alvo.rotation.y += v.y; alvo.rotation.x += v.x;
      if (!ativo){ v.y += (auto - v.y) * .03; v.x *= .94; alvo.rotation.x *= .97; } };
  }

  /* bola de tênis */
  let FELTRO, GEO_BOLA, GEO_COST, MAT_BOLA, MAT_COST;
  function bola(r){
    if (!FELTRO){
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const g = cv.getContext('2d');
      g.fillStyle = '#cfe23a'; g.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 9000; i++){ g.fillStyle = `hsla(${62 + Math.random() * 10},75%,${40 + Math.random() * 30}%,.35)`; g.fillRect(Math.random() * 512, Math.random() * 256, 1.5, 1.5); }
      FELTRO = new T.CanvasTexture(cv); FELTRO.encoding = T.sRGBEncoding;
      class Costura extends T.Curve { getPoint(t, alvo = new T.Vector3()){ const a = .72, b = .28, u = t * Math.PI * 2;
        return alvo.set(a * Math.cos(u) + b * Math.cos(3 * u), a * Math.sin(u) - b * Math.sin(3 * u), 2 * Math.sqrt(a * b) * Math.sin(2 * u)).multiplyScalar(1.004); } }
      GEO_BOLA = new T.SphereGeometry(1, 48, 36); GEO_COST = new T.TubeGeometry(new Costura(), 240, .028, 8, true);
      MAT_BOLA = new T.MeshStandardMaterial({ map: FELTRO, roughness: .95, bumpMap: FELTRO, bumpScale: .02 });
      MAT_COST = new T.MeshStandardMaterial({ color: 0xf4f4ee, roughness: .6 });
    }
    const g = new T.Group(); g.add(new T.Mesh(GEO_BOLA, MAT_BOLA), new T.Mesh(GEO_COST, MAT_COST)); g.scale.setScalar(r); return g;
  }

  /* ---------- troféu ---------- */
  function trofeu(box){
    const c = cena(box, 35, 10);
    c.scene.environment = ambiente(c.renderer);
    const ouro = new T.MeshStandardMaterial({ color: 0xffc94a, metalness: 1, roughness: .22, side: T.DoubleSide });
    const pedra = new T.MeshStandardMaterial({ color: 0x151515, roughness: .4, metalness: .3 });
    const t = new T.Group();
    const perfil = [[0,0],[.55,0],[.55,.1],[.42,.14],[.18,.3],[.12,.55],[.1,.9],[.16,1.02],[.3,1.06],[.55,1.25],[.75,1.6],[.82,2.05],[.84,2.3],[.78,2.3],[.72,2],[.62,1.62],[.4,1.3],[0,1.25]].map(p => new T.Vector2(p[0], p[1]));
    t.add(new T.Mesh(new T.LatheGeometry(perfil, 64), ouro));
    [-1, 1].forEach(s => { const al = new T.Mesh(new T.TorusGeometry(.32, .06, 16, 40, Math.PI * 1.2), ouro);
      al.position.set(s * .86, 1.78, 0); al.rotation.z = s > 0 ? -Math.PI * .6 : Math.PI * 1.4; t.add(al); });
    const base = new T.Mesh(new T.BoxGeometry(1.5, .45, 1.5), pedra); base.position.y = -.22; t.add(base);
    const placa = new T.Mesh(new T.BoxGeometry(.9, .22, .02), ouro); placa.position.set(0, -.22, .76); t.add(placa);
    const mini = bola(.28); mini.position.set(0, 2.55, 0); t.add(mini);
    t.position.y = -1.25; c.scene.add(t);
    const giro = arrasto(box, t, .012);
    let anim = reduz ? 60 : 1;
    c.tick = () => {
      giro();
      if (anim < 60){ anim++; const k = anim / 60; t.scale.setScalar(Math.min(1, k * 4) + Math.sin(k * Math.PI) * .2 * (1 - k)); t.rotation.y += .25 * (1 - k); }
      mini.rotation.y += .03; t.position.y = -1.25 + Math.sin(performance.now() / 700) * .05;
    };
  }

  /* confete (2D, por cima) */
  function confete(cv){
    const g = cv.getContext('2d'), w = cv.width = cv.clientWidth * 2, h = cv.height = cv.clientHeight * 2;
    const cores = ['#2bd576', '#facc15', '#ffffff', '#d9ec3c', '#38bdf8'];
    let pecas = reduz ? [] : Array.from({ length: 150 }, () => ({ x: w / 2, y: h * .45, vx: (Math.random() - .5) * 28, vy: -Math.random() * 30 - 8, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cores[Math.random() * 5 | 0], s: 6 + Math.random() * 8 }));
    (function loop(){
      if (!cv.isConnected || !pecas.length) return; g.clearRect(0, 0, w, h);
      pecas.forEach(p => { p.vy += .9; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); });
      pecas = pecas.filter(p => p.y < h + 20); requestAnimationFrame(loop);
    })();
  }

  /* ---------- tubo de créditos ---------- */
  const MAX = 5;
  function tubo(box, n, antes){
    const c = cena(box, 30, 9.6);
    const R = .42, ALT = MAX * (2 * R + .02) + .1;
    const tb = new T.Group(); tb.rotation.z = -.1; c.scene.add(tb);
    tb.add(new T.Mesh(new T.CylinderGeometry(R + .06, R + .06, ALT, 40, 1, true),
      new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .14, roughness: .05, side: T.DoubleSide, depthWrite: false })));
    const tampa = new T.Mesh(new T.CylinderGeometry(R + .1, R + .1, .18, 40), new T.MeshStandardMaterial({ color: 0x2bd576, roughness: .4 }));
    tampa.position.y = -ALT / 2 - .09; tb.add(tampa);
    const aro = new T.Mesh(new T.TorusGeometry(R + .07, .03, 12, 40), new T.MeshStandardMaterial({ color: 0xdddddd, metalness: .6, roughness: .3 }));
    aro.rotation.x = Math.PI / 2; aro.position.y = ALT / 2; tb.add(aro);
    const bolas = [], fundoY = i => -ALT / 2 + R + i * (2 * R + .02);
    const ficam = () => bolas.filter(b => !b.saindo);
    function por(cair, atraso){ const i = ficam().length; if (i >= MAX) return;
      const g = bola(R), b = { g, y: cair ? ALT / 2 + 2 + atraso : fundoY(i), vy: 0, alvo: fundoY(i), saindo: false };
      g.position.y = b.y; g.rotation.set(Math.random() * 6, Math.random() * 6, 0); tb.add(g); bolas.push(b); }
    function tirar(){ const v = ficam(), b = v[v.length - 1]; if (!b) return; b.saindo = true; b.vy = .18; b.vx = -.07; }
    let atual = Math.min(n, MAX);
    const ini = reduz ? atual : Math.min(antes == null ? atual : antes, MAX);
    for (let i = 0; i < ini; i++) por(false, 0);
    const ajustarPara = alvo => { alvo = Math.min(alvo, MAX); let k = 0;
      while (ficam().length < alvo) por(true, (k++) * 1.2);
      let s = 0; while (ficam().length > alvo){ const b = ficam()[ficam().length - 1]; b.saindo = true; b.vy = .18 + s * .02; b.vx = -.07; s++; } };
    setTimeout(() => ajustarPara(atual), 450);
    c.tick = () => {
      tb.rotation.y += .004;
      for (const b of bolas){
        if (b.saindo){ b.vy -= .012; b.g.position.y += b.vy; b.g.position.x += b.vx; b.g.rotation.z += .15; continue; }
        if (b.y > b.alvo || b.vy > 0){ b.vy -= .02; b.y += b.vy; if (b.y <= b.alvo){ b.y = b.alvo; b.vy = Math.abs(b.vy) > .06 ? -b.vy * .4 : 0; } }
        b.g.position.y = b.y;
      }
      for (let i = bolas.length - 1; i >= 0; i--) if (bolas[i].saindo && bolas[i].g.position.y < -7){ tb.remove(bolas[i].g); bolas.splice(i, 1); }
    };
    return { set: v => { atual = v; ajustarPara(v); } };
  }

  window.K3D = { trofeu, tubo, confete, MAX };
})();
