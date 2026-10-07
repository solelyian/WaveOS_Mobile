# WaveOS — prototype mobile « Sillage »

Prototype d'expérience utilisateur et d'interface graphique de WaveOS mobile.
TypeScript + C + C++ compilé en WebAssembly, rendu dans le navigateur.

Direction visuelle : **Sillage** — l'eau comme comportement (verre liquide,
matière élastique, ressorts physiques), jamais comme décor. Signature : motif
« O », géométrie triptyque squircle/pill/capsule, palette nuit indigo + accents
minéraux, wallpaper « Rubans » cuit en C++ pixel par pixel.

## Lancer

```sh
npm install
sh tools/build-wasm.sh   # requiert zig (ziglang) pour cc/c++ → wasm
npm run dev              # http://localhost:5173
```

Le navigateur reste la seule cible du prototype : c'est le support de décision
le plus rapide pour la direction visuelle, et il garantit que le même code
(C/C++ → wasm) tournera tel quel dans une coque native plus tard.

## Gestes (coords logiques 393×852)

| Geste | Action |
|---|---|
| Glisser vers le haut (verrouillage) | Déverrouiller |
| Glisser depuis le tiers droit du bord supérieur | Centre de contrôle |
| Glisser depuis le tiers gauche/milieu | Centre de notifications |
| Glisser depuis le bas (accueil) | Multitâche |
| Glisser depuis le bas (app ouverte) | Fermer l'app |
| Glisser depuis le bord gauche (app) | Retour |
| Carte du multitâche : glisser-haut | Tuer l'app |
| Carte de notification : glisser-gauche | Supprimer |
| Toucher une icône / une carte | Ouvrir |

Les gestes sont directement pilotés par la banque de ressorts WASM :
interruption à tout moment, vélocité héritée au lâcher.

## Arborescence

```
native/
  wmath.h        mini-libm freestanding (sqrt/exp/log/trig — builtins wasm + minimax)
  wavecore.c     C : banque de ressorts semi-implicites, easing, géométrie
                 superellipse (squircle n=4.6), couleur, caoutchouc de dépassement
  wavegfx.cpp    C++ : raster wallpaper « Rubans » (SDF capsules −16°),
                 double passe de blur, upsample bilinéaire, screen blend,
                 vignette + grain, luminance par région pour le scrim adaptatif
src/
  wasm/bridge.ts  chargement wasm, mémoire, appels wc_*/wg_*
  wasm/spring.ts  ressort TS pilotant wc_spring_* (valeur, vélocité, presets)
  core/motion.ts  boucle unique requestAnimationFrame, presets de ressorts
  core/gestures.ts routeur de gestes : seuil 8px, zones de bords, anti click-fantôme
  core/a11y.ts    réduction de mouvement, échelle de texte (--ts), annonces aria-live
  core/el.ts      DOM tiny helpers (el, svgEl, glyphIcon)
  core/icons.ts   bibliothèque de ~40 glyphes SVG + fabrique d'icônes squircle
  system/state.ts état système pub-sub (thème, radios, focus, luminosité, volume…)
  apps/registry.ts 16 apps + dock + contenus réels (Horloge, Photos…)
  apps/settings.ts Réglages : tout est câblé à l'état réel
  shell/          wallpaper, statusbar, lock, home, cc, nc, switcher, appwin, shell
tokens.json     source unique des tokens → gen-tokens.mjs → tokens.gen.ts + tokens.h
```

## Vérifié

Verrouillage, déverrouillage, accueil, centre de contrôle (tuiles, sliders,
Focus, verrouillage), centre de notifications (dismiss, Effacer), ouverture /
fermeture / kill / réouverture d'apps, Réglages complet, thème clair + wallpaper
Aube, ressorts interruptibles. Voir `ARCHITECTURE.md` et `REVUE-EQUIPE.md`.
