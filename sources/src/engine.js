/* Projet : La fuite d’Abel  ·  Version : 1.9.0  ·  Date : 17/11/2026
   Auteur : Tom Rougeaud  ·  Licence : CC BY-NC 4.0
   Réalisé avec l’aide de l’IA : Claude Sonnet 5.5 (Anthropic) */
import * as THREE from 'three';
import { buildRunner, poseRunner, buildDog, poseDog, PRESET } from './char.js';
import { proto } from './vehicles.js';
import { THEMES, Scenery, applyLook } from './themes.js';
import { coinMaterials, envMap } from './textures.js';
import { badgeTexture } from './icons.js';
import { buildChaser, poseDrone } from './chasers.js';

export const LANE = 3.2, LX = [-LANE, 0, LANE];
/* vitesse de défilement (m/s) : seul le décor accélère, pas la cadence des jambes */
export const SPEEDS = [32, 43, 55];
/* 15 niveaux : 5 décors × (jour, soir, nuit). Plus on avance, plus c’est long, rapide et chargé. */
/* 50 niveaux de 5 000 m : décor = 5 lieux × 3 ambiances (jour, soir, nuit), difficulté et vitesse croissantes */
export const LEVELS = Array.from({ length: 50 }, (_, i) => ({ theme: (i % 5) + 5 * (Math.floor(i / 5) % 3), len: 5000, diff: 0.4 + 0.7 * i / 49, vmul: 1 + 0.003 * i, seed: 11 * (i + 1) }));
export const POWERS = { aimant: { icon: 'magnet', bg: '#c0392b', dur: 9 }, bouclier: { icon: 'shield', bg: '#2f7fd0', dur: 14 }, envol: { icon: 'balloon', bg: '#d9578a', dur: 5.5 }, x2: { icon: 'x2', bg: '#7a4fb8', dur: 10 }, ralenti: { icon: 'snail', bg: '#3a8f7a', dur: 6 }, bottes: { icon: 'rabbit', bg: '#d98a2b', dur: 12 }, repousse: { icon: 'wind', bg: '#4a7fa8', dur: 0 }, pluie: { icon: 'sparkle', bg: '#b88a1c', dur: 8 }, coeur: { icon: 'heart', bg: '#d1344a', dur: 0 } };
const SIZE = { sedan: [4.8, 1.9, 1.7], pickup: [5.6, 2.05, 2.1], van: [5.2, 2.1, 2.45], truck: [17.6, 2.55, 4.0], bus: [11.5, 2.5, 3.0], busramp: [18.5, 2.5, 3.0], barrier: [0.7, 2.6, 0.9], beam: [0.6, 3.3, 2.0], crate: [1.8, 1.8, 1.5], barrel: [1.6, 1.6, 1.5] };
const RAMP = 7;

