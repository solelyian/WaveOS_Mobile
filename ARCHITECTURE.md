# Architecture — WaveOS « Sillage »

## Répartition TS / C / C++ — et pourquoi

**C (`native/wavecore.c`) — mathématiques du mouvement et de la forme.**
Banque de ressorts semi-implicites (Euler symplectique à pas fixe), easing,
couleur, géométrie superellipse, fonction caoutchouc. Du C pur : zéro objet,
zéro allocation, des fonctions sur tableaux — le code le plus simple à faire
auditer et à porter vers un moteur natif.

**C++ (`native/wavegfx.cpp`) — le raster lourd.**
Le wallpaper « Rubans » est calculé pixel par pixel : SDF de capsules inclinées
−16°, deux passes de blur séparable à 0.4× résolution, upsample bilinéaire,
screen blend, vignette, grain de dithering. C'est exactement le genre de code
qui paie en C++ (struct + tableaux contigus) et qui serait plus tard porté en
compute shader / Metal sans changer de forme. Expose aussi `wg_luminance` —
mesurée par région, elle alimente le scrim adaptatif (QA avait raison de
l'exiger : le contraste sur verre ne se devine pas, il se mesure).

**TypeScript (`src/`) — composition, interaction, accessibilité.**
DOM + CSS `backdrop-filter` pour le verre (le navigateur fait mieux que tout ce
qu'on écrirait en 5 jours), machine à états gestuelle, boucle RAF unique.

**Communication TS ↔ WASM** : un seul module `waveos.wasm` chargé par
`src/wasm/bridge.ts` (mémoire linéaire partagée, exports `wc_*`/`wg_*`).
Le C alloue une banque de ressorts en mémoire wasm ; chaque `Spring` TS n'est
qu'un handle. Le framebuffer wallpaper est écrit par le C++ dans sa mémoire,
lu par TS en `Uint8ClampedArray` → `ImageData` → canvas. Zéro copie côté
chaud ; une seule copie pour le bake (qui n'arrive qu'au changement de thème).

## Stratégie de performance

- **Le DOM ne fait que composer.** Chaque calque ne touche que `transform` et
  `opacity` — jamais de layout en frame, jamais de box-shadow animé.
- **Une seule boucle RAF** (`core/motion.ts`) : toutes les springs intègrent,
  puis un seul `shell.frame()` écrit tous les styles. Pas de re-render réactif.
- **Les ressorts vivent en wasm**, intégrés en C ; TS ne fait que lire v/vel.
- **Le wallpaper est pré-rendu** (bake), jamais recalculé par frame — le blur
  de 200 kpx × 2 passes tourne une fois, pas 60 fois par seconde.
- **Zéro dépendance runtime.** Vite pour dev, TypeScript strict, pas de
  framework : le graphe d'objets est celui du shell, explicite.
- **Budget par frame** : <16 ms. Mesuré sur la machine de dev : bake ~44 ms
  (une fois), frame <2 ms en régime.

## Compromis assumés

- **Les apps sont des placeholders** à contenu réel mais limité (Horloge,
  Photos) — le sujet est le shell, pas un OS complet.
- **backdrop-filter** impose Chrome/Safari récents ; fallback dégradé = tint
  opaque (contraste garanti, matière perdue).
- **Pas de snap pixel des apps dans le multitâche** : la miniature re-rend la
  coque (plus nette qu'un snapshot et honnête : un OS réel garde une vue
  composée, pas une photo).
