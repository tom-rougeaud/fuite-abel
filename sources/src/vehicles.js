/* Projet : La fuite d’Abel  ·  Version : 1.12.0  ·  Date : 18/11/2026
   Auteur : Tom Rougeaud  ·  Licence : CC BY-NC 4.0
   Réalisé avec l’aide de l’IA : Claude Sonnet 5.5 (Anthropic) */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mat, mesh, rbox } from './char.js';

const glass = () => mat('#26313f', 0.12, 0.35);
const rubber = mat('#1c1e23', 0.95);
const chrome = mat('#aeb3bb', 0.25, 0.8);
const tailM = () => mat('#8f2c27', 0.4, 0, '#6a1c18', 0.8);
const amberM = () => mat('#c98a2b', 0.4, 0, '#7a4d12', 0.6);

/* fusionne tous les maillages d’un groupe par matériau (peu d’appels de dessin) */
export function mergeGroup(g) {
  g.updateMatrixWorld(true);
  const buckets = new Map();
  g.traverse(o => { if (o.isMesh) { let geo = o.geometry.clone(); if (geo.index) geo = geo.toNonIndexed(); geo.applyMatrix4(o.matrixWorld); if (!buckets.has(o.material)) buckets.set(o.material, []); buckets.get(o.material).push(geo); } });
  const out = new THREE.Group();
  buckets.forEach((arr, m) => {
    const merged = mergeGeometries(arr, false); arr.forEach(a => a.dispose());
    if (!merged) return;
    const me = new THREE.Mesh(merged, m); me.castShadow = true; me.receiveShadow = true; out.add(me);
  });
  out.userData = g.userData; return out;
}

function wheel(r, w) {
  const g = new THREE.Group();
  const tire = mesh(new THREE.CylinderGeometry(r, r, w, 24), rubber); tire.rotation.z = Math.PI / 2; g.add(tire);
  const hub = mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, w + 0.02, 18), chrome); hub.rotation.z = Math.PI / 2; g.add(hub);
  const cap = mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.2, w + 0.05, 10), mat('#5b6068', 0.5, 0.6)); cap.rotation.z = Math.PI / 2; g.add(cap);
  return g;
}
function add(g, o, x, y, z) { o.position.set(x, y, z); g.add(o); return o; }

