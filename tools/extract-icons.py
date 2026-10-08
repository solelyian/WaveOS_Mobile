#!/usr/bin/env python3
"""Extrait les tuiles d'icônes des planches générées (grille 3x3, fond sombre).

Pour chaque cellule : recadrage serré sur le contenu non-fond (seuil de
luminance), puis export PNG carré. Le masque squircle final est appliqué côté
CSS (clip-path), donc les coins sombres résiduels sont coupés au rendu.
"""
import sys
from PIL import Image

PLANCHES = {
    "/Users/devin/waveos-proto/assets-gen/planche_a_glass.png": [
        "telephone", "messages", "navigateur",
        "musique", "mail", "photos",
        "camera", "plans", "meteo",
    ],
    "/Users/devin/waveos-proto/assets-gen/planche_b_glass.png": [
        "reglages", "horloge", "notes",
        "rappels", "store", "calculette",
        "fichiers", "sante", "bourse",
    ],
}

OUT = "/Users/devin/waveos-proto/public/icons"
CROP_FRAC = 0.78        # tuile ≈ 82% de la cellule, centrée (évite la fuite de lueur des voisines)


def tight_box(img):
    """Crop centré fixe — plus fiable que la luminance quand les tuiles
    dépolies dégagent une lueur qui déborde dans la cellule voisine."""
    w, h = img.size
    side = int(min(w, h) * CROP_FRAC)
    cx, cy = w // 2, h // 2
    x0 = max(0, cx - side // 2)
    y0 = max(0, cy - side // 2)
    return (x0, y0, min(w, x0 + side), min(h, y0 + side))


def squircle_alpha(side, n=4.6, feather=1.5):
    """Masque alpha « squircle » n=4.6 (notre géométrie Sillage) supersamplé.
    Coupe les coins sombres ET les bavures de lueur en bord de tuile."""
    ss = 4
    S = side * ss
    m = Image.new("L", (S, S), 0)
    px = m.load()
    a = S / 2.0
    for y in range(S):
        for x in range(S):
            dx = (x - a + 0.5) / a
            dy = (y - a + 0.5) / a
            if abs(dx) ** n + abs(dy) ** n <= 1.0:
                px[x, y] = 255
    return m.resize((side, side), Image.LANCZOS)


MASK = squircle_alpha(256)


def extract(path, names):
    img = Image.open(path).convert("RGB")
    W, H = img.size
    cw, ch = W // 3, H // 3
    for i, name in enumerate(names):
        col, row = i % 3, i // 3
        cell = img.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))
        box = tight_box(cell)
        tile = cell.crop(box)
        tile = tile.resize((256, 256), Image.LANCZOS).convert("RGBA")
        tile.putalpha(MASK)
        tile.save(f"{OUT}/{name}.png", optimize=True)
        print(f"{name}: cell {box} → 256px squircle")


if __name__ == "__main__":
    for p, names in PLANCHES.items():
        extract(p, names)
    print("done")
