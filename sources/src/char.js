import * as THREE from 'three';
import { surface } from './textures.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/* matériaux partagés (mémorisés) */
const MC = {};
export function tmat(c, kind, r = 0.85, rep = 1, bs = 1.2) {
  const k = 'T' + c + kind + r + rep; if (MC[k]) return MC[k];
  const t = surface(c, kind, rep);
  const cloth = kind === 'jersey' || kind === 'sweat' || kind === 'denim' || kind === 'canvas';
  const o = { color: '#ffffff', map: t.map, bumpMap: t.bump, bumpScale: bs, roughness: r, metalness: 0 };
  if (cloth) Object.assign(o, { sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(c).lerp(new THREE.Color('#ffffff'), 0.55) });
  if (kind === 'skin') Object.assign(o, { sheen: 0.5, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffb8a0') });
  if (kind === 'leather') Object.assign(o, { clearcoat: 0.35, clearcoatRoughness: 0.4 });
  if (kind === 'hair') Object.assign(o, { sheen: 1, sheenRoughness: 0.35, sheenColor: new THREE.Color(c).lerp(new THREE.Color('#ffffff'), 0.4) });
  return MC[k] = new THREE.MeshPhysicalMaterial(o);
}
export function mat(c, r = 0.8, m = 0, e = null, ei = 1) {
  const k = c + '|' + r + '|' + m + '|' + (e || '') + '|' + ei;
  return MC[k] || (MC[k] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: m }, e ? { emissive: e, emissiveIntensity: ei } : {})));
}
export function shadeHex(c, k) { const x = new THREE.Color(c).multiplyScalar(k); return '#' + x.getHexString(); }
export function mesh(g, m, shadow = true) { const o = new THREE.Mesh(g, m); o.castShadow = shadow; o.receiveShadow = true; return o; }
export const rbox = (w, h, d, r, m, shadow = true) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), m, shadow);
export function ell(rx, ry, rz, m, seg = 18) { const s = mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)), m); s.scale.set(rx, ry, rz); return s; }

function taper(len, r0, r1, seg = 16) {
  const pts = [], n = 6;
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.max(1e-4, r1 * Math.cos(a)), -len + r1 * Math.sin(a))); }
  for (let i = 0; i <= n; i++) { const a = (i / n) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.max(1e-4, r0 * Math.cos(a)), r0 * Math.sin(a))); }
  return new THREE.LatheGeometry(pts, seg);
}
const GEO = {};
function torsoGeo() {
  if (GEO.torso) return GEO.torso;
  const prof = [[0.0001, 0], [0.12, 0], [0.118, 0.07], [0.125, 0.15], [0.145, 0.23], [0.165, 0.31], [0.168, 0.37], [0.15, 0.425], [0.105, 0.462], [0.0001, 0.48]];
  return GEO.torso = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 26);
}
const grp = (x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };
const tp = (len, r0, r1) => { const k = len + '_' + r0 + '_' + r1; return GEO[k] || (GEO[k] = taper(len, r0, r1)); };

export const PRESET = {
  abel: { skin: '#e3b48c', hairStyle: 'court', hair: '#5a3a26', top: 'tshirt', topColor: '#3f6f8f', bottom: 'long', bottomColor: '#2b3a55', shoes: '#e8e1d0', hat: 'casquette', hatColor: '#b2634a', back: 'sac', backColor: '#6f8f7a', neck: 'echarpe', neckColor: '#c0583f', glasses: null },
  garde: { skin: '#c68e63', hairStyle: 'court', hair: '#1c1a1a', top: 'tshirt', topColor: '#2f4468', bottom: 'long', bottomColor: '#222c40', shoes: '#15171b', hat: 'casquette', hatColor: '#2f4468', back: null, neck: null, badge: true },
  robot: { skin: '#a9b6c3', metal: true, hairStyle: 'chauve', hair: '#222', top: 'sweat', topColor: '#6b7c8e', bottom: 'long', bottomColor: '#47556a', shoes: '#2d3642', hat: 'antenne', back: null, neck: null, glasses: 'visiere' }
};

const L = (a, b, t) => a + (b - a) * t;
function ribbon(w0, w1, n, m) {
  const g = new THREE.PlaneGeometry(1, 1, 3, n); g.userData.keep = true;
  const o = new THREE.Mesh(g, m); o.castShadow = true; o.frustumCulled = false; o.userData = { w0, w1, n };
  return o;
}
/* le ruban part du point (0,y0,z0) et s’éloigne vers +z en ondulant */
function flutter(o, t, sp, y0, z0, len, drop, amp, tw = 0) {
  const { w0, w1, n } = o.userData, p = o.geometry.attributes.position;
  for (let j = 0; j <= n; j++) {
    const u = j / n, w = L(w0, w1, u), x0 = Math.sin(t * 9 - u * 5) * amp * u * sp, y = y0 - drop * u + Math.sin(t * 12 - u * 6) * amp * 0.7 * u * sp, z = z0 + len * u * (0.55 + 0.45 * sp);
    const a = tw * (0.9 + Math.sin(t * 5 - u * 4) * 0.5 * sp);
    for (let i = 0; i <= 3; i++) { const q = (i / 3 - 0.5) * w; p.setXYZ(j * 4 + i, x0 + q * Math.cos(a), y + q * Math.sin(a), z); }
  }
  p.needsUpdate = true; o.geometry.computeVertexNormals();
}

