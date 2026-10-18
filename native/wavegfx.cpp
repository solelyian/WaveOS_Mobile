// wavegfx.cpp — rasterisation temps réel (C++ freestanding, zéro dépendance).
// Produit les surfaces pixelisées du prototype : plan de ville pour l'app Plans.
// Sortie : buffer RGBA linéaire, copié vers un <canvas> côté TS.
#include "wmath.h"
#include "tokens.h"

#define EXP(n) __attribute__((export_name(n)))

#define GLASS_MAXW 512
#define GLASS_MAXH 640
#define GLYPH_MAXW 1024
#define GLYPH_MAXH 640

static const int MAP_W = 480, MAP_H = 850;
static unsigned char g_map[480 * 850 * 4];

static void put(int x, int y, unsigned char r, unsigned char g, unsigned char b) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return;
  unsigned char *p = g_map + (y * MAP_W + x) * 4;
  p[0] = r; p[1] = g; p[2] = b; p[3] = 255;
}

// hash déterministe → texture de bâtiments stable
static int hash2i(int a, int b) { unsigned h = (unsigned)a * 2654435761u ^ (unsigned)b * 40503u; h ^= h >> 13; return (int)(h & 0xffff); }

// distance point → segment
static float dseg(float px, float py, float ax, float ay, float bx, float by) {
  float dx = bx - ax, dy = by - ay;
  float t = wv_clampf(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0.f, 1.f);
  float qx = ax + dx * t - px, qy = ay + dy * t - py;
  return wv_sqrt(qx * qx + qy * qy);
}

// rectangle arrondi : distance signée au corps
static float drect(float px, float py, float cx, float cy, float hw, float hh, float r) {
  float qx = wv_fabs(px - cx) - (hw - r), qy = wv_fabs(py - cy) - (hh - r);
  float ox = wv_max(qx, 0.f), oy = wv_max(qy, 0.f);
  return wv_sqrt(ox * ox + oy * oy) + wv_min(wv_max(qx, qy), 0.f) - r;
}

EXP("wg_map_ptr") int wg_map_ptr(void) { return (int)(unsigned long)g_map; }
EXP("wg_map_size") void wg_map_size(int *w, int *h) { *w = MAP_W; *h = MAP_H; }

// Rend le plan « Apple Maps clair » : baie à droite, grille de rues,
// deux parcs, une artère diagonale, texture de bâtiments par îlot.
EXP("wg_map_render")
void wg_map_render(void) {
  const float cw = (float)MAP_W, ch = (float)MAP_H;
  for (int y = 0; y < MAP_H; y++) {
    for (int x = 0; x < MAP_W; x++) {
      float fx = (float)x, fy = (float)y;

      // base : terre beige clair
      float r = 229.f, g = 227.f, b = 223.f;

      // îlots : assombrissement léger par cellule de grille
      int gx = (int)(fx / 68.f), gy = (int)(fy / 74.f);
      float lx = fx - gx * 68.f, ly = fy - gy * 74.f;
      bool inside = lx > 5.f && lx < 63.f && ly > 5.f && ly < 69.f;
      if (inside) { r = 234.f; g = 232.f; b = 227.f; }
      // bâtiments : petites dalles par îlot
      if (inside && hash2i(gx, gy) % 3 != 0) {
        float bx = 14.f + (float)(hash2i(gx, gy + 7) % 30);
        float by = 14.f + (float)(hash2i(gx + 3, gy) % 34);
        if (drect(lx - 4, ly - 4, bx, by, 9.f, 7.f, 1.5f) < 0.f) { r = 219.f; g = 216.f; b = 210.f; }
      }

      // rues : bandes blanches sur la grille
      float dxv = wv_fabs(wv_fmodf(fx, 68.f) - 2.f);
      float dyh = wv_fabs(wv_fmodf(fy, 74.f) - 2.f);
      if (dxv < 3.2f || dyh < 3.2f) { r = 251.f; g = 250.f; b = 247.f; }

      // avenues majeures (teinte sable, plus larges)
      if (wv_fabs(wv_fmodf(fx + 12.f, 204.f) - 8.f) < 5.5f ||
          wv_fabs(wv_fmodf(fy + 20.f, 222.f) - 8.f) < 5.5f) { r = 245.f; g = 236.f; b = 200.f; }

      // artère diagonale type Market St
      if (dseg(fx, fy, -20.f, ch * 0.62f, cw * 0.9f, ch * 0.30f) < 7.f) { r = 252.f; g = 251.f; b = 248.f; }

      // parcs : deux masses vertes adoucies
      float dPark1 = drect(fx, fy, 120.f, 640.f, 62.f, 46.f, 18.f);
      float dPark2 = drect(fx, fy, 320.f, 180.f, 70.f, 52.f, 20.f);
      float dPark = wv_min(dPark1, dPark2);
      if (dPark < 0.f) { r = 197.f; g = 224.f; b = 188.f; }
      else if (dPark < 3.f) { float t = dPark / 3.f; r = wv_lerpf(197.f, r, t); g = wv_lerpf(224.f, g, t); b = wv_lerpf(188.f, b, t); }
      // arbres en points
      if (dPark < -6.f && hash2i(x / 9, y / 9) % 5 == 0) { r = 178.f; g = 208.f; b = 168.f; }

      // baie : littoral incurvé à droite
      float coast = cw * 0.86f + 18.f * wv_sin(fy * 0.011f) + 8.f * wv_sin(fy * 0.031f);
      if (fx > coast) { r = 168.f; g = 208.f; b = 224.f; }
      else if (fx > coast - 4.f) { float t = (coast - fx) / 4.f; r = wv_lerpf(r, 168.f, 1.f - t); g = wv_lerpf(g, 208.f, 1.f - t); b = wv_lerpf(b, 224.f, 1.f - t); }

      // quais / marina : pontons
      if (fx > coast - 30.f && fx < coast && (int)(fy / 26.f) % 3 == 0 && wv_fabs(wv_fmodf(fy, 26.f)) < 4.f) { r = 251.f; g = 250.f; b = 247.f; }

      // léger dégradé atmosphérique haut→bas
      float vg = fy / ch * 6.f;
      put(x, y,
          (unsigned char)wv_clampf(r + (3.f - vg), 0.f, 255.f),
          (unsigned char)wv_clampf(g + (3.f - vg), 0.f, 255.f),
          (unsigned char)wv_clampf(b + (3.f - vg), 0.f, 255.f));
    }
  }
}

