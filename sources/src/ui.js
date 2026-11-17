import { createEngine, LEVELS, SPEEDS, POWERS } from './engine.js';
import { ic } from './icons.js';

const DATA = JSON.parse(document.getElementById('data-contenu').textContent);
const KEY = 'abelfuite_v1_';
const $ = s => document.querySelector(s);
const mem = {};
function sGet(k) { try { return localStorage.getItem(KEY + k); } catch (e) { return mem[k] === undefined ? null : mem[k]; } }
function sSet(k, v) { try { localStorage.setItem(KEY + k, v); } catch (e) { mem[k] = v; } }
function sDel(k) { try { localStorage.removeItem(KEY + k); } catch (e) { delete mem[k]; } }

/* ---------- sauvegarde ---------- */
const NL = DATA.niveaux.length;
function defSave() { return { v: 1, coins: 0, stars: new Array(NL).fill(0), levels: [0], eq: Object.assign({}, DATA.defauts), owned: [], sound: true, quality: 'auto', speed: 0, offered: false, keys: 'fleches' }; }
function sanitize(o) {
  const d = defSave(); if (!o || typeof o !== 'object') return d;
  d.coins = Number.isFinite(o.coins) ? Math.max(0, Math.min(1e6, Math.floor(o.coins))) : 0;
  if (Array.isArray(o.stars)) d.stars = d.stars.map((_, i) => { const s = Math.floor(o.stars[i]); return s >= 0 && s <= 3 ? s : 0; });
  /* niveaux possédés (achetés dans la boutique) ; anciennes sauvegardes : on garde l’accès aux niveaux déjà ouverts */
  const lv = new Set([0]);
  if (Array.isArray(o.levels)) o.levels.forEach(n => { if (Number.isInteger(n) && n >= 0 && n < NL) lv.add(n); });
  else if (Array.isArray(o.stars)) o.stars.forEach((st, i) => { if (st >= 1 && i + 1 < NL) lv.add(i + 1); });
  d.levels = [...lv].sort((a, b) => a - b);
  d.keys = o.keys === 'lettres' ? 'lettres' : 'fleches';
  DATA.categories.forEach(c => { const n = o.eq && Number.isInteger(o.eq[c.id]) ? o.eq[c.id] : d.eq[c.id]; d.eq[c.id] = n >= 0 && n < c.items.length ? n : DATA.defauts[c.id]; });
  const own = new Set(); if (Array.isArray(o.owned)) o.owned.forEach(s => { if (typeof s === 'string' && /^[a-z]+:\d+$/.test(s)) { const [c, i] = s.split(':'), cat = DATA.categories.find(x => x.id === c); if (cat && +i < cat.items.length) own.add(s); } });
  DATA.categories.forEach(c => c.items.forEach((it, i) => { if (it.p === 0 || d.eq[c.id] === i && false) own.add(c.id + ':' + i); }));
  DATA.categories.forEach(c => own.add(c.id + ':' + d.eq[c.id]));
  d.owned = [...own];
  d.sound = o.sound !== false; d.quality = ['auto', 'bas', 'haut'].includes(o.quality) ? o.quality : 'auto';
  d.speed = [0, 1, 2].includes(o.speed) ? o.speed : 0; d.offered = !!o.offered;
  return d;
}
function load() { try { return sanitize(JSON.parse(sGet('save'))); } catch (e) { return sanitize(null); } }
let save = load();
function persist() { sSet('save', JSON.stringify(save)); }

/* ---------- son (WebAudio, sans fichier) ---------- */
let actx = null;
function beep(f, d, type = 'sine', vol = 0.12, slide = 0, when = 0) {
  if (!save.sound) return; try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume();
    const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + when;
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d + 0.02);
  } catch (e) { }
}
const SFX = {
  coin() { beep(880, 0.08, 'triangle', 0.1); beep(1320, 0.12, 'triangle', 0.1, 0, 0.06); }, jump() { beep(300, 0.18, 'sine', 0.12, 260); }, slide() { beep(220, 0.22, 'sawtooth', 0.05, -120); }, move() { beep(500, 0.04, 'sine', 0.04); },
  hit() { beep(140, 0.3, 'square', 0.14, -80); }, shield() { beep(600, 0.2, 'triangle', 0.12, 400); }, power() { [523, 659, 784].forEach((f, i) => beep(f, 0.14, 'triangle', 0.11, 0, i * 0.07)); },
  win() { [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.22, 'triangle', 0.13, 0, i * 0.12)); }, lose() { [392, 330, 262].forEach((f, i) => beep(f, 0.25, 'sine', 0.12, 0, i * 0.16)); }, go() { beep(660, 0.12, 'triangle', 0.1); }, click() { beep(700, 0.05, 'triangle', 0.08); }
};

