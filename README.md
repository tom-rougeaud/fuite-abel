# La fuite d’Abel

Jeu de course en 3D pour les jeunes enfants (navigateur et mobile). On court, on saute, on se baisse, on ramasse des pièces et on échappe au poursuivant.

**Jouer :** https://tom-rougeaud.github.io/fuite-abel/

## Le jeu
- 5 niveaux (ville, plage, neige, désert, forêt), 3 vitesses (escargot, lapin, guépard), 3 étoiles par niveau.
- Obstacles à l’américaine : voitures, camionnettes, pick-up, bus, semi-remorques, barrières, poutres, bus avec rampe.
- Les pièces indiquent le chemin le plus sûr. 3 cœurs. Interface en icônes, très peu de texte.
- Bonus : aimant, bouclier, envol, pièces ×2, cœur. Poursuivant : garde, chien ou robot.
- Boutique (pièces) : personnage très personnalisable (peau, coiffure, tenue, chapeau, cape, ailes, lunettes…).
- Commandes : glisser (gauche/droite/haut/bas) ou toucher (tiers gauche/droit = voie, centre = saut) ; clavier : flèches.

## Données et vie privée
Aucun compte, aucune publicité, aucun traceur, aucun appel réseau. La progression est enregistrée uniquement dans l’appareil (clés `abelfuite_v1_…`). Export, import et effacement dans les réglages.

## Installation sur l’écran d’accueil
Application web installable (PWA) : bouton d’installation dans le jeu ; sur iPhone, Partager puis « Sur l’écran d’accueil ».

## Fichiers publiés
`index.html` (le jeu en un seul fichier), `manifest.webmanifest`, `sw.js`, icônes. Le dossier `sources/` contient le code modifiable ; `python3 build.py` (avec `npm install`) régénère `index.html`.

## Licence
Création : Tom Rougeaud, licence CC BY-NC 4.0. Moteur 3D : [three.js](https://threejs.org) (licence MIT), embarqué dans la page.
