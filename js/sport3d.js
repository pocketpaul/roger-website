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
    // Kopf als Superellipse, unten in den Hals übergehend
    const se = (t, a, b, n) => { const c = Math.cos(t), s = Math.sin(t); return [a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]; };
    const HY = 0.36, HA = 0.5, HB = 0.56, N = 2.5;
    const shape = new THREE.Shape();
    shape.moveTo(0.075, -0.66);
    shape.bezierCurveTo(0.12, -0.42, 0.34, -0.3, 0.44, -0.08);
    const a0 = Math.atan2(-0.08 - HY, 0.44) + 0.02;
    for (let i = 0; i <= 120; i++) { const t = a0 + (Math.PI - 2 * a0) * (i / 120) * -1 + 0; }
    // Kopf gegen den Uhrzeigersinn von rechts unten über oben nach links unten
    const tStart = -0.62, tEnd = Math.PI + 0.62;
    for (let i = 0; i <= 140; i++) { const t = tStart + (tEnd - tStart) * i / 140; const [x, y] = se(t, HA, HB, N); shape.lineTo(x, y + HY); }
    shape.bezierCurveTo(-0.34, -0.3, -0.12, -0.42, -0.075, -0.66);
    shape.lineTo(0.075, -0.66);
    // Herzförmige Öffnung im Hals
    const heart = new THREE.Path();
    heart.moveTo(0, -0.46);
    heart.bezierCurveTo(0.08, -0.36, 0.2, -0.22, 0.17, -0.13);
    heart.bezierCurveTo(0.14, -0.05, 0.04, -0.06, 0, -0.12);
    heart.bezierCurveTo(-0.04, -0.06, -0.14, -0.05, -0.17, -0.13);
    heart.bezierCurveTo(-0.2, -0.22, -0.08, -0.36, 0, -0.46);
    shape.holes.push(heart);
    // Lochung
    const holes = [];
    for (let r = 0; r < 14; r++) for (let c = -7; c <= 7; c++) {
      const x = c * 0.075 + (r % 2 ? 0.0375 : 0), y = 0.02 + r * 0.066;
      const nx = x / (HA * 0.8), ny = (y - HY) / (HB * 0.8);
      if (Math.pow(Math.abs(nx), N) + Math.pow(Math.abs(ny), N) > 1 || y < 0.02) continue;
      holes.push([x, y]); const h = new THREE.Path(); h.absarc(x, y, 0.021, 0, Math.PI * 2, true); shape.holes.push(h);
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 5, curveSegments: 16 });
    geo.translate(0, 0, -0.05);
    // Schlagfläche: Grafik in Akzentfarbe mit dunklem Rahmen
    const face = canvasTex(512, 800, (c, w, h) => {
      const X = (x) => (x + 0.55) / 1.1 * w, Y = (y) => h - (y + 0.7) / 1.7 * h;
      c.fillStyle = '#F4F6FA'; c.fillRect(0, 0, w, h);
      c.save(); c.beginPath(); for (let i = 0; i <= 120; i++) { const [x, y] = se(i / 120 * Math.PI * 2, HA, HB, N); c.lineTo(X(x), Y(y + HY)); } c.closePath(); c.clip();
      const acc = '#' + ac.getHexString();
      c.fillStyle = acc; c.beginPath(); c.moveTo(X(-0.6), Y(0.15)); c.bezierCurveTo(X(-0.1), Y(0.55), X(0.2), Y(0.2), X(0.6), Y(0.75)); c.lineTo(X(0.6), Y(1.0)); c.lineTo(X(-0.6), Y(1.0)); c.fill();
      c.fillStyle = '#1B2436'; c.beginPath(); c.moveTo(X(-0.6), Y(0.08)); c.bezierCurveTo(X(-0.1), Y(0.46), X(0.2), Y(0.11), X(0.6), Y(0.64)); c.lineTo(X(0.6), Y(0.7)); c.bezierCurveTo(X(0.2), Y(0.17), X(-0.1), Y(0.52), X(-0.6), Y(0.14)); c.fill();
      c.restore();
      c.lineWidth = 0.055 / 1.1 * w; c.strokeStyle = '#1B2436'; c.beginPath(); for (let i = 0; i <= 120; i++) { const [x, y] = se(i / 120 * Math.PI * 2, HA - 0.02, HB - 0.02, N); c.lineTo(X(x), Y(y + HY)); } c.closePath(); c.stroke();
      c.fillStyle = '#1B2436'; c.fillRect(X(-0.2), Y(-0.05), X(0.2) - X(-0.2), Y(-0.7) - Y(-0.05));
    });
    face.wrapS = face.wrapT = THREE.ClampToEdgeWrapping; face.repeat.set(1 / 1.1, 1 / 1.7); face.offset.set(0.5, 0.7 / 1.7);
    const frameM = new THREE.MeshPhysicalMaterial({ color: 0x1B2436, roughness: 0.35, clearcoat: 0.8 });
    const head = new THREE.Mesh(geo, [new THREE.MeshPhysicalMaterial({ map: face, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3 }), frameM]);
    // Griff mit Griffband und Schlaufe
    const grip = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#F2F4F8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#C9D0DC'; c.lineWidth = 6; for (let i = -h; i < w + h; i += 28) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + h * 0.6, h); c.stroke(); } });
    grip.wrapS = grip.wrapT = THREE.RepeatWrapping; grip.repeat.set(2, 2);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.072, 0.42, 32), new THREE.MeshStandardMaterial({ map: grip, roughness: 0.85 }));
    handle.position.y = -0.87; handle.scale.z = 0.8;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.06, 32), frameM); cap.position.y = -1.1; cap.scale.z = 0.8;
    const loop = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -1.12, 0), new THREE.Vector3(0.1, -1.28, 0.02), new THREE.Vector3(0.06, -1.45, 0.05), new THREE.Vector3(-0.07, -1.42, 0.04), new THREE.Vector3(-0.08, -1.26, 0.02), new THREE.Vector3(0, -1.12, 0)], true);
    const strap = new THREE.Mesh(new THREE.TubeGeometry(loop, 64, 0.014, 8, true), new THREE.MeshStandardMaterial({ color: ac, roughness: 0.6 }));
    const rk = new THREE.Group(); rk.add(head, handle, cap, strap); rk.position.y = 0.32; rk.rotation.z = -0.32; rk.scale.setScalar(0.95);
    const ball = seamBall(['#FFFFFF', '#E8ECF3'], '#' + ac.getHexString(), 0.17); ball.position.set(0.78, -0.55, 0.3);
    g.add(rk, ball); g.userData.ball = ball; g.userData.sway = true;
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
    const red = new THREE.MeshPhysicalMaterial({ color: 0xA3141C, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 });
    const white = new THREE.MeshPhysicalMaterial({ color: 0xF5F6F8, roughness: 0.45, clearcoat: 0.6 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x8E1B20, roughness: 0.55 });
    const g = new THREE.Group();
    // Faust: höher als breit, Finger rollen nach vorn, unten fließender Übergang in die Manschette
    const body = new THREE.SphereGeometry(1, 128, 96), p = body.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.set(p.getX(i), p.getY(i), p.getZ(i));
      let x = v.x * 0.56, y = v.y * 0.6, z = v.z * 0.56;
      if (v.y < 0) { const t = Math.pow(-v.y, 1.3); x = v.x * (0.56 - 0.17 * t); z = v.z * (0.56 - 0.17 * t); y = v.y * 0.82; }
      z += 0.2 * Math.max(0, v.y + 0.2) * (1 - Math.abs(v.x) * 0.3);   // Finger rollen nach vorn
      if (v.z > 0) z *= 1 + 0.12 * Math.max(0, v.y);                    // volle Schlagfläche
      if (v.z < 0) z *= 0.82;                                           // flacher Handrücken
      p.setXYZ(i, x, y, z);
    }
    body.computeVertexNormals();
    const fist = new THREE.Mesh(body, red); fist.position.y = 0.3;
    // Daumen seitlich an der Handfläche, Spitze liegt an der Faust an
    const tc = new THREE.CatmullRomCurve3([new THREE.Vector3(0.28, -0.34, 0.2), new THREE.Vector3(0.43, -0.14, 0.3), new THREE.Vector3(0.46, 0.06, 0.42), new THREE.Vector3(0.34, 0.16, 0.56)]);
    const tg = new THREE.TubeGeometry(tc, 64, 0.17, 24, false);
    { const q = tg.attributes.position; const c = new THREE.Vector3(); for (let i = 0; i < q.count; i++) { const u = Math.floor(i / 25) / 64; c.copy(tc.getPoint(u)); const d = new THREE.Vector3(q.getX(i), q.getY(i), q.getZ(i)).sub(c); const s = 1 - 0.2 * u; q.setXYZ(i, c.x + d.x * s, c.y + d.y * s, c.z + d.z * s); } tg.computeVertexNormals(); }
    const thumb = new THREE.Mesh(tg, red); thumb.position.y = 0.3;
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), red); e1.position.copy(tc.getPoint(0)); e1.position.y += 0.3;
    const e2 = new THREE.Mesh(new THREE.SphereGeometry(0.136, 24, 16), red); e2.position.copy(tc.getPoint(1)); e2.position.y += 0.3;
    // Manschette mit Klettverschluss
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.4, 0.78, 64), red); cuff.position.y = -0.58; cuff.scale.z = 0.9;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.385, 0.4, 0.3, 64), white); band.position.y = -0.62; band.scale.z = 0.92;
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.05), white); tab.position.set(0.2, -0.62, 0.33); tab.rotation.y = 0.55;
    const stitch = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.052), new THREE.MeshStandardMaterial({ color: 0xD9DDE5, roughness: 0.8 })); stitch.position.copy(tab.position); stitch.rotation.y = 0.55;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.035, 16, 64), white); rim.rotation.x = Math.PI / 2; rim.position.y = -0.97; rim.scale.y = 0.9;
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.378, 0.014, 8, 64), dark); seam.rotation.x = Math.PI / 2; seam.position.y = -0.27; seam.scale.y = 0.9;
    g.add(fist, thumb, e1, e2, cuff, band, tab, stitch, rim, seam);
    g.scale.setScalar(0.9); g.position.y = 0.12; g.rotation.set(0.12, 0, -0.28);
    const wrap = new THREE.Group(); wrap.add(g); wrap.userData.sway = true;
    return wrap;
  },
};