/* ======================= LIQUID GLASS =======================
 * wg_glass_* : rend une plaque de verre liquide dans g_out.
 * Entrée : image de fond (ce qu'il y a DERRIÈRE le panneau) copiée dans
 * g_bg — le verre réfracte/givre ce fond, avec rim fresnel + reflets.
 *
 * wg_glass_set_bg(w,h)  → le TS remplit g_bg (w*h*4 octets)
 * wg_glass_render(x,y,w,h,r,tr,tg,tb,al) → g_out reçoit w*h*4
 *   (x,y) = origine du panneau dans l'image de fond, r = rayon coins,
 *   tr/tg/tb = teinte, al = opacité du corps vitré (0..1).
 */
static unsigned char g_bg[GLASS_MAXW * GLASS_MAXH * 4];
static unsigned char g_bg2[GLASS_MAXW * GLASS_MAXH * 4]; // copie floutée
static unsigned char g_out[GLYPH_MAXW * GLYPH_MAXH * 4];
static unsigned char g_aqua_reflection[GLYPH_MAXW * GLYPH_MAXH * 4];
static unsigned char g_aqua_relief[GLYPH_MAXW * GLYPH_MAXH * 4];
static int g_bgW = 0, g_bgH = 0;
static int g_outW = 0, g_outH = 0;

EXP("wg_bg_ptr") int wg_bg_ptr(void) { return (int)(unsigned long)g_bg; }
EXP("wg_out_ptr") int wg_out_ptr(void) { return (int)(unsigned long)g_out; }

EXP("wg_glass_set_bg")
void wg_glass_set_bg(int w, int h) {
  g_bgW = w > GLASS_MAXW ? GLASS_MAXW : w;
  g_bgH = h > GLASS_MAXH ? GLASS_MAXH : h;
}

EXP("wg_glass_blur")
void wg_glass_blur(int radius) {
  // box blur séparable ×2 ≈ gaussien — l'intérieur du verre montre
  // le même flou que le backdrop du sheet (verre quasi incolore)
  if (radius < 1) radius = 1;
  const int w = g_bgW, h = g_bgH, n = radius * 2 + 1;
  for (int pass = 0; pass < 2; pass++) {
    // horizontal : g_bg -> g_bg2
    for (int y = 0; y < h; y++) {
      int sr = 0, sg = 0, sb = 0;
      const unsigned char *row = g_bg + y * w * 4;
      for (int x = -radius; x <= radius; x++) {
        int xx = x < 0 ? 0 : x >= w ? w - 1 : x;
        sr += row[xx * 4]; sg += row[xx * 4 + 1]; sb += row[xx * 4 + 2];
      }
      for (int x = 0; x < w; x++) {
        unsigned char *o = g_bg2 + (y * w + x) * 4;
        o[0] = sr / n; o[1] = sg / n; o[2] = sb / n; o[3] = 255;
        int xa = x - radius < 0 ? 0 : x - radius;
        int xb = x + radius + 1 >= w ? w - 1 : x + radius + 1;
        sr += row[xb * 4] - row[xa * 4];
        sg += row[xb * 4 + 1] - row[xa * 4 + 1];
        sb += row[xb * 4 + 2] - row[xa * 4 + 2];
      }
    }
    // vertical : g_bg2 -> g_bg
    for (int x = 0; x < w; x++) {
      int sr = 0, sg = 0, sb = 0;
      for (int y = -radius; y <= radius; y++) {
        int yy = y < 0 ? 0 : y >= h ? h - 1 : y;
        const unsigned char *p = g_bg2 + (yy * w + x) * 4;
        sr += p[0]; sg += p[1]; sb += p[2];
      }
      for (int y = 0; y < h; y++) {
        unsigned char *o = g_bg + (y * w + x) * 4;
        o[0] = sr / n; o[1] = sg / n; o[2] = sb / n;
        int ya = y - radius < 0 ? 0 : y - radius;
        int yb = y + radius + 1 >= h ? h - 1 : y + radius + 1;
        const unsigned char *pa = g_bg2 + (ya * w + x) * 4;
        const unsigned char *pb = g_bg2 + (yb * w + x) * 4;
        sr += pb[0] - pa[0]; sg += pb[1] - pa[1]; sb += pb[2] - pa[2];
      }
    }
  }
}

