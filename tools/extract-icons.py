#!/usr/bin/env python3
"""Extrait les tuiles d'icônes des planches générées (grille 3x3, fond sombre).

Pour chaque cellule : recadrage serré sur le contenu non-fond (seuil de
luminance), puis export PNG carré. Le masque squircle final est appliqué côté
CSS (clip-path), donc les coins sombres résiduels sont coupés au rendu.
"""
import sys
from PIL import Image

PLANCHES = {
    "/Users/devin/waveos-proto/assets-gen/planche_a.png": [
        "telephone", "messages", "navigateur",
        "musique", "mail", "photos",
        "camera", "plans", "meteo",
    ],
    "/Users/devin/waveos-proto/assets-gen/planche_b.png": [
        "reglages", "horloge", "notes",
        "rappels", "store", "calculette",
        "fichiers", "sante", "bourse",
    ],
}

OUT = "/Users/devin/waveos-proto/public/icons"
LUM_THRESHOLD = 26      # fond ~#0A0E1F → coupe à 26
PAD = 2                 # marge gardée autour du contenu détecté


def tight_box(img):
    """Bounding box des pixels au-dessus du seuil de luminance."""
    g = img.convert("L")
    px = g.load()
    w, h = g.size
    xs, ys = [], []
    step = 2
    for y in range(0, h, step):
        for x in range(0, w, step):
            if px[x, y] > LUM_THRESHOLD:
                xs.append(x)
                ys.append(y)
    if not xs:
        return (0, 0, w, h)
    x0, x1 = max(0, min(xs) - PAD), min(w, max(xs) + step + PAD)
    y0, y1 = max(0, min(ys) - PAD), min(h, max(ys) + step + PAD)
    # force un carré centré
    bw, bh = x1 - x0, y1 - y0
    side = max(bw, bh)
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    x0 = max(0, cx - side // 2)
    y0 = max(0, cy - side // 2)
    x1 = min(w, x0 + side)
    y1 = min(h, y0 + side)
    return (x0, y0, x1, y1)


def extract(path, names):
    img = Image.open(path).convert("RGB")
    W, H = img.size
    cw, ch = W // 3, H // 3
    for i, name in enumerate(names):
        col, row = i % 3, i // 3
        cell = img.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))
        box = tight_box(cell)
        tile = cell.crop(box)
        tile = tile.resize((256, 256), Image.LANCZOS)
        tile.save(f"{OUT}/{name}.png", optimize=True)
        print(f"{name}: cell {box} → 256px")


if __name__ == "__main__":
    for p, names in PLANCHES.items():
        extract(p, names)
    print("done")
