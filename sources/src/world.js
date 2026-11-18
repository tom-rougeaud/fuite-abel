import * as THREE from 'three';
import { mat, mesh, rbox } from './char.js';

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

export function skyTexture() {
  const c = canvas(4, 512), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#2a3a63'); gr.addColorStop(0.4, '#5d6e98'); gr.addColorStop(0.62, '#c9a38f'); gr.addColorStop(0.75, '#e2bc96'); gr.addColorStop(1, '#cfa98c');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function asphalt(len) {
  const c = canvas(512, 512), g = c.getContext('2d');
  g.fillStyle = '#4b505b'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14000; i++) { const v = 62 + rnd() * 48 | 0; g.fillStyle = `rgba(${v},${v},${v + 6},0.35)`; g.fillRect(rnd() * 512, rnd() * 512, 1.6, 1.6); }
  g.fillStyle = '#d9d5c9';
  for (const x of [256 - 85.3, 256 + 85.3]) for (let y = 0; y < 512; y += 256) g.fillRect(x - 3, y + 20, 6, 128);
  g.fillRect(256 - 240 - 3, 0, 6, 512); g.fillRect(256 + 240 - 3, 0, 6, 512);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, len / 12); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function facade(color) {
  const c = canvas(256, 512), g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.08})`; g.fillRect(rnd() * 256, rnd() * 512, 2, 2); }
  for (let y = 24; y < 500; y += 46) for (let x = 18; x < 240; x += 40) {
    const lit = rnd() < 0.38; g.fillStyle = lit ? (rnd() < 0.5 ? '#f0cf8d' : '#e3bd7b') : '#33405a';
    g.fillRect(x, y, 24, 30); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x, y, 24, 3); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, y + 28, 24, 3);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const FACADES = ['#8f5a46', '#b09a80', '#6f7a8a', '#9a8f86', '#7c6a5e', '#8d9a9a'];

export function buildWorld(scene, z0, z1) {
  const len = z0 - z1, cz = (z0 + z1) / 2;
  const road = new THREE.Mesh(new THREE.PlaneGeometry(9.6, len), new THREE.MeshStandardMaterial({ map: asphalt(len), roughness: 0.95 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0, cz); road.receiveShadow = true; scene.add(road);
  const concrete = mat('#a8a395', 0.95);
  for (const s of [-1, 1]) {
    const walk = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.16, len), concrete); walk.position.set(s * (4.8 + 2.6), 0.08, cz); walk.receiveShadow = true; scene.add(walk);
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, len), mat('#c1bcae', 0.9)); curb.position.set(s * 4.9, 0.09, cz); curb.receiveShadow = true; scene.add(curb);
    const ground = new THREE.Mesh(new THREE.BoxGeometry(60, 0.1, len), mat('#46544a', 1)); ground.position.set(s * (10 + 30), -0.02, cz); ground.receiveShadow = true; scene.add(ground);
  }
  /* bâtiments */
  for (const s of [-1, 1]) {
    let z = z0 + 10;
    while (z > z1) {
      const w = 12 + rnd() * 10, d = 12 + rnd() * 8, h = 14 + rnd() * 34, x = s * (10.5 + d / 2 + rnd() * 2);
      const tex = facade(FACADES[(rnd() * FACADES.length) | 0]); tex.repeat.set(w / 10, h / 12);
      const sideTex = tex.clone(); sideTex.repeat.set(d / 10, h / 12); sideTex.needsUpdate = true;
      const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), ms = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.9 });
      const b = new THREE.Mesh(new THREE.BoxGeometry(d, h, w), [ms, ms, mat('#5a5b60', 1), mat('#5a5b60', 1), m, m]);
      b.position.set(x, h / 2, z - w / 2); b.castShadow = true; b.receiveShadow = true; scene.add(b);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(d * 0.3, 1.6, w * 0.3), mat('#6a6d73', 1)); roof.position.set(x, h + 0.8, z - w / 2); scene.add(roof);
      z -= w + 1 + rnd() * 2;
    }
  }
  /* lampadaires, arbres, bouches d’incendie, panneaux */
  const pole = mat('#3a3f47', 0.6, 0.4), lampM = new THREE.MeshStandardMaterial({ color: '#ffe2a8', emissive: '#ffcf80', emissiveIntensity: 1.6 });
  for (const s of [-1, 1]) {
    for (let z = z0 - 6; z > z1; z -= 26) {
      const p = mesh(new THREE.CylinderGeometry(0.07, 0.1, 7, 10), pole); p.position.set(s * 5.4, 3.5, z + (s > 0 ? 0 : 13)); scene.add(p);
      const arm = mesh(new THREE.BoxGeometry(1.8, 0.1, 0.1), pole); arm.position.set(s * 4.55, 6.95, p.position.z); scene.add(arm);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, 0.3), lampM); lamp.position.set(s * 3.7, 6.85, p.position.z); scene.add(lamp);
    }
    for (let z = z0 - 10; z > z1; z -= 17) {
      const zz = z + (s > 0 ? 6 : 0), trunk = mesh(new THREE.CylinderGeometry(0.16, 0.22, 3.0, 8), mat('#5a4636', 1)); trunk.position.set(s * 7.4, 1.6, zz); scene.add(trunk);
      for (let k = 0; k < 3; k++) { const f = mesh(new THREE.IcosahedronGeometry(1.4 - k * 0.2, 1), mat(k % 2 ? '#5d8a62' : '#4f7a5c', 1)); f.position.set(s * 7.4 + (k - 1) * 0.5, 3.6 + k * 0.7, zz + (k - 1) * 0.3); f.castShadow = true; scene.add(f); }
    }
    for (let z = z0 - 30; z > z1; z -= 53) {
      const h = new THREE.Group(); const body = mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 12), mat('#a93a30', 0.6)); body.position.y = 0.5; h.add(body);
      const cap = mesh(new THREE.SphereGeometry(0.17, 12, 8), mat('#a93a30', 0.6)); cap.position.y = 0.88; h.add(cap); h.position.set(s * 5.5, 0.1, z); scene.add(h);
    }
  }
  /* passage piéton */
  for (let z = z0 - 70; z > z1; z -= 140) for (let i = -4; i <= 4; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.01, 3.2), mat('#e6e2d6', 0.9)); st.position.set(i * 1.0, 0.012, z); st.receiveShadow = true; scene.add(st); }
}
