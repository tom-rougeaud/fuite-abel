# La fuite d’Abel

Jeu de course en 3D pour les jeunes enfants (navigateur et mobile). On court, on saute, on se baisse, on ramasse des pièces et on échappe au poursuivant.

**Jouer :** https://tom-rougeaud.github.io/fuite-abel/

## Le jeu
- 50 niveaux de 5 000 m (de 1 000 à 5 000 pièces, trafic continu sans pause, une seule voie libre, caisses qui tombent sur ta voie, sauts + changements de voie ; 3 cœurs (escargot, lapin) ou 2 (guépard)) (5 décors : ville, plage, neige, désert, forêt, chacun de jour, au soir et de nuit), de plus en plus longs et difficiles (défilement très rapide, files de voitures, voitures qui sortent de leur place, objets qui tombent avec une ombre d’avertissement, pièces rares). Ils se débloquent avec des pièces dans la boutique. 3 vitesses de défilement (escargot, lapin, guépard ; gains +10 % et +25 % aux deux plus rapides), 3 étoiles par niveau.
- Obstacles à l’américaine : voitures, camionnettes, pick-up, bus, semi-remorques, barrières, poutres, bus avec rampe.
- Les pièces indiquent le chemin le plus sûr. 3 cœurs. Interface en icônes avec un court libellé courbé sur les boutons.
- Bonus : aimant, bouclier, envol, pièces ×2, cœur. Poursuivant : 22 poursuivants (premier onglet de la boutique, avec leurs noms) au choix (garde, chien, robot carré, drone, mascotte, fantôme, taureau, golem, écureuil, Père Noël, sprinter, sorcière) (tout près, un choc coûte 2 cœurs). Mouvements animés : élan et réception du saut, tacle, virages.
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

- Bonus à icônes ; un cœur ou un parachute tous les 100 pièces ; scènes de capture de 10 s, une chorégraphie par poursuivant (appui = passer) ; sur PC : flèches pour naviguer, Entrée pour valider ; poursuivants de 1 500 à 3 000 pièces.
