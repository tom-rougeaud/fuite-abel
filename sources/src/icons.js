/* Projet : La fuite d’Abel  ·  Version : 1.7.0  ·  Date : 17/11/2026
   Auteur : Tom Rougeaud  ·  Licence : CC BY-NC 4.0
   Réalisé avec l’aide de l’IA : Claude Sonnet 5.5 (Anthropic) */
import * as THREE from 'three';

/* Icônes SVG (viewBox 24×24), dessinées à la main, aucune ressource externe.
   Les couleurs « currentColor » suivent la couleur du texte du parent. */
const S = 'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"';
const F = 'fill="currentColor"';
/* roue crantée : 8 dents, tracée par le code */
function gearPath() {
  const n = 8, R = 10, r = 7.6, w = Math.PI / n, pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI; [[r, a - w * 0.5], [R, a - w * 0.3], [R, a + w * 0.3], [r, a + w * 0.5]].forEach(q => pts.push(q)); }
  return 'M' + pts.map(([rr, a]) => (12 + rr * Math.cos(a)).toFixed(2) + ' ' + (12 + rr * Math.sin(a)).toFixed(2)).join('L') + 'Z';
}
const I = {
  brokenheart: `<g transform="translate(-0.9 0.5) rotate(-7 12 14)"><path ${F} d="M12 7A4.6 4.6 0 0 0 4 10C4 15.8 12 21 12 21L11 17L13 13.2L10.6 11Z"/></g><g transform="translate(0.9 0.5) rotate(7 12 14)"><path ${F} d="M12 7A4.6 4.6 0 0 1 20 10C20 15.8 12 21 12 21L11 17L13 13.2L10.6 11Z"/></g>`,
  heart: `<path ${F} d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/>`,
  heartO: `<path ${S} d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/>`,
  coin: `<circle cx="12" cy="12" r="9" fill="#f2c14e" stroke="#b9801b" stroke-width="2"/><circle cx="12" cy="12" r="5.4" fill="none" stroke="#b9801b" stroke-width="1.6"/><path d="M12 9v6M10.4 10.4h2.3a1.2 1.2 0 0 1 0 2.4h-1.4a1.2 1.2 0 0 0 0 2.4h2.3" stroke="#b9801b" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
  star: `<path fill="#f2c14e" stroke="#b9801b" stroke-width="1.6" stroke-linejoin="round" d="M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.2l-5.7 3.1 1.1-6.3L2.8 9.5l6.4-.9z"/>`,
  starO: `<path fill="rgba(255,255,255,.18)" stroke="currentColor" stroke-opacity=".45" stroke-width="1.6" stroke-linejoin="round" d="M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.2l-5.7 3.1 1.1-6.3L2.8 9.5l6.4-.9z"/>`,
  play: `<path ${F} d="M7 4.5v15l13-7.5z"/>`,
  pause: `<rect ${F} x="6" y="4.5" width="4.2" height="15" rx="1.4"/><rect ${F} x="13.8" y="4.5" width="4.2" height="15" rx="1.4"/>`,
  replay: `<path ${S} d="M4 12a8 8 0 1 0 2.6-5.9"/><path ${S} d="M4 4v4.5h4.5"/>`,
  home: `<path ${S} d="M3.5 11.5L12 4l8.5 7.5"/><path ${S} d="M6 10.5V20h12v-9.5"/><path ${S} d="M10 20v-5h4v5"/>`,
  next: `<path ${F} d="M5 5v14l9-7z"/><path ${F} d="M12 5v14l9-7z"/>`,
  back: `<path ${S} stroke-width="2.6" d="M15 5l-7 7 7 7"/>`,
  close: `<path ${S} stroke-width="2.6" d="M6 6l12 12M18 6L6 18"/>`,
  bag: `<path ${S} d="M5 8h14l-1 12H6z"/><path ${S} d="M9 8V6.5a3 3 0 0 1 6 0V8"/>`,
  map: `<path ${S} d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path ${S} d="M9 4v14M15 6v14"/>`,
  gear: `<path ${F} fill-rule="evenodd" d="${gearPath()} M15.2 12a3.2 3.2 0 1 0-6.4 0 3.2 3.2 0 1 0 6.4 0z"/>`,
  moon: `<path ${F} d="M20 14.6A8.4 8.4 0 0 1 9.4 4a8.4 8.4 0 1 0 10.6 10.6z"/>`,
  sunset: `<path ${S} d="M3.5 18.5h17M7 18.5a5 5 0 0 1 10 0"/><path ${S} d="M12 6.5v3M5.3 9.8l2 2M18.7 9.8l-2 2M2.8 14.5h2.2M19 14.5h2.2"/>`,
  keyboard: `<rect ${S} x="2.5" y="6.5" width="19" height="11" rx="2.2"/><path ${S} stroke-width="2.4" d="M6.5 10.5h.1M10 10.5h.1M13.5 10.5h.1M17 10.5h.1M7.5 14h9"/>`,
  refresh: `<path ${S} d="M19.5 12a7.5 7.5 0 1 1-2.4-5.5"/><path ${S} d="M19.5 4.5v4.5H15"/>`,
  speaker: `<path ${F} d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path ${S} d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>`,
  speakerOff: `<path ${F} d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path ${S} d="M16 9.5l5 5M21 9.5l-5 5"/>`,
  lock: `<rect ${F} x="5" y="10.5" width="14" height="10" rx="2.4"/><path ${S} d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5"/>`,
  check: `<path ${S} stroke-width="3" d="M5 12.8l4.6 4.6L19 7.5"/>`,
  download: `<path ${S} d="M12 4v11M7.5 10.8L12 15.3l4.5-4.5"/><path ${S} d="M5 19.5h14"/>`,
  upload: `<path ${S} d="M12 15V4M7.5 8.2L12 3.7l4.5 4.5"/><path ${S} d="M5 19.5h14"/>`,
  share: `<path ${S} d="M12 15V4M7.5 7.8L12 3.3l4.5 4.5"/><path ${S} d="M6 11.5H5v8h14v-8h-1"/>`,
  trash: `<path ${S} d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>`,
  info: `<circle ${S} cx="12" cy="12" r="9"/><path ${S} d="M12 11v6"/><circle ${F} cx="12" cy="7.6" r="1.3"/>`,
  shieldLock: `<path ${S} d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z"/><path ${S} d="M9.5 12l2 2 3.5-4"/>`,
  flag: `<path ${S} d="M6 21V4"/><path ${F} d="M6 4.5h11l-2.2 3.8L17 12H6z"/>`,
  runner: `<circle ${F} cx="14.5" cy="4.5" r="2.3"/><path ${S} stroke-width="2.4" d="M13 8.5l-3.2 3 2.8 2.4-1.4 5.6M13 8.5l3.2 3.6 3 .6M9.8 11.5l-3.6 1.2M12.6 13.9l3.2 2.4 2.6 3.2"/>`,
  snail: `<path ${S} stroke-width="2.2" d="M3 18.5h15.5a2.5 2.5 0 0 0 0-5H18"/><circle ${S} stroke-width="2" cx="11.5" cy="11.5" r="5.5"/><path ${S} stroke-width="1.8" d="M11.5 11.5m-2.4 0a2.4 2.4 0 1 1 2.4 2.4"/><path ${S} stroke-width="1.8" d="M18.8 13.5V8.5M21.3 14V9.8"/>`,
  rabbit: `<path ${S} stroke-width="2" d="M8.5 20.5c-3 0-4.8-2.3-4.8-5 0-3.4 2.8-5.6 6.2-5.6h3.2c1.5 0 2.8.8 3.6 2l2.6.3c1 .1 1.5 1 1.1 1.8-.5 1-1.8 1.6-3.2 1.2-.3 2.6-2.2 5.3-5.2 5.3z"/><path ${S} stroke-width="2" d="M12.5 9.5c-.6-3.4-.2-6 1.4-6.2 1.5-.1 1.8 2.9 1.2 6.6"/><circle ${F} cx="17.2" cy="12.2" r=".9"/>`,
  cheetah: `<path ${S} stroke-width="2" d="M2.5 14.5c3-1.8 6-2.7 9-2.7 3.2 0 5 1 6.6 2.2l3.4.2M7.5 11.6l-1.7-3.3M14 12.2l1-4.2h3.6l1.2 3.2"/><path ${S} stroke-width="2" d="M6 14.8l-1.8 4.8M10.8 15l.6 4.8M17 14.8l2.6 4.6"/><circle ${F} cx="9" cy="14.2" r=".8"/><circle ${F} cx="12.6" cy="14.4" r=".8"/><circle ${F} cx="15.6" cy="13.8" r=".8"/>`,
  magnet: `<path ${S} stroke-width="3" d="M5 4v8a7 7 0 0 0 14 0V4"/><path stroke="#e84a4a" stroke-width="3" stroke-linecap="round" d="M5 4v3M19 4v3" fill="none"/><path stroke="#dfe6ee" stroke-width="3" stroke-linecap="round" d="M5 7.8v1M19 7.8v1" fill="none"/>`,
  shield: `<path fill="rgba(80,170,255,.25)" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z"/><path ${F} d="M12 6.5l1.3 3h3.1l-2.5 2 1 3.2L12 12.9l-2.9 1.8 1-3.2-2.5-2h3.1z"/>`,
  balloon: `<ellipse cx="12" cy="9.5" rx="6.2" ry="7" fill="#ee5d6c" stroke="#a82f3c" stroke-width="1.6"/><path fill="#a82f3c" d="M12 16.5l-1.6 2.2h3.2z"/><path ${S} stroke-width="1.4" d="M12 18.7c-1.5 1-1 2 0 2.5s1.5 1.2 0 2"/><path stroke="#fff" stroke-opacity=".6" stroke-width="1.8" stroke-linecap="round" d="M8.6 7.2c.5-1.3 1.4-2 2.4-2.3" fill="none"/>`,
  x2: `<text x="12" y="17.5" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="15" ${F}>×2</text>`,
  city: `<path ${F} d="M3 21V9h5v12zM9 21V4h6v17zM16 21v-9h5v9z"/><g fill="#0b1226" opacity=".55"><rect x="10.4" y="6" width="1.2" height="1.6"/><rect x="12.4" y="6" width="1.2" height="1.6"/><rect x="10.4" y="10" width="1.2" height="1.6"/><rect x="12.4" y="10" width="1.2" height="1.6"/></g>`,
  beach: `<path ${S} d="M2 18c2.2-1.6 4.2-1.6 5.5 0s3.3 1.6 5 0 3.3-1.6 5 0 2.4 1.2 4.5 0"/><circle ${F} cx="17.5" cy="7" r="3.2"/><path ${S} d="M5.5 15.5l3-9M8.5 6.5c-2.2.2-3.7 1.2-4.4 2.6M8.5 6.5c1.9-.9 3.8-.7 5 .6"/>`,
  snow: `<path ${S} stroke-width="1.8" d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path ${S} stroke-width="1.6" d="M9.8 4.8L12 6.6l2.2-1.8M9.8 19.2L12 17.4l2.2 1.8"/>`,
  desert: `<path ${F} d="M10.5 21V6.5a1.9 1.9 0 0 1 3.8 0V21z"/><path ${S} stroke-width="2.6" d="M10.5 13.8H8.2a1.6 1.6 0 0 1-1.6-1.6V9.6M14.3 11.6h2.2a1.6 1.6 0 0 0 1.6-1.6V7.6"/><path ${S} d="M3 21h18"/>`,
  forest: `<path ${F} d="M12 2.8l5 7h-2.8l4 5.7h-4.4L16.5 21h-9l2.2-5.5H5.3l4-5.7H7z"/><rect ${F} x="11" y="19" width="2" height="3" fill="#7a5a3a"/>`,
  skin: `<circle ${S} cx="12" cy="9" r="4.6"/><path ${S} d="M4 21c.6-4.6 3.6-6.6 8-6.6s7.4 2 8 6.6"/>`,
  hair: `<path ${F} d="M4.5 13.5C3.8 7.2 7.5 3.5 12 3.5s8.2 3.7 7.5 10c-1-3.3-2.4-5-4.7-5.6-1.8 1.4-5.3 2-8.3 2.2-.9.9-1.5 2-2 3.4z"/><path ${S} d="M6.5 14v5.5M17.5 14v5.5"/>`,
  haircolor: `<path ${F} d="M12 3c3.6 4.2 6 7.4 6 10.6A6 6 0 0 1 6 13.6C6 10.4 8.4 7.2 12 3z"/>`,
  shirt: `<path ${S} d="M8.5 4l-5 3.3 2.2 4 2.3-1.2V20h7.9v-9.9l2.3 1.2 2.2-4L15.5 4c-.6 1.5-1.9 2.3-3.5 2.3S9.1 5.5 8.5 4z"/>`,
  pants: `<path ${S} d="M7 3.5h10l1.2 17h-4.6L12 10.5l-1.6 10h-4.6z"/>`,
  shoe: `<path ${S} d="M3 15.5V9.5l4.5 1.7 2.6-3 2.6 3.6c1.5 1.5 5 1.5 6.3 3.2.6.8.2 2.2-1 2.2H4.4c-.8 0-1.4-.8-1.4-1.7z"/><path ${S} d="M3 18.5h17.6"/>`,
  hat: `<path ${S} d="M5 15a7 7 0 0 1 14 0z"/><path ${S} d="M3 15.5c3.5-1 12-1 18 .6"/>`,
  backpack: `<rect ${S} x="6" y="6" width="12" height="15" rx="4"/><path ${S} d="M9 6V4.8a3 3 0 0 1 6 0V6M9 14h6"/>`,
  scarf: `<path ${S} d="M4 8c5 3 11 3 16 0v3c-5 3-11 3-16 0z"/><path ${S} d="M8 13.5l-.6 6 3.6-.4.4-4.6"/>`,
  glasses: `<circle ${S} cx="7" cy="13" r="3.6"/><circle ${S} cx="17" cy="13" r="3.6"/><path ${S} d="M10.6 12.6c.9-.7 1.9-.7 2.8 0M3.4 12.6L2 9.5M20.6 12.6L22 9.5"/>`,
  chaser: `<circle ${F} cx="9" cy="4.5" r="2.3"/><path ${S} stroke-width="2.4" d="M10 8.5l2.8 3.4 3.4.4M10 8.5L7 11.5l-3 .4M11.6 10.5l-.8 4.6-3.4 3.4M10.8 15.1l4 2.2.4 3.6"/><path ${S} stroke-width="1.8" d="M17.5 5.2l3 .8M17 8l3.4 1.4"/>`,
  dog: `<path ${S} stroke-width="2" d="M3 12.5c0-1.4 1-2.6 2.4-2.6h6.4l2.2-3 2.2.9.6 2.2h2c.9 0 1.4.6 1.4 1.4v1.4c0 .9-.7 1.5-1.4 1.5H17l-.3 4.8M7 15v4.8M11 15v4.8M16.5 15.6l-.5 4.2"/><circle ${F} cx="17.8" cy="10.2" r=".8"/><path ${S} stroke-width="2" d="M3 12.5L2 9.5"/>`,
  robot: `<rect ${S} x="5" y="8" width="14" height="11" rx="3"/><path ${S} d="M12 8V4.5"/><circle ${F} cx="12" cy="3.6" r="1.4"/><circle ${F} cx="9" cy="13" r="1.7"/><circle ${F} cx="15" cy="13" r="1.7"/><path ${S} d="M9.5 17h5M3 12.5v3M21 12.5v3"/>`,
  guard: `<path ${S} d="M5 11a7 7 0 0 1 14 0z"/><path ${S} d="M3 11.5h18"/><circle ${S} cx="12" cy="16" r="4"/><path ${S} d="M8 21c.8-1.4 2.2-2 4-2s3.2.6 4 2"/>`,
  sparkle: `<path ${F} d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9zM19 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>`,
  bell: `<path ${S} d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4"/>`
};
export const ICON_NAMES = Object.keys(I);
export function ic(name, cls = '') {
  const body = I[name] || '';
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
}
/* Texture 3D à partir d’une icône (pour les bonus à ramasser) */
const texCache = {};
export function svgTexture(name, color = '#ffffff', size = 128) {
  const key = name + color + size; if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = c.height = size;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; texCache[key] = t;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" style="color:${color}">${I[name] || ''}</svg>`.replace(/currentColor/g, color);
  const img = new Image();
  img.onload = () => { const g = c.getContext('2d'); g.clearRect(0, 0, size, size); g.drawImage(img, 0, 0, size, size); t.needsUpdate = true; };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return t;
}

/* pastille ronde avec icône blanche (bonus à ramasser) */
const bCache = {};
export function badgeTexture(name, bg, size = 160) {
  const key = name + bg; if (bCache[key]) return bCache[key];
  const c = document.createElement('canvas'); c.width = c.height = size;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; bCache[key] = t;
  const draw = (img) => {
    const g = c.getContext('2d'); g.clearRect(0, 0, size, size);
    g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(size / 2, size / 2, size * 0.48, 0, 7); g.fill();
    g.fillStyle = bg; g.beginPath(); g.arc(size / 2, size / 2, size * 0.41, 0, 7); g.fill();
    if (img) g.drawImage(img, size * 0.22, size * 0.22, size * 0.56, size * 0.56); t.needsUpdate = true;
  };
  draw(null);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96">${(I[name] || '').replace(/currentColor/g, '#ffffff')}</svg>`;
  const img = new Image(); img.onload = () => draw(img); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return t;
}