/* ---------- moteur ---------- */
const canvas = $('#gl');
const E = createEngine(canvas, {
  onSfx: n => { if (SFX[n]) SFX[n](); },
  onHud: updateHud,
  onEnd: showResult,
  onKeys: m => { save.keys = m; persist(); }
});
E.setKeys(save.keys);
function fit() { E.resize(window.innerWidth, window.innerHeight); }
addEventListener('resize', fit); fit(); E.setQuality(save.quality);

/* ---------- tenue ---------- */
function lookFrom(eq, pend) {
  const L = { hat: null, back: null, neck: null, glasses: null }; let chaser = 'garde';
  DATA.categories.forEach(c => { const i = pend && pend.cat === c.id ? pend.idx : eq[c.id], s = c.items[i].set; if (s.chaser) chaser = s.chaser; else Object.assign(L, s); });
  return { L, chaser };
}
function applyLook(pend) { const { L, chaser } = lookFrom(save.eq, pend); E.setLook(L); E.setChaser(chaser); }
applyLook(null);

/* ---------- écrans ---------- */
const SCR = ['home', 'map', 'hud', 'pause', 'result', 'shop', 'settings'];
let cur = 'home';
function show(id) { cur = id; SCR.forEach(s => $('#scr-' + s).classList.toggle('on', s === id)); document.body.dataset.scr = id; }
/* libellé courbé le long du bas d’un bouton rond */
let arcN = 0;
function arc(el, text) {
  if (!text) return; const id = 'arc' + (++arcN), t = text.toUpperCase(), fs = Math.min(15, 112 / (0.72 * t.length));
  el.classList.add('lab');
  el.insertAdjacentHTML('beforeend', `<svg class="arc" viewBox="0 0 100 100" aria-hidden="true"><path id="${id}" d="M 12 50 A 38 38 0 0 0 88 50" fill="none"/><text font-size="${fs.toFixed(1)}"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${t}</textPath></text></svg>`);
}
function setIcon(el, name) { el.innerHTML = ic(name); arc(el, el.dataset.t); }
function btn(cls, icon, label, fn, text) { const b = document.createElement('button'); b.className = 'rb ' + cls; b.setAttribute('aria-label', label); b.innerHTML = ic(icon); arc(b, text); b.addEventListener('click', () => { SFX.click(); fn(); }); return b; }
function coinsText() { return `${ic('coin')}<b>${save.coins}</b>`; }
function refreshCoins() { document.querySelectorAll('.coinbar').forEach(e => e.innerHTML = coinsText()); }

/* accueil */
let themeHome = Math.floor(Math.random() * 5);
function goHome() { E.menu(themeHome); show('home'); refreshCoins(); updateInstallBtn(); maybeShowUpdate(); }
{
  const h = $('#scr-home');
  setIcon(h.querySelector('.play'), 'play'); h.querySelector('.play').addEventListener('click', () => { SFX.click(); goMap(); });
  setIcon(h.querySelector('.b-shop'), 'bag'); h.querySelector('.b-shop').addEventListener('click', () => { SFX.click(); goShop(); });
  setIcon(h.querySelector('.b-set'), 'gear'); h.querySelector('.b-set').addEventListener('click', () => { SFX.click(); goSettings(); });
  setIcon(h.querySelector('.b-inst'), 'download'); h.querySelector('.b-inst').addEventListener('click', () => { SFX.click(); openInstall(); });
}

