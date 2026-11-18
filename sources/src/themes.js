/* Projet : La fuite d’Abel  ·  Version : 1.10.0  ·  Date : 18/11/2026
   Auteur : Tom Rougeaud  ·  Licence : CC BY-NC 4.0
   Réalisé avec l’aide de l’IA : Claude Sonnet 5.5 (Anthropic) */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mat } from './char.js';

/* ---------- données des 5 décors ---------- */
export const THEMES = [
  { id: 'ville', icon: 'city', sky: ['#2a3a63', '#5d6e98', '#c9a38f', '#e2bc96', '#cfa98c'], fog: ['#d2ab8e', 45, 190], hemi: ['#c9d3ef', '#5b5a50', 1.15], sun: ['#ffd7a3', 2.6, [-11, 17, 9]], exposure: 1.05, env: 0.55,
    road: { base: '#4b505b', line: '#d9d5c9', edge: '#d9d5c9', alpha: 1 }, walk: '#a8a395', curb: '#c1bcae', ground: '#46544a', gkind: 'grass', haze: '#c9a58f' },
  { id: 'plage', icon: 'beach', sky: ['#4f9fe0', '#86c3ee', '#cfe8f5', '#f3ecd4', '#efdcb0'], fog: ['#cde4ee', 60, 230], hemi: ['#e2f1ff', '#d1bd8e', 1.3], sun: ['#fff1cf', 3.1, [-10, 20, 6]], exposure: 1.1, env: 0.6,
    road: { base: '#6d7075', line: '#f1ede2', edge: '#f1ede2', alpha: 1 }, walk: '#cdb887', curb: '#e8dcc0', ground: '#e8d6a4', gkind: 'sand', haze: '#cfe3ea', sea: true },
  { id: 'neige', icon: 'snow', sky: ['#7fa3d0', '#b7cde6', '#e1ebf5', '#f1f5fa', '#e8eef4'], fog: ['#dbe5ef', 40, 170], hemi: ['#e6f1ff', '#a9b7c8', 1.45], sun: ['#fff4e2', 2.2, [-9, 16, 8]], exposure: 1.05, env: 0.6,
    road: { base: '#5a616c', line: '#eef2f6', edge: '#eef2f6', alpha: 0.95 }, walk: '#e6edf4', curb: '#f2f6fa', ground: '#f1f5f9', gkind: 'snow', haze: '#d6e1ec', snow: true },
  { id: 'desert', icon: 'desert', sky: ['#5f9fd6', '#98c1dd', '#efd4a6', '#efb676', '#e4a566'], fog: ['#ebbf8d', 55, 210], hemi: ['#ffe8c8', '#a8774a', 1.2], sun: ['#ffd29a', 3.0, [-12, 15, 7]], exposure: 1.05, env: 0.5,
    road: { base: '#5f564a', line: '#e8d9a8', edge: '#e8d9a8', alpha: 0.85 }, walk: '#c78f58', curb: '#d9a46c', ground: '#d8a266', gkind: 'sand2', haze: '#e6b98a' },
  { id: 'foret', icon: 'forest', sky: ['#79b3a0', '#a6cfb4', '#d1e5c0', '#e6edc9', '#cfe0b4'], fog: ['#bcd3b0', 30, 150], hemi: ['#d8f0dc', '#4a5a3a', 1.15], sun: ['#fff0c0', 2.3, [-9, 18, 8]], exposure: 1.05, env: 0.5,
    road: { base: '#5c5648', line: '#cfc7a8', edge: '#cfc7a8', alpha: 0.55 }, walk: '#6e7b4a', curb: '#8a7a5a', ground: '#4f7a3f', gkind: 'grass', haze: '#aac7a2' }
];

/* ---------- variantes : soir (couchant) et nuit — mêmes décors, autres lumières ---------- */
const BASE_N = THEMES.length;
const DUSK = { sky: ['#2f2f66', '#7a4f80', '#e07a58', '#f2a86a', '#efbf7c'], fog: ['#e3a07c', 40, 175], hemi: ['#f0c3b4', '#4a3c4a', 0.95], sun: ['#ff9a55', 2.4, [-14, 10, 10]], exposure: 1.0, env: 0.4, lit: 0.6, label: 'soir' };
const NIGHT = { sky: ['#040816', '#0a1632', '#14264a', '#1f3359', '#283d66'], fog: ['#16223f', 28, 135], hemi: ['#7f95d0', '#20263a', 0.95], sun: ['#b9c8f5', 1.25, [-9, 16, 8]], exposure: 1.1, env: 0.28, lit: 0.9, stars: true, label: 'nuit' };
[DUSK, NIGHT].forEach(v => {
  for (let i = 0; i < BASE_N; i++) {
    const b = THEMES[i], road = Object.assign({}, b.road), t = Object.assign({}, b, { sky: v.sky, fog: v.fog, hemi: v.hemi, sun: v.sun, exposure: v.exposure, env: v.env, lit: v.lit, stars: !!v.stars, variant: v.label, road });
    if (v.stars) { t.ground = shadeHex(b.ground, 0.55); t.walk = shadeHex(b.walk, 0.6); t.curb = shadeHex(b.curb, 0.65); }
    else { t.ground = shadeHex(b.ground, 0.85); t.walk = shadeHex(b.walk, 0.88); }
    THEMES.push(t);
  }
});
function shadeHex(c, k) { return '#' + new THREE.Color(c).multiplyScalar(k).getHexString(); }

