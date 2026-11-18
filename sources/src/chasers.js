/* Projet : La fuite d’Abel  ·  Version : 1.12.0  ·  Date : 18/11/2026
   Auteur : Tom Rougeaud  ·  Licence : CC BY-NC 4.0
   Réalisé avec l’aide de l’IA : Claude Sonnet 5.5 (Anthropic) */
/* ===== SECTION : poursuivants =====
   Chaque poursuivant est un groupe 3D construit à partir du coureur (buildRunner) ou du chien (buildDog), complété par des accessoires.
   userData : kind = 'runner' | 'dog' | 'drone' (type d’animation), sc = échelle, cad = rapidité des pas, cy = hauteur du centre (caméra de la boutique). */
import * as THREE from 'three';
import { buildRunner, buildDog, PRESET, mat, mesh, ell } from './char.js';

/* identifiants dans l’ordre de la boutique */
export const CHASER_IDS = ['garde', 'chien', 'robot', 'drone', 'mascotte', 'fantome', 'taureau', 'golem', 'ecureuil', 'noel', 'sprinter', 'sorciere', 'cuisinier', 'pirate', 'ninja', 'viking', 'sherif', 'momie', 'vampire', 'alien', 'chevalier', 'dino'];

const put = (parent, o, x, y, z, rx = 0, ry = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); parent.add(o); return o; };
const box = (w, h, d, m) => mesh(new THREE.BoxGeometry(w, h, d), m);
const cone = (r, h, m, seg = 14) => mesh(new THREE.ConeGeometry(r, h, seg), m);
const tag = (g, kind, sc, cad = 1, cy = 0.95, hh = 1.05) => { Object.assign(g.userData, { kind, sc, cad, cy, hh }); return g; }; /* cy : hauteur du centre, hh : demi-hauteur (cadrage de la boutique) */