function mb(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const sm = (a, b, t) => { const u = Math.max(0, Math.min(1, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* ---------- génération d’un niveau (déterministe) ---------- */
export function genLevel(li, si) {
  const L = LEVELS[li], v = SPEEDS[si] * L.vmul, r0 = mb(L.seed * 100 + si), obs = [], coins = [], picks = [], safes = []; let r = r0, nextSeg = 600, slal = 0; /* slal : nombre de rangées restantes d’un slalom */ /* r : générateur du tronçon courant */
  const addObs = (kind, lane, d0, extra = {}) => {
    const [len, w, top] = SIZE[kind], type = kind === 'barrier' ? 'barrier' : kind === 'beam' ? 'beam' : kind === 'busramp' ? 'ramp' : 'block';
    obs.push(Object.assign({ kind, lane, x: LX[lane], d0, d1: d0 + len, len, hw: w / 2, top, type, variant: (r() * 6) | 0 }, extra));
    return len;
  };
  const coin = (d, x, y) => coins.push({ d, x, y, got: false }); const haz = [];
  const pv = () => { const z = r(); return z < 0.1 ? 'sedan' : z < 0.2 ? 'pickup' : z < 0.6 ? 'van' : z < 0.8 ? 'truck' : 'bus'; }, /* véhicules qui barrent une voie : surtout trop hauts pour être sautés */ pv2 = () => { const z = r(); return z < 0.45 ? 'sedan' : z < 0.75 ? 'pickup' : 'van'; };
  // tutoriel : ligne de pièces au centre, aucun obstacle
  for (let d = 10; d <= 46; d += 3) coin(d, 0, 1.0);
  let d = 54, safe = 1, prevEnd = 46, rows = 0, lastPick = 0, prevSafe = 1, combo = false, lastCombo = false;
  while (d < L.len - 40) {
    /* tronçons de 500 m tirés dans un petit lot de graines : certains reviennent à l’identique (ou presque) ; chaque tronçon repart sur la voie centrale */
    let boundary = false;
    if (d >= nextSeg) { boundary = true; nextSeg += 500; r = mb(7000 + (L.seed % 9) * 16 + ((r0() * 8) | 0)); combo = false; lastCombo = false; rows = Math.max(rows, 4); }
    const diff = Math.min(1.1, L.diff * (0.55 + 0.45 * Math.min(1, rows / 8)) + 0.25 * Math.min(1, d / L.len));
    let kind;
    const q = r();
    if (rows === 0) kind = 'barrier'; else if (rows === 1) kind = 'beam';
    else if (q < 0.06 - 0.04 * diff) kind = 'free'; else if (q < 0.46) kind = 'barrier'; else if (q < 0.64) kind = 'beam'; else kind = rows >= 3 ? 'busramp' : 'barrier';
    if (combo) kind = r() < 0.5 ? 'barrier' : 'beam';
    if (boundary) kind = 'free';
    /* slalom : 3 à 5 rangées rapprochées qui obligent à changer de voie à chaque fois (toutes les autres voies sont barrées) */
    if (!boundary && slal === 0 && rows > 4 && r() < 0.1 + 0.12 * diff) slal = 3 + ((r() * 3) | 0);
    const inSl = slal > 0 && !boundary; if (inSl) { kind = 'free'; combo = false; }
    const pullNow = rows >= 3 && !inSl && !boundary && !combo && r() < 0.6 + 0.3 * diff; /* voiture qui sort dans TA voie */
    /* rangée « saut + décalage » : on saute (ou glisse), puis un véhicule surgit dans la même voie : il faut passer sur la voisine presque en même temps */
    const hopNow = rows > 5 && !inSl && !boundary && !combo && !pullNow && r() < 0.18 + 0.15 * diff; if (hopNow) kind = r() < 0.5 ? 'barrier' : 'beam';
    const opts = [safe - 1, safe + 1].filter(l => l >= 0 && l <= 2);
    const newSafe = rows < 2 || boundary ? 1 : (combo ? safe : inSl || pullNow || r() < 0.88 ? opts[(r() * opts.length) | 0] : safe); /* on change presque toujours de voie */
    const hopOpts = [newSafe - 1, newSafe + 1].filter(l => l >= 0 && l <= 2), hopT = hopNow ? hopOpts[(r() * hopOpts.length) | 0] : -1; /* voie d’esquive */
    const endLane = hopNow ? hopT : newSafe; /* voie où l’on se trouve à la fin de la rangée */
    // pièces de la zone de dégagement : le chemin glisse vers la nouvelle voie
    /* danger de la zone : décidé avant, pour élargir l’écart si la voie à quitter est concernée */
    const hOuter = [0, 2].filter(l => l !== newSafe && l !== prevSafe), hLeaves = prevSafe !== newSafe && prevSafe !== 1;
    const hz = hopNow ? null : pullNow ? { pull: true, early: true } : (rows >= 2 && !inSl && r() < 0.5 + 0.2 * diff ? { pull: false, early: hLeaves && r() < 0.7 } : null);
    const hvf = v * (1 + 0.25 * Math.min(1, d / L.len));
    if (hz && hz.early) d += 0.75 * hvf; /* voie à quitter : il faut laisser le temps de réagir */
    if (hz && !hz.early && !hOuter.length) hz.none = true;
    const g0 = prevEnd + 2, g1 = d - 3;
    for (let dd = g0; dd <= g1; dd += 3) { const u = g1 > g0 ? (dd - g0) / (g1 - g0) : 1; coin(dd, LX[prevSafe] + (LX[newSafe] - LX[prevSafe]) * sm(0.15, 0.85, u), 1.0); }
    /* dangers de la zone : voiture qui sort de son stationnement, objet qui tombe */
    let lateStart = -1; /* début de la voiture qui sort dans la voie à quitter */
    if (hz && !hz.none && g1 - g0 >= 13) {
      const hl = hz.early ? prevSafe : hOuter[(r() * hOuter.length) | 0], span = g1 - g0, sd = hl === 1 ? -(Math.sign(LX[newSafe]) || 1) : Math.sign(LX[hl]); /* sortie du côté opposé à la voie suivante */
      if (hz.pull) {
        const k = pv2(), len = SIZE[k][0], d0h = hz.early ? prevEnd + hvf + r() * 0.15 * hvf : g0 + 1 + r() * Math.max(0, span - len - 3);
        obs.push({ kind: k, lane: hl, x: sd * 5.7, xPark: sd * 5.7, xLane: LX[hl], d0: d0h, d1: d0h + len, len, hw: SIZE[k][1] / 2, top: SIZE[k][2], type: 'block', variant: (r() * 6) | 0, dyn: 'pull', p: 0, on: false });
        haz.push({ d0: d0h, d1: d0h + len, x: LX[hl] }); if (hz.early) lateStart = d0h;
      } else {
        const k = r() < 0.5 ? 'crate' : 'barrel', len = SIZE[k][0], d0h = hz.early ? prevEnd + hvf + r() * 0.15 * hvf : g0 + 2 + r() * Math.max(0, span - 6);
        obs.push({ kind: k, lane: hl, x: LX[hl], d0: d0h, d1: d0h + len, len, hw: SIZE[k][1] / 2, top: 1.5, type: 'block', variant: (r() * 3) | 0, dyn: 'drop', p: 0, on: false, landed: false, fy: 9 });
        haz.push({ d0: d0h, d1: d0h + len, x: LX[hl] });
      }
    }
    /* zone de dégagement : circulation continue, une seule voie libre presque en permanence.
       - les voies que le trajet n’emprunte pas sont remplies de véhicules d’un bout à l’autre ;
       - si l’on change de voie : la nouvelle est barrée au début, l’ancienne à la fin, avec un créneau de ≈ 0,4 s au milieu pour passer. */
    const tile = (lane, a0, b0) => { /* aligne des véhicules (petits écarts) entre a0 et b0 */
      let x = a0 + r() * 0.8;
      while (true) { const k = pv2(), len = SIZE[k][0]; if (x + len > b0 + 0.5) break; addObs(k, lane, x); haz.push({ d0: x, d1: x + len, x: LX[lane] }); x += len + 1.4 + r() * 2.2; }
    };
    let swPt = g0; /* point où le trajet change de voie (robot de test) */
    if (g1 - g0 >= 6 && !boundary) {
      const lo = Math.min(prevSafe, newSafe), hi = Math.max(prevSafe, newSafe);
      for (let l = 0; l < 3; l++) { if (l >= lo && l <= hi) continue; tile(l, g0, g1); }
      if (prevSafe === newSafe) { for (let l = 0; l < 3; l++) if (l !== newSafe && (l < lo || l > hi)) { /* déjà rempli ci-dessus */ } }
      else {
        const W = 0.3 * hvf, lateAt = lateStart > 0 ? lateStart : g1 - 6, swA = g0 + Math.max(0, (Math.min(lateAt, g1) - g0 - W) * 0.5), swB = swA + W;
        tile(newSafe, g0, swA);
        if (lateStart < 0) tile(prevSafe, swB, g1);
        swPt = (swA + swB) / 2;
      }
    }
    let rowLen = 1;
    const sl = kind === 'free' ? 0 : addObs(kind, newSafe, d);
    if (kind === 'free') rowLen = 10; else rowLen = sl;
    // pièces sur le chemin
    if (kind === 'free') for (let dd = d; dd <= d + 10; dd += 3) coin(dd, LX[newSafe], 1.0);
    else if (kind === 'barrier') for (let k = 0; k <= 6; k++) { const u = k / 6; coin(d + 0.35 - 4.5 + u * 9, LX[newSafe], 1.0 + 1.55 * Math.sin(Math.PI * u)); }
    else if (kind === 'beam') for (let k = 0; k <= 4; k++) coin(d + 0.3 - 3 + k * 1.5, LX[newSafe], 0.85);
    else { for (let k = 0; k <= 4; k++) { const u = k / 4; coin(d + u * RAMP, LX[newSafe], 1.0 + 3.0 * u); } for (let dd = d + RAMP + 1.5; dd < d + sl - 1; dd += 2) coin(dd, LX[newSafe], 4.0); }
    // autres voies
    for (let lane = 0; lane < 3; lane++) {
      if (lane === newSafe) continue;
      const pBlock = inSl ? 1 : kind === 'free' ? 0.97 : 0.995; /* presque toujours une seule voie praticable */
      if (rows < 2) continue;
      if (lane === hopT) { const kk = 'van'; rowLen = Math.max(rowLen, addObs(kk, lane, d) ); continue; }
      const q2 = r();
      if (q2 < pBlock) {
        const k = pv(), shift = r() * 2; rowLen = Math.max(rowLen, addObs(k, lane, d + shift) + shift);
        /* convoi : un deuxième véhicule juste derrière */
        if (r() < 0.55 + 0.3 * diff) { const k2 = pv2(), sh2 = shift + SIZE[k][0] + 1.2 + r() * 1.5; rowLen = Math.max(rowLen, addObs(k2, lane, d + sh2) + sh2);
          /* troisième véhicule du convoi */
          if (r() < 0.35 * diff + 0.15) { const k3 = pv2(), sh3 = sh2 + SIZE[k2][0] + 1.2 + r() * 1.5; rowLen = Math.max(rowLen, addObs(k3, lane, d + sh3) + sh3); } }
      }
      else if (q2 < Math.min(0.99, pBlock + 0.25)) { addObs(r() < 0.5 ? 'barrier' : 'beam', lane, d + r() * 2); }
    }
    if (hopNow) { /* le véhicule surgit dans la voie du saut, juste après l’obstacle */
      const kv = r() < 0.5 ? 'van' : 'truck', vf2 = v * (1 + 0.25 * Math.min(1, d / L.len)), dv = d + 0.55 * vf2, e = addObs(kv, newSafe, dv);
      safes.push({ g0: swPt, lane: newSafe, from: prevSafe, end: d + 6 }); rowLen = Math.max(rowLen, e + 0.55 * vf2); safes.push({ g0: d + 7, lane: hopT, from: newSafe, end: d + rowLen });
    } else safes.push({ g0: swPt, lane: newSafe, from: prevSafe, end: d + rowLen });
    rows++; prevSafe = endLane; safe = endLane; prevEnd = d + rowLen;
    // bonus
    if (d - lastPick > 330 && rows > 3) { /* bonus plus rares ; cœur et ballons très rares */
      const t = r(), type = t < 0.16 ? 'aimant' : t < 0.30 ? 'bouclier' : t < 0.35 ? 'envol' : t < 0.47 ? 'x2' : t < 0.51 ? 'coeur' : t < 0.63 ? 'ralenti' : t < 0.77 ? 'bottes' : t < 0.89 ? 'repousse' : 'pluie';
      const pd = prevEnd + 5;
      picks.push({ d: pd, x: LX[endLane], type, got: false });
      if (type === 'envol') for (let k = 0; k < 12; k++) coin(pd + 12 + k * 2.6, LX[endLane], 5.0);
      lastPick = d;
    }
    /* série : un second obstacle suit de près sur la même voie (saute, puis glisse) */
    lastCombo = combo; combo = rows > 3 && !lastCombo && !hopNow && (kind === 'barrier' || kind === 'beam') && r() < 0.18 + 0.4 * diff;
    const vf = v * (1 + 0.25 * Math.min(1, d / L.len)); /* vitesse réelle à cet endroit : l’écart reste faisable (un saut dure 0,77 s) */
    if (inSl) slal--;
    d = prevEnd + (inSl ? vf * 0.62 + 3 : combo ? vf * 0.8 + 4 : Math.max(9, vf * (0.78 + 0.06 * (1 - Math.min(1, diff))) + r() * 0.08 * vf));
  }
  // fin de parcours : dernière ligne de pièces vers l’arche
  const g0 = prevEnd + 2; for (let dd = g0; dd < L.len - 4; dd += 3) { const u = (dd - g0) / Math.max(1, L.len - 4 - g0); coin(dd, LX[safe] + (0 - LX[safe]) * sm(0.1, 0.5, u), 1.0); }
  /* beaucoup moins de pièces : on garde 1 pièce sur 5 (1 sur 2 dans le tutoriel), sauf sous les dangers */
  const all = coins.filter(c => !haz.some(h => c.d > h.d0 - 2 && c.d < h.d1 + 2 && Math.abs(c.x - h.x) < 2.2)).sort((a, b) => a.d - b.d), kept = []; let ti = 0, k5 = 0;
  for (const c of all) { if (c.d <= 46) { if ((ti++ & 1) === 0) kept.push(c); } else if ((k5++ % 5) === 2) kept.push(c); }
  return { safes, obs, dyn: obs.filter(o => o.dyn), coins: kept, picks, len: L.len, theme: L.theme, v, speed: si };
}

/* ---------- moteur ---------- */
export function createEngine(canvas, cb = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!cb.preserve });
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene(), hemi = new THREE.HemisphereLight(), sun = new THREE.DirectionalLight();
  sun.castShadow = true; Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 70 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(hemi, sun, sun.target);
  const cam = new THREE.PerspectiveCamera(58, 0.56, 0.1, 400);
  envMap(renderer).then(e => { scene.environment = e; }).catch(() => {});

  const S = { mode: 'menu', themeIdx: -1, scen: null, look: Object.assign({}, PRESET.abel), chaserType: 'garde', quality: 'auto', q: 2, w: 1, h: 1, t: 0, paused: false, fpsAcc: 0, fpsN: 0, lowCount: 0 };
  const P = { d: 0, x: 0, y: 0, vy: 0, lane: 1, grounded: true, coyote: 0, jumpBuf: 0, slide: 0, inv: 0, hitT: 9, hearts: 3, coins: 0, phi: 0, fly: 0, shield: 0, magnet: 0, x2: 0, slow: 0, boots: 0, rain: 0, lost: 0, tired: 0, speedMul: 1, state: 'ready', endT: 0, camShake: 0, flash: 0 };
  const C = { gap: 12, x: 0, phi: 0, nextVisit: 20, vphase: 0, vt: 0, near: 0 };
  let runner = null, chaser = null, lev = null, obsGroup = new THREE.Group(), coinMesh = null, pickGroup = new THREE.Group(), finishGroup = null, confetti = null, shieldMesh = null, platform = null;
  scene.add(obsGroup, pickGroup);
  const live = new Map(); // obstacles instanciés
  let coinStart = 0;
  const shop = { focus: 'body', yaw: 0, subject: 'runner', yawNow: 0 };
  const hudT = { t: 0 };
  const CADENCE = 15; // rad/s : foulée constante, quelle que soit la vitesse de défilement

  function applyQuality() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), steps = [0.6, 0.8, Math.min(dpr, 1.5), Math.min(dpr, 2)];
    const q = S.quality === 'bas' ? 0 : S.quality === 'haut' ? 3 : S.q;
    renderer.setPixelRatio(steps[q]); renderer.shadowMap.enabled = q >= 1; sun.castShadow = q >= 1;
    const ms = q >= 3 ? 2048 : 1024; if (sun.shadow.mapSize.x !== ms) { sun.shadow.mapSize.set(ms, ms); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    renderer.setSize(S.w, S.h, false);
  }
  function resize(w, h) { S.w = w; S.h = h; cam.aspect = w / h; cam.updateProjectionMatrix(); applyQuality(); }
  function setQuality(q) { S.quality = q; S.q = 2; applyQuality(); }

  function setTheme(i) {
    if (S.themeIdx === i) return;
    if (S.scen) S.scen.dispose(); S.scen = new Scenery(scene, i); S.themeIdx = i;
    applyLook(scene, hemi, sun, renderer, THEMES[i]); S.scen.update(S.lastZ || 0, 0, cam, 0);
  }
  function buildChars() {
    if (runner) scene.remove(runner); if (chaser) scene.remove(chaser);
    runner = buildRunner(S.look); scene.add(runner);
    chaser = buildChaser(S.chaserType); chaser.scale.setScalar(chaser.userData.sc);
    scene.add(chaser);
    if (!shieldMesh) { shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 14), new THREE.MeshBasicMaterial({ color: '#58a8ff', transparent: true, opacity: 0.22, depthWrite: false })); shieldMesh.visible = false; scene.add(shieldMesh); }
    if (!platform) { platform = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.12, 40), new THREE.MeshStandardMaterial({ color: '#cfd6e2', roughness: 0.5 })); platform.position.y = -0.06; platform.receiveShadow = true; platform.visible = false; scene.add(platform); }
  }
  function setLook(l) { S.look = Object.assign({}, PRESET.abel, l); buildChars(); }
  function setChaser(t) { S.chaserType = t; buildChars(); }
  buildChars();

  /* ---------- modes ---------- */
  function clearRun() {
    live.forEach(o => { obsGroup.remove(o.m); if (o.sh) obsGroup.remove(o.sh); }); live.clear(); pickGroup.clear();
    if (coinMesh) { scene.remove(coinMesh); coinMesh.dispose(); coinMesh = null; }
    if (finishGroup) { scene.remove(finishGroup); finishGroup = null; } if (confetti) { scene.remove(confetti); confetti = null; }
    lev = null; coinStart = 0;
  }
  function menu(themeIdx = 1) {
    clearRun(); S.mode = 'menu'; setTheme(themeIdx); S.paused = false;
    S.mz = -400 - Math.random() * 50; S.lastZ = S.mz; P.state = 'ready'; platform.visible = false; shieldMesh.visible = false; runner.visible = true; chaser.visible = true;
    S.scen.update(S.mz, 0, cam, 0, true);
  }
  function shopMode(themeIdx = 0) {
    clearRun(); S.mode = 'shop'; setTheme(themeIdx); S.paused = false; S.mz = -300; S.lastZ = S.mz; platform.visible = true; shieldMesh.visible = false;
    shop.yawNow = 0.6; S.scen.update(S.mz, 0, cam, 0, true);
  }
  function shopView(focus, yaw, subject) { shop.focus = focus; shop.yaw = yaw; shop.subject = subject || 'runner'; }
  function startLevel(li, si) {
    clearRun(); S.mode = 'play'; S.paused = false; platform.visible = false;
    lev = genLevel(li, si); lev.li = li; lev.totalCoins = lev.coins.length;
    S.lastZ = 0; S.themeIdx === lev.theme && S.scen && (S.scen.dispose(), S.scen = null, S.themeIdx = -1); setTheme(lev.theme);
    Object.assign(P, { d: 0, x: 0, y: 0, vy: 0, lane: 1, grounded: true, coyote: 0, jumpBuf: 0, slide: 0, inv: 0, hitT: 9, hearts: 3, coins: 0, phi: 0, fly: 0, shield: 0, magnet: 0, x2: 0, slow: 0, boots: 0, rain: 0, lost: 0, tired: 0, speedMul: 1, state: 'run', endT: 0, camShake: 0, flash: 0, vx: 0, airT: 0, jumped: false, land: 0, sk: 0, jk: 0, ended: false });
    Object.assign(C, { gap: 14, x: 1.2, phi: 0, nextVisit: 8 + Math.random() * 4, vphase: 0, vt: 0, near: 0 });
    const cm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.34, 0.34, 0.07, 28), coinMaterials(), 220); cm.frustumCulled = false; cm.count = 0; cm.castShadow = false; scene.add(cm); coinMesh = cm;
    // arche d’arrivée
    finishGroup = new THREE.Group(); const post = new THREE.MeshStandardMaterial({ color: '#e9e4d6', roughness: 0.6 });
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, 7, 0.7), post); p.position.set(s * 5.2, 3.5, 0); finishGroup.add(p); }
    const cvs = document.createElement('canvas'); cvs.width = 512; cvs.height = 64; const g = cvs.getContext('2d');
    for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#1c1f26' : '#f4f1e8'; g.fillRect(i * 32, j * 32, 32, 32); }
    const ct = new THREE.CanvasTexture(cvs); ct.colorSpace = THREE.SRGBColorSpace;
    const ban = new THREE.Mesh(new THREE.BoxGeometry(10.8, 1.4, 0.5), new THREE.MeshStandardMaterial({ map: ct, roughness: 0.7 })); ban.position.set(0, 6.6, 0); finishGroup.add(ban);
    finishGroup.position.z = -lev.len; scene.add(finishGroup);
    for (const p of lev.picks) {
      const def = POWERS[p.type], sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTexture(def.icon, def.bg), transparent: true, depthWrite: false, fog: false }));
      sp.scale.set(1.5, 1.5, 1); sp.position.set(p.x, 1.5, -p.d); p.sp = sp; pickGroup.add(sp);
    }
    S.scen.update(0, 0, cam, 0); emit('go');
  }
  function emit(n) { if (cb.onSfx) cb.onSfx(n); }

  /* ---------- sol / collisions ---------- */
  function floorAt(x, d) {
    let f = 0;
    for (const o of lev.obs) if (o.type === 'ramp' && d >= o.d0 && d <= o.d1 && Math.abs(x - o.x) < 1.15) { const h = d < o.d0 + RAMP ? 3.0 * (d - o.d0) / RAMP : 3.0; if (h > f) f = h; }
    return f;
  }
  function hurt() {
    if (P.inv > 0 || P.fly > 0 || P.state !== 'run') return;
    if (P.shield > 0) { P.shield = 0; P.inv = 1.2; emit('shield'); return; }
    const close = C.near > 0 || C.vphase === 1 || C.vphase === 2; /* gardien tout près : le choc coûte 2 cœurs */
    P.hearts -= close ? 2 : 1; P.inv = 1.8; P.hitT = 0; P.camShake = 0.5; P.flash = 1; emit('hit');
    C.near = 7;
    if (P.hearts <= 0) { P.state = 'lose'; P.endT = 0; emit('lose'); }
  }
  function collide() {
    const py = P.y, sl = P.slide > 0;
    for (const o of lev.obs) {
      if (o.d1 < P.d - 1 || o.d0 > P.d + 1.5) continue;
      if (!(P.d + 0.3 > o.d0 && P.d - 0.3 < o.d1)) continue;
      if (Math.abs(P.x - o.x) > o.hw - 0.05) continue;
      if (o.dyn === 'drop' && !o.landed) continue;
      if (o.type === 'barrier') { if (py < 0.7) { hurt(); } }
      else if (o.type === 'beam') { if (!sl) hurt(); }
      else if (o.type === 'block') { if (py < o.top - 0.25) hurt(); }
      else if (o.type === 'ramp') { if (P.d > o.d0 + RAMP && py < 2.7) hurt(); }
    }
  }
  const SHG = new THREE.CircleGeometry(1.1, 24);
  function syncDyn() {
    for (const [o, v] of live) {
      if (!o.dyn) continue; const dist = o.d0 - P.d;
      if (o.dyn === 'pull') { v.m.position.x = o.x; v.m.rotation.y = o.on && o.p < 1 ? (Math.sign(o.xLane) || 1) * 0.45 * Math.sin(Math.PI * o.p) : 0; }
      else { v.m.visible = o.on; v.m.position.y = o.fy; v.sh.visible = !o.landed && dist < Math.max(P.vNow || 20, 12) * 2.0; v.sh.material.opacity = 0.25 + 0.4 * (o.on ? o.p : 0); v.sh.scale.setScalar(0.8 + 0.4 * (o.on ? o.p : 0)); }
    }
  }
  function spawnLive() {
    for (const o of lev.obs) {
      const vis = o.d1 > P.d - 25 && o.d0 < P.d + 135, has = live.get(o);
      if (vis && !has) {
        const m = proto(o.kind, o.variant).clone();
        const z = o.kind === 'busramp' ? -o.d0 - (11.5 / 2 + RAMP) : -(o.d0 + o.len / 2); m.position.set(o.x, 0, z);
        obsGroup.add(m); const ent = { m };
        if (o.dyn === 'drop') { m.visible = o.on; m.position.y = o.fy; const sh = new THREE.Mesh(SHG, new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.4, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.set(o.x, 0.04, z); sh.visible = false; obsGroup.add(sh); ent.sh = sh; }
        live.set(o, ent);
      } else if (!vis && has) { obsGroup.remove(has.m); if (has.sh) obsGroup.remove(has.sh); live.delete(o); }
    }
  }

  /* ---------- entrées ---------- */
  function input(a) {
    if (S.mode !== 'play' || P.state !== 'run' || S.paused) return;
    if (a === 'left' && P.lane > 0) { P.lane--; emit('move'); } else if (a === 'right' && P.lane < 2) { P.lane++; emit('move'); }
    else if (a === 'jump') { P.jumpBuf = 0.18; } else if (a === 'slide') { if (P.grounded) { P.slide = 0.75; emit('slide'); } else { P.vy = Math.min(P.vy, -16); P.slidePending = true; } }
  }
  let ptr = null;
  canvas.addEventListener('pointerdown', e => { ptr = { x: e.clientX, y: e.clientY, t: performance.now(), done: false }; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} });
  canvas.addEventListener('pointermove', e => {
    if (!ptr || ptr.done) return; const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y, ad = Math.max(Math.abs(dx), Math.abs(dy));
    if (ad > 26) { ptr.done = true; if (Math.abs(dx) > Math.abs(dy)) input(dx < 0 ? 'left' : 'right'); else input(dy < 0 ? 'jump' : 'slide'); }
  });
  canvas.addEventListener('pointerup', e => {
    if (ptr && !ptr.done && performance.now() - ptr.t < 320) { const fx = e.clientX / canvas.clientWidth; input(fx < 0.33 ? 'left' : fx > 0.67 ? 'right' : 'jump'); }
    ptr = null;
  });
  /* clavier : les flèches marchent toujours ; ZQSD / WASD seulement si le clavier n’a pas de flèches
     (réglage « lettres », ou choix automatique si la première touche utilisée est une lettre) */
  let keysMode = 'fleches', arrowSeen = false;
  const ARROWS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', ArrowDown: 'slide' }, LETTERS = { q: 'left', a: 'left', d: 'right', z: 'jump', w: 'jump', s: 'slide' };
  addEventListener('keydown', e => {
    const k = e.key;
    if (ARROWS[k]) { arrowSeen = true; if (S.mode === 'play') e.preventDefault(); input(ARROWS[k]); return; }
    if (k === ' ') { if (S.mode === 'play') e.preventDefault(); input('jump'); return; }
    const a = LETTERS[(k || '').toLowerCase()]; if (!a || e.ctrlKey || e.metaKey || e.altKey || S.mode !== 'play') return;
    if (keysMode !== 'lettres') { if (arrowSeen) return; keysMode = 'lettres'; if (cb.onKeys) cb.onKeys('lettres'); }
    input(a);
  });
  function setKeys(m) { keysMode = m === 'lettres' ? 'lettres' : 'fleches'; }

  /* ---------- mise à jour ---------- */
  const dummy = new THREE.Object3D();
  function stepPlay(dt) {
    P.hitT += dt; P.inv = Math.max(0, P.inv - dt); P.slide = Math.max(0, P.slide - dt); P.magnet = Math.max(0, P.magnet - dt); P.x2 = Math.max(0, P.x2 - dt); P.slow = Math.max(0, P.slow - dt); P.boots = Math.max(0, P.boots - dt); P.rain = Math.max(0, P.rain - dt); P.fly = Math.max(0, P.fly - dt);
    P.flash = Math.max(0, P.flash - dt * 2); P.camShake = Math.max(0, P.camShake - dt);
    const v0 = lev.v * (1 + 0.25 * Math.min(1, P.d / lev.len));
    let spd = v0;
    if (P.state === 'run') spd *= 0.5 + 0.5 * sm(0, 1.3, P.hitT);
    else if (P.state === 'win') spd *= Math.max(0, 1 - P.endT / 2.2);
    else spd *= Math.max(0, 1 - P.endT / 0.9);
    if (P.slow > 0) spd *= 0.62; /* bonus ralenti : le décor défile moins vite */
    P.speedMul = spd / v0; P.vNow = spd;
    P.d += spd * dt;
    /* changement de voie : ressort amorti (départ et arrivée progressifs, pas de saccade) */
    P.vx += (260 * (LX[P.lane] - P.x) - 32 * P.vx) * dt; P.x = clamp(P.x + P.vx * dt, -LANE - 0.15, LANE + 0.15);
    P.land = Math.max(0, P.land - dt / 0.3); if (!P.grounded) P.airT += dt;
    for (const o of lev.dyn) {
      const dist = o.d0 - P.d; if (dist > 400 || dist < -30) continue;
      if (!o.on && dist < Math.max(P.vNow, 12) * (o.dyn === 'pull' ? 1.0 : 0.95)) o.on = true;
      if (!o.on) continue;
      if (o.dyn === 'pull') { if (o.p < 1) { o.p = Math.min(1, o.p + dt / 0.8); o.x = o.xPark + (o.xLane - o.xPark) * sm(0, 1, o.p); } }
      else if (!o.landed) { o.p = Math.min(1, o.p + dt / 0.5); o.fy = 9 * (1 - o.p * o.p); if (o.p >= 1) { o.landed = true; o.fy = 0; emit('thud'); P.camShake = Math.max(P.camShake, 0.15); } }
    }
    const fl = floorAt(P.x, P.d);
    if (P.fly > 0 || (P.fly <= 0 && P.flyPrev)) { /* vol */ }
    if (P.fly > 0) { P.y += (4.6 - P.y) * Math.min(1, dt * 3); P.vy = 0; P.grounded = false; }
    else {
      if (P.grounded) P.coyote = 0.1; else P.coyote -= dt;
      P.jumpBuf = Math.max(0, P.jumpBuf - dt);
      if (P.jumpBuf > 0 && (P.grounded || P.coyote > 0) && P.state === 'run') { P.vy = P.boots > 0 ? 12.6 : 10; P.grounded = false; /* bottes : saut plus haut */ P.coyote = 0; P.jumpBuf = 0; P.slide = 0; P.jumped = true; P.airT = 0; emit('jump'); }
      if (!P.grounded || P.y > fl + 0.001 || P.vy > 0) { P.vy -= 26 * dt; P.y += P.vy * dt; }
      if (P.y <= fl) { if (!P.grounded) { P.land = P.airT > 0.18 ? 1 : 0; P.jumped = false; P.airT = 0; } if (!P.grounded && P.slidePending) { P.slide = 0.75; P.slidePending = false; emit('slide'); } P.y = fl; P.vy = 0; P.grounded = true; } else P.grounded = false;
    }
    P.flyPrev = P.fly > 0;
    if (P.state === 'run') {
      collide();
      if (P.d >= lev.len) { P.state = 'win'; P.endT = 0; emit('win'); makeConfetti(); }
    } else P.endT += dt;
    if (P.state === 'win' && P.endT > 2.6 && !P.ended) { P.ended = true; finishRun(true); }
    if (P.state === 'lose' && P.endT > 1.8 && !P.ended) { P.ended = true; finishRun(false); }
    /* pièces */
    const pc = P.y + (P.slide > 0 ? 0.5 : 0.9);
    while (coinStart < lev.coins.length && lev.coins[coinStart].d < P.d - 4) coinStart++;
    for (let i = coinStart; i < lev.coins.length; i++) {
      const c = lev.coins[i]; if (c.d > P.d + 130) break; if (c.got) continue;
      const dd = c.d - P.d;
      if (P.magnet > 0 && dd > -1 && dd < 9 && Math.abs(c.x - P.x) < 5) { const k = Math.min(1, dt * 9); c.d -= dd * k; c.x += (P.x - c.x) * k; c.y += (pc - c.y) * k; }
      if (Math.abs(c.d - P.d) < 1.1 && Math.abs(c.x - P.x) < 1.3 && Math.abs(c.y - pc) < 1.5 && P.state !== 'lose') { c.got = true; P.coins += P.rain > 0 ? 3 : P.x2 > 0 ? 2 : 1; emit('coin'); }
    }
    for (const p of lev.picks) {
      if (p.got) continue; if (Math.abs(p.d - P.d) < 1.3 && Math.abs(p.x - P.x) < 1.5 && Math.abs(1.5 - pc) < 1.6 + (P.y > 0.5 ? 0.8 : 0)) {
        p.got = true; p.sp.visible = false; emit('power');
        if (p.type === 'aimant') P.magnet = POWERS.aimant.dur; else if (p.type === 'bouclier') P.shield = POWERS.bouclier.dur; else if (p.type === 'envol') { P.fly = POWERS.envol.dur; P.inv = Math.max(P.inv, POWERS.envol.dur + 0.6); } else if (p.type === 'x2') P.x2 = POWERS.x2.dur; else if (p.type === 'ralenti') P.slow = POWERS.ralenti.dur; else if (p.type === 'bottes') P.boots = POWERS.bottes.dur; else if (p.type === 'pluie') P.rain = POWERS.pluie.dur; else if (p.type === 'repousse') { C.gap += 14; C.vphase = 0; C.nextVisit = 16; C.near = 0; } else if (p.type === 'coeur') { if (P.hearts < 3) P.hearts++; else P.coins += 5; }
      }
    }
    if (P.shield > 0 && P.state === 'run') P.shield -= dt;
    /* poursuivant */
    C.nextVisit -= dt; C.near = Math.max(0, C.near - dt);
    if (C.vphase === 0 && C.nextVisit <= 0 && P.state === 'run') { C.vphase = 1; C.vt = 0; }
    if (C.vphase > 0) { C.vt += dt; if (C.vphase === 1 && C.vt > 2.4) { C.vphase = 2; C.vt = 0; } else if (C.vphase === 2 && C.vt > 3.8) { C.vphase = 3; C.vt = 0; } else if (C.vphase === 3 && C.vt > 2.4) { C.vphase = 0; C.nextVisit = 9 + Math.random() * 6; } }
    let tg = 14; if (C.vphase === 1 || C.vphase === 2) tg = 4.4; if (C.near > 0) tg = 3.0; if (P.state === 'lose') tg = 0.9; if (P.state === 'win') tg = 14;
    C.gap += (tg - C.gap) * Math.min(1, dt * 2.2);
    let cxT = P.x - 1.15; if (P.x < -2) cxT = P.x + 1.15; C.x += (cxT - C.x) * Math.min(1, dt * 4);
    P.phi += dt * (spd > 0.5 ? CADENCE : 0);
    C.phi += dt * CADENCE * (chaser.userData.cad || 1);
    spawnLive(); S.scen.update(-P.d, dt, cam, S.t);
    hudT.t -= dt; if (hudT.t <= 0) { hudT.t = 0.1; sendHud(); }
  }
  function sendHud() {
    if (!cb.onHud) return;
    cb.onHud({ hearts: P.hearts, coins: P.coins, prog: clamp(P.d / lev.len, 0, 1), powers: [['aimant', P.magnet, POWERS.aimant.dur], ['bouclier', P.shield, POWERS.bouclier.dur], ['envol', P.fly, POWERS.envol.dur], ['x2', P.x2, POWERS.x2.dur], ['ralenti', P.slow, POWERS.ralenti.dur], ['bottes', P.boots, POWERS.bottes.dur], ['pluie', P.rain, POWERS.pluie.dur]].filter(a => a[1] > 0).map(a => ({ id: a[0], f: a[1] / a[2] })), chaser: C.gap < 7 });
  }
  function finishRun(win) {
    const total = lev.totalCoins, ratio = total ? P.coins / total : 0;
    const stars = win ? 1 + (ratio >= 0.6 ? 1 : 0) + (P.hearts >= 3 ? 1 : 0) : 0;
    if (cb.onEnd) cb.onEnd({ win, stars, coins: P.coins, total, hearts: P.hearts, level: lev.li, speed: lev.speed });
  }
  function makeConfetti() {
    const n = 220, p = new Float32Array(n * 3), col = new Float32Array(n * 3), cs = ['#e24a4a', '#f2c14e', '#3f8fd8', '#4fae6a', '#e86a8a', '#ffffff'];
    for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - 0.5) * 14; p[i * 3 + 1] = 2 + Math.random() * 9; p[i * 3 + 2] = -lev.len - 8 + Math.random() * 14; const c = new THREE.Color(cs[i % 6]); col.set([c.r, c.g, c.b], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    confetti = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.28, vertexColors: true, depthWrite: false })); confetti.frustumCulled = false; scene.add(confetti);
  }
  function drawCoins() {
    if (!coinMesh || !lev) return; let n = 0; const spin = S.t * 3.2;
    for (let i = coinStart; i < lev.coins.length && n < 218; i++) {
      const c = lev.coins[i]; if (c.d > P.d + 120) break; if (c.got) continue;
      dummy.position.set(c.x, c.y, -c.d); dummy.rotation.set(Math.PI / 2, 0, 0); dummy.updateMatrix();
      const rot = new THREE.Matrix4().makeRotationY(spin + c.d * 0.35); coinMesh.setMatrixAt(n++, rot.setPosition(c.x, c.y, -c.d).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)));
    }
    coinMesh.count = n; coinMesh.instanceMatrix.needsUpdate = true;
    for (const p of lev.picks) if (p.sp && !p.got) { p.sp.position.y = 1.5 + Math.sin(S.t * 3 + p.d) * 0.18; }
    if (confetti) { const a = confetti.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let y = a.getY(i) - 0.05 * (1 + (i % 4) * 0.2); if (y < 0) y = 11; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(S.t * 2 + i) * 0.01); } a.needsUpdate = true; }
  }
  function posePlay(dt) {
    P.sk += ((P.slide > 0 ? 1 : 0) - P.sk) * Math.min(1, dt * (P.slide > 0 ? 16 : 9)); const sliding = P.sk;
    const jumpK = P.fly > 0 ? 0 : clamp((P.y - (P.grounded ? P.y : 0)) > 0 || !P.grounded ? 1 : 0, 0, 1);
    runner.position.set(P.x, P.y, -P.d); runner.rotation.set(0, -clamp(P.vx * 0.03, -0.5, 0.5), -clamp(P.vx * 0.022, -0.35, 0.35));
    P.jk = (P.jk || 0) + ((!P.grounded && P.fly <= 0 ? 1 : 0) - (P.jk || 0)) * Math.min(1, dt * 14); const air = P.jk;
    poseRunner(runner, { phi: P.phi, jump: air, ap: P.jumped ? clamp(P.airT / 0.77, 0, 1) : 0.8, land: P.land, side: clamp(P.vx / 14, -1, 1), slide: sliding, t: S.t, speed: clamp(P.speedMul, 0.3, 1), stumble: P.hitT < 0.8 && P.state === 'run' ? 1 - P.hitT / 0.8 : 0, fly: P.fly > 0 ? 1 : 0, win: P.state === 'win' && P.endT > 0.8 ? 1 : 0, tired: P.state === 'lose' ? clamp(P.endT * 2, 0, 1) : 0 });
    runner.visible = P.inv > 0 && P.state === 'run' && P.fly <= 0 ? Math.floor(S.t * 14) % 2 === 0 : true;
    shieldMesh.visible = P.shield > 0; shieldMesh.position.set(P.x, P.y + 0.95, -P.d); shieldMesh.scale.setScalar(1 + Math.sin(S.t * 6) * 0.03);
    chaser.visible = C.gap < 9; chaser.position.set(C.x, 0, -P.d + C.gap); chaser.rotation.set(0, 0, 0);
    poseChaser(chaser, C.phi, S.t, { tired: 0 });
    /* caméra */
    const cx = P.x * 0.85, shake = P.camShake > 0 ? Math.sin(S.t * 80) * 0.05 * P.camShake : 0;
    const win = P.state === 'win' ? sm(0.4, 2, P.endT) : 0;
    const camZ = -P.d + 6.4 - win * 9.6, camX = cx + 0.55 - win * 1.5, camY = 3.0 + P.y * 0.7 + shake - win * 1.4;
    cam.position.set(camX, camY, camZ); cam.lookAt(win > 0 ? P.x : cx * 0.95, 1.4 + P.y * 0.5 - win * 0.2, win > 0 ? -P.d : -P.d - 8);
    cam.fov = 58 + Math.min(10, 4 * (P.vNow ? P.vNow / 14 : 0)) + (P.fly > 0 ? 3 : 0); cam.updateProjectionMatrix();
    sun.position.set(P.x + THEMES[S.themeIdx].sun[2][0], THEMES[S.themeIdx].sun[2][1], -P.d + THEMES[S.themeIdx].sun[2][2]); sun.target.position.set(P.x, 0, -P.d - 2); sun.target.updateMatrixWorld();
    syncDyn(); drawCoins();
  }
  function poseMenu(dt) {
    S.mz -= dt * 8; S.lastZ = S.mz; P.phi += dt * 12;
    const z = S.mz; runner.position.set(0, 0, z); runner.rotation.set(0, 0, 0);
    poseRunner(runner, { phi: P.phi, t: S.t, speed: 0.9 });
    chaser.visible = true; chaser.position.set(-1.6, 0, z + 4.2); chaser.rotation.set(0, 0, 0); C.phi += dt * 12;
    poseChaser(chaser, C.phi * 1.1, S.t, {});
    S.scen.update(z, dt, cam, S.t, true);
    const asp = S.w / S.h, dist = asp < 0.7 ? 5.6 : 4.6;
    const a = S.t * 0.25; cam.position.set(2.4 + Math.sin(a) * 0.8, 1.55, z - dist); cam.lookAt(-0.2, asp < 0.7 ? 0.2 : 0.7, z + 0.4); cam.fov = 55; cam.updateProjectionMatrix();
    sun.position.set(-8, 14, z + 6); sun.target.position.set(0, 0, z); sun.target.updateMatrixWorld();
  }
  /* pose d’un poursuivant selon son type d’animation */
  function poseChaser(c, phi, t, extra) {
    const k = c.userData.kind;
    if (k === 'dog') poseDog(c, { phi, t: t + 2 }); else if (k === 'drone') poseDrone(c, { t }); else poseRunner(c, Object.assign({ phi: phi * 0.95 + 1.3, t: t + 3, speed: 1 }, extra));
  }
  function poseShop(dt) {
    const z = S.mz, sub = shop.subject === 'chaser' ? chaser : runner, other = sub === runner ? chaser : runner;
    other.visible = false; sub.visible = true; sub.scale.setScalar(sub === chaser ? chaser.userData.sc : 1);
    shop.yawNow += (shop.yaw - shop.yawNow) * Math.min(1, dt * 4);
    const sway = Math.sin(S.t * 0.6) * 0.45;
    sub.position.set(0, 0, z); sub.rotation.set(0, shop.yawNow + sway, 0); platform.position.set(0, -0.06, z);
    if (sub.userData.kind === 'dog') poseDog(sub, { phi: S.t * 3, t: S.t }); else if (sub.userData.kind === 'drone') poseDrone(sub, { t: S.t }); else poseRunner(sub, { phi: S.t * 4, idle: 1, t: S.t, speed: 0.4 });
    const asp = S.w / S.h, f = shop.focus, k = asp < 0.7 ? 1.25 : 1;
    const V = { body: [1.2, 4.1 * k, 0.6], head: [1.72, 2.2 * k, 1.36], feet: [0.5, 2.1 * k, 0.12], back: [1.2, 4.1 * k, 0.6], chaser: [chaser.userData.cy * chaser.userData.sc * (chaser.userData.kind === 'drone' ? 1 : 1) + 0.3, Math.max(2.6, chaser.userData.hh * chaser.userData.sc * 3.4) * k, chaser.userData.cy * (chaser.userData.kind === 'drone' ? 1 : chaser.userData.sc)], level: [1.9, 6.6 * k, 1.0] }[sub === chaser ? 'chaser' : f] || [1.2, 4.1, 0.6];
    cam.position.set(0, V[0], z - V[1]); cam.lookAt(0, V[2], z); cam.fov = 40; cam.updateProjectionMatrix();
    S.scen.update(z, dt, cam, S.t, true);
    sun.position.set(-5, 8, z - 6); sun.target.position.set(0, 0, z); sun.target.updateMatrixWorld();
  }
  let last = performance.now(), raf = 0, running = true;
  function frame(now) {
    raf = requestAnimationFrame(frame); if (!running) return;
    let dt = Math.min(0.05, (now - last) / 1000); last = now; S.t += dt; if (!S.scen) return;
    if (S.mode === 'play') {
      if (!S.paused) { const n = Math.ceil(dt / (1 / 60)); for (let i = 0; i < n; i++) stepPlay(dt / n); }
      posePlay(dt);
    } else if (S.mode === 'menu') poseMenu(dt); else if (S.mode === 'shop') poseShop(dt);
    renderer.render(scene, cam);
    /* qualité automatique */
    if (S.quality === 'auto' && dt > 0) { S.fpsAcc += dt; S.fpsN++; if (S.fpsAcc > 2) { const fps = S.fpsN / S.fpsAcc; S.fpsAcc = 0; S.fpsN = 0; if (fps < 34 && S.q > 0) { S.lowCount++; if (S.lowCount >= 2) { S.q--; S.lowCount = 0; applyQuality(); } } else S.lowCount = 0; } }
  }
  raf = requestAnimationFrame(frame);
  function pause(b) { S.paused = b; }
  return {
    setLook, setChaser, setKeys, menu, shopMode, shopView, startLevel, input, resize, setQuality, pause, renderer, scene, cam,
    stop() { running = false; }, go() { running = true; last = performance.now(); },
    _s: () => ({ S, P, C, lev, live }), _step: dt => stepPlay(dt), POWERS
  };
}
