# La fuite d’Abel

Jeu de course en 3D pour les jeunes enfants (navigateur et mobile). On court, on saute, on se baisse, on ramasse des pièces et on échappe au poursuivant.

**Jouer :** https://tom-rougeaud.github.io/fuite-abel/

## Le jeu
- 50 niveaux de 10 000 m (de 2 000 à 9 000 pièces, trafic dense) (5 décors : ville, plage, neige, désert, forêt, chacun de jour, au soir et de nuit), de plus en plus longs et difficiles (défilement très rapide, files de voitures, voitures qui sortent de leur place, objets qui tombent avec une ombre d’avertissement, pièces rares). Ils se débloquent avec des pièces dans la boutique. 3 vitesses de défilement (escargot, lapin, guépard ; gains +10 % et +25 % aux deux plus rapides), 3 étoiles par niveau.
- Obstacles à l’américaine : voitures, camionnettes, pick-up, bus, semi-remorques, barrières, poutres, bus avec rampe.
- Les pièces indiquent le chemin le plus sûr. 3 cœurs. Interface en icônes avec un court libellé courbé sur les boutons.
- Bonus : aimant, bouclier, envol, pièces ×2, cœur. Poursuivant : garde, chien ou robot (tout près, un choc coûte 2 cœurs). Mouvements animés : élan et réception du saut, tacle, virages.
- Boutique (pièces) : personnage très personnalisable (peau, coiffure, tenue, chapeau, cape, ailes, lunettes…).
- Commandes : glisser (gauche/droite/haut/bas) ou toucher (tiers gauche/droit = voie, centre = saut) ; clavier : flèches (ZQSD seulement si le clavier n’a pas de flèches, ou à choisir dans les réglages).

## Données et vie privée
Aucun compte, aucune publicité, aucun traceur, aucun envoi de données (le jeu relit seulement `version.json`, sur son propre site, pour proposer les mises à jour). La progression est enregistrée uniquement dans l’appareil (clés `abelfuite_v1_…`). Export, import et effacement dans les réglages.

## Installation sur l’écran d’accueil
Application web installable (PWA) : bouton d’installation dans le jeu ; sur iPhone, Partager puis « Sur l’écran d’accueil ».

## Fichiers publiés
`index.html` (le jeu en un seul fichier), `version.json`, `manifest.webmanifest`, `sw.js`, icônes. Le dossier `sources/` contient le code modifiable ; `python3 build.py` (avec `npm install`) régénère `index.html`.

## Licence
Création : Tom Rougeaud, licence CC BY-NC 4.0. Moteur 3D : [three.js](https://threejs.org) (licence MIT), embarqué dans la page.