export function buildRunner(opts = {}) {
  const P = Object.assign({}, PRESET.abel, opts);
  const skin = P.metal ? mat(P.skin, 0.35, 0.7) : tmat(P.skin, 'skin', 0.55, 2, 0.9);
  const topM = tmat(P.topColor, P.top === 'sweat' ? 'sweat' : 'jersey', 0.92, 2, 2.2), pantsM = tmat(P.bottomColor, 'denim', 0.88, 2, 2.0), shoesM = tmat(P.shoes, 'leather', 0.5, 2, 0.8), soleM = mat('#f4f1e8', 0.7), hairM = tmat(P.hair, 'hair', 0.5, 1, 1.0);
  const root = new THREE.Group(), B = {};
  B.pelvis = grp(0, 0.96, 0); root.add(B.pelvis);
  const hips = ell(0.168, 0.105, 0.11, pantsM); hips.position.y = -0.015; B.pelvis.add(hips);
  B.spine = grp(0, 0.03, 0); B.pelvis.add(B.spine);
  B.chest = grp(0, 0, 0); B.spine.add(B.chest);
  const torso = mesh(torsoGeo(), topM); torso.scale.set(1.12, 1, 0.74); B.chest.add(torso);
  if (P.top === 'sweat') { const hood = mesh(new THREE.TorusGeometry(0.085, 0.034, 8, 18), topM); hood.rotation.x = Math.PI / 2; hood.position.set(0, 0.45, 0.012); B.chest.add(hood); }
  B.neck = grp(0, 0.455, 0); B.chest.add(B.neck);
  const neckM = mesh(tp(0.1, 0.048, 0.045), skin); neckM.position.y = 0.1; B.neck.add(neckM);
  B.head = grp(0, 0.2, 0); B.neck.add(B.head);
  B.head.add(ell(0.088, 0.108, 0.1, skin, 24));
  const jaw = ell(0.07, 0.07, 0.08, skin); jaw.position.set(0, -0.055, -0.012); B.head.add(jaw);
  const eyeM = P.metal ? mat('#38e0ff', 0.3, 0, '#38e0ff', 1.6) : mat('#1c1a1a', 0.3);
  for (const s of [-1, 1]) {
    const ear = ell(0.014, 0.03, 0.022, skin); ear.position.set(s * 0.086, -0.005, 0.005); B.head.add(ear);
    const eye = ell(0.011, 0.014, 0.008, eyeM); eye.position.set(s * 0.034, 0.012, -0.093); B.head.add(eye);
    const ck = ell(0.02, 0.013, 0.008, mat('#c9806a', 0.8)); ck.position.set(s * 0.05, -0.03, -0.086); if (!P.metal) B.head.add(ck);
  }
  const nose = ell(0.014, 0.018, 0.02, skin); nose.position.set(0, -0.012, -0.102); B.head.add(nose);
  const mouth = ell(0.02, 0.005, 0.006, mat(P.metal ? '#2a323c' : '#9a4a3c', 0.7)); mouth.position.set(0, -0.052, -0.094); B.head.add(mouth);

  /* coiffures */
  const hs = P.hairStyle;
  B.pony = [];
  if (hs !== 'chauve') {
    const cap = ell(0.097, 0.108, 0.108, hairM, 24); cap.position.set(0, 0.012, 0.022); B.head.add(cap);
    if (hs === 'court') { const hb = ell(0.085, 0.07, 0.065, hairM); hb.position.set(0, -0.025, 0.055); B.head.add(hb); }
    if (hs === 'long') {
      const hb = ell(0.098, 0.2, 0.075, hairM); hb.position.set(0, -0.12, 0.065); B.head.add(hb);
      for (const s of [-1, 1]) { const sd = ell(0.025, 0.15, 0.06, hairM); sd.position.set(s * 0.088, -0.09, 0.03); B.head.add(sd); }
    }
    if (hs === 'queue') {
      const hb = ell(0.085, 0.07, 0.065, hairM); hb.position.set(0, -0.025, 0.055); B.head.add(hb);
      const knot = ell(0.034, 0.034, 0.034, hairM); knot.position.set(0, 0.03, 0.12); B.head.add(knot);
      let py = 0.02;
      for (let i = 0; i < 4; i++) { const sg = ell(0.027 - i * 0.003, 0.05, 0.027 - i * 0.003, hairM); B.head.add(sg); B.pony.push(sg); }
    }
    if (hs === 'boucle') {
      const r = mulberry(7);
      for (let i = 0; i < 18; i++) { const a = r() * Math.PI * 2, b = r() * 1.15; const cu = ell(0.036, 0.036, 0.036, hairM, 10); cu.position.set(Math.cos(a) * Math.sin(b + 0.35) * 0.108, 0.012 + Math.cos(b + 0.1) * 0.118, 0.024 + Math.sin(a) * Math.sin(b + 0.35) * 0.115); if (cu.position.z > -0.045) B.head.add(cu); }
    }
  }
  /* chapeaux */
  const hatM = P.hatColor ? tmat(P.hatColor, 'canvas', 0.9, 1, 0.7) : null;
  const dome = (sx, sy, sz, m, y = 0.035, z = 0.008) => { const d = mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), m); d.scale.set(sx, sy, sz); d.position.set(0, y, z); B.head.add(d); return d; };
  if (P.hat === 'casquette') {
    dome(0.105, 0.098, 0.116, hatM);
    const brim = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.008, 24, 1, false, Math.PI / 2, Math.PI), mat(shadeHex(P.hatColor, 0.8), 0.8)); brim.scale.set(1.02, 1, 1.3); brim.position.set(0, 0.052, -0.045); brim.rotation.x = 0.12; B.head.add(brim);
    if (P.badge) { const b = ell(0.017, 0.012, 0.004, mat('#d9b45a', 0.4, 0.6)); b.position.set(0, 0.07, -0.108); B.head.add(b); }
  } else if (P.hat === 'bonnet') {
    dome(0.107, 0.104, 0.116, hatM, 0.03);
    const roll = mesh(new THREE.TorusGeometry(0.1, 0.022, 8, 24), mat(shadeHex(P.hatColor, 1.15), 0.9)); roll.rotation.x = Math.PI / 2; roll.scale.set(1.04, 1.16, 1); roll.position.set(0, 0.03, 0.008); B.head.add(roll);
    const pom = ell(0.032, 0.032, 0.032, mat('#f2efe6', 0.95)); pom.position.set(0, 0.14, 0.008); B.head.add(pom);
  } else if (P.hat === 'couronne') {
    const gold = mat('#f2c14e', 0.3, 0.8, '#6b4a10', 0.4);
    const ring = mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.05, 20, 1, true), gold); ring.position.set(0, 0.085, 0.008); B.head.add(ring);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const sp = mesh(new THREE.ConeGeometry(0.014, 0.05, 6), gold); sp.position.set(Math.cos(a) * 0.08, 0.135, 0.008 + Math.sin(a) * 0.08); B.head.add(sp); const g = ell(0.008, 0.008, 0.008, mat(i % 2 ? '#e35a6a' : '#58a0e8', 0.3, 0, i % 2 ? '#e35a6a' : '#58a0e8', 0.5)); g.position.set(Math.cos(a) * 0.08, 0.085, 0.008 + Math.sin(a) * 0.08 + 0.0); if (Math.sin(a) < -0.3) { g.position.z -= 0.0; } B.head.add(g); }
  } else if (P.hat === 'casque') {
    dome(0.112, 0.11, 0.125, hatM, 0.03, 0.012);
    for (const s of [-1, 0, 1]) { const v = rbox(0.022, 0.012, 0.1, 0.004, mat('#1b1f26', 0.8)); v.position.set(s * 0.04, 0.128 - Math.abs(s) * 0.01, -0.02); v.rotation.z = -s * 0.28; B.head.add(v); }
    const str = rbox(0.12, 0.012, 0.012, 0.004, mat('#e8e4d6', 0.7)); str.position.set(0, -0.008, -0.1); B.head.add(str);
  } else if (P.hat === 'paille') {
    const straw = mat('#e2c377', 0.95);
    const brimM = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.01, 28), straw); brimM.position.set(0, 0.058, 0.008); brimM.rotation.x = 0.06; B.head.add(brimM);
    dome(0.098, 0.082, 0.108, straw, 0.058);
    const band = mesh(new THREE.CylinderGeometry(0.1, 0.103, 0.022, 22, 1, true), mat('#c0583f', 0.9)); band.position.set(0, 0.075, 0.008); B.head.add(band);
  } else if (P.hat === 'antenne') {
    const st = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.09, 6), mat('#2a323c', 0.5, 0.6)); st.position.set(0, 0.17, 0.01); B.head.add(st);
    const bl = ell(0.018, 0.018, 0.018, mat('#ff4a5a', 0.3, 0, '#ff4a5a', 1.5)); bl.position.set(0, 0.22, 0.01); B.head.add(bl);
  }
  /* lunettes */
  if (P.glasses === 'rondes' || P.glasses === 'soleil') {
    const gm = mat(P.glasses === 'soleil' ? '#16181c' : '#2b2f36', 0.4, 0.3);
    for (const s of [-1, 1]) {
      if (P.glasses === 'rondes') { const r = mesh(new THREE.TorusGeometry(0.03, 0.0048, 8, 20), gm); r.position.set(s * 0.036, 0.012, -0.099); B.head.add(r); }
      else { const l = ell(0.036, 0.026, 0.006, gm); l.position.set(s * 0.036, 0.01, -0.1); B.head.add(l); }
      const arm = rbox(0.004, 0.004, 0.1, 0.001, gm); arm.position.set(s * 0.088, 0.012, -0.05); B.head.add(arm);
    }
    const br = rbox(0.03, 0.005, 0.005, 0.001, gm); br.position.set(0, 0.014, -0.1); B.head.add(br);
  } else if (P.glasses === 'visiere') {
    const v = rbox(0.17, 0.034, 0.02, 0.01, mat('#12333d', 0.2, 0.6, '#38e0ff', 0.7)); v.position.set(0, 0.012, -0.098); B.head.add(v);
  }
  /* épaules + bras */
  for (const s of [-1, 1]) {
    const k = s < 0 ? 'R' : 'L';
    const sh = grp(s * 0.205, 0.405, 0); B.chest.add(sh); B['sh' + k] = sh;
    sh.add(ell(0.058, 0.058, 0.056, topM));
    const sweat = P.top === 'sweat';
    sh.add(mesh(tp(0.27, 0.05, 0.042), skin));
    sh.add(mesh(tp(sweat ? 0.27 : 0.13, 0.058, sweat ? 0.047 : 0.052), topM));
    const el = grp(0, -0.27, 0); sh.add(el); B['el' + k] = el;
    el.add(ell(0.044, 0.044, 0.044, sweat ? topM : skin));
    el.add(mesh(tp(0.25, 0.04, 0.03), sweat ? topM : skin));
    if (sweat) { const cuff = mesh(tp(0.04, 0.036, 0.034), mat(shadeHex(P.topColor, 1.2), 0.9)); cuff.position.y = -0.22; el.add(cuff); }
    const hd = grp(0, -0.265, 0); el.add(hd);
    const fist = ell(0.036, 0.046, 0.034, skin); fist.position.y = -0.03; hd.add(fist);
    const th = ell(0.014, 0.025, 0.014, skin); th.position.set(-s * 0.016, -0.02, -0.022); hd.add(th);
    B['hd' + k] = hd;
  }
  /* jambes */
  for (const s of [-1, 1]) {
    const k = s < 0 ? 'R' : 'L';
    const hp = grp(s * 0.088, -0.03, 0); B.pelvis.add(hp); B['hip' + k] = hp;
    const short = P.bottom === 'short';
    if (short) { hp.add(mesh(tp(0.44, 0.088, 0.062), skin)); hp.add(mesh(tp(0.27, 0.1, 0.082), pantsM)); }
    else hp.add(mesh(tp(0.44, 0.094, 0.064), pantsM));
    const kn = grp(0, -0.44, 0); hp.add(kn); B['knee' + k] = kn;
    kn.add(ell(0.065, 0.065, 0.066, short ? skin : pantsM));
    kn.add(mesh(tp(0.43, 0.06, 0.043), short ? skin : pantsM));
    const an = grp(0, -0.43, 0); kn.add(an); B['ankle' + k] = an;
    const sock = mesh(tp(0.07, 0.044, 0.04), short ? mat('#f2efe6', 0.9) : skin); sock.position.y = 0.025; an.add(sock);
    const sh = ell(0.054, 0.046, 0.128, shoesM); sh.position.set(0, -0.022, -0.045); an.add(sh);
    const sl = ell(0.056, 0.016, 0.132, soleM); sl.position.set(0, -0.056, -0.045); an.add(sl);
    const toe = ell(0.05, 0.036, 0.05, shoesM); toe.position.set(0, -0.03, -0.12); an.add(toe);
  }
  /* dos */
  B.cape = []; B.wings = [];
  if (P.back === 'sac') {
    const bc = mat(P.backColor, 0.85);
    const pack = rbox(0.3, 0.38, 0.15, 0.06, bc); pack.position.set(0, 0.2, 0.15); B.chest.add(pack);
    const pocket = rbox(0.2, 0.14, 0.05, 0.03, mat(shadeHex(P.backColor, 0.8), 0.85)); pocket.position.set(0, 0.12, 0.23); B.chest.add(pocket);
    for (const s of [-1, 1]) { const st = rbox(0.04, 0.34, 0.02, 0.01, mat('#2b2f36', 0.9)); st.position.set(s * 0.1, 0.27, 0.115); B.chest.add(st); }
  } else if (P.back === 'cape') {
    const cm = new THREE.MeshStandardMaterial({ color: P.backColor, roughness: 0.85, side: THREE.DoubleSide });
    const cp = ribbon(0.3, 0.46, 10, cm); B.chest.add(cp); B.cape.push(cp);
    const clasp = ell(0.02, 0.02, 0.012, mat('#f2c14e', 0.3, 0.8)); clasp.position.set(0, 0.44, -0.095); B.chest.add(clasp);
  } else if (P.back === 'ailes') {
    const wm = mat(P.backColor, 0.7), wm2 = mat(shadeHex(P.backColor, 1.15), 0.7);
    for (const s of [-1, 1]) {
      const w = grp(s * 0.08, 0.36, 0.15); B.chest.add(w); B.wings.push({ g: w, s });
      for (let i = 0; i < 5; i++) { const f = ell(0.032, 0.17 + (i === 2 ? 0.05 : 0) - i * 0.01, 0.008, i % 2 ? wm : wm2, 10); f.position.set(s * (0.07 + i * 0.065), 0.1 - i * 0.03, 0); f.rotation.z = -s * (0.5 + i * 0.12); w.add(f); }
    }
  }
  /* écharpe */
  B.scarf = [];
  if (P.neck === 'echarpe') {
    const sc = mat(P.neckColor, 0.95);
    const ring = mesh(new THREE.TorusGeometry(0.075, 0.032, 10, 20), sc); ring.rotation.x = Math.PI / 2; ring.position.y = 0.04; B.neck.add(ring);
    const sm = new THREE.MeshStandardMaterial({ color: P.neckColor, roughness: 0.95, side: THREE.DoubleSide });
    const rb = ribbon(0.11, 0.09, 8, sm); B.neck.add(rb); B.scarf.push(rb);
  }
  /* ballons (pose « envol ») */
  B.balloons = grp(0, 0, 0); B.balloons.visible = false; B.chest.add(B.balloons);
  [['#ee5d6c', -0.18, 0.18], ['#f2c14e', 0.0, 0.3], ['#58a0e8', 0.18, 0.15]].forEach(([c, x, h]) => {
    const b = ell(0.17, 0.2, 0.17, mat(c, 0.35, 0, null), 16); b.position.set(x * 1.6, 1.25 + h, -0.05); B.balloons.add(b);
    const knot = mesh(new THREE.ConeGeometry(0.03, 0.05, 6), mat(c, 0.35)); knot.position.set(x * 1.6, 1.03 + h, -0.05); knot.rotation.x = Math.PI; B.balloons.add(knot);
    const str = mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.0 + h, 4), mat('#eeeeee', 0.9), false);
    str.position.set(x * 0.8, 0.5 + (1.0 + h) / 2 - 0.5 + 0.08, -0.05); str.rotation.z = -x * 1.6 / (1.0) * 0.62; B.balloons.add(str);
  });
  root.userData = { B, P, kind: 'runner' };
  return root;
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const clamp01 = x => Math.max(0, Math.min(1, x));
/* st : {phi, jump, slide, stumble, fly, win, tired, t, speed} */
export function poseRunner(R, st) {
  const B = R.userData.B, phi = st.phi || 0, jump = st.jump || 0, slide = st.slide || 0, t = st.t || 0;
  const stumble = st.stumble || 0, fly = st.fly || 0, win = st.win || 0, tired = st.tired || 0;
  const s0 = Math.sin(phi), s1 = Math.sin(phi + Math.PI), c0 = Math.cos(phi), c1 = Math.cos(phi + Math.PI);
  const leg = (s, c) => ({ hip: 0.12 + 0.82 * s, knee: -(0.32 + 1.15 * Math.pow(Math.max(0, c), 1.3)), ankle: -0.26 + 0.5 * s });
  const lL = leg(s0, c0), lR = leg(s1, c1);
  const jp = { hipL: 1.2, kneeL: -1.3, ankleL: 0.15, hipR: -0.3, kneeR: -0.55, ankleR: -0.7, shL: 1.45, shR: -0.8, elL: 0.75, elR: 1.15 };
  const sl = { hipL: 0.32, kneeL: -0.08, ankleL: 0.35, hipR: 0.18, kneeR: -0.25, ankleR: 0.35, shL: -1.5, shR: -1.3, elL: 0.3, elR: 0.3 };
  const mx = (r, j, c) => L(L(r, j, jump), c, slide);
  const S = (J, v) => { J.rotation.x = v; };
  S(B.hipL, mx(lL.hip, jp.hipL, sl.hipL)); S(B.kneeL, mx(lL.knee, jp.kneeL, sl.kneeL)); S(B.ankleL, mx(lL.ankle, jp.ankleL, sl.ankleL));
  S(B.hipR, mx(lR.hip, jp.hipR, sl.hipR)); S(B.kneeR, mx(lR.knee, jp.kneeR, sl.kneeR)); S(B.ankleR, mx(lR.ankle, jp.ankleR, sl.ankleR));
  S(B.shL, mx(-0.78 * s0, jp.shL, sl.shL)); S(B.shR, mx(-0.78 * s1, jp.shR, sl.shR));
  S(B.elL, mx(1.32 - 0.38 * s0, jp.elL, sl.elL)); S(B.elR, mx(1.32 - 0.38 * s1, jp.elR, sl.elR));
  B.shL.rotation.z = 0.12; B.shR.rotation.z = -0.12;
  const run = 1 - jump * 0.8 - slide;
  B.spine.rotation.x = L(-0.2, -0.16, jump) + slide * -0.55;
  B.chest.rotation.y = -0.2 * s0 * Math.max(0, run); B.pelvis.rotation.y = 0.13 * s0 * Math.max(0, run);
  B.pelvis.rotation.z = 0.045 * s0 * Math.max(0, 1 - jump - slide); B.chest.rotation.z = -0.03 * s0;
  B.head.rotation.y = 0.12 * s0; B.head.rotation.x = 0.12 - slide * 0.3; B.neck.rotation.x = 0.08;
  B.pelvis.rotation.x = slide * 1.15;
  B.pelvis.position.y = 0.96 + (-0.045 * Math.cos(2 * phi) * (1 - jump) - 0.035) * (1 - slide) - slide * 0.5 + jump * 0.02;
  B.pelvis.position.x = 0.022 * s0 * (1 - jump) * (1 - slide);
  B.pelvis.position.z = slide * 0.15;
  /* trébuche : buste en avant, bras qui battent */
  if (stumble > 0) {
    const k = stumble, w = Math.sin(t * 26);
    B.spine.rotation.x += -0.55 * k; B.head.rotation.x += 0.35 * k;
    B.shL.rotation.x = L(B.shL.rotation.x, 1.9 + 0.5 * w, k); B.shR.rotation.x = L(B.shR.rotation.x, 1.9 - 0.5 * w, k);
    B.shL.rotation.z = L(B.shL.rotation.z, 0.8, k); B.shR.rotation.z = L(B.shR.rotation.z, -0.8, k);
    B.elL.rotation.x = L(B.elL.rotation.x, 0.3, k); B.elR.rotation.x = L(B.elR.rotation.x, 0.3, k);
  }
  /* envol : suspendu aux ballons */
  B.balloons.visible = fly > 0.01;
  if (fly > 0) {
    const k = fly, sw = Math.sin(t * 3);
    B.shL.rotation.x = L(B.shL.rotation.x, 2.9, k); B.shR.rotation.x = L(B.shR.rotation.x, 2.9, k);
    B.shL.rotation.z = L(B.shL.rotation.z, 0.35, k); B.shR.rotation.z = L(B.shR.rotation.z, -0.35, k);
    B.elL.rotation.x = L(B.elL.rotation.x, 0.15, k); B.elR.rotation.x = L(B.elR.rotation.x, 0.15, k);
    B.hipL.rotation.x = L(B.hipL.rotation.x, 0.5 + 0.2 * sw, k); B.hipR.rotation.x = L(B.hipR.rotation.x, 0.15 - 0.2 * sw, k);
    B.kneeL.rotation.x = L(B.kneeL.rotation.x, -0.5, k); B.kneeR.rotation.x = L(B.kneeR.rotation.x, -0.9, k);
    B.ankleL.rotation.x = L(B.ankleL.rotation.x, 0.5, k); B.ankleR.rotation.x = L(B.ankleR.rotation.x, 0.5, k);
    B.spine.rotation.x = L(B.spine.rotation.x, -0.05, k); B.head.rotation.x = L(B.head.rotation.x, -0.1, k);
    B.chest.rotation.y *= 1 - k; B.pelvis.rotation.y *= 1 - k;
  }
  /* victoire : bras en l’air, petits sauts */
  if (win > 0) {
    const k = win, h = Math.abs(Math.sin(t * 5));
    B.shL.rotation.x = L(B.shL.rotation.x, 2.9 + 0.2 * Math.sin(t * 9), k); B.shR.rotation.x = L(B.shR.rotation.x, 2.9 - 0.2 * Math.sin(t * 9), k);
    B.shL.rotation.z = L(B.shL.rotation.z, 0.5, k); B.shR.rotation.z = L(B.shR.rotation.z, -0.5, k);
    B.elL.rotation.x = L(B.elL.rotation.x, 0.2, k); B.elR.rotation.x = L(B.elR.rotation.x, 0.2, k);
    for (const J of ['hipL', 'hipR']) B[J].rotation.x = L(B[J].rotation.x, 0.1 + h * 0.5, k);
    for (const J of ['kneeL', 'kneeR']) B[J].rotation.x = L(B[J].rotation.x, -0.15 - h * 0.7, k);
    for (const J of ['ankleL', 'ankleR']) B[J].rotation.x = L(B[J].rotation.x, 0.3 * h, k);
    B.spine.rotation.x = L(B.spine.rotation.x, 0.05, k); B.head.rotation.x = L(B.head.rotation.x, -0.15, k);
    B.chest.rotation.y *= 1 - k; B.pelvis.rotation.y *= 1 - k; B.pelvis.rotation.z *= 1 - k;
    B.pelvis.position.y += h * 0.2 * k;
  }
  /* fatigué : épaules tombantes, tête basse */
  if (tired > 0) {
    const k = tired, b = Math.sin(t * 3) * 0.02;
    for (const J of ['shL', 'shR']) B[J].rotation.x = L(B[J].rotation.x, 0.15 + b, k);
    B.shL.rotation.z = L(B.shL.rotation.z, 0.1, k); B.shR.rotation.z = L(B.shR.rotation.z, -0.1, k);
    for (const J of ['elL', 'elR']) B[J].rotation.x = L(B[J].rotation.x, 0.25, k);
    for (const J of ['hipL', 'hipR']) B[J].rotation.x = L(B[J].rotation.x, 0.08, k);
    for (const J of ['kneeL', 'kneeR']) B[J].rotation.x = L(B[J].rotation.x, -0.1, k);
    for (const J of ['ankleL', 'ankleR']) B[J].rotation.x = L(B[J].rotation.x, 0, k);
    B.spine.rotation.x = L(B.spine.rotation.x, -0.38 + b, k); B.head.rotation.x = L(B.head.rotation.x, 0.45, k);
    B.chest.rotation.y *= 1 - k; B.pelvis.rotation.y *= 1 - k; B.pelvis.rotation.z *= 1 - k;
    B.pelvis.position.y = L(B.pelvis.position.y, 0.93, k);
  }
  if (st.idle) {
    const k = st.idle, b = Math.sin(t * 1.8) * 0.02;
    for (const J of ['hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR']) B[J].rotation.x = L(B[J].rotation.x, 0, k);
    B.hipL.rotation.x = L(B.hipL.rotation.x, 0.03, k); B.kneeL.rotation.x = L(B.kneeL.rotation.x, -0.05, k);
    B.shL.rotation.x = L(B.shL.rotation.x, 0.05 + b, k); B.shR.rotation.x = L(B.shR.rotation.x, 0.05 - b, k);
    B.shL.rotation.z = L(B.shL.rotation.z, 0.1, k); B.shR.rotation.z = L(B.shR.rotation.z, -0.1, k);
    B.elL.rotation.x = L(B.elL.rotation.x, 0.22, k); B.elR.rotation.x = L(B.elR.rotation.x, 0.22, k);
    B.spine.rotation.x = L(B.spine.rotation.x, -0.02 + b, k); B.head.rotation.x = L(B.head.rotation.x, 0.02, k); B.neck.rotation.x = L(B.neck.rotation.x, 0, k);
    B.chest.rotation.y *= 1 - k; B.pelvis.rotation.y *= 1 - k; B.pelvis.rotation.z *= 1 - k; B.chest.rotation.z *= 1 - k; B.head.rotation.y *= 1 - k;
    B.pelvis.position.y = L(B.pelvis.position.y, 0.95 + b * 0.5, k); B.pelvis.position.x *= 1 - k;
  }
  /* accessoires animés */
  const sp = st.speed === undefined ? 1 : st.speed;
  B.scarf.forEach(r => flutter(r, t, sp, 0.03, 0.07, 0.55, 0.06, 0.05, 1.2));
  B.cape.forEach(c => flutter(c, t, sp, 0.42, 0.12, 0.55, 0.78, 0.05, 0));
  B.wings.forEach(w => { const flap = Math.sin(t * (fly > 0 ? 8 : 14)) * 0.25 * (0.4 + sp * 0.6); w.g.rotation.y = -w.s * (0.4 + flap); });
  B.pony.forEach((sg, i) => { sg.position.set(Math.sin(t * 9 - i) * 0.02 * i * sp, 0.0 - i * 0.07 + 0.01, 0.12 + 0.05 + i * 0.012 + 0.02 * i * sp); sg.rotation.x = 0.4 + Math.sin(t * 10 - i) * 0.2 * sp; });
}

