/* Projet : La fuite d’Abel  ·  Version : 1.11.0  ·  Date : 18/11/2026
   Auteur : Tom Rougeaud  ·  Licence : CC BY-NC 4.0
   Réalisé avec l’aide de l’IA : Claude Sonnet 5.5 (Anthropic) */
import * as THREE from 'three';
/* Textures procédurales (aucune image externe) : tissu, denim, peau, cheveux, cuir, pièce gravée. */
function cv(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function tex(c, rep = 1, srgb = true) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; }
const shade = (c, k) => '#' + new THREE.Color(c).multiplyScalar(k).getHexString();
const CACHE = {};

/* kind : 'jersey' (maille t-shirt), 'sweat' (molleton), 'denim', 'skin', 'hair', 'leather', 'canvas' */
export function surface(color, kind, rep = 1) {
  const key = color + kind + rep; if (CACHE[key]) return CACHE[key];
  const S = 256, c = cv(S), g = c.getContext('2d'), b = cv(S), h = b.getContext('2d'), r = rng(kind.length * 977 + color.charCodeAt(1));
  g.fillStyle = color; g.fillRect(0, 0, S, S); h.fillStyle = '#808080'; h.fillRect(0, 0, S, S);
  const dark = shade(color, 0.78), light = shade(color, 1.22);
  if (kind === 'jersey' || kind === 'sweat') {
    const st = kind === 'jersey' ? 8 : 12;
    for (let y = 0; y < S; y += st) for (let x = 0; x < S; x += st) {
      const v = (x / st + y / st) % 2;
      g.strokeStyle = v ? dark : light; g.globalAlpha = 0.55; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, y + st); g.lineTo(x + st / 2, y); g.lineTo(x + st, y + st); g.stroke();
      h.strokeStyle = '#d0d0d0'; h.globalAlpha = 0.55; h.lineWidth = 2; h.beginPath(); h.moveTo(x, y + st); h.lineTo(x + st / 2, y); h.lineTo(x + st, y + st); h.stroke();
    }
  } else if (kind === 'denim') {
    for (let i = -S; i < S * 2; i += 3) {
      g.strokeStyle = (i / 3) % 2 ? light : dark; g.globalAlpha = 0.28; g.lineWidth = 1.5; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke();
      h.strokeStyle = (i / 3) % 2 ? '#e0e0e0' : '#303030'; h.globalAlpha = 0.5; h.lineWidth = 1.5; h.beginPath(); h.moveTo(i, 0); h.lineTo(i + S, S); h.stroke();
    }
    for (let i = 0; i < 900; i++) { g.globalAlpha = 0.25; g.fillStyle = light; g.fillRect(r() * S, r() * S, 1, 3); }
  } else if (kind === 'skin') {
    for (let i = 0; i < 5000; i++) { const x = r() * S, y = r() * S; g.globalAlpha = 0.06 + r() * 0.06; g.fillStyle = r() < 0.5 ? '#b5654f' : shade(color, 1.1); g.fillRect(x, y, 2, 2); h.globalAlpha = 0.5; h.fillStyle = r() < 0.5 ? '#6a6a6a' : '#9a9a9a'; h.fillRect(x, y, 1.4, 1.4); }
    const gr = g.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S * 0.7); gr.addColorStop(0, 'rgba(255,200,170,0.16)'); gr.addColorStop(1, 'rgba(120,60,40,0.10)'); g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(0, 0, S, S);
  } else if (kind === 'hair') {
    for (let x = 0; x < S; x += 1.2) { g.globalAlpha = 0.45 + r() * 0.4; g.strokeStyle = r() < 0.5 ? shade(color, 0.6) : shade(color, 1.5); g.lineWidth = 1 + r() * 1.4; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + r() * 6 - 3, S * 0.3, x + r() * 6 - 3, S * 0.7, x + r() * 4 - 2, S); g.stroke();
      h.globalAlpha = 0.6; h.strokeStyle = r() < 0.5 ? '#404040' : '#e0e0e0'; h.lineWidth = 1.2; h.beginPath(); h.moveTo(x, 0); h.lineTo(x + r() * 4 - 2, S); h.stroke(); }
  } else if (kind === 'leather') {
    for (let i = 0; i < 2500; i++) { const x = r() * S, y = r() * S; g.globalAlpha = 0.18; g.fillStyle = r() < 0.5 ? dark : light; g.beginPath(); g.arc(x, y, 1 + r() * 2.2, 0, 7); g.fill(); h.globalAlpha = 0.5; h.fillStyle = r() < 0.5 ? '#505050' : '#b0b0b0'; h.beginPath(); h.arc(x, y, 1 + r() * 2, 0, 7); h.fill(); }
  } else { // canvas / toile
    for (let y = 0; y < S; y += 3) { g.globalAlpha = 0.22; g.fillStyle = (y / 3) % 2 ? dark : light; g.fillRect(0, y, S, 1.4); h.globalAlpha = 0.5; h.fillStyle = (y / 3) % 2 ? '#404040' : '#d8d8d8'; h.fillRect(0, y, S, 1.4); }
    for (let x = 0; x < S; x += 3) { g.globalAlpha = 0.18; g.fillStyle = (x / 3) % 2 ? dark : light; g.fillRect(x, 0, 1.4, S); }
  }
  g.globalAlpha = 1; h.globalAlpha = 1;
  const m = tex(c, rep), bm = tex(b, rep, false);
  return CACHE[key] = { map: m, bump: bm };
}

