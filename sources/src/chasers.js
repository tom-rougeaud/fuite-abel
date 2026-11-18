/* Projet : La fuite d’Abel  ·  Version : 1.10.0  ·  Date : 18/11/2026
   Auteur : Tom Rougeaud  ·  Licence : CC BY-NC 4.0
   Réalisé avec l’aide de l’IA : Claude Sonnet 5.5 (Anthropic) */
/* ===== SECTION : poursuivants =====
   Chaque poursuivant est un groupe 3D construit à partir du coureur (buildRunner) ou du chien (buildDog), complété par des accessoires.
   userData : kind = 'runner' | 'dog' | 'drone' (type d’animation), sc = échelle, cad = rapidité des pas, cy = hauteur du centre (caméra de la boutique). */
import * as THREE from 'three';
import { buildRunner, buildDog, PRESET, mat, mesh, ell } from './char.js';

/* identifiants dans l’ordre de la boutique */
export const CHASER_IDS = ['garde', 'chien', 'robot', 'drone', 'mascotte', 'fantome', 'taureau', 'golem', 'ecureuil', 'noel', 'sprinter', 'sorciere'];

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

  /* ---- taureau : grand chien sombre avec des cornes ---- */
  if (type === 'taureau') {
    const g = buildDog({ fur: '#5e3f2d' }), B = g.userData.B, horn = mat('#efe6d2', 0.6);
    put(B.head, cone(0.03, 0.16, horn, 10), -0.1, 0.1, -0.02, 0, 0, 0.9); put(B.head, cone(0.03, 0.16, horn, 10), 0.1, 0.1, -0.02, 0, 0, -0.9);
    put(B.head, ell(0.03, 0.05, 0.02, mat('#efe6d2', 0.8), 8), 0, 0.02, -0.12);
    put(B.body, ell(0.16, 0.14, 0.14, mat('#4b3225', 0.9), 12), 0, 0.14, -0.2);
    return tag(g, 'dog', 1.9, 1.0, 0.5, 0.75);
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

  /* ---- écureuil géant : petit, rapide, grosse queue ---- */
  if (type === 'ecureuil') {
    const g = buildDog({ fur: '#b5652e' }), B = g.userData.B, fur = mat('#b5652e', 0.9);
    B.tail.scale.setScalar(2.4); put(B.head, cone(0.025, 0.09, fur, 8), -0.07, 0.13, 0.0); put(B.head, cone(0.025, 0.09, fur, 8), 0.07, 0.13, 0.0);
    put(B.head, ell(0.045, 0.045, 0.03, mat('#e9d3b0', 0.9), 10), 0, -0.04, -0.13);
    return tag(g, 'dog', 1.3, 1.6, 0.5, 0.95);
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
  return tag(buildRunner(PRESET.garde), 'runner', 1.08);
}

/* animation du drone : l’appareil flotte et ses hélices tournent */
export function poseDrone(R, st) {
  const B = R.userData.B, t = st.t || 0;
  B.body.position.y = 1.7 + 0.08 * Math.sin(t * 4); B.body.rotation.x = -0.12; B.body.rotation.z = 0.05 * Math.sin(t * 2.5);
  B.rotors.forEach(r => { r.rotation.y = t * 40; });
}