/* ---------- chien poursuivant ---------- */
export function buildDog(opts = {}) {
  const fur = mat(opts.fur || '#b9854f', 0.9), dark = mat(shadeHex(opts.fur || '#b9854f', 0.62), 0.9), light = mat('#efe3cf', 0.9), nose = mat('#1b1b1f', 0.4);
  const root = new THREE.Group(), B = {};
  B.body = grp(0, 0.62, 0); root.add(B.body);
  const torso = ell(0.2, 0.2, 0.46, fur, 20); B.body.add(torso);
  const chest = ell(0.19, 0.21, 0.2, light, 14); chest.position.set(0, -0.03, -0.26); B.body.add(chest);
  B.neckG = grp(0, 0.1, -0.36); B.body.add(B.neckG);
  const neck = ell(0.13, 0.17, 0.13, fur, 12); neck.position.set(0, 0.07, -0.04); neck.rotation.x = -0.5; B.neckG.add(neck);
  B.head = grp(0, 0.2, -0.1); B.neckG.add(B.head);
  B.head.add(ell(0.115, 0.105, 0.12, fur, 16));
  const snout = ell(0.07, 0.06, 0.1, light, 12); snout.position.set(0, -0.03, -0.14); B.head.add(snout);
  const nz = ell(0.03, 0.025, 0.025, nose, 10); nz.position.set(0, -0.012, -0.235); B.head.add(nz);
  const tongue = ell(0.025, 0.008, 0.05, mat('#d9566a', 0.6), 8); tongue.position.set(0, -0.07, -0.19); B.head.add(tongue);
  B.ears = [];
  for (const s of [-1, 1]) {
    const eg = grp(s * 0.095, 0.075, 0.02); B.head.add(eg); const e = ell(0.04, 0.09, 0.05, dark, 10); e.position.y = -0.06; eg.add(e); B.ears.push({ g: eg, s });
    const eye = ell(0.016, 0.02, 0.01, nose, 8); eye.position.set(s * 0.05, 0.03, -0.108); B.head.add(eye);
  }
  B.tail = grp(0, 0.12, 0.44); B.body.add(B.tail); const tl = ell(0.04, 0.17, 0.04, fur, 8); tl.position.y = 0.12; B.tail.add(tl);
  const mk = (x, z, front) => {
    const hip = grp(x, -0.08, z); B.body.add(hip);
    const up = mesh(taper(0.3, 0.075, 0.05), fur); hip.add(up);
    const kn = grp(0, -0.3, 0); hip.add(kn); kn.add(mesh(taper(0.28, 0.05, 0.035), front ? fur : dark));
    const paw = ell(0.05, 0.03, 0.075, light, 10); paw.position.set(0, -0.29, -0.03); kn.add(paw);
    return { hip, kn };
  };
  B.fl = mk(-0.11, -0.28, true); B.fr = mk(0.11, -0.28, true); B.bl = mk(-0.11, 0.3, false); B.br = mk(0.11, 0.3, false);
  root.userData = { B, kind: 'dog' };
  return root;
}
export function poseDog(R, st) {
  const B = R.userData.B, phi = st.phi || 0, t = st.t || 0;
  const g = (J, a, k) => { J.hip.rotation.x = a; J.kn.rotation.x = k; };
  const f = Math.sin(phi), b = Math.sin(phi + 0.9);
  g(B.fl, 0.85 * f, -0.5 - 0.7 * Math.max(0, Math.cos(phi))); g(B.fr, 0.85 * Math.sin(phi + 0.45), -0.5 - 0.7 * Math.max(0, Math.cos(phi + 0.45)));
  g(B.bl, 0.9 * b - 0.1, 0.5 + 0.7 * Math.max(0, Math.cos(phi + 0.9))); g(B.br, 0.9 * Math.sin(phi + 1.35) - 0.1, 0.5 + 0.7 * Math.max(0, Math.cos(phi + 1.35)));
  B.body.position.y = 0.66 + 0.06 * Math.cos(phi * 1 + 0.2); B.body.rotation.x = 0.1 * Math.sin(phi + 0.5);
  B.head.rotation.x = 0.1 * -Math.sin(phi + 0.5) + 0.05; B.tail.rotation.x = 0.6; B.tail.rotation.z = Math.sin(t * 14) * 0.5;
  B.ears.forEach(e => { e.g.rotation.x = 0.4 + 0.3 * Math.sin(phi * 2); e.g.rotation.z = e.s * (0.3 + 0.2 * Math.sin(phi * 2 + 1)); });
}
export function disposeTree(o) { /* géométries partagées : rien à libérer */ }