// échantillon bilinéaire du fond (déjà flouté), borné
static void bgSample(float fx, float fy, float *r, float *g, float *b) {
  int x0 = (int)wv_floor(fx), y0 = (int)wv_floor(fy);
  float tx = fx - (float)x0, ty = fy - (float)y0;
  if (x0 < 0) x0 = 0; if (y0 < 0) y0 = 0;
  if (x0 > g_bgW - 2) x0 = g_bgW - 2; if (y0 > g_bgH - 2) y0 = g_bgH - 2;
  const unsigned char *p0 = g_bg + (y0 * g_bgW + x0) * 4;
  const unsigned char *p1 = p0 + 4;
  const unsigned char *p2 = p0 + g_bgW * 4;
  const unsigned char *p3 = p2 + 4;
  float a = 1.f - tx, c = 1.f - ty;
  *r = (p0[0]*a + p1[0]*tx)*c + (p2[0]*a + p3[0]*tx)*ty;
  *g = (p0[1]*a + p1[1]*tx)*c + (p2[1]*a + p3[1]*tx)*ty;
  *b = (p0[2]*a + p1[2]*tx)*c + (p2[2]*a + p3[2]*tx)*ty;
}

// gradient du SDF arrondi (pour la normale de bord → réfraction)
static void drectGrad(float px, float py, float cx, float cy, float hw, float hh, float r,
                      float *gx, float *gy) {
  float qx = wv_fabs(px - cx) - (hw - r), qy = wv_fabs(py - cy) - (hh - r);
  float sx = px < cx ? -1.f : 1.f, sy = py < cy ? -1.f : 1.f;
  float ox = wv_max(qx, 0.f), oy = wv_max(qy, 0.f);
  float len = wv_sqrt(ox * ox + oy * oy);
  if (len > 1e-4f && qx > 0.f && qy > 0.f) { *gx = sx * ox / len; *gy = sy * oy / len; return; }
  if (qx > qy) { *gx = sx; *gy = 0.f; } else { *gx = 0.f; *gy = sy; }
}

EXP("wg_glass_render")
void wg_glass_render(float ox, float oy, int w, int h, float r,
                     float tr, float tg, float tb, float al) {
  // Effets optiques de bord uniquement — l'intérieur est transparent :
  // le backdrop-filter natif de l'élément fournit le fond réfracté réel
  // (auto-aligné, identique au sheet). (ox,oy,tr,tg,tb,al réservés.)
  if (w > GLASS_MAXW) w = GLASS_MAXW;
  if (h > GLASS_MAXH) h = GLASS_MAXH;
  g_outW = w; g_outH = h;
  const float hw = w * 0.5f, hh = h * 0.5f;
  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      float px = x + 0.5f, py = y + 0.5f;
      float d = drect(px, py, hw, hh, hw, hh, r);   // <0 dedans
      float cov = wv_clampf(0.5f - d / 1.4f, 0.f, 1.f);
      unsigned char *q = g_out + (y * w + x) * 4;
      if (cov <= 0.f) { q[3] = 0; continue; }
      float inside = wv_max(-d, 0.f);
      float vert = py / h;

      // éclairage directionnel (source haut-gauche) : le bord tourné vers
      // la lumière est lumineux, l'opposé plus sombre → épaisseur 3D
      float nx, ny; drectGrad(px, py, hw, hh, hw, hh, r, &nx, &ny);
      // normale sortante : inversée par rapport au gradient SDF
      float lx = -0.62f, ly = -0.79f;             // dir lumière haut-gauche
      float facing = nx * lx + ny * ly;            // +1 face, -1 opposé
      float lit = 0.5f + 0.5f * facing;

      // liseré : rim net modulé par la lumière + halo interne doux
      float rim = wv_clampf(1.f - inside / 1.8f, 0.f, 1.f);
      float rimL = rim * (0.28f + 0.42f * lit);    // haut-gauche ~.70, bas ~.28
      float glow = wv_pow(wv_clampf(1.f - inside / 16.f, 0.f, 1.f), 2.2f)
                 * (0.10f + 0.16f * lit);

      // reflet doux au coin haut-gauche (pas de bande → pas de ligne)
      float cd = wv_sqrt((px / w) * (px / w) + (py / h) * (py / h)); // 0 au coin haut-gauche
      float spec = wv_exp(-cd * cd * 7.f) * 0.16f;

      // ombre interne bas (masse de verre) — accentuée côté opposé
      float ish = wv_clampf((vert - 0.68f) / 0.32f, 0.f, 1.f)
                * wv_clampf(inside / 10.f, 0.f, 1.f) * 0.18f;

      float lum = rimL + glow + spec - ish;
      if (lum >= 0.f) {
        q[0] = q[1] = q[2] = 255;
        q[3] = (unsigned char)(wv_clampf(lum, 0.f, 1.f) * cov * 255.f);
      } else {
        q[0] = q[1] = q[2] = 0;
        q[3] = (unsigned char)(wv_clampf(-lum, 0.f, 1.f) * cov * 255.f);
      }
    }
  }
}