/* carte des niveaux : seuls les niveaux achetés dans la boutique se jouent */
let selLevel = 0, selSpeed = save.speed;
const owns = i => save.levels.includes(i);
function goMap(want) {
  let first = save.levels.find(i => save.stars[i] === 0); if (first === undefined) first = save.levels[save.levels.length - 1];
  selLevel = Number.isInteger(want) && owns(want) ? want : first; selSpeed = save.speed;
  drawMap(); show('map'); E.menu(LEVELS[selLevel].theme); refreshCoins();
}
const VAR_ICON = ['', 'sunset', 'moon'];
function drawMap() {
  const box = $('#levels'); box.innerHTML = '';
  DATA.niveaux.forEach((n, i) => {
    const ok = owns(i), d = document.createElement('button'); d.className = 'lv' + (i === selLevel ? ' sel' : '') + (ok ? '' : ' lock'); d.setAttribute('aria-label', n.nom + (ok ? '' : ' (à débloquer, ' + n.p + ' pièces)'));
    d.innerHTML = `<span class="lvi t${i % 5}">${ic(n.icon)}</span><span class="nm">${n.nom}</span><span class="stars">${[0, 1, 2].map(k => ic(k < save.stars[i] ? 'star' : 'starO')).join('')}</span>${n.var ? `<span class="vb">${ic(VAR_ICON[n.var])}</span>` : ''}${ok ? '' : `<span class="lk">${ic('lock')}</span><span class="pr">${ic('coin')}<b>${n.p}</b></span>`}`;
    d.addEventListener('click', () => { if (!ok) { SFX.click(); goShop(0, i); return; } SFX.click(); selLevel = i; E.menu(LEVELS[i].theme); drawMap(); });
    box.appendChild(d);
  });
  const sel = box.children[selLevel]; if (sel && sel.scrollIntoView) { try { box.scrollLeft = Math.max(0, sel.offsetLeft - box.clientWidth / 2 + sel.offsetWidth / 2); } catch (e) { } }
  const sp = $('#speeds'); sp.innerHTML = '';
  ['snail', 'rabbit', 'cheetah'].forEach((n, i) => { const b = document.createElement('button'); b.className = 'sp' + (i === selSpeed ? ' sel' : ''); b.setAttribute('aria-label', ['lent', 'moyen', 'rapide'][i]); b.innerHTML = ic(n); arc(b, ['lent', 'moyen', 'rapide'][i]); b.addEventListener('click', () => { SFX.click(); selSpeed = i; save.speed = i; persist(); drawMap(); }); sp.appendChild(b); });
}
{
  const m = $('#scr-map');
  setIcon(m.querySelector('.back'), 'back'); m.querySelector('.back').addEventListener('click', () => { SFX.click(); goHome(); });
  setIcon(m.querySelector('.go'), 'play'); m.querySelector('.go').addEventListener('click', () => { SFX.click(); startGame(selLevel, selSpeed); });
}

/* partie */
let lastRun = null;
function startGame(li, si) { lastRun = { li, si }; show('hud'); $('#hudcoins').innerHTML = coinsText().replace(/<b>\d+<\/b>/, '<b>0</b>'); E.startLevel(li, si); }
let hudPrev = '';
function updateHud(h) {
  const k = JSON.stringify(h); if (k === hudPrev) return; hudPrev = k;
  $('#hearts').innerHTML = [0, 1, 2].map(i => `<span class="${i < h.hearts ? '' : 'off'}">${ic(i < h.hearts ? 'heart' : 'heartO')}</span>`).join('');
  $('#hudcoins').innerHTML = `${ic('coin')}<b>${h.coins}</b>`;
  $('#bar i').style.width = (h.prog * 100).toFixed(1) + '%'; $('#bar u').style.left = (h.prog * 100).toFixed(1) + '%';
  $('#chips').innerHTML = h.powers.map(p => `<span class="chip" style="background:${POWERS[p.id].bg};--f:${(p.f * 100).toFixed(0)}%">${ic(POWERS[p.id].icon)}<em></em></span>`).join('');
  $('#warn').classList.toggle('on', h.chaser);
}
{
  $('#bar u').innerHTML = ic('runner'); $('#bar s').innerHTML = ic('flag'); $('#warn').innerHTML = ic('chaser');
  const p = $('#btn-pause'); p.innerHTML = ic('pause'); p.addEventListener('click', () => { SFX.click(); E.pause(true); show('pause'); document.body.classList.add('over'); });
  const ps = $('#scr-pause .row');
  ps.appendChild(btn('big', 'play', 'reprendre', () => { E.pause(false); show('hud'); document.body.classList.remove('over'); }, 'Reprendre'));
  ps.appendChild(btn('', 'replay', 'recommencer', () => { document.body.classList.remove('over'); startGame(lastRun.li, lastRun.si); }, 'Rejouer'));
  ps.appendChild(btn('', 'home', 'accueil', () => { document.body.classList.remove('over'); goHome(); }, 'Accueil'));
}
document.addEventListener('visibilitychange', () => { if (document.hidden && cur === 'hud') { E.pause(true); show('pause'); document.body.classList.add('over'); } });

