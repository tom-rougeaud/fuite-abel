/* Projet : La fuite d’Abel  ·  Version : 1.9.0  ·  Date : 17/11/2026
   Auteur : Tom Rougeaud  ·  Licence : CC BY-NC 4.0
   Réalisé avec l’aide de l’IA : Claude Sonnet 5.5 (Anthropic) */
/* La fuite d’Abel — service worker : réseau d’abord (sans cache du navigateur : icônes et manifeste toujours frais), copie locale en secours (fonctionne hors connexion) */
const VERSION = '1.14.6', CACHE = 'fuite-abel-' + VERSION;
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'version.json', 'icone-abel.svg', 'icone-abel-180.png', 'icone-abel-192.png', 'icone-abel-512.png', 'icone-abel-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('fuite-abel-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r, { cache: 'no-cache' }).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
