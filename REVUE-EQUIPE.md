# Revue d'équipe — prototype « Sillage » 0.9

Revue croisée avant présentation direction. Chacun parle avec son angle,
y compris là où on a dû trancher un désaccord.

## Ce qui est solide

**DA** — La signature tient : rubans −16°, motif O, triptyque de rayons,
quatre accents minéraux sur nuit indigo. Personne ne confondra ça avec une
copie d'iOS : on a gardé la *physique* du verre liquide, pas ses composants.
Le point fort, c'est la cohérence : la même matière du boot au multitâche.

**UX** — Tous les gestes sont interruptibles et pilotés par la physique, pas
des timers. Les zones de bords sont franches (top-tier / côtés / bas), pas de
geste qui se termine dans un état intermédiaire. Le retour tactile est
immédiat : le spring suit le doigt au pixel.

**Motion** — Vélocité héritée au lâcher sur tous les commits
(`predicted = v + vel·0.22`), ouverture d'app qui « part » de la tuile
(`appP.to(1, 2.4)`), tension résiduelle dans le wallpaper (parallaxe liée au
scrim). L'ensemble garde le même caractère — c'est le « Sillage » voulu.

**Frontend** — TypeScript strict, zéro dépendance runtime, une boucle RAF,
état pub-sub à un seul endroit. Le bug des glyphes SVG (clip-path évalué dans
le mauvais espace de coordonnées par Chrome) a été trouvé et corrigé proprement,
pas masqué.

**Graphique** — Un bug réel a été trouvé en revue : le blur vertical du
wallpaper moyennait les mêmes lignes du haut pour toute la frame (les rubans
étaient « là » mais invisibles). C'est ce genre de bug qu'on ne voit qu'en
regardant les pixels — la vérification visuelle a payé. Bake ~44 ms, frame <2 ms.

**QA/A11y** — Contrastes sur verre mesurés par `wg_luminance` (scrim adaptatif,
pas un tint « au cas où »), échelle de texte `--ts`, réduction de mouvement,
`:focus-visible` Opale, roles/aria sur les sheets, annonces d'état. Le thème
clair est complet jusqu'à la status bar et les toggles.

## Ce qui reste fragile

- **Zones de geste à la souris** : le prototype parle « doigt » mais est testé
  à la souris — certains départs de drag dans les 5-6 px du cadre ratent parce
  que le pointeur part hors du `border-radius`. Non bloquant mais à mesurer
  sur écran tactile réel.
- **backdrop-filter** : Safari ancien = tint opaque. Le fallback est propre
  mais la matière disparaît — vérifier la matrice des navigateurs cibles.
- **Le multitâche n'affiche pas de vrai snapshot** — choix assumé, mais si la
  direction veut des aperçus fidèles il faudra une couche de capture.
- **Aucun test automatisé** : la boucle de mouvement est testable
  (springs déterministes à pas fixe) mais on n'a pas encore la suite.

## Risques de performance

- **Blur wallpaper** : 44 ms ponctuels — invisible (hors boucle) mais c'est le
  poste le plus cher du build. Sur mobile réel il faudra le passer en GPU.
- **backdrop-filter sur grande surface** : les sheets plein écran sont le seul
  usage gourmand — le blur est GPU-composited chez Chrome mais coûteux sur
  GPU intégré faible ; prévoir un mode « g-opaque » pour entrée de gamme.
- **La montée à 120 fps est déjà là** (pas de budget par frame >2 ms), mais la
  vérif réelle exige un appareil 120 Hz — la souris ne le prouve pas.

## Prochaines étapes prototype → produit

1. **Portage natif** : la séparation est prête — `wavecore.c`/`wavegfx.cpp`
   n'ont aucune dépendance navigateur ; il faut une cible Metal/Vulkan pour
   `wavegfx` et un compositeur équivalent à `backdrop-filter`.
2. **Snapshots d'apps réels** pour le multitâche.
3. **Suite de tests de mouvement** : les springs étant déterministes, on peut
   écrire des tests de trajectoire exacts (un luxe rare en UI).
4. **Écran tactile réel** pour calibrer les seuils de geste (8 px est un pari).
5. **Découper `shell.ts`** si de nouveaux modes arrivent — il tient encore.