/* Pièce : face gravée (étoile, anneau, tranche striée) */
function coinFace(S, bump) {
  const c = cv(S), g = c.getContext('2d'), R = S / 2, r = rng(11);
  if (bump) { g.fillStyle = '#6a6a6a'; g.fillRect(0, 0, S, S); }
  else { const gr = g.createRadialGradient(R * 0.8, R * 0.7, R * 0.1, R, R, R); gr.addColorStop(0, '#fff0b0'); gr.addColorStop(0.55, '#f0bf4a'); gr.addColorStop(1, '#c08a22'); g.fillStyle = gr; g.fillRect(0, 0, S, S); }
  const ring = (rad, lw, col) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(R, R, rad, 0, 7); g.stroke(); };
  if (bump) {
    g.fillStyle = '#b0b0b0'; g.beginPath(); g.arc(R, R, R * 0.99, 0, 7); g.fill();
    g.fillStyle = '#707070'; g.beginPath(); g.arc(R, R, R * 0.84, 0, 7); g.fill();
    ring(R * 0.9, S * 0.03, '#f4f4f4');
    for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; g.fillStyle = '#f0f0f0'; g.beginPath(); g.arc(R + Math.cos(a) * R * 0.94, R + Math.sin(a) * R * 0.94, S * 0.01, 0, 7); g.fill(); }
  } else { ring(R * 0.9, S * 0.03, '#ffe58a'); ring(R * 0.84, S * 0.012, '#a8741c'); }
  const star = (rad, col) => { g.fillStyle = col; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? rad * 0.45 : rad; g.lineTo(R + Math.cos(a) * q, R + Math.sin(a) * q); } g.closePath(); g.fill(); };
  if (bump) { star(R * 0.5, '#f8f8f8'); } else { star(R * 0.52, '#a8741c'); star(R * 0.46, '#ffd96b'); }
  if (!bump) { g.globalAlpha = 0.08; for (let i = 0; i < 700; i++) { g.strokeStyle = r() < 0.5 ? '#fff' : '#7a4d10'; g.lineWidth = 1; const a = r() * 6.28, d = r() * R; g.beginPath(); g.moveTo(R + Math.cos(a) * d, R + Math.sin(a) * d); g.lineTo(R + Math.cos(a + 0.3) * (d + 20), R + Math.sin(a + 0.3) * (d + 20)); g.stroke(); } g.globalAlpha = 1; }
  return c;
}
let COIN;
export function coinMaterials() {
  if (COIN) return COIN;
  const map = tex(coinFace(256, false)), bump = tex(coinFace(256, true), 1, false); map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping; bump.wrapS = bump.wrapT = THREE.ClampToEdgeWrapping;
  const face = new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 2.2, color: '#ffffff', metalness: 1, roughness: 0.3, envMapIntensity: 1.5 });
  const sc = cv(64, 16), sg = sc.getContext('2d'); sg.fillStyle = '#d9a530'; sg.fillRect(0, 0, 64, 16); for (let x = 0; x < 64; x += 2) { sg.fillStyle = x % 4 ? '#a8741c' : '#f4cf6a'; sg.fillRect(x, 0, 1, 16); }
  const sideT = tex(sc, 1); const side = new THREE.MeshStandardMaterial({ map: sideT, metalness: 1, roughness: 0.35, envMapIntensity: 1.4 });
  return COIN = [side, face, face];
}
/* éclairage ambiant réaliste (reflets) sans fichier externe */
export async function envMap(renderer) {
  const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
  const pm = new THREE.PMREMGenerator(renderer); const e = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); return e;
}