/* ---------- textures ---------- */
function cv(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const shade = (c, k) => '#' + new THREE.Color(c).multiplyScalar(k).getHexString();
function rep(t, u, v) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(u, v); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
export function skyTexture(th) {
  const c = cv(4, 512), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
  [0, 0.4, 0.62, 0.75, 1].forEach((p, i) => gr.addColorStop(p, th.sky[i]));
  g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function roadTex(th) {
  const r = rng(5), c = cv(512), g = c.getContext('2d'), R = th.road;
  g.fillStyle = R.base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16000; i++) { const v = r() < 0.5 ? 1.12 : 0.86; g.fillStyle = shade(R.base, v); g.globalAlpha = 0.25; g.fillRect(r() * 512, r() * 512, 1.6, 1.6); }
  /* traces de pneus, rustines et fissures : la route paraît usée */
  g.fillStyle = shade(R.base, 0.8); g.globalAlpha = 0.22;
  for (const cx of [256 - 170.6, 256, 256 + 170.6]) for (const dx of [-26, 26]) g.fillRect(cx + dx - 9, 0, 18, 512);
  g.globalAlpha = 0.5;
  for (let i = 0; i < 7; i++) { g.fillStyle = shade(R.base, 0.88 + r() * 0.1); g.fillRect(40 + r() * 400, r() * 500, 20 + r() * 50, 12 + r() * 30); }
  g.strokeStyle = shade(R.base, 0.6); g.lineWidth = 1.4;
  for (let i = 0; i < 8; i++) { let x = 30 + r() * 450, y = r() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 22; y += 8 + r() * 14; g.lineTo(x, y); } g.stroke(); }
  g.globalAlpha = R.alpha; g.fillStyle = R.line;
  for (const x of [256 - 85.3, 256 + 85.3]) for (let y = 0; y < 512; y += 256) g.fillRect(x - 3, y + 20, 6, 128);
  g.fillStyle = R.edge; g.fillRect(256 - 240 - 3, 0, 6, 512); g.fillRect(256 + 240 - 3, 0, 6, 512);
  g.globalAlpha = 1; return c;
}
function groundTex(th) {
  const r = rng(9), c = cv(256), g = c.getContext('2d'), base = th.ground; g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  const k = th.gkind;
  for (let i = 0; i < 5000; i++) {
    const x = r() * 256, y = r() * 256;
    if (k === 'grass') { g.strokeStyle = shade(base, 0.8 + r() * 0.45); g.globalAlpha = 0.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + r() * 3 - 1.5, y - 3 - r() * 3); g.stroke(); }
    else if (k === 'snow') { g.fillStyle = r() < 0.12 ? '#ffffff' : shade(base, 0.95 + r() * 0.05); g.globalAlpha = 0.5; g.fillRect(x, y, 2, 2); }
    else { g.fillStyle = shade(base, 0.88 + r() * 0.2); g.globalAlpha = 0.35; g.fillRect(x, y, 2, 1.4); }
  }
  g.globalAlpha = 0.12; g.strokeStyle = shade(base, k === 'snow' ? 0.92 : 0.82);
  if (k === 'sand' || k === 'sand2') for (let y = 8; y < 256; y += 16) { g.beginPath(); for (let x = 0; x <= 256; x += 16) g.lineTo(x, y + Math.sin(x / 20 + y) * 2); g.stroke(); }
  g.globalAlpha = 1; return c;
}
function seaTex() {
  const r = rng(3), c = cv(256), g = c.getContext('2d'); g.fillStyle = '#2f93c9'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 180; i++) { g.strokeStyle = r() < 0.5 ? '#6cc3e6' : '#2276ad'; g.globalAlpha = 0.4; g.lineWidth = 1.6; const x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - 3, x + 22, y); g.stroke(); }
  g.globalAlpha = 1; return c;
}
const FAC = {}, CUR = { lit: 0.38 };
function facadeMat(color, lit = '#f0cf8d', dark = '#33405a') {
  const k = color + lit + CUR.lit; if (FAC[k]) return FAC[k];
  const r = rng(color.charCodeAt(2) * 31), c = cv(256, 512), g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.08})`; g.fillRect(r() * 256, r() * 512, 2, 2); }
  for (let y = 20; y < 500; y += 46) for (let x = 18; x < 240; x += 40) {
    const on = r() < CUR.lit; g.fillStyle = on ? (r() < 0.5 ? lit : shade(lit, 0.92)) : dark; g.fillRect(x, y, 24, 30);
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x, y, 24, 3); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, y + 28, 24, 3);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x - 3, y + 31, 30, 3);
  }
  const t = new THREE.CanvasTexture(c); rep(t, 1, 1);
  return FAC[k] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 });
}
function facadeUV(c) {
  const p = c.attributes.position, n = c.attributes.normal, uv = c.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), nz = Math.abs(n.getZ(i)), side = nz > 0.5 || nx > 0.5;
    const u = nz > 0.5 ? p.getX(i) / 9 : nx > 0.5 ? p.getZ(i) / 9 : p.getX(i) / 9;
    uv.setXY(i, u, side ? p.getY(i) / 33 : p.getZ(i) / 9);
  }
}

/* ---------- assemblage de géométries fusionnées ---------- */
const G = { box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 9), cone: new THREE.ConeGeometry(1, 1, 9), sph: new THREE.SphereGeometry(1, 9, 7), ico: new THREE.IcosahedronGeometry(1, 1), dome: new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2) };
class Bucket {
  constructor() { this.m = new Map(); this.o = new THREE.Object3D(); }
  put(g, m, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, uvf = null) {
    const o = this.o; o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz); o.updateMatrix();
    let c = g.clone(); if (c.index) c = c.toNonIndexed(); c.applyMatrix4(o.matrix); if (uvf) uvf(c);
    if (!this.m.has(m)) this.m.set(m, []); this.m.get(m).push(c);
  }
  box(m, x, y, z, w, h, d, ry = 0, rx = 0, rz = 0) { this.put(G.box, m, x, y + h / 2, z, w, h, d, rx, ry, rz); }
  cyl(m, x, y, z, r, h, rx = 0, rz = 0, ry = 0) { this.put(G.cyl, m, x, y + h / 2, z, r, h, r, rx, ry, rz); }
  cone(m, x, y, z, r, h) { this.put(G.cone, m, x, y + h / 2, z, r, h, r); }
  sph(m, x, y, z, rx, ry = rx, rz = rx) { this.put(G.sph, m, x, y, z, rx, ry, rz); }
  ico(m, x, y, z, rx, ry = rx, rz = rx, ryaw = 0) { this.put(G.ico, m, x, y, z, rx, ry, rz, 0, ryaw, 0); }
  dome(m, x, y, z, rx, ry = rx, rz = rx) { this.put(G.dome, m, x, y, z, rx, ry, rz); }
  facade(m, x, z, w, d, h) { this.put(G.box, m, x, h / 2, z, d, h, w, 0, 0, 0, facadeUV); }
  finish(shadow = false) {
    const out = new THREE.Group();
    this.m.forEach((arr, m) => { const g = mergeGeometries(arr, false); arr.forEach(a => a.dispose()); if (!g) return; const me = new THREE.Mesh(g, m); me.castShadow = shadow; me.receiveShadow = false; me.matrixAutoUpdate = false; out.add(me); });
    return out;
  }
}
const M = (c, r = 0.9) => mat(c, r);
const EM = (c, e, i = 1.2) => mat(c, 0.5, 0, e, i);
const pick = (r, a) => a[(r() * a.length) | 0];
const R2 = (r, a, b) => a + r() * (b - a);

/* ---------- objets réutilisables ---------- */
function lamp(B, x, z, s, warm = '#ffe2a8') {
  const pole = M('#3a3f47', 0.6);
  B.cyl(pole, x, 0, z, 0.08, 7); B.box(pole, x - s * 0.8, 6.9, z, 1.7, 0.1, 0.1); B.box(EM(warm, '#ffcf80', 1.6), x - s * 1.6, 6.8, z, 0.7, 0.14, 0.3);
}
function roundTree(B, r, x, z, sc = 1, cols = ['#5d8a62', '#4f7a5c']) {
  B.cyl(M('#5a4636', 1), x, 0, z, 0.2 * sc, 2.8 * sc);
  for (let k = 0; k < 3; k++) B.ico(M(cols[k % 2], 1), x + (k - 1) * 0.5 * sc, (3.4 + k * 0.7) * sc, z + (k - 1) * 0.3 * sc, (1.5 - k * 0.2) * sc);
}
function pine(B, x, z, h, snow, col = '#2f5d4a') {
  B.cyl(M('#5a4636', 1), x, 0, z, 0.22 * h / 4, h * 0.25);
  const m = M(col, 1), w = M('#f4f7fa', 0.95);
  for (let k = 0; k < 4; k++) { const y = h * (0.18 + k * 0.2), r = h * (0.36 - k * 0.07); B.cone(m, x, y, z, r, h * 0.3); if (snow) B.cone(w, x, y + h * 0.1, z, r * 0.82, h * 0.2); }
}
function palm(B, r, x, z, h) {
  const lean = R2(r, -0.25, 0.25), trunk = M('#8a6a45', 1), leaf = M(pick(r, ['#3f8f4a', '#4a9a52', '#38824a']), 0.8);
  for (let i = 0; i < 6; i++) { const t = i / 6; B.cyl(trunk, x + lean * t * h * 0.3, t * h, z, 0.2 - t * 0.06, h / 6 + 0.05, 0, -lean * 0.3); }
  const tx = x + lean * h * 0.3;
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; B.put(G.sph, leaf, tx + Math.cos(a) * 1.3, h + 0.1, z + Math.sin(a) * 1.3, 1.6, 0.12, 0.45, 0, -a, Math.cos(a) * 0 - 0.35); }
  B.sph(M('#7a5a35'), tx, h - 0.1, z, 0.28); B.sph(M('#7a5a35'), tx + 0.25, h - 0.3, z + 0.1, 0.24);
}
function cactus(B, r, x, z, h) {
  const m = M('#5a8f4a', 0.85);
  B.cyl(m, x, 0, z, 0.38, h); B.sph(m, x, h, z, 0.38);
  for (const s of [-1, 1]) if (r() < 0.8) { const ah = h * R2(r, 0.35, 0.6); B.cyl(m, x + s * 0.8, ah, z, 0.26, h * 0.3); B.cyl(m, x + s * 0.4, ah - 0.1, z, 0.24, 0.8, 0, Math.PI / 2); B.sph(m, x + s * 0.8, ah + h * 0.3, z, 0.26); }
}
function rock(B, r, x, z, s, col) { B.ico(M(col, 1), x, s * 0.5, z, s * R2(r, 0.9, 1.5), s * 0.7, s * R2(r, 0.9, 1.4), r() * 3); }
function snowman(B, x, z) { const w = M('#f7fafc', 0.9); B.sph(w, x, 0.55, z, 0.55); B.sph(w, x, 1.35, z, 0.4); B.sph(w, x, 1.95, z, 0.28); B.cone(M('#e0752a'), x, 1.9, z - 0.25, 0.05, 0.4); B.cyl(M('#222'), x, 2.17, z, 0.26, 0.28); B.cyl(M('#222'), x, 2.17, z, 0.38, 0.04); B.cyl(M('#c8412f'), x, 1.6, z, 0.32, 0.1); }
function mushroom(B, x, z, s, cap = '#c8412f') { B.cyl(M('#efe5d0'), x, 0, z, 0.18 * s, 0.6 * s); B.dome(M(cap, 0.7), x, 0.55 * s, z, 0.6 * s, 0.4 * s, 0.6 * s); const w = M('#fff'); for (let i = 0; i < 5; i++) { const a = i * 1.3; B.sph(w, x + Math.cos(a) * 0.3 * s, 0.7 * s + Math.sin(i) * 0.05, z + Math.sin(a) * 0.3 * s, 0.08 * s); } }
function cabin(B, x, z, s, snow, wall = '#8a5a3c') {
  B.box(M(wall, 0.95), x, 0, z, 6, 3, 5); const rm = snow ? M('#f4f7fa', 0.9) : M('#7a3f2f', 0.9);
  B.box(rm, x, 3, z - 1.4, 6.6, 0.3, 3.4, 0, 0.55); B.box(rm, x, 3, z + 1.4, 6.6, 0.3, 3.4, 0, -0.55);
  B.box(EM('#ffd98a', '#ffb04a', 1.3), x + (x > 0 ? -3.02 : 3.02), 1.2, z, 0.05, 1, 1.2); B.box(M('#4a2f1f'), x + (x > 0 ? -3.02 : 3.02), 0, z + 1.6, 0.06, 2, 0.9);
}

/* ---------- générateurs de blocs de 50 m ---------- */
const CH = 50;
const GEN = {
  ville(B, r, z0, side) {
    const cols = ['#8f5a46', '#b09a80', '#6f7a8a', '#9a8f86', '#7c6a5e', '#8d9a9a'];
    let z = z0 - 1;
    while (z > z0 - CH) {
      const w = R2(r, 11, 17), d = R2(r, 12, 18), h = R2(r, 14, 48), x = side * (10.8 + d / 2 + r() * 1.5);
      const fm = facadeMat(pick(r, cols)); B.facade(fm, x, z - w / 2, w, d, h); B.box(M('#6a6d73', 1), x, h, z - w / 2, d * 0.3, 1.6, w * 0.3);
      if (r() < 0.4) B.box(M('#5b5f66', 0.9), x - side * (d / 2 + 0.2), 3.0, z - w / 2, 0.4, 0.15, w * 0.9);
      z -= w + R2(r, 0.5, 2.5);
    }
    for (let k = 0; k < 2; k++) lamp(B, side * 5.4, z0 - 6 - k * 25 - (side > 0 ? 0 : 12), side);
    for (let k = 0; k < 3; k++) roundTree(B, r, side * 7.4, z0 - 4 - k * 17 - (side > 0 ? 6 : 0), R2(r, 0.9, 1.15));
    if (r() < 0.5) { const z = z0 - R2(r, 8, 42); B.cyl(M('#a93a30', 0.6), side * 5.5, 0.1, z, 0.18, 0.7); B.sph(M('#a93a30', 0.6), side * 5.5, 0.95, z, 0.19); }
    if (r() < 0.35) { const z = z0 - R2(r, 8, 42); B.box(M('#6b5a3f'), side * 6.2, 0.1, z, 0.7, 0.5, 2.2); B.box(M('#6b5a3f'), side * 6.45, 0.5, z, 0.15, 0.5, 2.2); }
  },
  plage(B, r, z0, side) {
    const pastel = ['#f1d9b5', '#f2c4b0', '#bfe0e8', '#f4ecc8'];
    if (side > 0) { let z = z0 - 1; while (z > z0 - CH) { const w = R2(r, 12, 18), d = R2(r, 10, 14), h = R2(r, 8, 18), x = 17 + d / 2 + r() * 2; B.facade(facadeMat(pick(r, pastel), '#ffe3a0', '#4a6a8a'), x, z - w / 2, w, d, h); B.box(M('#d9684f'), x, h, z - w / 2, d + 0.6, 0.5, w + 0.6); z -= w + R2(r, 1, 4); } }
    for (let k = 0; k < 3; k++) palm(B, r, side * R2(r, 7.4, 9), z0 - 5 - k * 16 - (side > 0 ? 6 : 0), R2(r, 5.5, 8));
    for (let k = 0; k < 3; k++) {
      const x = side * R2(r, 10, side > 0 ? 15 : 22), z = z0 - R2(r, 3, 47), c = pick(r, ['#e24a4a', '#f2c14e', '#3f8fd8', '#ffffff', '#e9772e']);
      B.cyl(M('#e8e4d6'), x, 0, z, 0.05, 2.4); B.cone(M(c, 0.8), x, 2.1, z, 1.7, 0.7); B.box(M(pick(r, ['#f1d9b5', '#e24a6a', '#3f8fd8'])), x + 1.8, 0.02, z + 1, 1.1, 0.04, 2.0, r() * 3);
    }
    if (r() < 0.5) { const x = side * 11.5, z = z0 - R2(r, 6, 40); B.box(M('#f4ede0'), x, 0, z, 3.4, 2.4, 3); B.box(M('#d9684f'), x, 2.4, z, 3.8, 0.35, 3.4, 0, 0, 0.0); B.cone(M('#d9684f'), x, 2.6, z, 2.6, 1.0); B.box(M('#4a6a8a'), x - side * 1.72, 0.1, z, 0.06, 1.8, 0.9); }
    if (r() < 0.4) { const x = side * 12, z = z0 - R2(r, 6, 40), sb = M('#e8e4d6'); B.cyl(sb, x - 1, 0, z - 1, 0.1, 2.2); B.cyl(sb, x + 1, 0, z - 1, 0.1, 2.2); B.cyl(sb, x - 1, 0, z + 1, 0.1, 2.2); B.cyl(sb, x + 1, 0, z + 1, 0.1, 2.2); B.box(M('#f2c14e'), x, 2.2, z, 2.8, 1.6, 2.8); B.box(M('#d9684f'), x, 3.8, z, 3.2, 0.2, 3.2); }
    for (let k = 0; k < 2; k++) { const x = side * R2(r, 9.5, 14), z = z0 - R2(r, 3, 47); B.box(M(pick(r, ['#e24a4a', '#3f8fd8', '#f2c14e', '#4fae6a'])), x, 0.1, z, 0.5, 2.0, 0.1, 0, -0.2); }
    if (side < 0) for (let k = 0; k < 3; k++) rock(B, r, -R2(r, 20, 26), z0 - R2(r, 2, 48), R2(r, 0.7, 1.4), '#8d8f94');
    lamp(B, side * 5.4, z0 - 8 - (side > 0 ? 0 : 14), side, '#fff2c8'); lamp(B, side * 5.4, z0 - 33 - (side > 0 ? 0 : 12), side, '#fff2c8');
  },
  neige(B, r, z0, side) {
    for (let k = 0; k < 7; k++) pine(B, side * R2(r, 7.5, 30), z0 - R2(r, 1, 49), R2(r, 4, 9), true);
    for (let k = 0; k < 5; k++) pine(B, side * R2(r, 7, 12), z0 - k * 10 - R2(r, 0, 8), R2(r, 3, 5), true);
    if (r() < 0.55) snowman(B, side * R2(r, 7.5, 9), z0 - R2(r, 5, 45));
    if (r() < 0.4) cabin(B, side * R2(r, 15, 19), z0 - R2(r, 8, 40), 1, true);
    if (r() < 0.35) { const x = side * 10, z = z0 - R2(r, 8, 40); B.dome(M('#f4f7fa', 0.9), x, 0, z, 2.2, 1.7, 2.2); B.box(M('#9fb4c8'), x - side * 2.0, 0, z, 0.6, 1.1, 1.0); }
    for (let k = 0; k < 4; k++) rock(B, r, side * R2(r, 8, 24), z0 - R2(r, 1, 49), R2(r, 0.6, 1.6), '#a9b9cc');
    for (let k = 0; k < 6; k++) B.sph(M('#f7fafc', 0.95), side * 5.55, 0.05, z0 - k * 9 - R2(r, 0, 4), 0.9, 0.35, 3.2);
    lamp(B, side * 5.4, z0 - 10 - (side > 0 ? 0 : 12), side, '#ffd98a'); lamp(B, side * 5.4, z0 - 36 - (side > 0 ? 0 : 12), side, '#ffd98a');
  },
  desert(B, r, z0, side) {
    for (let k = 0; k < 4; k++) cactus(B, r, side * R2(r, 7.5, 24), z0 - R2(r, 1, 49), R2(r, 2, 4.6));
    for (let k = 0; k < 4; k++) rock(B, r, side * R2(r, 8, 36), z0 - R2(r, 1, 49), R2(r, 0.6, 2.4), pick(r, ['#b5764a', '#a8683f', '#c28a5a']));
    for (let k = 0; k < 2; k++) B.sph(M('#d9a468', 1), side * R2(r, 30, 60), 0, z0 - R2(r, 5, 45), R2(r, 12, 20), R2(r, 2.5, 5), R2(r, 12, 20));
    const pm = M('#5a4632', 1);
    for (let k = 0; k < 2; k++) { const z = z0 - 8 - k * 25 - (side > 0 ? 0 : 12); B.cyl(pm, side * 6.1, 0, z, 0.12, 7.5); B.box(pm, side * 6.1, 7, z, 2.2, 0.16, 0.16); B.box(pm, side * 6.1, 6.4, z, 1.6, 0.14, 0.14); }
    if (r() < 0.45) { const x = side * R2(r, 14, 20), z = z0 - R2(r, 8, 40); B.box(M('#d9b48a'), x, 0, z, 6, 3.4, 5); B.box(M('#c9a07a'), x, 3.4, z, 6.4, 0.3, 5.4); B.box(M('#6a4a32'), x - side * 3.02, 0, z + 1, 0.06, 2.2, 1.1); B.box(M('#2f6f8f'), x - side * 3.02, 1.4, z - 1.2, 0.06, 0.9, 0.9); B.cyl(M('#c8412f'), x + 1.5, 3.7, z, 0.15, 0.5); }
    if (r() < 0.35) { const x = side * 7.2, z = z0 - R2(r, 8, 40); B.cyl(M('#5a4632'), x, 0, z, 0.06, 2.2); B.box(M('#f2c14e'), x, 1.6, z, 0.04, 0.9, 1.2); }
    for (let k = 0; k < 3; k++) B.ico(M('#9a7a4a', 1), side * R2(r, 7, 14), 0.35, z0 - R2(r, 2, 48), 0.35);
  },
  foret(B, r, z0, side) {
    for (let k = 0; k < 9; k++) {
      const x = side * R2(r, 7.2, 26), z = z0 - R2(r, 0, 50), t = r();
      if (t < 0.45) pine(B, x, z, R2(r, 7, 13), false, pick(r, ['#2f5d3a', '#386b43', '#2a5234']));
      else roundTree(B, r, x, z, R2(r, 1.3, 2.1), pick(r, [['#4f7a3f', '#5f8f48'], ['#3f6f3a', '#4f8040'], ['#6a8f3f', '#7a9f4a']]));
    }
    for (let k = 0; k < 6; k++) B.ico(M(pick(r, ['#4a7a3a', '#3f6a34', '#5a8a42']), 1), side * R2(r, 6.4, 12), 0.5, z0 - R2(r, 0, 50), R2(r, 0.5, 1.1), 0.5, R2(r, 0.5, 1.1));
    for (let k = 0; k < 2; k++) mushroom(B, side * R2(r, 6.4, 9), z0 - R2(r, 2, 48), R2(r, 1.2, 2.2), pick(r, ['#c8412f', '#d9824a']));
    if (r() < 0.5) { const z = z0 - R2(r, 6, 44); B.cyl(M('#6a4a32', 1), side * R2(r, 7, 10), 0.35, z, 0.35, 3.6, Math.PI / 2, 0, 0.25); }
    for (let k = 0; k < 3; k++) rock(B, r, side * R2(r, 7, 16), z0 - R2(r, 2, 48), R2(r, 0.5, 1.2), '#7a8a72');
    for (let k = 0; k < 12; k++) B.sph(M(pick(r, ['#f2c14e', '#ffffff', '#e86a8a', '#b58ae8'])), side * R2(r, 6.2, 9), 0.12, z0 - R2(r, 0, 50), 0.09);
    if (r() < 0.35) cabin(B, side * R2(r, 14, 20), z0 - R2(r, 8, 40), 1, false, '#7a5232');
    const wm = M('#7a5a3a', 0.95);
    for (let z = z0 - 2; z > z0 - 48; z -= 4) { B.cyl(wm, side * 5.8, 0, z, 0.1, 1.0); }
    B.box(wm, side * 5.8, 0.75, z0 - 25, 0.08, 0.1, 46); B.box(wm, side * 5.8, 0.4, z0 - 25, 0.08, 0.1, 46);
  }
};

/* ---------- détails communs à tous les décors : balises, panneaux, touffes, cailloux ---------- */
function common(B, r, z0, side, th) {
  const night = !!th.stars, post = M('#e8e6dc', 0.7), red = night ? EM('#ff4b3a', '#ff2a1a', 1.4) : M('#c8412f', 0.7);
  for (let z = z0 - 3; z > z0 - CH; z -= 12) { B.box(post, side * 4.98, 0, z, 0.1, 0.8, 0.1); B.box(red, side * 4.98, 0.5, z, 0.11, 0.12, 0.11); }
  if (r() < 0.6) {
    const z = z0 - R2(r, 6, 44), x = side * 5.6, pm = M('#585d66', 0.6), sg = M(pick(r, ['#f2c14e', '#3f8fd8', '#e24a4a', '#4fae6a']), 0.6);
    B.cyl(pm, x, 0, z, 0.05, 2.3); B.put(G.box, sg, x, 2.55, z, 0.9, 0.9, 0.06, 0, side * 1.1, Math.PI / 4);
  }
  const tuft = M(shadeHex(th.ground, 1.12), 1);
  for (let k = 0; k < 5; k++) { const x = side * R2(r, 5.2, 6.4), z = z0 - R2(r, 0, 50); B.cone(tuft, x, 0.1, z, 0.12, 0.45); B.cone(tuft, x + 0.12, 0.1, z + 0.05, 0.1, 0.35); }
  for (let k = 0; k < 4; k++) B.ico(M(shadeHex(th.curb, 0.85), 1), side * R2(r, 5.2, 9.5), 0.1, z0 - R2(r, 0, 50), R2(r, 0.1, 0.22), 0.1, R2(r, 0.1, 0.22), r() * 3);
}

/* ---------- fonds lointains (suivent le joueur) ---------- */
function backdrop(th, idx) {
  const g = new THREE.Group(), r = rng(idx + 40), B = new Bucket(), hz = (c) => new THREE.MeshBasicMaterial({ color: c, fog: false });
  const far = -300;
  if (th.id === 'ville') {
    for (let i = 0; i < 26; i++) { const h = R2(r, 40, 120), w = R2(r, 14, 26); B.box(hz(pick(r, ['#7d7f9a', '#8a86a0', '#9a8fa0'])), (i - 13) * 24 + r() * 8, 0, far - r() * 40, w, h, w); }
  } else if (th.id === 'plage') {
    B.box(hz('#bfe0ee'), 0, -0.3, far, 900, 1, 2);
    B.sph(hz('#7ea58a'), -160, -6, far - 40, 80, 24, 20); B.sph(hz('#8fb59a'), -90, -4, far - 70, 50, 16, 14);
    B.sph(hz('#9bc0a4'), 190, -6, far - 40, 90, 22, 20);
  } else if (th.id === 'neige') {
    for (let i = 0; i < 12; i++) { const h = R2(r, 60, 120), x = (i - 6) * 52 + r() * 20; B.cone(hz('#8ea6c4'), x, -2, far - r() * 40, h * 0.7, h); B.cone(hz('#f4f8fc'), x, h * 0.55, far - 1 - r() * 0, h * 0.34, h * 0.45); }
  } else if (th.id === 'desert') {
    for (let i = 0; i < 9; i++) { const h = R2(r, 25, 55), w = R2(r, 40, 80), x = (i - 4) * 90 + r() * 30, z = far - r() * 40; B.box(hz('#c2774a'), x, 0, z, w, h * 0.6, w * 0.6); B.box(hz('#cf8656'), x, h * 0.6, z, w * 0.7, h * 0.4, w * 0.45); }
  } else {
    for (let i = 0; i < 10; i++) B.sph(hz(pick(r, ['#7da88a', '#6f9a7c', '#88b094'])), (i - 5) * 70 + r() * 20, -8, far - r() * 50, R2(r, 60, 90), R2(r, 25, 45), 50);
  }
  g.add(B.finish());
  /* nuages (jour et soir) */
  if (!th.stars) {
    const cb = new Bucket(), cm = new THREE.MeshBasicMaterial({ color: th.variant === 'soir' ? '#f4c9b0' : '#ffffff', fog: false, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 9; i++) { const x = (i - 4) * 70 + r() * 30, y = R2(r, 70, 130), z = far - 30 - r() * 60, sc = R2(r, 14, 26); for (let k = 0; k < 4; k++) cb.sph(cm, x + (k - 1.5) * sc * 0.7, y + (k % 2) * sc * 0.18, z, sc * 0.55, sc * 0.3, sc * 0.4); }
    const cg = cb.finish(); g.add(cg); g.userData.clouds = cg;
  } else {
    const n = 260, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, e = 0.25 + r() * 1.1, R = 330; p[i * 3] = Math.cos(a) * Math.cos(e) * R * 0.9; p[i * 3 + 1] = Math.sin(e) * R * 0.45 + 15; p[i * 3 + 2] = -Math.abs(Math.sin(a)) * Math.cos(e) * R - 40; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const st = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, fog: false, depthWrite: false })); st.frustumCulled = false; g.add(st);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 20, 14), new THREE.MeshBasicMaterial({ color: '#f4f1de', fog: false })); moon.position.set(-90, 120, far - 80); g.add(moon);
  }
  return g;
}

/* ---------- gestionnaire de décor ---------- */
export class Scenery {
  constructor(scene, idx) {
    this.scene = scene; this.idx = idx; this.th = THEMES[idx]; this.root = new THREE.Group(); scene.add(this.root);
    this.chunks = new Map(); this.disp = [];
    const th = this.th, LEN = 260;
    this.LEN = LEN;
    const rt = new THREE.CanvasTexture(roadTex(th)); rep(rt, 1, LEN / 12);
    this.road = new THREE.Mesh(new THREE.PlaneGeometry(9.6, LEN), new THREE.MeshStandardMaterial({ map: rt, roughness: 0.95 }));
    this.road.rotation.x = -Math.PI / 2; this.road.receiveShadow = true; this.root.add(this.road);
    this.static = new THREE.Group(); this.root.add(this.static);
    const walkM = mat(th.walk, 0.95), curbM = mat(th.curb, 0.9);
    for (const s of [-1, 1]) {
      const walk = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.16, LEN), walkM); walk.position.set(s * 7.4, 0.08, 0); walk.receiveShadow = true; this.static.add(walk);
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, LEN), curbM); curb.position.set(s * 4.9, 0.09, 0); curb.receiveShadow = true; this.static.add(curb);
    }
    const gt = new THREE.CanvasTexture(groundTex(th)); rep(gt, 8, LEN / 12 * 1);
    const gm = new THREE.MeshStandardMaterial({ map: gt, roughness: 1 });
    const gw = th.sea ? 18 : 110;
    this.gl = new THREE.Mesh(new THREE.PlaneGeometry(gw, LEN), gm); this.gl.rotation.x = -Math.PI / 2; this.gl.position.x = -(10 + gw / 2); this.gl.receiveShadow = true;
    this.gr = new THREE.Mesh(new THREE.PlaneGeometry(110, LEN), gm); this.gr.rotation.x = -Math.PI / 2; this.gr.position.x = 10 + 55; this.gr.receiveShadow = true;
    this.static.add(this.gl, this.gr);
    if (th.sea) {
      const st = new THREE.CanvasTexture(seaTex()); rep(st, 30, LEN / 8);
      this.sea = new THREE.Mesh(new THREE.PlaneGeometry(400, LEN), new THREE.MeshStandardMaterial({ map: st, roughness: 0.25, metalness: 0.1, envMapIntensity: 1.3 }));
      this.sea.rotation.x = -Math.PI / 2; this.sea.position.set(-(28 + 200), -0.25, 0); this.static.add(this.sea);
      const foam = new THREE.Mesh(new THREE.PlaneGeometry(2.4, LEN), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 })); foam.rotation.x = -Math.PI / 2; foam.position.set(-27.4, -0.2, 0); this.static.add(foam);
    }
    this.back = backdrop(th, idx); this.root.add(this.back);
    if (th.snow) {
      const n = 700, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - 0.5) * 40; p[i * 3 + 1] = Math.random() * 18; p[i * 3 + 2] = -Math.random() * 40; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
      this.snow = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#ffffff', size: 0.14, transparent: true, opacity: 0.9, depthWrite: false })); this.snow.frustumCulled = false; this.root.add(this.snow);
    }
    this.snapZ = 1e9;
  }
  build(i) {
    const r = rng(this.idx * 7919 + i * 131 + 17), B = new Bucket(), z0 = -i * CH, gen = GEN[this.th.id];
    CUR.lit = this.th.lit || 0.38;
    gen(B, r, z0, -1); gen(B, r, z0, 1); common(B, r, z0, -1, this.th); common(B, r, z0, 1, this.th);
    if (this.th.id === 'ville' && r() < 0.35) { const z = z0 - R2(r, 10, 40); for (let k = -4; k <= 4; k++) B.box(mat('#e6e2d6', 0.9), k * 1.0, 0.012, z, 0.55, 0.01, 3.2); }
    const grp = B.finish(); this.root.add(grp); this.chunks.set(i, grp);
  }
  update(pz, dt = 0, cam = null, t = 0, back = false) {
    const s = Math.round(pz / 12) * 12, cz = back ? s : s - 80;
    this.road.position.z = cz; this.static.children.forEach(m => { if (m !== this.sea) m.position.z = cz; });
    if (this.sea) this.sea.position.z = cz;
    this.back.position.z = back ? pz + 600 : pz;
    if (this.back.userData.clouds) this.back.userData.clouds.position.x = Math.sin(t * 0.02) * 40;
    const ci = Math.floor(-pz / CH);
    for (let i = Math.max(0, ci - (back ? 4 : 1)); i <= ci + 5; i++) if (!this.chunks.has(i)) this.build(i);
    this.chunks.forEach((g, i) => { if (i < ci - (back ? 5 : 2)) { g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); this.root.remove(g); this.chunks.delete(i); } });
    if (this.snow && cam) {
      const p = this.snow.geometry.attributes.position;
      for (let k = 0; k < p.count; k++) { let y = p.getY(k) - dt * (2.2 + (k % 5) * 0.3); if (y < 0) y += 18; p.setY(k, y); p.setX(k, p.getX(k) + Math.sin(t * 0.7 + k) * dt * 0.4); }
      p.needsUpdate = true; this.snow.position.set(cam.position.x, 0, cam.position.z - 14);
    }
  }
  dispose() {
    this.chunks.forEach(g => g.traverse(o => { if (o.geometry) o.geometry.dispose(); }));
    this.root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map && o.material.map.dispose) { /* textures propres au décor */ o.material.map.dispose(); } });
    this.scene.remove(this.root);
  }
}

export function applyLook(scene, hemi, sun, renderer, th) {
  if (scene.background && scene.background.dispose) scene.background.dispose();
  scene.background = skyTexture(th); scene.fog = new THREE.Fog(th.fog[0], th.fog[1], th.fog[2]);
  hemi.color.set(th.hemi[0]); hemi.groundColor.set(th.hemi[1]); hemi.intensity = th.hemi[2];
  sun.color.set(th.sun[0]); sun.intensity = th.sun[1]; renderer.toneMappingExposure = th.exposure; scene.environmentIntensity = th.env;
}