EXP("wg_glass_size")
void wg_glass_size(int *w, int *h) { *w = g_outW; *h = g_outH; }

/* ---------------- moteur « vrai liquid glass » (iOS 26) ----------------
 * Décomposition rétro-ingénierie :
 *  1) LENTILLE DE BORD : une bande de ~24 px au bord montre le fond des
 *     ~60 px alentour compressé — le décor « rentre » sous le verre et se
 *     courbe. Carte de déplacement : direction = normale sortante,
 *     magnitude m(a)=M·(1-a/D)^1.35 (max pile au bord → 0 à D px).
 *     R/G = offset (128 neutre), A = silhouette AA.
 *  2) LISE ́ SPÉCULAIRE : filet lumineux ~1.5 px pile sur le contour, le plus
 *     vif en haut-gauche (lumière fixe), + halo interne doux ~7 px, ombre
 *     interne bas-droite, filet de caustique là où la lentille s'arrête.
 *     Rendu en overlay PNG séparé — pas de feSpecularLighting (trop mou).
 *  3) CORPS : quasi incolore (léger blur+saturate dans le filtre).
 */
EXP("wg_glass_disp")
void wg_glass_disp(int w, int h, float r, float amp, float depth) {
  if (w > GLASS_MAXW) w = GLASS_MAXW;
  if (h > GLASS_MAXH) h = GLASS_MAXH;
  g_outW = w; g_outH = h;
  const float hw = w * 0.5f, hh = h * 0.5f;
  const float DEPTH = depth > 0.f ? wv_max(1.f, depth) : 30.f;
  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      float px = x + 0.5f, py = y + 0.5f;
      float d = drect(px, py, hw, hh, hw, hh, r);
      unsigned char *q = g_out + (y * w + x) * 4;
      float cov = wv_clampf(0.5f - d / 1.4f, 0.f, 1.f); // AA silhouette
      if (cov <= 0.f) { q[0] = 128; q[1] = 128; q[2] = 0; q[3] = 0; continue; }
      float inside = wv_max(-d, 0.f);
      float nx, ny; drectGrad(px, py, hw, hh, hw, hh, r, &nx, &ny);
      // lentille : le bord compresse le décor (tiré vers l'extérieur)
      float t = wv_clampf(inside / DEPTH, 0.f, 1.f);
      float u = 1.f - t;
      float wt = wv_pow(u, 1.35f) * amp;
      int rr = (int)(128.f + nx * wt * 127.f);
      int gg = (int)(128.f + ny * wt * 127.f);
      q[0] = (unsigned char)wv_clampf((float)rr, 0.f, 255.f);
      q[1] = (unsigned char)wv_clampf((float)gg, 0.f, 255.f);
      q[2] = (unsigned char)wv_clampf(u * 255.f, 0.f, 255.f); // profondeur bord
      q[3] = (unsigned char)(cov * 255.f);
    }
  }
}

/* wg_glass_edge(w,h,r) → g_out = PNG RGBA d'habillage de bord :
 *   filet spéculaire directionnel + halo + ombre interne + caustique.
 * Lumière fixe haut-gauche (même convention que l'ancien moteur). */
EXP("wg_glass_edge")
void wg_glass_edge(int w, int h, float r, float depth) {
  if (w > GLASS_MAXW) w = GLASS_MAXW;
  if (h > GLASS_MAXH) h = GLASS_MAXH;
  g_outW = w; g_outH = h;
  const float hw = w * 0.5f, hh = h * 0.5f;
  const float lx = -0.62f, ly = -0.79f;  // lumière haut-gauche (normée)
  const float DEPTH = depth > 0.f ? wv_max(1.f, depth) : 30.f;
  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      float px = x + 0.5f, py = y + 0.5f;
      float d = drect(px, py, hw, hh, hw, hh, r);
      unsigned char *q = g_out + (y * w + x) * 4;
      q[0] = q[1] = q[2] = q[3] = 0;
      if (d > 2.f) continue;                       // rien hors silhouette
      float inside = wv_max(-d, 0.f);
      float nx, ny; drectGrad(px, py, hw, hh, hw, hh, r, &nx, &ny);
      // composante lumineuse : 1 face à la lumière → 0 à l'opposé (wrap)
      float lit = wv_clampf(nx * lx + ny * ly * 0.5f + 0.55f, 0.f, 1.f);
      // 1) filet spéculaire net ~1.6 px centré sur le contour
      float rim = wv_clampf(1.f - wv_fabs(d + 0.2f) / 0.9f, 0.f, 1.f);
      float rimI = rim * (0.05f + 0.80f * lit);   // filet fin, haut-gauche vif
      // 2) halo interne doux sous le filet (~7 px, côté lumière)
      float glow = wv_exp(-(inside * inside) / (2.f * 3.4f * 3.4f));
      float glowI = glow * lit * 0.17f;
      // 3) filet de caustique : là où la lentille retombe (a≈DEPTH)
      float dc = wv_fabs(inside - DEPTH);
      float caus = wv_clampf(1.f - dc / 1.1f, 0.f, 1.f) * 0.07f;
      // 4) ombre interne bas-droite (~8 px)
      float sh = wv_exp(-(inside * inside) / (2.f * 4.5f * 4.5f));
      float shI = sh * (1.f - lit) * 0.13f;
      // compose : blancs (rim+glow+caustique) puis noir (ombre)
      float wa = wv_clampf(rimI + glowI + caus, 0.f, 1.f);
      float ba = wv_clampf(shI * (1.f - wa), 0.f, 1.f);
      // mélange blanc/noir en alpha, sortie non-prémultipliée
      float a = wv_clampf(wa + ba, 0.f, 1.f);
      if (a <= 0.f) continue;
      float lr = wa / (wa + ba);                    // part de blanc
      unsigned char v = (unsigned char)(lr * 255.f);
      q[0] = v; q[1] = v; q[2] = v; q[3] = (unsigned char)(a * 255.f);
    }
  }
}