export function buildChaser(type) {
  /* ---- ceux qui existaient ---- */
  if (type === 'chien') return tag(buildDog(), 'dog', 1.15, 1.2, 0.5, 0.95);
  if (type === 'garde') return tag(buildRunner(PRESET.garde), 'runner', 1.08);

  /* ---- robot carré : blocs métalliques ---- */
  if (type === 'robot') {
    const g = buildRunner(PRESET.robot), B = g.userData.B, metal = mat('#8d9aa8', 0.4, 0.7), dark = mat('#2a323c', 0.5, 0.3);
    B.chest.children[0].visible = false; B.head.children[0].visible = false; B.head.children[1].visible = false;
    put(B.chest, box(0.5, 0.58, 0.32, metal), 0, 0.2, 0); put(B.chest, box(0.2, 0.2, 0.02, dark), 0, 0.22, -0.165);
    put(B.chest, box(0.14, 0.14, 0.14, metal), -0.3, 0.38, 0); put(B.chest, box(0.14, 0.14, 0.14, metal), 0.3, 0.38, 0);
    put(B.head, box(0.26, 0.26, 0.26, metal), 0, 0.01, 0); put(B.head, box(0.21, 0.07, 0.02, dark), 0, 0.03, -0.135);
    put(B.head, box(0.04, 0.1, 0.04, dark), 0, 0.19, 0);
    return tag(g, 'runner', 1.12, 0.9);
  }

  /* ---- drone de surveillance : vole au-dessus de la route ---- */
  if (type === 'drone') {
    const g = new THREE.Group(), metal = mat('#4b5563', 0.4, 0.6), dark = mat('#20262e', 0.5, 0.3), eye = mat('#c0583f', 0.4, 0, '#c0583f', 0.6);
    const body = new THREE.Group(); body.position.y = 1.7; g.add(body);
    put(body, ell(0.32, 0.14, 0.32, metal, 16), 0, 0, 0); put(body, ell(0.1, 0.1, 0.06, eye, 12), 0, -0.02, -0.3);
    const rotors = [];
    for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) {
      put(body, box(Math.hypot(x, z) * 1.0, 0.04, 0.05, dark), x / 2, 0.02, z / 2, 0, Math.atan2(-z, x), 0);
      const r = put(body, mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.015, 18), mat('#9aa3ad', 0.5, 0.2)), x, 0.09, z); r.material.transparent = true; r.material.opacity = 0.55; rotors.push(r);
    }
    g.userData = { B: { body, rotors }, kind: 'drone', sc: 1, cad: 1, cy: 1.7, hh: 0.9 }; return g;
  }

  /* ---- mascotte géante : grosse peluche ronde ---- */
  if (type === 'mascotte') {
    const g = buildRunner({ skin: '#d9a441', hairStyle: 'chauve', top: 'sweat', topColor: '#c8633f', bottom: 'long', bottomColor: '#a8502f', shoes: '#f3ecdc', hat: null, glasses: null, back: null, neck: null }), B = g.userData.B;
    B.head.scale.setScalar(2.1); const fur = mat('#d9a441', 0.9), pale = mat('#f3ecdc', 0.9);
    put(B.head, ell(0.04, 0.04, 0.025, fur, 12), -0.08, 0.1, 0); put(B.head, ell(0.04, 0.04, 0.025, fur, 12), 0.08, 0.1, 0);
    put(B.head, ell(0.07, 0.05, 0.04, pale, 12), 0, -0.04, -0.085); put(B.chest, ell(0.2, 0.22, 0.12, pale, 14), 0, 0.12, -0.1);
    return tag(g, 'runner', 1.35, 0.85);
  }

  /* ---- fantôme : translucide ---- */
  if (type === 'fantome') {
    const g = buildRunner({ skin: '#e9eef4', hairStyle: 'chauve', top: 'tshirt', topColor: '#dfe6ee', bottom: 'long', bottomColor: '#dfe6ee', shoes: '#dfe6ee', hat: null, glasses: null, back: null, neck: null });
    g.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.55; o.material.depthWrite = false; o.castShadow = false; } });
    const B = g.userData.B, hole = mat('#20262e', 0.9); put(B.head, ell(0.02, 0.03, 0.01, hole, 8), -0.035, 0.015, -0.098); put(B.head, ell(0.02, 0.03, 0.01, hole, 8), 0.035, 0.015, -0.098);
    return tag(g, 'runner', 1.12, 0.9);
  }

  /* ---- taureau : massif, tout noir, bosse sur le garrot, grandes cornes courbes, anneau au nez ---- */
  if (type === 'taureau') {
    const g = buildDog({ fur: '#16141a', light: '#26222b', tongue: false }), B = g.userData.B, horn = mat('#efe6d2', 0.55), black = mat('#16141a', 0.85), gold = mat('#d6a93c', 0.4, 0.6);
    B.neckG.scale.set(1.45, 1.3, 1.35); B.head.scale.setScalar(1.45); B.ears.forEach(e => e.g.scale.setScalar(0.6));
    for (const J of [B.fl, B.fr, B.bl, B.br]) { J.hip.scale.set(1.5, 0.85, 1.5); }
    B.body.children[0].scale.multiply(new THREE.Vector3(1.3, 1.35, 1.05)); B.body.children[1].scale.multiply(new THREE.Vector3(1.25, 1.25, 1.1)); /* torse et poitrail plus massifs */
    put(B.body, ell(0.25, 0.2, 0.22, black, 14), 0, 0.2, -0.2); /* bosse du garrot */
    for (const s of [-1, 1]) { /* corne en deux segments : vers l’extérieur puis vers le haut */
      put(B.head, cone(0.05, 0.16, horn, 12), s * 0.14, 0.09, -0.02, 0, 0, -s * 1.2);
      put(B.head, cone(0.036, 0.13, horn, 12), s * 0.235, 0.15, -0.03, -0.25, 0, s * 0.35);
    }
    put(B.head, mesh(new THREE.TorusGeometry(0.035, 0.008, 8, 16), gold), 0, -0.07, -0.22, 0, 0, 0);
    B.tail.scale.set(0.7, 1, 0.7); put(B.tail, ell(0.045, 0.07, 0.045, black, 8), 0, 0.3, 0);
    return tag(g, 'dog', 1.85, 1.0, 0.55, 0.85);
  }

  /* ---- golem de pierre ---- */
  if (type === 'golem') {
    const g = buildRunner({ skin: '#8a8f94', hairStyle: 'chauve', top: 'sweat', topColor: '#7a7f84', bottom: 'long', bottomColor: '#6b7075', shoes: '#55595d', hat: null, glasses: null, back: null, neck: null }), B = g.userData.B;
    const rock = mat('#777c82', 0.95), moss = mat('#5f7a4c', 0.95);
    put(B.chest, ell(0.13, 0.11, 0.12, rock, 8), -0.26, 0.4, 0); put(B.chest, ell(0.13, 0.11, 0.12, rock, 8), 0.26, 0.4, 0);
    put(B.chest, ell(0.12, 0.05, 0.08, moss, 8), 0.2, 0.46, -0.02); put(B.head, ell(0.05, 0.03, 0.05, moss, 8), -0.04, 0.1, 0);
    B.chest.scale.set(1.2, 1, 1.2);
    return tag(g, 'runner', 1.6, 0.8);
  }

  /* ---- écureuil géant : fin, grosse tête ronde, énorme queue en panache dressée ---- */
  if (type === 'ecureuil') {
    const g = buildDog({ fur: '#b5652e', light: '#f1e2c4', tongue: false }), B = g.userData.B, fur = mat('#b5652e', 0.9), tip = mat('#e2a15f', 0.9), cream = mat('#f1e2c4', 0.9);
    B.body.children[0].scale.multiply(new THREE.Vector3(0.85, 0.9, 0.9)); B.head.scale.setScalar(1.25); B.head.children[1].scale.multiply(new THREE.Vector3(0.7, 0.7, 0.45)); /* ell() fixe déjà l’échelle : on multiplie */
    for (const s of [-1, 1]) { put(B.head, cone(0.03, 0.12, fur, 8), s * 0.075, 0.16, 0.0, 0, 0, -s * 0.15); put(B.head, ell(0.012, 0.02, 0.012, mat('#6b3a1a', 0.9), 6), s * 0.082, 0.235, 0.0); put(B.head, ell(0.04, 0.04, 0.03, cream, 8), s * 0.07, -0.04, -0.1); } /* oreilles à pinceau, joues */
    B.tail.children[0].visible = false;
    put(B.tail, ell(0.1, 0.22, 0.09, fur, 12), 0, 0.2, 0.06, -0.25, 0, 0); put(B.tail, ell(0.12, 0.2, 0.1, fur, 12), 0, 0.5, 0.0, -0.45, 0, 0); put(B.tail, ell(0.1, 0.17, 0.09, tip, 12), 0, 0.74, -0.1, -0.7, 0, 0);
    return tag(g, 'dog', 1.05, 1.6, 0.6, 1.0);
  }

  /* ---- Père Noël : costume rouge très fourré de blanc ---- */
  if (type === 'noel') {
    const g = buildRunner({ skin: '#e8b99a', hairStyle: 'court', hair: '#f2f2f2', top: 'sweat', topColor: '#b5323a', bottom: 'long', bottomColor: '#b5323a', shoes: '#1c1a1a', hat: 'bonnet', hatColor: '#b5323a', glasses: null, back: 'sac', backColor: '#8a5a3a', neck: null }), B = g.userData.B;
    const white = mat('#f6f3ec', 1), red = mat('#b5323a', 0.9), black = mat('#1c1a1a', 0.6), ring = (r, t) => mesh(new THREE.TorusGeometry(r, t, 10, 24), white);
    /* barbe, moustache, sourcils : grosse moumoute blanche */
    put(B.head, ell(0.098, 0.12, 0.07, white, 14), 0, -0.1, -0.06); put(B.head, ell(0.05, 0.026, 0.026, white, 8), -0.035, -0.04, -0.105); put(B.head, ell(0.05, 0.026, 0.026, white, 8), 0.035, -0.04, -0.105);
    put(B.head, ell(0.03, 0.012, 0.012, white, 8), -0.034, 0.045, -0.092); put(B.head, ell(0.03, 0.012, 0.012, white, 8), 0.034, 0.045, -0.092);
    /* bonnet : gros bandeau de fourrure et pompon */
    put(B.head, ring(0.1, 0.034), 0, 0.06, 0, Math.PI / 2, 0, 0); put(B.head, ell(0.04, 0.04, 0.04, white, 12), 0.02, 0.27, 0.1);
    /* col, ventre, ceinture, bande de fourrure sur le devant, bas de la veste, poignets, bas de pantalon, gants */
    put(B.chest, ring(0.13, 0.04), 0, 0.43, 0, Math.PI / 2, 0, 0); put(B.chest, ell(0.2, 0.2, 0.16, red, 14), 0, 0.08, -0.06);
    put(B.chest, box(0.09, 0.62, 0.03, white), 0, 0.17, -0.2); put(B.chest, ring(0.2, 0.034), 0, 0.02, -0.04, Math.PI / 2, 0, 0);
    put(B.chest, mesh(new THREE.TorusGeometry(0.2, 0.024, 8, 24), black), 0, 0.1, -0.05, Math.PI / 2, 0, 0); put(B.chest, box(0.07, 0.06, 0.02, mat('#d6a93c', 0.4, 0.5)), 0, 0.1, -0.245);
    put(B.pelvis, ring(0.2, 0.05), 0, -0.1, 0, Math.PI / 2, 0, 0);
    for (const k of ['L', 'R']) {
      put(B['el' + k], ring(0.04, 0.026), 0, -0.23, 0, Math.PI / 2, 0, 0); put(B['sh' + k], ell(0.07, 0.06, 0.07, white, 10), 0, 0.02, 0);
      put(B['hd' + k], ell(0.042, 0.052, 0.04, black, 10), 0, -0.03, 0); put(B['ankle' + k], ring(0.062, 0.03), 0, 0.06, 0, Math.PI / 2, 0, 0);
    }
    return tag(g, 'runner', 1.15, 0.95);
  }

  /* ---- athlète sprinter : débardeur, short, dossard, bandeau, bracelets éponge ---- */
  if (type === 'sprinter') {
    const g = buildRunner({ skin: '#a9714b', hairStyle: 'court', hair: '#1c1a1a', top: 'tshirt', topColor: '#d9d4c6', bottom: 'short', bottomColor: '#2a5f9a', shoes: '#c0583f', hat: null, glasses: null, back: null, neck: null }), B = g.userData.B;
    const red = mat('#c0583f', 0.7), white = mat('#f4f1ea', 0.9), dark = mat('#1c1a1a', 0.7);
    put(B.head, mesh(new THREE.TorusGeometry(0.094, 0.016, 8, 24), red), 0, 0.045, 0, Math.PI / 2, 0, 0.05);
    put(B.chest, box(0.2, 0.2, 0.012, white), 0, 0.2, -0.178); put(B.chest, box(0.02, 0.1, 0.014, dark), -0.03, 0.2, -0.186); put(B.chest, box(0.09, 0.02, 0.014, dark), 0.02, 0.24, -0.186); put(B.chest, box(0.09, 0.02, 0.014, dark), 0.02, 0.16, -0.186);
    put(B.chest, box(0.4, 0.05, 0.3, red), 0, 0.36, 0); /* épaules : bretelles du débardeur */
    for (const k of ['L', 'R']) { put(B['el' + k], mesh(new THREE.TorusGeometry(0.04, 0.02, 8, 16), white), 0, -0.22, 0, Math.PI / 2, 0, 0); put(B['sh' + k], mesh(new THREE.TorusGeometry(0.05, 0.016, 8, 16), red), 0, -0.1, 0, Math.PI / 2, 0, 0); }
    return tag(g, 'runner', 1.05, 1.35);
  }

  /* ---- sorcière : chapeau pointu et robe ---- */
  if (type === 'sorciere') {
    const g = buildRunner({ skin: '#7aa561', hairStyle: 'chauve', top: 'tshirt', topColor: '#4a2a6a', bottom: 'long', bottomColor: '#3a2056', shoes: '#1c1a1a', hat: null, glasses: null, back: null, neck: null }), B = g.userData.B;
    const black = mat('#1d1a26', 0.9), purple = mat('#4a2a6a', 0.9);
    put(B.pelvis, mesh(new THREE.CylinderGeometry(0.17, 0.36, 0.62, 18), purple), 0, -0.3, 0);
    put(B.head, mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.012, 22), black), 0, 0.08, 0); put(B.head, cone(0.115, 0.42, black, 18), 0, 0.3, 0, -0.1, 0, 0.08);
    put(B.head, mesh(new THREE.TorusGeometry(0.115, 0.014, 6, 20), mat('#b8862c', 0.6)), 0, 0.1, 0, Math.PI / 2, 0, 0);
    put(B.head, cone(0.014, 0.07, mat('#7aa561', 0.7), 8), 0, -0.015, -0.12, -Math.PI / 2, 0, 0); put(B.head, ell(0.09, 0.09, 0.05, black, 10), 0, 0.0, 0.08);
    return tag(g, 'runner', 1.1);
  }

  /* ---- 10 nouveaux poursuivants (coureur habillé + accessoires) ---- */
  const base = (o) => Object.assign({ hairStyle: 'chauve', hair: '#1c1a1a', top: 'tshirt', bottom: 'long', shoes: '#1c1a1a', hat: null, glasses: null, back: null, neck: null }, o);
  const eyes = (H, col, z = -0.098, x = 0.035, y = 0.02) => { for (const s of [-1, 1]) put(H, ell(0.016, 0.02, 0.01, col, 8), s * x, y, z); };
  const ringM = (r, t, m) => mesh(new THREE.TorusGeometry(r, t, 8, 22), m);

  /* cuisinier : toque, tablier, moustache, rouleau à pâtisserie */
  if (type === 'cuisinier') {
    const g = buildRunner(base({ skin: '#d9a47e', top: 'tshirt', topColor: '#f4f1ea', bottomColor: '#3a3f4a', shoes: '#2a2a2a' })), B = g.userData.B;
    const white = mat('#fbf9f3', 0.9), cream = mat('#ece6d6', 0.9), dark = mat('#2a1c14', 0.9), wood = mat('#b98a52', 0.8);
    put(B.head, mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.14, 18), white), 0, 0.17, 0); put(B.head, ell(0.13, 0.08, 0.13, white, 14), 0, 0.27, 0); put(B.head, ringM(0.1, 0.012, cream), 0, 0.11, 0, Math.PI / 2, 0, 0);
    put(B.head, ell(0.05, 0.02, 0.02, dark, 8), -0.03, -0.045, -0.1, 0, 0, 0.3); put(B.head, ell(0.05, 0.02, 0.02, dark, 8), 0.03, -0.045, -0.1, 0, 0, -0.3);
    put(B.chest, box(0.34, 0.5, 0.03, cream), 0, 0.1, -0.19); put(B.pelvis, box(0.38, 0.3, 0.03, cream), 0, -0.1, -0.17); put(B.chest, box(0.04, 0.2, 0.02, cream), -0.1, 0.4, -0.12);
    put(B.hdR, mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 10), wood), 0, -0.04, 0, 0, 0, Math.PI / 2);
    return tag(g, 'runner', 1.1, 0.95);
  }
  /* pirate : bicorne à tête de mort, cache-œil, ceinture rouge, crochet */
  if (type === 'pirate') {
    const g = buildRunner(base({ skin: '#d4a07a', hairStyle: 'court', hair: '#2a1c14', topColor: '#e8e2d0', bottomColor: '#3a2a20', shoes: '#1c1a1a' })), B = g.userData.B;
    const black = mat('#1a1a1f', 0.8), red = mat('#a8353d', 0.9), white = mat('#f4f1ea', 0.9), metal = mat('#9aa3ad', 0.4, 0.7);
    put(B.head, ell(0.21, 0.05, 0.12, black, 14), 0, 0.12, 0, 0, 0, 0.05); put(B.head, ell(0.1, 0.07, 0.1, black, 12), 0, 0.15, 0); put(B.head, ell(0.025, 0.025, 0.01, white, 8), 0, 0.12, -0.115);
    put(B.head, ell(0.032, 0.032, 0.012, black, 10), -0.035, 0.022, -0.1); put(B.head, box(0.2, 0.012, 0.01, black), 0, 0.05, -0.095, 0, 0, 0.35);
    put(B.head, ell(0.09, 0.04, 0.05, black, 10), 0, -0.07, -0.06);
    put(B.pelvis, ringM(0.2, 0.05, red), 0, -0.02, 0, Math.PI / 2, 0, 0); put(B.chest, box(0.1, 0.5, 0.02, black), 0.12, 0.2, -0.18);
    put(B.hdR, cone(0.018, 0.12, metal, 8), 0, -0.1, 0); put(B.hdR, ringM(0.035, 0.01, metal), 0, -0.17, 0);
    return tag(g, 'runner', 1.1, 1.0);
  }
  /* ninja : tout noir, bandeau rouge qui flotte, katana dans le dos */
  if (type === 'ninja') {
    const g = buildRunner(base({ skin: '#1d2028', top: 'sweat', topColor: '#1b1d24', bottomColor: '#15171d', shoes: '#101216', neck: 'echarpe', neckColor: '#a8353d' })), B = g.userData.B;
    const red = mat('#a8353d', 0.85), dark = mat('#1b1d24', 0.7), skin = mat('#e0b08a', 0.85), steel = mat('#b8c0c8', 0.35, 0.8);
    put(B.head, box(0.17, 0.045, 0.02, skin), 0, 0.03, -0.096); eyes(B.head, dark, -0.108, 0.04, 0.032);
    put(B.head, ringM(0.1, 0.02, red), 0, 0.075, 0, Math.PI / 2, 0, 0.04); put(B.head, box(0.03, 0.2, 0.012, red), -0.03, 0.04, 0.2, 1.2, 0, 0.1); put(B.head, box(0.03, 0.18, 0.012, red), 0.03, 0.02, 0.2, 1.1, 0, -0.1);
    put(B.chest, box(0.035, 0.74, 0.035, steel), 0, 0.15, 0.17, 0, 0, 0.7); put(B.chest, box(0.05, 0.16, 0.05, dark), 0.22, 0.45, 0.17, 0, 0, 0.7);
    return tag(g, 'runner', 1.08, 1.25);
  }
  /* viking : casque à cornes, grande barbe blonde, tresses, col de fourrure */
  if (type === 'viking') {
    const g = buildRunner(base({ skin: '#e0b08a', hairStyle: 'court', hair: '#c58b3a', top: 'sweat', topColor: '#7a5a3a', bottomColor: '#5a4a38', shoes: '#3a2a1c' })), B = g.userData.B;
    const steel = mat('#9aa3ad', 0.4, 0.7), horn = mat('#efe6d2', 0.55), blond = mat('#c58b3a', 0.9), fur = mat('#5e4a36', 1), leather = mat('#3a2a1c', 0.8), gold = mat('#d6a93c', 0.4, 0.6);
    put(B.head, ell(0.115, 0.075, 0.115, steel, 14), 0, 0.07, 0); put(B.head, ringM(0.105, 0.014, steel), 0, 0.045, 0, Math.PI / 2, 0, 0); put(B.head, box(0.02, 0.1, 0.012, steel), 0, 0.0, -0.115);
    for (const s of [-1, 1]) { put(B.head, cone(0.03, 0.14, horn, 10), s * 0.13, 0.08, 0, 0, 0, -s * 1.1); put(B.head, cone(0.022, 0.13, horn, 10), s * 0.2, 0.16, 0, 0, 0, -s * 0.2); put(B.head, ell(0.012, 0.1, 0.012, blond, 8), s * 0.07, -0.17, -0.08); }
    put(B.head, ell(0.1, 0.13, 0.075, blond, 14), 0, -0.1, -0.055); put(B.head, ell(0.05, 0.022, 0.022, blond, 8), -0.035, -0.04, -0.105); put(B.head, ell(0.05, 0.022, 0.022, blond, 8), 0.035, -0.04, -0.105);
    put(B.chest, ringM(0.14, 0.045, fur), 0, 0.42, 0, Math.PI / 2, 0, 0); put(B.pelvis, ringM(0.2, 0.025, leather), 0, 0.02, 0, Math.PI / 2, 0, 0); put(B.pelvis, box(0.06, 0.06, 0.02, gold), 0, 0.02, -0.2);
    return tag(g, 'runner', 1.2, 0.9);
  }
  /* shérif : grand chapeau de cowboy, gilet, étoile, moustache, foulard */
  if (type === 'sherif') {
    const g = buildRunner(base({ skin: '#c98f66', hairStyle: 'court', hair: '#3a2a1c', topColor: '#d9c9a3', bottomColor: '#3a5a7a', shoes: '#4a3220', neck: 'echarpe', neckColor: '#a8353d' })), B = g.userData.B;
    const tan = mat('#a9824a', 0.9), band = mat('#3a2a1c', 0.8), vest = mat('#6a4a2c', 0.9), gold = mat('#d6a93c', 0.4, 0.6), dark = mat('#2a1c14', 0.9);
    put(B.head, mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.014, 24), tan), 0, 0.09, 0); put(B.head, mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.13, 18), tan), 0, 0.16, 0); put(B.head, ringM(0.105, 0.012, band), 0, 0.12, 0, Math.PI / 2, 0, 0);
    put(B.head, ell(0.055, 0.02, 0.02, dark, 8), -0.03, -0.045, -0.1, 0, 0, 0.35); put(B.head, ell(0.055, 0.02, 0.02, dark, 8), 0.03, -0.045, -0.1, 0, 0, -0.35);
    put(B.chest, box(0.1, 0.48, 0.03, vest), -0.11, 0.17, -0.185); put(B.chest, box(0.1, 0.48, 0.03, vest), 0.11, 0.17, -0.185);
    put(B.chest, box(0.06, 0.06, 0.012, gold), 0.12, 0.3, -0.205, 0, 0, Math.PI / 4); put(B.chest, box(0.06, 0.06, 0.012, gold), 0.12, 0.3, -0.205);
    put(B.pelvis, ringM(0.2, 0.03, band), 0, 0.0, 0, Math.PI / 2, 0, 0); put(B.pelvis, box(0.07, 0.07, 0.025, gold), 0, 0.0, -0.2);
    return tag(g, 'runner', 1.1, 1.0);
  }
  /* momie : bandelettes enroulées partout, yeux dans l’ombre, bout de tissu qui pend */
  if (type === 'momie') {
    const g = buildRunner(base({ skin: '#d9ccab', top: 'tshirt', topColor: '#d9ccab', bottomColor: '#d2c4a0', shoes: '#cdbf9b' })), B = g.userData.B;
    const wrap = mat('#e6dcc0', 1), shade = mat('#9d9070', 1), dark = mat('#1c1a1a', 0.9), white = mat('#f4f1ea', 0.9);
    for (const y of [0.0, 0.07, 0.14]) put(B.head, ringM(0.104 - 0.006 * Math.abs(y - 0.07) * 4, 0.012, wrap), 0, y - 0.035, 0, Math.PI / 2, 0, y * 0.5);
    put(B.head, box(0.16, 0.035, 0.02, dark), 0, 0.03, -0.098); eyes(B.head, white, -0.108, 0.035, 0.032);
    for (const y of [0.02, 0.14, 0.26, 0.36]) put(B.chest, ringM(0.2, 0.015, wrap), 0, y, 0, Math.PI / 2, 0, 0.1);
    for (const k of ['L', 'R']) { put(B['el' + k], ringM(0.052, 0.014, wrap), 0, -0.1, 0, Math.PI / 2, 0, 0); put(B['sh' + k], ringM(0.058, 0.014, wrap), 0, -0.08, 0, Math.PI / 2, 0, 0); put(B['ankle' + k], ringM(0.06, 0.014, wrap), 0, 0.05, 0, Math.PI / 2, 0, 0); put(B['knee' + k], ringM(0.07, 0.014, wrap), 0, 0.1, 0, Math.PI / 2, 0, 0); }
    put(B.chest, box(0.05, 0.4, 0.012, shade), 0.22, 0.2, 0, 0.1, 0, 0.12);
    return tag(g, 'runner', 1.1, 0.8);
  }
  /* vampire : peau pâle, cape rouge sombre, haut col, crocs */
  if (type === 'vampire') {
    const g = buildRunner(base({ skin: '#e6e1e8', hairStyle: 'court', hair: '#15121a', topColor: '#2a1830', bottomColor: '#1c1626', shoes: '#101014', back: 'cape', backColor: '#7a1f2c' })), B = g.userData.B;
    const black = mat('#15121a', 0.9), white = mat('#fbf9f3', 0.8), red = mat('#7a1f2c', 0.8);
    put(B.chest, box(0.2, 0.2, 0.025, black), -0.1, 0.46, 0.09, 0, 0, 0.3); put(B.chest, box(0.2, 0.2, 0.025, black), 0.1, 0.46, 0.09, 0, 0, -0.3); put(B.chest, box(0.12, 0.2, 0.025, red), 0, 0.46, -0.1, 0, 0, 0);
    for (const s of [-1, 1]) put(B.head, cone(0.01, 0.035, white, 8), s * 0.02, -0.075, -0.1, Math.PI, 0, 0);
    eyes(B.head, red, -0.098, 0.035, 0.022); put(B.head, ell(0.03, 0.04, 0.012, black, 8), 0, 0.12, -0.085, 0, 0, 0);
    return tag(g, 'runner', 1.1, 0.95);
  }
  /* alien : grosse tête verte, grands yeux noirs, deux antennes, combinaison argentée */
  if (type === 'alien') {
    const g = buildRunner(base({ skin: '#86b872', topColor: '#9aa6b4', bottomColor: '#6b7a8e', shoes: '#3a4452' })), B = g.userData.B;
    const black = mat('#101216', 0.3, 0.2), tipM = mat('#c0583f', 0.5, 0, '#c0583f', 0.4), green = mat('#86b872', 0.8);
    B.head.scale.set(1.35, 1.7, 1.35);
    for (const s of [-1, 1]) { put(B.head, ell(0.04, 0.062, 0.02, black, 12), s * 0.047, 0.0, -0.095, 0, 0, s * 0.45); put(B.head, mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 6), green), s * 0.045, 0.19, 0, 0, 0, -s * 0.25); put(B.head, ell(0.022, 0.022, 0.022, tipM, 8), s * 0.082, 0.27, 0); }
    return tag(g, 'runner', 1.12, 1.0);
  }
  /* chevalier : armure d’acier, casque à plumet rouge, bouclier */
  if (type === 'chevalier') {
    const g = buildRunner(base({ skin: '#8d98a6', top: 'sweat', topColor: '#8d98a6', bottomColor: '#7b8694', shoes: '#4a5260' })), B = g.userData.B;
    const steel = mat('#aeb8c4', 0.35, 0.8), dark = mat('#20262e', 0.6), red = mat('#a8353d', 0.85), gold = mat('#d6a93c', 0.4, 0.6);
    put(B.head, ell(0.125, 0.13, 0.125, steel, 16), 0, 0.02, 0); put(B.head, box(0.15, 0.025, 0.02, dark), 0, 0.03, -0.12); put(B.head, box(0.02, 0.12, 0.02, dark), 0, -0.02, -0.12);
    put(B.head, ell(0.04, 0.09, 0.14, red, 10), 0, 0.18, 0.02, 0.3, 0, 0);
    put(B.chest, ell(0.2, 0.24, 0.15, steel, 14), 0, 0.2, -0.06); put(B.chest, ringM(0.13, 0.04, steel), 0, 0.42, 0, Math.PI / 2, 0, 0);
    for (const k of ['L', 'R']) { put(B['sh' + k], ell(0.085, 0.07, 0.085, steel, 10), 0, 0.03, 0); put(B['knee' + k], ell(0.06, 0.05, 0.06, steel, 8), 0, 0, -0.04); }
    put(B.elL, mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 22), mat('#2f4468', 0.7)), -0.1, -0.1, -0.04, 0, 0, Math.PI / 2); put(B.elL, mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 14), gold), -0.12, -0.1, -0.04, 0, 0, Math.PI / 2);
    return tag(g, 'runner', 1.15, 0.85);
  }
  /* dinosaure : peau verte, grosse tête à crocs, crête dorsale, longue queue */
  if (type === 'dino') {
    const g = buildRunner(base({ skin: '#6fa05a', topColor: '#6fa05a', bottomColor: '#5b8a4a', shoes: '#4a7a3c' })), B = g.userData.B;
    const green = mat('#6fa05a', 0.85), dgreen = mat('#58844a', 0.85), spike = mat('#d9a441', 0.8), white = mat('#fbf9f3', 0.8), yellow = mat('#e2c04a', 0.5);
    B.head.scale.setScalar(1.5); put(B.head, ell(0.085, 0.055, 0.13, green, 12), 0, -0.045, -0.14); put(B.head, ell(0.08, 0.02, 0.1, dgreen, 10), 0, -0.095, -0.13);
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) put(B.head, cone(0.008, 0.03, white, 6), s * 0.045, -0.083, -0.1 - i * 0.04, Math.PI, 0, 0);
    for (const s of [-1, 1]) { put(B.head, ell(0.022, 0.022, 0.012, yellow, 8), s * 0.06, 0.05, -0.09); put(B.head, ell(0.01, 0.015, 0.008, mat('#101216', 0.5), 6), s * 0.06, 0.05, -0.098); }
    for (let i = 0; i < 5; i++) put(B.chest, cone(0.045 - i * 0.004, 0.14, spike, 8), 0, 0.42 - i * 0.1, 0.14, 0.5, 0, 0);
    put(B.pelvis, cone(0.12, 0.8, green, 12), 0, -0.05, 0.4, Math.PI / 2 + 0.25, 0, 0);
    return tag(g, 'runner', 1.25, 0.9);
  }

  return tag(buildRunner(PRESET.garde), 'runner', 1.08);
}

/* animation du drone : l’appareil flotte et ses hélices tournent */
export function poseDrone(R, st) {
  const B = R.userData.B, t = st.t || 0;
  B.body.position.y = 1.7 + 0.08 * Math.sin(t * 4); B.body.rotation.x = -0.12; B.body.rotation.z = 0.05 * Math.sin(t * 2.5);
  B.rotors.forEach(r => { r.rotation.y = t * 40; });
}