/* résultat : on voit toujours quoi faire ensuite (suite, rejouer, boutique) */
function showResult(r) {
  const gain = r.coins; save.coins += gain;
  if (r.win) { save.stars[r.level] = Math.max(save.stars[r.level], r.stars); }
  persist();
  const box = $('#scr-result .panel'), nxt = r.win && r.level + 1 < NL ? r.level + 1 : -1, nv = nxt >= 0 ? DATA.niveaux[nxt] : null;
  box.innerHTML = `<h2 class="ttl">${r.win ? 'Bravo !' : 'Raté…'}</h2><div class="rstars">${r.win ? [0, 1, 2].map(k => `<span class="rs ${k < r.stars ? 'on' : ''}" style="animation-delay:${0.25 + k * 0.35}s">${ic(k < r.stars ? 'star' : 'starO')}</span>`).join('') : `<span class="sad">${ic('chaser')}</span>`}</div><div class="gain">${ic('coin')}<b>+${gain}</b></div><div class="sub">${ic('coin', 'inl')} ${save.coins} en tout</div><div class="stack"></div><div class="row"></div>`;
  const st = box.querySelector('.stack'), row = box.querySelector('.row');
  const wide = (cls, html, fn) => { const b = document.createElement('button'); b.className = 'wide ' + cls; b.innerHTML = html; b.addEventListener('click', () => { SFX.click(); fn(); }); st.appendChild(b); return b; };
  if (r.win && nv) {
    if (owns(nxt)) wide('', `${ic('next')}<span>Niveau suivant : ${nv.nom}</span>`, () => startGame(nxt, r.speed));
    else if (save.coins >= nv.p) wide('', `${ic('lock')}<span>Débloquer ${nv.nom}</span><b>${ic('coin')}${nv.p}</b>`, () => { save.coins -= nv.p; save.levels.push(nxt); save.levels.sort((a, b) => a - b); persist(); SFX.power(); startGame(nxt, r.speed); });
    else { wide('no', `${ic('lock')}<span>${nv.nom} : il te manque ${nv.p - save.coins}</span><b>${ic('coin')}</b>`, () => goShop(0, nxt)); }
  } else if (r.win) wide('sec', `${ic('star')}<span>Tous les niveaux sont finis !</span>`, () => { });
  if (r.win && r.stars >= 2 && r.speed < 2) wide('sec', `${ic(['rabbit', 'cheetah'][r.speed])}<span>Rejouer plus vite</span>`, () => { save.speed = r.speed + 1; persist(); startGame(r.level, r.speed + 1); });
  row.appendChild(btn(r.win ? '' : 'big', 'replay', 'rejouer', () => startGame(r.level, r.speed), 'Rejouer'));
  row.appendChild(btn('', 'bag', 'boutique', () => goShop(), 'Boutique'));
  row.appendChild(btn('', 'home', 'accueil', () => goHome(), 'Accueil'));
  document.body.classList.add('over'); show('result'); setTimeout(() => document.body.classList.remove('over'), 0);
}