EXP("wg_aqua_reflection_ptr")
int wg_aqua_reflection_ptr() { return (int)(unsigned long)g_aqua_reflection; }

EXP("wg_aqua_relief_ptr")
int wg_aqua_relief_ptr() { return (int)(unsigned long)g_aqua_relief; }

/* Transmission RG uses scale=256; reflection uses twice the probe distance.
 * Transmission B carries Fresnel reflectance, A is an opaque carrier.
 * Reflection B carries directional grazing light for the edge mask.
 * Padding preserves the surrounding scene until the element clips the result. */
EXP("wg_aqua_lens")
int wg_aqua_lens(int w, int h, float r, float depth, float thickness,
                 float ior, float zoom, int padding) {
  if (w < 1 || h < 1 || padding < 0 || padding > 256
      || w > GLYPH_MAXW - padding * 2 || h > GLYPH_MAXH - padding * 2
      || !(r >= 0.f && r <= 1024.f) || !(depth >= 1.f && depth <= 640.f)
      || !(thickness >= 0.f && thickness <= 128.f)
      || !(ior >= 1.f && ior <= 2.5f) || !(zoom >= 1.f && zoom <= 2.f)) return 0;
  const int mw = w + padding * 2, mh = h + padding * 2;
  const float hw = w * 0.5f, hh = h * 0.5f;
  r = wv_min(r, wv_min(hw, hh));
  depth = wv_min(depth, wv_min(hw, hh));
  const float shrink = 1.f - 1.f / zoom;
  const float eta = 1.f / ior;
  const float probe = wv_min((float)padding, wv_min(hw, hh) * 1.8f);
  const float reflectionRange = wv_max(probe, 1.f) * 2.f;
  g_outW = mw; g_outH = mh;
  for (int y = 0; y < mh; y++) {
    for (int x = 0; x < mw; x++) {
      const int offset = (y * mw + x) * 4;
      unsigned char *q = g_out + offset, *reflection = g_aqua_reflection + offset;
      unsigned char *relief = g_aqua_relief + offset;
      q[0] = q[1] = reflection[0] = reflection[1] = 128;
      q[2] = reflection[2] = 0; q[3] = reflection[3] = 255;
      relief[0] = relief[1] = relief[2] = relief[3] = 0;
      const float px = x + 0.5f - padding, py = y + 0.5f - padding;
      const float d = drect(px, py, hw, hh, hw, hh, r);
      if (d > 0.5f) continue;
      const float coverage = wv_clampf(0.5f - d, 0.f, 1.f);
      const float inside = wv_max(-d, 0.f);
      const float u = wv_clampf(1.f - inside / depth, 0.f, 0.999f);
      const float profile = wv_sqrt(wv_max(1.f - u * u, 0.001f));
      const float height = thickness * profile;
      const float slope = thickness / depth * u / profile;
      const float nz = 1.f / wv_sqrt(1.f + slope * slope);
      float nx, ny;
      drectGrad(px, py, hw, hh, hw, hh, r, &nx, &ny);
      const float ux = nx, uy = ny;
      nx *= slope * nz; ny *= slope * nz;
      const float transmittedZ = wv_sqrt(wv_max(1.f - eta * eta * (1.f - nz * nz), 0.f));
      const float bend = ior == 1.f ? 0.f : transmittedZ - eta * nz;
      const float travel = (height + thickness * 3.f) / wv_max(transmittedZ, 0.05f);
      float dx = -(px - hw) * shrink - nx * bend * travel;
      const float compression = (ior - 1.f) * .13f;
      float dy = (py - hh) * ((1.f + compression) / zoom - 1.f)
        - ny * bend * travel * u * u;
      const float reach = wv_min(120.f, wv_min(hw, hh) * 1.1f), magnitude = wv_sqrt(dx * dx + dy * dy);
      const float soft = 1.f / wv_sqrt(1.f + (magnitude / reach) * (magnitude / reach));
      // Regularize the tangent singularity before rasterizing either ray field.
      const float taper = wv_clampf(inside / wv_max(thickness * .22f, 1.f), 0.f, 1.f);
      const float boundary = taper * taper * (3.f - 2.f * taper);
      dx *= soft * boundary; dy *= soft * boundary;
      q[0] = (unsigned char)wv_clampf(128.5f + dx * (255.f / 256.f), 0.f, 255.f);
      q[1] = (unsigned char)wv_clampf(128.5f + dy * (255.f / 256.f), 0.f, 255.f);
      const float rs = (nz - ior * transmittedZ) / wv_max(nz + ior * transmittedZ, .0001f);
      const float rp = (ior * nz - transmittedZ) / wv_max(ior * nz + transmittedZ, .0001f);
      const float fresnel = (ior == 1.f ? 0.f : (rs * rs + rp * rp) * .5f) * coverage;
      q[2] = (unsigned char)wv_clampf(fresnel * 255.f, 0.f, 255.f);
      const float reflectedTaper = wv_clampf(inside / wv_max(thickness * .4f, 1.f), 0.f, 1.f);
      const float reflectedBoundary = reflectedTaper * reflectedTaper * (3.f - 2.f * reflectedTaper);
      reflection[0] = (unsigned char)wv_clampf(128.5f + 2.f * nx * nz * probe * reflectedBoundary * (255.f / reflectionRange), 0.f, 255.f);
      reflection[1] = (unsigned char)wv_clampf(128.5f + 2.f * ny * nz * probe * reflectedBoundary * (255.f / reflectionRange), 0.f, 255.f);
      const float interface = wv_clampf((ior - 1.f) / .46f, 0.f, 1.f);
      const float rimWidth = wv_max(thickness * (.045f + .075f * wv_fabs(ux)), .5f);
      const float rimOffset = inside - thickness * (.025f + .03f * wv_fabs(ux));
      const float rimLight = wv_exp(-rimOffset * rimOffset / (rimWidth * rimWidth))
        * wv_clampf(1.04f + ux * .34f - uy * .6f, .1f, 1.f);
      reflection[2] = (unsigned char)(rimLight * interface * coverage * 255.f);
      const float lower = wv_max(ny, 0.f);
      const float facing = wv_clampf(-nx * .4f - ny * .75f, 0.f, 1.f);
      const float front = wv_exp(-inside * inside / .45f) * facing * .32f;
      const float bounce = lower * lower * .52f;
      const float shadow = wv_max(nx * .65f + ny * .25f, 0.f) * slope * nz * .055f;
      const float shoulderWidth = wv_max(depth * .24f, 1.f);
      const float shoulderOffset = inside - depth * .36f;
      const float shoulder = wv_exp(-shoulderOffset * shoulderOffset / (shoulderWidth * shoulderWidth));
      const float angle = (wv_fabs(uy) - .4f) / .22f;
      const float left = wv_max(-ux, 0.f);
      const float focal = shoulder * wv_exp(-angle * angle) * left * left * .92f;
      const float vertical = py / h;
      const float upper = wv_clampf(1.f - vertical / .42f, 0.f, 1.f);
      const float lowerFace = wv_clampf((vertical - .62f) / .06f, 0.f, 1.f);
      const float environment = lowerFace * lowerFace * (3.f - 2.f * lowerFace) * .26f
        - upper * wv_sqrt(upper) * .108f;
      const float illumination = (front + bounce + focal + environment - shadow) * interface;
      relief[0] = relief[1] = relief[2] = illumination >= 0.f ? 255 : 0;
      relief[3] = (unsigned char)(wv_clampf(wv_fabs(illumination), 0.f, 1.f) * coverage * 255.f);
    }
  }
  return 1;
}

