// wavegfx.cpp — rasterisation temps réel (C++ freestanding, zéro dépendance).
// Produit les surfaces pixelisées du prototype : plan de ville pour l'app Plans.
// Sortie : buffer RGBA linéaire, copié vers un <canvas> côté TS.
#include "wmath.h"
#include "tokens.h"

#define EXP(n) __attribute__((export_name(n)))

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