/* boutique */
let shopCat = 0, pend = null;
/* onglet 0 = niveaux à débloquer ; les suivants = tenue et poursuivant */
const CATS = [{ id: 'niveaux', icon: 'map', lv: true, focus: 'level', yaw: 0 }, ...DATA.categories];
function goShop(cat = 0, lvl = null) {
  shopCat = cat; pend = lvl !== null && !owns(lvl) ? { cat: 'niveaux', idx: lvl } : null;
  E.shopMode(pend ? LEVELS[lvl].theme : themeHome); applyLook(null); drawShop(); show('shop'); refreshCoins();
}
function swatch(c, it) {
  const s = it.set, col = s.skin || s.hair || s.topColor || s.bottomColor || s.shoes || s.hatColor || s.backColor || s.neckColor;
  if (it.icon) return ic(it.icon);
  if (Object.keys(s).length === 1 && Object.values(s)[0] === null) return ic('close');
  const styled = s.hairStyle || s.hat || s.back || s.neck || s.glasses || s.top || s.bottom;
  if (col) return `<i class="dot" style="background:${col}"></i>${styled ? `<span class="gl dk">${ic(c.icon)}</span>` : ''}`;
  return `<span class="gl">${ic(c.icon)}</span>`;
}
function drawShop() {
  const cats = $('#cats'); cats.innerHTML = '';
  CATS.forEach((c, i) => { const b = document.createElement('button'); b.className = 'cat' + (i === shopCat ? ' sel' : ''); b.setAttribute('aria-label', c.id); b.innerHTML = ic(c.icon); b.addEventListener('click', () => { SFX.click(); shopCat = i; pend = null; E.shopMode(themeHome); applyLook(null); drawShop(); }); cats.appendChild(b); });
  const c = CATS[shopCat]; E.shopView(c.focus === 'chaser' ? 'body' : c.focus, c.yaw, c.focus === 'chaser' ? 'chaser' : 'runner');
  const box = $('#items'); box.innerHTML = '';
  if (c.lv) DATA.niveaux.forEach((n, i) => {
    const owned = owns(i), d = document.createElement('button');
    d.className = 'item lvit' + (pend && pend.idx === i ? ' pv' : '') + (owned ? '' : ' buy'); d.setAttribute('aria-label', n.nom + (owned ? '' : ', ' + n.p + ' pièces'));
    d.innerHTML = `<span class="lvi t${i % 5}">${ic(n.icon)}${n.var ? `<span class="vb" style="position:absolute;right:-6px;top:-6px;width:20px;height:20px;border-radius:50%;background:rgba(15,22,40,.85);color:#f6dfaa;padding:3px;font-size:14px">${ic(VAR_ICON[n.var])}</span>` : ''}</span><span class="nm">${n.nom}</span>${owned ? `<span class="ok">${ic('check')}</span>` : `<span class="pr">${ic('coin')}<b>${n.p}</b></span>`}`;
    d.addEventListener('click', () => {
      SFX.click();
      if (owned) { goMap(i); return; }
      pend = { cat: 'niveaux', idx: i }; E.shopMode(LEVELS[i].theme); drawShop();
    });
    box.appendChild(d);
  });
  else c.items.forEach((it, i) => {
    const owned = save.owned.includes(c.id + ':' + i), eq = save.eq[c.id] === i, d = document.createElement('button');
    d.className = 'item' + (eq && !pend ? ' on' : '') + (pend && pend.idx === i ? ' pv' : '') + (owned ? '' : ' buy');
    d.innerHTML = `<span class="sw">${swatch(c, it)}</span>${owned ? (eq ? `<span class="ok">${ic('check')}</span>` : '') : `<span class="pr">${ic('coin')}<b>${it.p}</b></span>`}`;
    d.addEventListener('click', () => {
      SFX.click();
      if (owned) { save.eq[c.id] = i; pend = null; persist(); applyLook(null); drawShop(); }
      else { pend = { cat: c.id, idx: i }; applyLook(pend); drawShop(); }
    });
    box.appendChild(d);
  });
  const bb = $('#buybar'); bb.innerHTML = '';
  if (pend) {
    const it = c.lv ? DATA.niveaux[pend.idx] : c.items[pend.idx], can = save.coins >= it.p;
    const b = document.createElement('button'); b.className = 'buy-btn' + (can ? '' : ' no'); b.setAttribute('aria-label', 'acheter');
    b.innerHTML = `${ic('bag')}<span>${ic('coin')}<b>${it.p}</b></span>`;
    b.addEventListener('click', () => {
      if (!can) { SFX.hit(); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); return; }
      save.coins -= it.p;
      if (c.lv) { save.levels.push(pend.idx); save.levels.sort((a, b) => a - b); } else { save.owned.push(c.id + ':' + pend.idx); save.eq[c.id] = pend.idx; }
      pend = null; persist(); SFX.power(); applyLook(null); drawShop(); refreshCoins();
    });
    bb.appendChild(b);
  }
}
{ const s = $('#scr-shop'); setIcon(s.querySelector('.back'), 'back'); s.querySelector('.back').addEventListener('click', () => { SFX.click(); pend = null; applyLook(null); goHome(); }); }

/* modales */
function modal(html, onClose) {
  const m = $('#modal'); m.innerHTML = `<div class="mbox">${html}</div>`; m.classList.add('on');
  const close = () => { m.classList.remove('on'); m.innerHTML = ''; if (onClose) onClose(); };
  m.onclick = e => { if (e.target === m) close(); };
  m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { SFX.click(); close(); })); return { close, el: m };
}
function textPage(title, paras) { modal(`<h2>${title}</h2>${paras.map(p => `<p>${p}</p>`).join('')}<div class="row"><button class="rb" data-close aria-label="fermer">${ic('check')}</button></div>`); }