/* Aqua Glass: continuous central magnification plus a shallow edge meniscus.
 * RG displacement is encoded for an SVG feDisplacementMap with scale=32. */
EXP("wg_aqua_disp")
int wg_aqua_disp(int w, int h, float r, float depth, float zoom) {
  if (w < 1 || h < 1 || w > GLASS_MAXW || h > GLASS_MAXH) return 0;
  const float hw = w * 0.5f, hh = h * 0.5f;
  r = wv_clampf(r, 0.f, wv_min(hw, hh));
  const float band = wv_max(depth, 1.f);
  const float shrink = 1.f - 1.f / wv_max(zoom, 1.f);
  g_outW = w; g_outH = h;
  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      const float px = x + 0.5f, py = y + 0.5f;
      const float d = drect(px, py, hw, hh, hw, hh, r);
      unsigned char *q = g_out + (y * w + x) * 4;
      q[0] = q[1] = 128; q[2] = 0; q[3] = 255;
      if (d > 0.5f) continue;
      const float inside = wv_max(-d, 0.f);
      const float t = wv_clampf(1.f - inside / band, 0.f, 1.f);
      const float meniscus = t * t * (3.f - 2.f * t) * wv_min(3.6f, band * 0.36f);
      float nx, ny;
      drectGrad(px, py, hw, hh, hw, hh, r, &nx, &ny);
      const float dx = -(px - hw) * shrink - nx * meniscus;
      const float dy = -(py - hh) * shrink - ny * meniscus;
      q[0] = (unsigned char)wv_clampf(128.f + dx * (255.f / 32.f), 0.f, 255.f);
      q[1] = (unsigned char)wv_clampf(128.f + dy * (255.f / 32.f), 0.f, 255.f);
      q[2] = 0;
      q[3] = 255;
    }
  }
  return 1;
}

