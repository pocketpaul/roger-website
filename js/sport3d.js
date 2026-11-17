// 3D-Symbole für die Sportarten-Seiten (three.js, ohne Zusatzmodule)
import * as THREE from './three.module.min.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Weiche Studio-Umgebung für Spiegelungen (Metall, Lack)
function studioEnv(renderer) {
  const s = new THREE.Scene();
  const geo = new THREE.SphereGeometry(10, 32, 16);
  const cols = [];
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 10;
    const c = new THREE.Color().lerpColors(new THREE.Color(0xC9D3E6), new THREE.Color(0xFFFFFF), (y + 1) / 2);
    cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  s.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const panel = (x, y, z, w, h, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k) })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  panel(-5, 5, 5, 6, 4, 4); panel(6, 2, -2, 3, 6, 2.5); panel(0, -6, 4, 8, 2, 1.2);
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(s, 0.04).texture; pm.dispose();
  return env;
}

const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

const seamBall = (base, line, r = 0.62) => {
  const tex = canvasTex(1024, 512, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, base[0]); grd.addColorStop(1, base[1]); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = line; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath();
    for (let x = 0; x <= w; x += 2) { const y = h / 2 + Math.sin((x / w) * Math.PI * 4) * h * 0.18; x ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  });
  return new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.75, sheen: 0.6, sheenColor: new THREE.Color(0xffffff), clearcoat: 0.05 }));
};