/* réglages */
function goSettings() { drawSettings(); show('settings'); }
function drawSettings() {
  const box = $('#setbox'); box.innerHTML = '';
  const row = (icon, label, ctrl) => { const d = document.createElement('div'); d.className = 'srow'; d.innerHTML = `<span class="si">${ic(icon)}</span><span class="sl">${label}</span>`; d.appendChild(ctrl); box.appendChild(d); };
  const snd = document.createElement('button'); snd.className = 'tg' + (save.sound ? ' on' : ''); snd.setAttribute('aria-label', 'son'); snd.innerHTML = ic(save.sound ? 'speaker' : 'speakerOff'); snd.addEventListener('click', () => { save.sound = !save.sound; persist(); SFX.click(); drawSettings(); }); row('speaker', 'Son', snd);
  const q = document.createElement('div'); q.className = 'seg'; [['auto', 'Auto'], ['bas', 'Bas'], ['haut', 'Haut']].forEach(([k, t]) => { const b = document.createElement('button'); b.textContent = t; b.className = save.quality === k ? 'on' : ''; b.addEventListener('click', () => { save.quality = k; persist(); E.setQuality(k); drawSettings(); }); q.appendChild(b); }); row('sparkle', 'Qualité 3D', q);
  const kb = document.createElement('div'); kb.className = 'seg'; [['fleches', 'Flèches'], ['lettres', 'ZQSD']].forEach(([k, t]) => { const b = document.createElement('button'); b.textContent = t; b.className = save.keys === k ? 'on' : ''; b.addEventListener('click', () => { save.keys = k; persist(); E.setKeys(k); drawSettings(); }); kb.appendChild(b); }); row('keyboard', 'Clavier (ordinateur)', kb);
  const mk = (icon, label, fn) => { const b = document.createElement('button'); b.className = 'tg'; b.setAttribute('aria-label', label); b.innerHTML = ic(icon); b.addEventListener('click', () => { SFX.click(); fn(); }); return b; };
  row('refresh', 'Vérifier les mises à jour', mk('refresh', 'mettre à jour', () => checkUpdate(true)));
  row('download', 'Exporter la sauvegarde', mk('download', 'exporter', exportData));
  row('upload', 'Importer une sauvegarde', mk('upload', 'importer', () => $('#file').click()));
  row('trash', 'Effacer la progression', mk('trash', 'effacer', confirmErase));
  row('info', 'À propos', mk('info', 'à propos', () => textPage('La fuite d’Abel — v' + DATA.version, DATA.textes.apropos)));
  row('shieldLock', 'Confidentialité', mk('shieldLock', 'confidentialité', () => textPage('Confidentialité', DATA.textes.confidentialite)));
  if (canInstall()) row('download', 'Installer le jeu', mk('download', 'installer', openInstall));
}
{ const s = $('#scr-settings'); setIcon(s.querySelector('.back'), 'back'); s.querySelector('.back').addEventListener('click', () => { SFX.click(); goHome(); }); }
function exportData() {
  try { const blob = new Blob([JSON.stringify(save, null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fuite-abel-sauvegarde.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  catch (e) { modal(`<p>L’export a échoué sur cet appareil.</p><div class="row"><button class="rb" data-close>${ic('check')}</button></div>`); }
}
$('#file').addEventListener('change', e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const r = new FileReader(); r.onload = () => { try { const o = JSON.parse(r.result); if (!o || typeof o !== 'object' || o.v !== 1) throw new Error('format'); save = sanitize(o); persist(); E.setQuality(save.quality); applyLook(null); drawSettings(); modal(`<p>${ic('check', 'big')}</p><div class="row"><button class="rb" data-close>${ic('check')}</button></div>`); } catch (er) { modal(`<p>Ce fichier n’est pas une sauvegarde valable.</p><div class="row"><button class="rb" data-close>${ic('close')}</button></div>`); } };
  r.onerror = () => modal(`<p>Lecture impossible.</p><div class="row"><button class="rb" data-close>${ic('close')}</button></div>`); r.readAsText(f);
});
function confirmErase() {
  const m = modal(`<p>${ic('trash', 'big')}</p><div class="row"><button class="rb" id="no">${ic('close')}</button><button class="rb big warn" id="yes">${ic('check')}</button></div>`);
  m.el.querySelector('#no').onclick = () => m.close();
  m.el.querySelector('#yes').onclick = () => { sDel('save'); save = defSave(); save = sanitize(save); persist(); applyLook(null); m.close(); drawSettings(); refreshCoins(); };
}

/* installation (PWA) */
let deferred = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function canInstall() { return !isStandalone() && (!!deferred || isIOS() || true); }
function updateInstallBtn() { $('#scr-home .b-inst').style.display = isStandalone() ? 'none' : ''; }
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; updateInstallBtn(); maybeOffer(); });
addEventListener('appinstalled', () => { deferred = null; updateInstallBtn(); });
function openInstall() {
  if (deferred) { const d = deferred; deferred = null; d.prompt(); d.userChoice.finally(() => updateInstallBtn()); return; }
  textPage('Installer', [isIOS() ? DATA.textes.ios + ' ' + ic('share', 'inl') : DATA.textes.installer]);
}
function maybeOffer() {
  if (save.offered || isStandalone() || cur !== 'home') return; save.offered = true; persist();
  const m = modal(`<p>${ic('download', 'big')}</p><div class="row"><button class="rb" data-close>${ic('close')}</button><button class="rb big" id="inst">${ic('check')}</button></div>`);
  m.el.querySelector('#inst').onclick = () => { m.close(); openInstall(); };
}

/* mise à jour : panneau plein écran, impossible à manquer */
const SEEN = 'seen';
const upd = $('#update');
function updPanel(html, onGo) {
  upd.innerHTML = html; upd.classList.add('on');
  const b = upd.querySelector('.wide'); if (b) { b.addEventListener('click', () => { SFX.click(); onGo(); }); try { b.focus(); } catch (e) { } }
}
function showNews() {
  const lis = DATA.textes.nouveautes.map(([i, t]) => `<li>${ic(i)}<span>${t}</span></li>`).join('');
  updPanel(`<div class="big">${ic('sparkle')}</div><h1 id="upt">Nouveautés</h1><p>Version ${DATA.version}</p><ul>${lis}</ul><button class="wide">${ic('play')}<span>C’est parti !</span></button>`, () => { upd.classList.remove('on'); upd.innerHTML = ''; });
}
const newer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
async function doUpdate() {
  try { if ('serviceWorker' in navigator) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(r => r.unregister())); } } catch (e) { }
  try { if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.filter(k => k.startsWith('fuite-abel-')).map(k => caches.delete(k))); } } catch (e) { }
  location.reload();
}
let pendingUpdate = null;
function showUpdate(v) {
  updPanel(`<div class="big">${ic('download')}</div><h1 id="upt">Mise à jour</h1><p>Une nouvelle version du jeu est prête (${v}).</p><button class="wide">${ic('refresh')}<span>Mettre à jour</span></button>`, doUpdate);
}
function maybeShowUpdate() { if (pendingUpdate && cur !== 'hud' && !upd.classList.contains('on')) showUpdate(pendingUpdate); }
async function checkUpdate(manual) {
  try {
    const res = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }); if (!res.ok) throw new Error('http');
    const v = (await res.json()).version;
    if (typeof v === 'string' && /^\d+\.\d+\.\d+$/.test(v) && newer(v, DATA.version)) { pendingUpdate = v; maybeShowUpdate(); return; }
    if (manual) modal(`<p>${ic('check', 'big')}</p><h2>Le jeu est à jour</h2><p>Version ${DATA.version}</p><div class="row"><button class="rb" data-close aria-label="fermer">${ic('check')}</button></div>`);
  } catch (e) { if (manual) modal(`<h2>Pas de connexion</h2><p>Impossible de chercher une mise à jour pour le moment.</p><div class="row"><button class="rb" data-close aria-label="fermer">${ic('close')}</button></div>`); }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(false); });
setInterval(() => { if (cur !== 'hud') checkUpdate(false); }, 600000);

/* démarrage */
$('#boot').remove();
goHome();
{ let seen = null; try { seen = sGet(SEEN); } catch (e) { } if (seen !== DATA.version) { sSet(SEEN, DATA.version); if (seen || sGet('save') !== null) showNews(); } }
checkUpdate(false);
setTimeout(() => { if (!deferred && !upd.classList.contains('on')) maybeOffer(); }, 4000);
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  let reloaded = false;
  navigator.serviceWorker.register('sw.js').then(reg => { reg.update && reg.update(); }).catch(() => { });
  
}
window.__E = E; window.__save = () => save;