EXP("wg_aqua_edge")
int wg_aqua_edge(int w, int h, float r, float depth) {
  if (w < 1 || h < 1 || w > GLASS_MAXW || h > GLASS_MAXH) return 0;
  const float hw = w * 0.5f, hh = h * 0.5f;
  r = wv_clampf(r, 0.f, wv_min(hw, hh));
  g_outW = w; g_outH = h;
  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      const float px = x + 0.5f, py = y + 0.5f;
      const float d = drect(px, py, hw, hh, hw, hh, r);
      unsigned char *q = g_out + (y * w + x) * 4;
      q[0] = q[1] = q[2] = q[3] = 0;
      if (d > 1.5f) continue;
      float nx, ny;
      drectGrad(px, py, hw, hh, hw, hh, r, &nx, &ny);
      const float face = wv_clampf(0.54f - 0.38f * nx - 0.45f * ny, 0.f, 1.f);
      const float outer = wv_exp(-(d * d) / 0.55f) * (0.16f + 0.65f * face);
      const float inner = wv_exp(-((d + 2.7f) * (d + 2.7f)) / 1.7f) * (0.02f + 0.12f * face);
      const float shoulder = wv_exp(-((d + depth * 0.6f) * (d + depth * 0.6f)) / 23.f) * face * 0.02f;
      const float shade = wv_exp(-((d + 1.3f) * (d + 1.3f)) / 5.f) * (1.f - face) * 0.08f;
      const float white = outer + inner + shoulder;
      const float alpha = wv_clampf(white + shade, 0.f, 1.f);
      if (alpha < 0.001f) continue;
      const unsigned char value = (unsigned char)(255.f * white / (white + shade));
      q[0] = q[1] = q[2] = value;
      q[3] = (unsigned char)(alpha * 255.f);
    }
  }
  return 1;
}

static unsigned char g_glyph_mask[GLYPH_MAXW * GLYPH_MAXH];
static unsigned char g_glyph_edge[GLYPH_MAXW * GLYPH_MAXH * 4];
static float g_glyph_distance[GLYPH_MAXW * GLYPH_MAXH];
static float g_glyph_smooth[GLYPH_MAXW * GLYPH_MAXH];
static float g_edt_input[GLYPH_MAXW], g_edt_output[GLYPH_MAXW], g_edt_bounds[GLYPH_MAXW + 1];
static int g_edt_sites[GLYPH_MAXW];

/* Lower envelope of squared-distance parabolas, allocation-free O(n). */
static void distanceLine(int n) {
  int k = 0;
  g_edt_sites[0] = 0; g_edt_bounds[0] = -1e12f; g_edt_bounds[1] = 1e12f;
  for (int q = 1; q < n; q++) {
    float intersection;
    do {
      const int p = g_edt_sites[k];
      intersection = ((g_edt_input[q] + q * q) - (g_edt_input[p] + p * p)) / (2.f * (q - p));
      if (intersection > g_edt_bounds[k] || k == 0) break;
      k--;
    } while (true);
    k++;
    g_edt_sites[k] = q; g_edt_bounds[k] = intersection; g_edt_bounds[k + 1] = 1e12f;
  }
  k = 0;
  for (int q = 0; q < n; q++) {
    while (g_edt_bounds[k + 1] < q) k++;
    const int delta = q - g_edt_sites[k];
    g_edt_output[q] = delta * delta + g_edt_input[g_edt_sites[k]];
  }
}

static void glyphEuclideanDistance(int w, int h) {
  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      g_edt_input[x] = g_glyph_mask[y * w + x] < 128 || x == 0 || y == 0 || x == w - 1 || y == h - 1 ? 0.f : 1e9f;
    }
    distanceLine(w);
    for (int x = 0; x < w; x++) g_glyph_distance[y * w + x] = g_edt_output[x];
  }
  for (int x = 0; x < w; x++) {
    for (int y = 0; y < h; y++) g_edt_input[y] = g_glyph_distance[y * w + x];
    distanceLine(h);
    for (int y = 0; y < h; y++) g_glyph_distance[y * w + x] = wv_sqrt(g_edt_output[y]);
  }
  static const float weights[9] = {1.f, 8.f, 28.f, 56.f, 70.f, 56.f, 28.f, 8.f, 1.f};
  for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
    float value = 0.f;
    for (int j = -4; j <= 4; j++) {
      const int xx = x + j;
      if (xx >= 0 && xx < w) value += g_glyph_distance[y * w + xx] * weights[j + 4];
    }
    g_glyph_smooth[y * w + x] = value / 256.f;
  }
  for (int x = 0; x < w; x++) {
    for (int y = 0; y < h; y++) {
      float value = 0.f;
      for (int j = -4; j <= 4; j++) {
        const int yy = y + j;
        if (yy >= 0 && yy < h) value += g_glyph_smooth[yy * w + x] * weights[j + 4];
      }
      g_edt_output[y] = value / 256.f;
    }
    for (int y = 0; y < h; y++) g_glyph_smooth[y * w + x] = g_edt_output[y];
  }
}

EXP("wg_glyph_mask_ptr")
int wg_glyph_mask_ptr(void) { return (int)(unsigned long)g_glyph_mask; }

EXP("wg_glyph_edge_ptr")
int wg_glyph_edge_ptr(void) { return (int)(unsigned long)g_glyph_edge; }

/* The distance field follows the rasterized glyph, including its counters.
 * Two chamfer passes keep this bounded and allocation-free. */