const BUILD = {
  tennis(ac) {
    const g = new THREE.Group();
    const b = seamBall(['#3A6BE3', '#2252CC'], '#ffffff', 0.8); g.add(b); g.userData.spinTarget = b;
    return g;
  },
  padel(ac) {
    const g = new THREE.Group();
    const shape = new THREE.Shape();
    // Kopf: abgerundete Tropfenform
    shape.moveTo(0, -0.62);
    shape.bezierCurveTo(0.42, -0.6, 0.72, -0.25, 0.72, 0.18);
    shape.bezierCurveTo(0.72, 0.62, 0.42, 0.9, 0, 0.9);
    shape.bezierCurveTo(-0.42, 0.9, -0.72, 0.62, -0.72, 0.18);
    shape.bezierCurveTo(-0.72, -0.25, -0.42, -0.6, 0, -0.62);
    for (let y = -0.3; y <= 0.66; y += 0.16) for (let x = -0.56; x <= 0.56; x += 0.16) {
      const ox = x + ((Math.round((y + 0.3) / 0.16) % 2) ? 0.08 : 0);
      const nx = ox / 0.62, ny = (y - 0.16) / 0.66;
      if (nx * nx + ny * ny > 0.78) continue;
      const h = new THREE.Path(); h.absarc(ox, y, 0.04, 0, Math.PI * 2, true); shape.holes.push(h);
    }
    const head = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 4, curveSegments: 32 }),
      [new THREE.MeshPhysicalMaterial({ color: ac, roughness: 0.35, clearcoat: 0.8 }), new THREE.MeshPhysicalMaterial({ color: 0x1B2436, roughness: 0.4, clearcoat: 0.6 })]);
    head.geometry.translate(0, 0, -0.07);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.36, 24), new THREE.MeshPhysicalMaterial({ color: 0x1B2436, roughness: 0.4, clearcoat: 0.6 }));
    neck.position.y = -0.78;
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 24), new THREE.MeshStandardMaterial({ color: 0xF2F4F8, roughness: 0.9 }));
    grip.position.y = -1.18;
    const rk = new THREE.Group(); rk.add(head, neck, grip); rk.position.y = 0.18; rk.scale.setScalar(0.92); rk.rotation.z = -0.35;
    const ball = seamBall(['#FFFFFF', '#E8ECF3'], ac, 0.2); ball.position.set(0.72, -0.62, 0.35);
    g.add(rk, ball); g.userData.ball = ball;
    return g;
  },
  golf(ac) {
    const g = new THREE.Group();
    const bump = canvasTex(512, 256, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); for (let y = 6; y < h; y += 13) for (let x = (y / 13 % 2) * 6.5; x < w; x += 13) { const r = c.createRadialGradient(x, y, 0, x, y, 6); r.addColorStop(0, '#666'); r.addColorStop(1, '#fff'); c.fillStyle = r; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); } });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.48, 64, 48), new THREE.MeshPhysicalMaterial({ color: 0xFBFBFB, roughness: 0.45, clearcoat: 0.6, bumpMap: bump, bumpScale: 2.2 }));
    ball.position.y = 0.05;
    const wood = new THREE.MeshStandardMaterial({ color: 0xE9D3B0, roughness: 0.7 });
    const tee = new THREE.Group();
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.05, 0.12, 24), wood); cup.position.y = -0.47;
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.015, 0.62, 16), wood); pin.position.y = -0.84;
    tee.add(cup, pin);
    const turf = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.08, 64), new THREE.MeshStandardMaterial({ color: 0x3E8E5C, roughness: 0.95 })); turf.position.y = -1.0;
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.09, 32), new THREE.MeshStandardMaterial({ color: 0x0F1D36 })); hole.position.set(0.55, -0.995, -0.25);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.7, 12), new THREE.MeshStandardMaterial({ color: 0xF3F4F6, metalness: 0.4, roughness: 0.3 })); pole.position.set(0.55, -0.15, -0.25);
    const fg = new THREE.PlaneGeometry(0.5, 0.32, 12, 4); fg.translate(0.25, 0, 0);
    const flag = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ color: ac, side: THREE.DoubleSide, roughness: 0.6 })); flag.position.set(0.56, 0.52, -0.25);
    flag.userData.base = fg.attributes.position.array.slice();
    g.add(ball, tee, turf, hole, pole, flag); g.userData.flag = flag; g.userData.spinTarget = ball;
    g.position.y = 0.15;
    return g;
  },
  reiten(ac) {
    const g = new THREE.Group();
    const pts = []; for (let i = 0; i <= 64; i++) { const a = -Math.PI * 0.18 + (Math.PI * 1.36) * (i / 64); pts.push(new THREE.Vector3(Math.cos(a) * 0.7, Math.sin(a) * 0.82, 0)); }
    const curve = new THREE.CatmullRomCurve3(pts);
    const steel = new THREE.MeshPhysicalMaterial({ color: 0xC9CED8, metalness: 1, roughness: 0.22, clearcoat: 0.3 });
    const shoe = new THREE.Mesh(new THREE.TubeGeometry(curve, 128, 0.17, 24, false), steel); shoe.scale.z = 0.55;
    const capG = new THREE.SphereGeometry(0.17, 24, 16);
    const c1 = new THREE.Mesh(capG, steel); c1.position.copy(pts[0]); c1.scale.z = 0.55;
    const c2 = new THREE.Mesh(capG, steel); c2.position.copy(pts[64]); c2.scale.z = 0.55;
    const nailM = new THREE.MeshStandardMaterial({ color: 0x3A3F4A, metalness: 0.6, roughness: 0.4 });
    for (const t of [0.12, 0.24, 0.36, 0.64, 0.76, 0.88]) { const p = curve.getPoint(t); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 12), nailM); n.rotation.x = Math.PI / 2; n.position.copy(p); g.add(n); }
    g.add(shoe, c1, c2); g.rotation.z = Math.PI; g.position.y = 0.05;
    const wrap = new THREE.Group(); wrap.add(g);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), new THREE.MeshPhysicalMaterial({ color: ac, roughness: 0.3, clearcoat: 1 })); star.position.set(0, 0.05, 0.2);
    return wrap;
  },
  tanz(ac) {
    const g = new THREE.Group();
    const R = 0.72, tiles = [];
    const geo = new THREE.BoxGeometry(0.085, 0.085, 0.02);
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xE9EDF5, metalness: 1, roughness: 0.12 });
    const rows = 18;
    for (let r = 1; r < rows; r++) {
      const phi = Math.PI * r / rows, n = Math.max(6, Math.round(2 * Math.PI * Math.sin(phi) * R / 0.095));
      for (let k = 0; k < n; k++) { const th = 2 * Math.PI * k / n; tiles.push(new THREE.Vector3(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)).multiplyScalar(R)); }
    }
    const inst = new THREE.InstancedMesh(geo, mat, tiles.length);
    const o = new THREE.Object3D();
    tiles.forEach((p, i) => { o.position.copy(p); o.lookAt(p.clone().multiplyScalar(2)); o.updateMatrix(); inst.setMatrixAt(i, o.matrix); });
    const core = new THREE.Mesh(new THREE.SphereGeometry(R - 0.02, 32, 24), new THREE.MeshStandardMaterial({ color: 0x1B2436 }));
    const ball = new THREE.Group(); ball.add(core, inst);
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.8, 8), new THREE.MeshStandardMaterial({ color: 0x8A94A6 })); str.position.y = R + 0.4;
    const capM = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.08, 16), new THREE.MeshPhysicalMaterial({ color: 0xC9CED8, metalness: 1, roughness: 0.3 })); capM.position.y = R + 0.02;
    g.add(ball, str, capM); g.userData.spinTarget = ball;
    const l1 = new THREE.PointLight(new THREE.Color(ac), 6, 6); const l2 = new THREE.PointLight(0x6EA0FF, 5, 6);
    g.add(l1, l2); g.userData.lights = [l1, l2];
    g.position.y = -0.1;
    return g;
  },
  schwimmen(ac) {
    const g = new THREE.Group();
    const tex = canvasTex(1024, 64, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#FFFFFF' : '#D8372F'; c.fillRect(i * w / 8, 0, w / 8 + 1, h); } });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.23, 32, 96), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.35, clearcoat: 0.9 }));
    const ropeM = new THREE.MeshStandardMaterial({ color: 0xF1E6CF, roughness: 0.9 });
    const rope = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.245, 6, 96, Math.PI * 2), new THREE.MeshStandardMaterial({ color: 0xF1E6CF, roughness: 0.9, wireframe: true, transparent: true, opacity: 0.0 }));
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; const loop = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.022, 8, 32), ropeM); loop.position.set(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0); loop.rotation.z = a; loop.rotation.y = Math.PI / 2; g.add(loop); }
    g.add(ring, rope);
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.25, 64), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(ac), transparent: true, opacity: 0.22, roughness: 0.1, clearcoat: 1 }));
    water.rotation.x = -Math.PI / 2; water.position.y = -0.95;
    const wrap = new THREE.Group(); g.rotation.x = -0.35; wrap.add(g, water); wrap.userData.bobber = g; wrap.userData.water = water;
    return wrap;
  },
  fussball(ac) {
    const R = 0.75;
    // Pentagone als Textur: je Bildpunkt prüfen, ob die Richtung in einem der 12 Fünfecke liegt
    const ico = new THREE.IcosahedronGeometry(1, 0), p = ico.attributes.position, V = [];
    for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)).normalize(); if (!V.some((s) => s.distanceTo(v) < 1e-3)) V.push(v); }
    const P = V.map((v) => {
      const nb = V.filter((w) => w !== v).sort((a, b) => b.dot(v) - a.dot(v)).slice(0, 5);
      const up = Math.abs(v.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      const e1 = new THREE.Vector3().crossVectors(up, v).normalize(), e2 = new THREE.Vector3().crossVectors(v, e1);
      const ang = nb.map((w) => { const q = w.clone().divideScalar(w.dot(v)).sub(v); return Math.atan2(q.dot(e2), q.dot(e1)); });
      return { v, e1, e2, a0: ang[0] };
    });
    const rv = Math.tan(0.36), ap = rv * Math.cos(Math.PI / 5), seg = (2 * Math.PI) / 5;
    const tex = canvasTex(1024, 512, (g, w, h) => {
      const img = g.createImageData(w, h), d = new THREE.Vector3(), q = new THREE.Vector3();
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const u = x / w, vv = y / h, th = u * 2 * Math.PI, ph = vv * Math.PI;
        d.set(-Math.cos(th) * Math.sin(ph), Math.cos(ph), Math.sin(th) * Math.sin(ph));
        let best = null, bd = -2; for (const pp of P) { const t = d.dot(pp.v); if (t > bd) { bd = t; best = pp; } }
        q.copy(d).divideScalar(bd).sub(best.v);
        const px = q.dot(best.e1), py = q.dot(best.e2), r = Math.hypot(px, py);
        let rel = Math.atan2(py, px) - best.a0 - seg / 2; rel = ((rel % seg) + seg) % seg - seg / 2;
        const lim = ap / Math.cos(rel);
        let c = 246; if (r < lim - 0.012) c = 22; else if (r < lim + 0.01) c = 120;
        // feine Nähte der Sechsecke
        const k = (y * w + x) * 4; img.data[k] = c; img.data[k + 1] = c + (c > 200 ? 2 : 4); img.data[k + 2] = c + (c > 200 ? 4 : 10); img.data[k + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.25 }));
    const wrap = new THREE.Group(); wrap.add(ball); wrap.userData.spinTarget = ball;
    return wrap;
  },
  kampfsport(ac) {
    const g = new THREE.Group();
    const red = new THREE.MeshPhysicalMaterial({ color: 0xB42318, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.2 });
    const white = new THREE.MeshPhysicalMaterial({ color: 0xF5F6F8, roughness: 0.5, clearcoat: 0.5 });
    const fist = new THREE.Mesh(new THREE.SphereGeometry(0.6, 48, 32), red); fist.scale.set(1, 1.08, 0.86); fist.position.y = 0.32;
    const knuckle = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.5, 12, 24), red); knuckle.rotation.z = Math.PI / 2; knuckle.position.set(0, 0.62, 0.18); knuckle.scale.set(1, 1, 0.9);
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.36, 12, 24), red); thumb.position.set(0.46, 0.2, 0.3); thumb.rotation.set(0.35, 0, 0.18);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.47, 0.62, 48), red); cuff.position.y = -0.42;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.455, 0.465, 0.14, 48), white); band.position.y = -0.3;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.05, 16, 48), white); rim.rotation.x = Math.PI / 2; rim.position.y = -0.73;
    g.add(fist, knuckle, thumb, cuff, band, rim); g.rotation.set(0.1, -0.3, 0); g.scale.setScalar(0.92);
    const wrap = new THREE.Group(); wrap.add(g); wrap.userData.spinTarget = g;
    return wrap;
  },
};