function tickObj(u, t) {
    if (u.spinTarget) u.spinTarget.rotation.x = t * 0.3;
    if (u.flag) { const a = u.flag.geometry.attributes.position, b = u.flag.userData.base; for (let i = 0; i < a.count; i++) { const x = b[i * 3]; a.setZ(i, Math.sin(x * 9 - t * 6) * x * 0.12); } a.needsUpdate = true; }
    if (u.lights) { u.lights[0].position.set(Math.cos(t * 1.4) * 1.6, 0.6, Math.sin(t * 1.4) * 1.6); u.lights[1].position.set(Math.cos(t * 1.1 + 3) * 1.6, -0.4, Math.sin(t * 1.1 + 3) * 1.6); }
    if (u.star) { u.star.rotation.y = t * 2; u.star.position.y = 0.05 + Math.sin(t * 2) * 0.05; }
    if (u.bobber) { u.bobber.position.y = Math.sin(t * 1.6) * 0.07; u.bobber.rotation.z = Math.sin(t * 1.1) * 0.08; u.water.scale.setScalar(1 + Math.sin(t * 1.6) * 0.03); }
    if (u.ball) { u.ball.position.y = -0.62 + Math.abs(Math.sin(t * 2.2)) * 0.25; u.ball.rotation.x = t * 3; }
}

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
  let hover = 0, hv = 0, tx = 0, ty = 0, mx = 0, my = 0, vis = true, spin = (opts.phase || 0) * 2.1;
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
    holder.rotation.y = (obj.userData.sway ? Math.sin(spin * 0.9) * 0.75 + 0.35 : spin * 0.6) + mx * 0.6; holder.rotation.x = my * 0.35 + 0.08;
    holder.position.y = Math.sin(t * 1.2) * 0.06 + hv * 0.08;
    holder.scale.setScalar(1 + hv * 0.07);
    sh.scale.setScalar(1.1 - holder.position.y * 0.4);
    tickObj(obj.userData, t);
    renderer.render(scene, camera);
  };
  requestAnimationFrame(frame);
  canvas.classList.add('ready');
}