static int renderGlyph(int w, int h, float depth, float pixelRatio, bool aqua) {
  if (w < 1 || h < 1 || w > (aqua ? GLYPH_MAXW : GLASS_MAXW) || h > GLYPH_MAXH) return 0;
  const float bevel = wv_max(1.f, depth);
  const float ratio = wv_max(0.5f, pixelRatio);
  const float diagonal = 1.41421356f;
  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      int i = y * w + x;
      g_glyph_distance[i] = g_glyph_mask[i] < 128 ? 0.f
        : x == 0 || y == 0 || x == w - 1 || y == h - 1 ? 1.f : (float)(w + h);
    }
  }
  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      int i = y * w + x;
      float d = g_glyph_distance[i];
      if (x > 0) d = wv_min(d, g_glyph_distance[i - 1] + 1.f);
      if (y > 0) {
        d = wv_min(d, g_glyph_distance[i - w] + 1.f);
        if (x > 0) d = wv_min(d, g_glyph_distance[i - w - 1] + diagonal);
        if (x < w - 1) d = wv_min(d, g_glyph_distance[i - w + 1] + diagonal);
      }
      g_glyph_distance[i] = d;
    }
  }
  for (int y = h - 1; y >= 0; y--) {
    for (int x = w - 1; x >= 0; x--) {
      int i = y * w + x;
      float d = g_glyph_distance[i];
      if (x < w - 1) d = wv_min(d, g_glyph_distance[i + 1] + 1.f);
      if (y < h - 1) {
        d = wv_min(d, g_glyph_distance[i + w] + 1.f);
        if (x > 0) d = wv_min(d, g_glyph_distance[i + w - 1] + diagonal);
        if (x < w - 1) d = wv_min(d, g_glyph_distance[i + w + 1] + diagonal);
      }
      g_glyph_distance[i] = d;
    }
  }
  if (aqua) glyphEuclideanDistance(w, h);
  g_outW = w; g_outH = h;
  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      int i = y * w + x;
      unsigned char *q = g_out + i * 4, *e = g_glyph_edge + i * 4;
      q[0] = q[1] = 128; q[2] = 0; q[3] = aqua ? 255 : g_glyph_mask[i];
      e[0] = e[1] = e[2] = e[3] = 0;
      if (!g_glyph_mask[i]) continue;
      const float *normalField = aqua ? g_glyph_smooth : g_glyph_distance;
      float nx = (x > 0 ? normalField[i - 1] : 0.f)
               - (x < w - 1 ? normalField[i + 1] : 0.f);
      float ny = (y > 0 ? normalField[i - w] : 0.f)
               - (y < h - 1 ? normalField[i + w] : 0.f);
      float length = wv_sqrt(nx * nx + ny * ny);
      if (aqua) { nx *= 0.5f; ny *= 0.5f; }
      else if (length > 0.001f) { nx /= length; ny /= length; }
      float inside = wv_max(0.f, g_glyph_distance[i] - 0.5f);
      float u = wv_clampf(1.f - inside / bevel, 0.f, 1.f);
      float lens = u * u * (3.f - 2.f * u);
      float dx = nx * lens, dy = ny * lens;
      if (aqua) {
        dx = -nx * (0.08f + lens * 0.52f);
        dy = -ny * (0.08f + lens * 0.52f);
      }
      q[0] = (unsigned char)wv_clampf(128.f + dx * 127.f, 0.f, 255.f);
      q[1] = (unsigned char)wv_clampf(128.f + dy * 127.f, 0.f, 255.f);
      q[2] = (unsigned char)(u * 255.f);
      float lit = wv_clampf(0.5f + 0.5f * (nx * -0.6f + ny * -0.8f), 0.f, 1.f);
      float rim = wv_exp(-inside * inside / (0.7f * ratio * ratio));
      float shoulder = wv_exp(-inside * inside / (0.5f * bevel * bevel));
      float wa = rim * (0.16f + lit * 0.64f) + shoulder * lit * 0.14f;
      float ba = shoulder * (1.f - lit) * 0.26f * (1.f - wa);
      if (aqua) {
        const float inset = inside - wv_min(bevel * 0.46f, ratio * 3.f);
        const float innerRim = wv_exp(-(inset * inset) / (0.9f * ratio * ratio));
        wa = rim * (0.12f + lit * 0.60f) + innerRim * (0.012f + lit * 0.05f)
           + shoulder * lit * 0.04f;
        ba = shoulder * (1.f - lit) * 0.08f * (1.f - wv_clampf(wa, 0.f, 1.f));
      }
      float a = wv_clampf(wa + ba, 0.f, 1.f);
      if (a > 0.f) {
        e[0] = e[1] = e[2] = (unsigned char)(255.f * wa / (wa + ba));
        e[3] = (unsigned char)(a * g_glyph_mask[i]);
      }
    }
  }
  return 1;
}

EXP("wg_glyph_render")
int wg_glyph_render(int w, int h, float depth, float pixelRatio) {
  return renderGlyph(w, h, depth, pixelRatio, false);
}

EXP("wg_aqua_glyph_render")
int wg_aqua_glyph_render(int w, int h, float depth, float pixelRatio) {
  return renderGlyph(w, h, depth, pixelRatio, true);
}