/* Tous les véhicules regardent vers -z ; l’arrière est du côté +z ; origine = centre au sol */
export function makeBus(body = '#e0a72c') {
  const g = new THREE.Group(), L = 11.5, W = 2.5;
  const m = mat(body, 0.5), blk = mat('#25282e', 0.8);
  add(g, rbox(W, 2.45, L, 0.32, m), 0, 1.78, 0);
  add(g, rbox(W + 0.03, 0.5, L - 0.1, 0.12, blk), 0, 0.62, 0);
  for (const y of [1.28, 2.05]) add(g, rbox(W + 0.025, 0.07, L - 0.5, 0.02, blk), 0, y, 0);
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) add(g, rbox(0.05, 0.72, 0.95, 0.03, glass()), s * (W / 2 + 0.005), 2.5, -4.6 + i * 1.15);
  add(g, rbox(2.1, 0.75, 0.06, 0.04, glass()), 0, 2.5, L / 2 + 0.01);
  add(g, rbox(0.9, 1.1, 0.06, 0.04, glass()), 0, 1.5, L / 2 + 0.01);
  add(g, rbox(0.04, 1.2, 0.07, 0.01, blk), 0, 1.55, L / 2 + 0.02);
  for (const s of [-1, 1]) { add(g, rbox(0.3, 0.22, 0.08, 0.04, tailM()), s * 1.0, 1.0, L / 2 + 0.02); add(g, rbox(0.3, 0.14, 0.08, 0.04, amberM()), s * 1.0, 1.28, L / 2 + 0.02); add(g, rbox(0.18, 0.12, 0.08, 0.04, tailM()), s * 1.0, 2.9, L / 2 + 0.02); }
  add(g, rbox(W + 0.1, 0.22, 0.2, 0.08, blk), 0, 0.5, L / 2 + 0.05);
  add(g, rbox(0.5, 0.14, 0.03, 0.01, mat('#e8e4d6', 0.6)), 0, 0.82, L / 2 + 0.02);
  const stop = mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.03, 8), mat('#a83a30', 0.6)); stop.rotation.z = Math.PI / 2; stop.rotation.y = Math.PI / 8; add(g, stop, -(W / 2 + 0.17), 1.7, -1.6);
  for (const z of [-3.9, 3.7]) for (const s of [-1, 1]) add(g, wheel(0.5, 0.3), s * (W / 2 - 0.1), 0.5, z);
  g.userData = { w: W, h: 3.0, l: L };
  return g;
}
export function makeTruck(cab = '#2f4468', trailer = '#dcd8cc') {
  const g = new THREE.Group(), W = 2.55;
  const cm = mat(cab, 0.45, 0.1), tm = mat(trailer, 0.65), blk = mat('#25282e', 0.8), red = mat('#a93a30', 0.6);
  add(g, rbox(W, 2.7, 12.6, 0.12, tm), 0, 2.55, 3.4);
  add(g, rbox(2.2, 0.35, 15.6, 0.05, blk), 0, 0.95, 1.9);
  add(g, rbox(W - 0.1, 0.4, 3.0, 0.1, cm), 0, 1.35, -5.5);
  add(g, rbox(W - 0.05, 2.2, 2.2, 0.28, cm), 0, 2.45, -6.0);
  add(g, rbox(W - 0.15, 0.9, 1.5, 0.15, cm), 0, 1.7, -7.6);
  add(g, rbox(W - 0.2, 0.9, 0.06, 0.05, glass()), 0, 2.9, -7.08);
  for (const s of [-1, 1]) { const st = mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.0, 10), chrome); add(g, st, s * 1.0, 3.5, -4.9); }
  for (let i = 0; i < 12; i++) { add(g, rbox(0.35, 0.08, 0.03, 0.01, i % 2 ? mat('#ece7da', 0.6) : red), -2.0 + i * 0.37 * 0.98 + 0.0, 1.3, 9.72); }
  add(g, rbox(0.03, 2.4, 0.04, 0.01, blk), 0, 2.55, 9.72);
  for (const s of [-1, 1]) { add(g, rbox(0.3, 0.2, 0.06, 0.03, tailM()), s * 1.05, 1.15, 9.74); add(g, rbox(0.12, 0.5, 0.05, 0.02, blk), s * 0.3, 2.5, 9.74); }
  add(g, rbox(W, 0.2, 0.18, 0.06, blk), 0, 1.05, 9.8);
  for (const z of [7.3, 8.6]) for (const s of [-1, 1]) add(g, wheel(0.52, 0.34), s * 1.05, 0.52, z);
  for (const z of [-4.6, -6.0]) for (const s of [-1, 1]) add(g, wheel(0.52, 0.34), s * 1.05, 0.52, z);
  for (const s of [-1, 1]) add(g, wheel(0.5, 0.3), s * 1.05, 0.5, -8.0);
  g.userData = { w: W, h: 4.0, l: 17.6 };
  return g;
}
export function makePickup(color = '#a8503b') {
  const g = new THREE.Group(), W = 2.05, m = mat(color, 0.4, 0.2), blk = mat('#25282e', 0.8);
  add(g, rbox(W, 0.85, 5.6, 0.14, m), 0, 0.98, 0);
  add(g, rbox(W - 0.1, 0.78, 2.2, 0.2, m), 0, 1.68, -0.9);
  add(g, rbox(W - 0.22, 0.52, 0.05, 0.04, glass()), 0, 1.75, 0.2);
  add(g, rbox(W - 0.1, 0.12, 0.08, 0.03, shade(m)), 0, 1.5, 2.8);
  for (const s of [-1, 1]) { add(g, rbox(0.1, 0.5, 2.5, 0.04, shade(m)), s * (W / 2 - 0.05), 1.65, 1.5); add(g, rbox(0.2, 0.28, 0.07, 0.03, tailM()), s * 0.82, 1.15, 2.83); }
  add(g, rbox(W + 0.04, 0.16, 0.2, 0.05, chrome), 0, 0.68, 2.85);
  for (const z of [-1.6, 1.7]) for (const s of [-1, 1]) add(g, wheel(0.42, 0.28), s * (W / 2 - 0.12), 0.42, z);
  g.userData = { w: W, h: 2.1, l: 5.6 };
  return g;
}
export function makeSedan(color = '#2f4468') {
  const g = new THREE.Group(), W = 1.9, m = mat(color, 0.35, 0.25);
  add(g, rbox(W, 0.7, 4.8, 0.2, m), 0, 0.75, 0);
  add(g, rbox(W - 0.2, 0.62, 2.6, 0.22, m), 0, 1.32, 0.2);
  add(g, rbox(W - 0.34, 0.45, 0.05, 0.04, glass()), 0, 1.35, 1.52);
  for (const s of [-1, 1]) { add(g, rbox(0.4, 0.14, 0.07, 0.03, tailM()), s * 0.68, 0.98, 2.4); add(g, rbox(0.04, 0.4, 1.6, 0.03, glass()), s * (W / 2 - 0.2), 1.36, 0.2); }
  add(g, rbox(0.5, 0.12, 0.03, 0.01, mat('#e8e4d6', 0.6)), 0, 0.72, 2.42);
  add(g, rbox(W + 0.03, 0.14, 0.14, 0.05, mat('#25282e', 0.7)), 0, 0.5, 2.4);
  for (const z of [-1.45, 1.45]) for (const s of [-1, 1]) add(g, wheel(0.34, 0.24), s * (W / 2 - 0.08), 0.34, z);
  g.userData = { w: W, h: 1.7, l: 4.8 };
  return g;
}
function shade(m) { return mat('#' + m.color.clone().multiplyScalar(0.8).getHexString(), 0.5); }