export function mount(canvas, kind, opts = {}) {
  const ac = new THREE.Color(opts.accent || '#2252CC');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.environment = studioEnv(renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50); camera.position.set(0, 0.2, opts.dist || 5.2);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xC2CCE0, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xDDE7FF, 1.2); rim.position.set(4, 1, -3); scene.add(rim);
  const obj = BUILD[kind](ac); const holder = new THREE.Group(); holder.add(obj); scene.add(holder);
  // Schatten als weicher Fleck
  const sh = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (c, w, h) => { const r = c.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(15,29,54,.35)'); r.addColorStop(1, 'rgba(15,29,54,0)'); c.fillStyle = r; c.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = -1.25; sh.scale.set(1.1, 1.1, 1); scene.add(sh);
  if (kind === 'golf' || kind === 'schwimmen') sh.visible = false;

  let w = 0, h = 0;
  const resize = () => { const r = canvas.getBoundingClientRect(); if (!r.width) return; w = r.width; h = r.height; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(canvas); resize();
  let hover = 0, hv = 0, tx = 0, ty = 0, mx = 0, my = 0, vis = true, spin = 0;
  const host = opts.host || canvas;
  host.addEventListener('pointerenter', () => { hover = 1; });
  host.addEventListener('pointerleave', () => { hover = 0; tx = ty = 0; });
  host.addEventListener('pointermove', (e) => { const r = host.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; });
  new IntersectionObserver(([en]) => { vis = en.isIntersecting; }, { threshold: 0 }).observe(canvas);
  const t0 = performance.now(); let last = t0;
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (!vis) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = reduce ? 1.2 : (now - t0) / 1000;
    hv += (hover - hv) * 0.08; mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
    if (!reduce) spin += dt * (0.5 + hv * 2.2) * (opts.speed || 1);
    holder.rotation.y = spin * 0.6 + mx * 0.6; holder.rotation.x = my * 0.35 + 0.08;
    holder.position.y = Math.sin(t * 1.2) * 0.06 + hv * 0.08;
    holder.scale.setScalar(1 + hv * 0.07);
    sh.scale.setScalar(1.1 - holder.position.y * 0.4);
    const u = obj.userData;
    if (u.spinTarget) u.spinTarget.rotation.x = t * 0.3;
    if (u.flag) { const a = u.flag.geometry.attributes.position, b = u.flag.userData.base; for (let i = 0; i < a.count; i++) { const x = b[i * 3]; a.setZ(i, Math.sin(x * 9 - t * 6) * x * 0.12); } a.needsUpdate = true; }
    if (u.lights) { u.lights[0].position.set(Math.cos(t * 1.4) * 1.6, 0.6, Math.sin(t * 1.4) * 1.6); u.lights[1].position.set(Math.cos(t * 1.1 + 3) * 1.6, -0.4, Math.sin(t * 1.1 + 3) * 1.6); }
    if (u.star) { u.star.rotation.y = t * 2; u.star.position.y = 0.05 + Math.sin(t * 2) * 0.05; }
    if (u.bobber) { u.bobber.position.y = Math.sin(t * 1.6) * 0.07; u.bobber.rotation.z = Math.sin(t * 1.1) * 0.08; u.water.scale.setScalar(1 + Math.sin(t * 1.6) * 0.03); }
    if (u.ball) { u.ball.position.y = -0.62 + Math.abs(Math.sin(t * 2.2)) * 0.25; u.ball.rotation.x = t * 3; }
    renderer.render(scene, camera);
  };
  requestAnimationFrame(frame);
  canvas.classList.add('ready');
}

export const KINDS = Object.keys(BUILD);