export const KINDS = Object.keys(BUILD);

// Startseite: alle Sportarten kreisen um das Produktbild. Zwei Leinwände (hinter und vor dem Bild) erzeugen Tiefe.
export function mountOrbit(back, front, items) {
  const mk = (canvas) => {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75)); r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    return { r, env: studioEnv(r) };
  };
  const A = mk(back), B = mk(front);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 2, 0.1, 80); camera.position.set(0, 2.3, 12); camera.lookAt(0, -0.2, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xC2CCE0, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-3, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xDDE7FF, 1.1); rim.position.set(4, 1, -4); scene.add(rim);
  const ring = new THREE.Group(); scene.add(ring);
  const objs = items.map(([kind, accent], i) => {
    const o = BUILD[kind](new THREE.Color(accent)); const pivot = new THREE.Group(); pivot.add(o);
    pivot.scale.setScalar(kind === 'golf' || kind === 'schwimmen' ? 0.62 : 0.7); ring.add(pivot);
    return { o, pivot, ph: i / items.length * Math.PI * 2, sway: !!o.userData.sway };
  });
  let Rx = 5, Rz = 2.6, vis = true, mx = 0, my = 0, tx = 0, ty = 0;
  const host = back.parentElement;
  const size = () => {
    const w = host.clientWidth, h = host.clientHeight; if (!w) return;
    for (const X of [A, B]) X.r.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const halfW = Math.tan(THREE.MathUtils.degToRad(15)) * 12 * camera.aspect;
    Rx = Math.min(5.2, halfW * 0.84); Rz = Math.min(2.6, Rx * 0.5);
  };
  new ResizeObserver(size).observe(host); size();
  new IntersectionObserver(([en]) => { vis = en.isIntersecting; }).observe(host);
  addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });
  const t0 = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame); if (!vis) return;
    const t = reduce ? 2 : (now - t0) / 1000;
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    ring.rotation.x = my * 0.12; ring.rotation.y = mx * 0.18;
    objs.forEach((O, i) => {
      const a = O.ph + t * 0.16;
      O.pivot.position.set(Math.cos(a) * Rx, -0.1 - Math.sin(a) * 1.45 + Math.sin(t * 1.1 + i) * 0.1, Math.sin(a) * Rz);
      O.o.rotation.y = O.sway ? Math.sin(t * 0.8 + i) * 0.7 + 0.3 : t * 0.5 + i;
      tickObj(O.o.userData, t + i);
    });
    // hintere Leinwand: Objekte hinter dem Bild, vordere: davor
    const wp = new THREE.Vector3();
    objs.forEach((O) => { O.pivot.getWorldPosition(wp); O.pivot.visible = wp.z < 0; });
    scene.environment = A.env; A.r.render(scene, camera);
    objs.forEach((O) => { O.pivot.getWorldPosition(wp); O.pivot.visible = wp.z >= 0; });
    scene.environment = B.env; B.r.render(scene, camera);
  };
  requestAnimationFrame(frame);
  back.classList.add('ready'); front.classList.add('ready');
}