export function makeVan(color = '#d8d0bd') {
  const g = new THREE.Group(), W = 2.1, m = mat(color, 0.45, 0.1), blk = mat('#25282e', 0.8);
  add(g, rbox(W, 2.0, 5.2, 0.22, m), 0, 1.45, 0);
  add(g, rbox(W + 0.03, 0.4, 5.1, 0.1, blk), 0, 0.55, 0);
  add(g, rbox(W - 0.3, 0.55, 0.05, 0.04, glass()), 0, 2.0, 2.6);
  add(g, rbox(W - 0.1, 0.12, 0.05, 0.02, mat(shadeC(color, 0.8), 0.5)), 0, 1.2, 2.61);
  for (const s of [-1, 1]) { add(g, rbox(0.04, 0.5, 1.4, 0.02, glass()), s * (W / 2 + 0.005), 2.0, -1.2); add(g, rbox(0.14, 0.34, 0.06, 0.03, tailM()), s * 0.85, 1.15, 2.6); }
  add(g, rbox(W + 0.03, 0.14, 0.14, 0.05, chrome), 0, 0.62, 2.62);
  for (const z of [-1.6, 1.6]) for (const s of [-1, 1]) add(g, wheel(0.4, 0.26), s * (W / 2 - 0.08), 0.4, z);
  g.userData = { w: W, h: 2.45, l: 5.2 };
  return g;
}
function shadeC(c, k) { return '#' + new THREE.Color(c).multiplyScalar(k).getHexString(); }
export function makeBarrier() {
  const g = new THREE.Group(), bm = mat('#d1632f', 0.7), wm = mat('#ece7da', 0.7), leg = mat('#3a3f47', 0.8);
  for (const s of [-1, 1]) { add(g, rbox(0.12, 0.95, 0.12, 0.02, leg), s * 1.15, 0.475, 0); add(g, rbox(0.12, 0.08, 0.7, 0.02, leg), s * 1.15, 0.04, 0); }
  for (let i = 0; i < 2; i++) {
    add(g, rbox(2.6, 0.28, 0.1, 0.03, bm), 0, 0.78 - i * 0.38, 0);
    for (let k = 0; k < 7; k++) { const st = add(g, rbox(0.18, 0.3, 0.11, 0.01, wm), -1.08 + k * 0.36, 0.78 - i * 0.38, 0); st.rotation.z = 0.5; }
  }
  add(g, rbox(0.3, 0.3, 0.05, 0.02, mat('#f2c14e', 0.4, 0, '#c98a1b', 0.8)), 0, 1.1, 0);
  g.userData = { w: 2.6, h: 0.9, l: 0.7 };
  return g;
}
/* objets qui tombent : caisse en bois, tonneau */
export function makeCrate(c = '#b98a4e') {
  const g = new THREE.Group(), w = mat(c, 0.85), d = mat('#8a6030', 0.9);
  add(g, rbox(1.7, 1.5, 1.7, 0.06, w), 0, 0.75, 0);
  for (const y of [0.12, 1.38]) add(g, rbox(1.76, 0.14, 1.76, 0.02, d), 0, y, 0);
  for (const s of [-1, 1]) { add(g, rbox(0.14, 1.5, 1.76, 0.02, d), s * 0.78, 0.75, 0); add(g, rbox(1.76, 1.5, 0.14, 0.02, d), 0, 0.75, s * 0.78); }
  g.userData = { w: 1.7, h: 1.5, l: 1.7 }; return g;
}
export function makeBarrel(c = '#3f6f8f') {
  const g = new THREE.Group(), m = mat(c, 0.55), band = mat('#2a2f38', 0.6, 0.5);
  add(g, mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.5, 22), m), 0, 0.75, 0);
  for (const y of [0.2, 0.75, 1.3]) add(g, mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.1, 22), band), 0, y, 0);
  g.userData = { w: 1.5, h: 1.5, l: 1.5 }; return g;
}
export function makeBeam() {
  const g = new THREE.Group(), red = mat('#c8412f', 0.6), wm = mat('#ece7da', 0.7), post = mat('#4a4f58', 0.6, 0.3);
  for (const s of [-1, 1]) { add(g, rbox(0.28, 2.6, 0.28, 0.05, post), s * 1.5, 1.3, 0); add(g, rbox(0.6, 0.12, 0.6, 0.03, post), s * 1.5, 0.06, 0); }
  add(g, rbox(3.3, 0.55, 0.22, 0.05, red), 0, 1.5, 0);
  for (let k = 0; k < 8; k++) { const st = add(g, rbox(0.2, 0.58, 0.23, 0.01, wm), -1.4 + k * 0.4, 1.5, 0); st.rotation.z = 0.6; }
  for (const s of [-1, 1]) add(g, rbox(0.26, 0.26, 0.1, 0.03, mat('#f2c14e', 0.4, 0, '#c98a1b', 1.0)), s * 1.5, 2.7, 0);
  g.userData = { w: 3.3, h: 2.0, l: 0.6 };
  return g;
}
/* bus + rampe d’accès à l’arrière : la rampe monte vers le toit (h = 3 m) */
export function makeBusRamp(color = '#e0a72c') {
  const g = new THREE.Group(), bus = makeBus(color); g.add(bus);
  const RL = 7, H = 3.0, W = 2.3;
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(RL, 0); sh.lineTo(0, H); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: false }); geo.rotateY(-Math.PI / 2); geo.translate(W / 2, 0, bus.userData.l / 2);
  const ramp = mesh(geo, mat('#c9953c', 0.7)); g.add(ramp);
  const dark = mat('#2e3138', 0.8);
  for (let i = 1; i < 7; i++) { const u = i / 7 * RL, y = H * (1 - u / RL); const pl = rbox(W + 0.02, 0.03, 0.14, 0.01, dark); pl.position.set(0, y + 0.015, bus.userData.l / 2 + u); pl.rotation.x = -Math.atan(H / RL) * -1; g.add(pl); pl.rotation.x = Math.atan(H / RL); }
  g.userData = { w: 2.5, h: 3.0, l: bus.userData.l + RL, ramp: RL, body: bus.userData.l, roof: 3.0 };
  return g;
}
const PROTO = {};
export function proto(kind, variant = 0) {
  const k = kind + variant; if (PROTO[k]) return PROTO[k];
  const SED = ['#2f4468', '#a8503b', '#6f8f7a', '#d8d0bd', '#8a3f4a', '#3f6f8f'], PIC = ['#a8503b', '#2f4468', '#4f6f4a', '#c8c2b0'], BUS = ['#e0a72c', '#c8412f', '#3f8fa8'], TR = [['#2f4468', '#dcd8cc'], ['#a93a30', '#e8e4d6'], ['#3f6f4a', '#cfd4d8']], VAN = ['#d8d0bd', '#6a8fb0', '#b0524a'];
  let g;
  switch (kind) {
    case 'sedan': g = makeSedan(SED[variant % SED.length]); break;
    case 'pickup': g = makePickup(PIC[variant % PIC.length]); break;
    case 'van': g = makeVan(VAN[variant % VAN.length]); break;
    case 'bus': g = makeBus(BUS[variant % BUS.length]); break;
    case 'truck': g = makeTruck(...TR[variant % TR.length]); break;
    case 'busramp': g = makeBusRamp(BUS[variant % BUS.length]); break;
    case 'barrier': g = makeBarrier(); break;
    case 'beam': g = makeBeam(); break;
    case 'crate': g = makeCrate(['#b98a4e', '#a87a42', '#c79a5c'][variant % 3]); break;
    case 'barrel': g = makeBarrel(['#3f6f8f', '#a8503b', '#4f7a4a'][variant % 3]); break;
  }
  return PROTO[k] = mergeGroup(g);
}