// Startseite: Sportsymbole schweben im Hintergrund des Kopfbereichs.
// items: [kind, accent, x, y, size, depth] mit x/y als Anteil der Fläche, size in px, depth 0..1 (1 = vorn, scharf)
export function mountFloat(canvas, items, mobileItems) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene(); scene.environment = studioEnv(renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, 10, 6000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xC2CCE0, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-300, 500, 600); scene.add(key);
  const rim = new THREE.DirectionalLight(0xDDE7FF, 1.1); rim.position.set(400, 100, -400); scene.add(rim);
  const host = canvas.parentElement;
  let W = 0, H = 0, set = null, objs = [];
  const build = (list) => {
    objs.forEach((O) => scene.remove(O.pivot));
    objs = list.map(([kind, accent, x, y, size, depth], i) => {
      const o = BUILD[kind](new THREE.Color(accent)); const pivot = new THREE.Group(); pivot.add(o); scene.add(pivot);
      if (depth < 0.6) o.traverse((m) => { if (!m.isMesh) return; (Array.isArray(m.material) ? m.material : [m.material]).forEach((mt) => { mt.transparent = true; mt.opacity = 0.25 + depth * 0.6; mt.depthWrite = false; }); });
      o.traverse((m) => { if (m.isLight) m.intensity = 0; });
      return { o, pivot, x, y, size, depth, ph: i * 1.7, sway: !!o.userData.sway };
    });
  };
  const size = () => {
    W = host.clientWidth; H = host.clientHeight; if (!W) return;
    renderer.setSize(W, H, false);
    const dist = 1200; camera.position.set(0, 0, dist); camera.fov = 2 * Math.atan(H / 2 / dist) * 180 / Math.PI; camera.aspect = W / H; camera.updateProjectionMatrix();
    const want = W < 700 ? 'm' : 'd';
    if (want !== set) { set = want; build(want === 'm' && mobileItems ? mobileItems : items); }
  };
  new ResizeObserver(size).observe(host); size();
  let vis = true; new IntersectionObserver(([en]) => { vis = en.isIntersecting; }).observe(host);
  let mx = 0, my = 0, tx = 0, ty = 0;
  addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });
  const t0 = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame); if (!vis) return;
    const t = reduce ? 3 : (now - t0) / 1000;
    mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
    const sy = reduce ? 0 : scrollY;
    objs.forEach((O) => {
      const amp = (14 + O.depth * 22) * (W < 700 ? 0.5 : 1);
      const px = (O.x - 0.5) * W + Math.sin(t * 0.35 + O.ph) * amp - mx * 40 * O.depth;
      const py = (0.5 - O.y) * H + Math.cos(t * 0.28 + O.ph * 1.3) * amp + sy * (0.08 + 0.22 * O.depth) * (W < 700 ? 0.4 : 1) - my * 30 * O.depth;
      O.pivot.position.set(px, py, (O.depth - 0.5) * 200);
      O.pivot.scale.setScalar(O.size / 2);
      O.o.rotation.y = O.sway ? Math.sin(t * 0.6 + O.ph) * 0.7 + 0.3 : t * 0.35 + O.ph;
      O.o.rotation.x = Math.sin(t * 0.4 + O.ph) * 0.15;
      tickObj(O.o.userData, t + O.ph);
    });
    renderer.render(scene, camera);
  };
  requestAnimationFrame(frame);
  canvas.classList.add('ready');
}
