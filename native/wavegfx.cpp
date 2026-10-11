// wavegfx.cpp — rasterisation temps réel (C++ freestanding, zéro dépendance).
// Produit les surfaces pixelisées du prototype : plan de ville pour l'app Plans.
// Sortie : buffer RGBA linéaire, copié vers un <canvas> côté TS.
#include "wmath.h"
#include "tokens.h"

#define EXP(n) __attribute__((export_name(n)))

#define GLASS_MAXW 512
#define GLASS_MAXH 640

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
static unsigned char g_out[GLASS_MAXW * GLASS_MAXH * 4];
static int g_bgW = 0, g_bgH = 0;
static int g_outW = 0, g_outH = 0;

EXP("wg_bg_ptr") int wg_bg_ptr(void) { return (int)(unsigned long)g_bg; }
EXP("wg_out_ptr") int wg_out_ptr(void) { return (int)(unsigned long)g_out; }

EXP("wg_glass_set_bg")
void wg_glass_set_bg(int w, int h) {
  g_bgW = w > GLASS_MAXW ? GLASS_MAXW : w;
  g_bgH = h > GLASS_MAXH ? GLASS_MAXH : h;
}

// échantillon bilinéaire du fond, borné
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
  if (w > GLASS_MAXW) w = GLASS_MAXW;
  if (h > GLASS_MAXH) h = GLASS_MAXH;
  g_outW = w; g_outH = h;
  const float hw = w * 0.5f, hh = h * 0.5f;
  const float BEND = 14.f;      // amplitude de réfraction près du bord
  const float EDGE = 26.f;      // profondeur de la lentille de bord
  const float FROST = 3.2f;     // rayon du givrage
  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      float px = x + 0.5f, py = y + 0.5f;
      float d = drect(px, py, hw, hh, hw, hh, r);   // <0 dedans

      // alpha du contour (AA ~1.4px)
      float cov = wv_clampf(0.5f - d / 1.4f, 0.f, 1.f);
      if (cov <= 0.f) { unsigned char *q = g_out + (y*w+x)*4; q[3] = 0; continue; }

      // normale de bord + réfraction : les pixels proches du bord
      // échantillonnent le fond décalé vers l'intérieur (lentille).
      float gx, gy; drectGrad(px, py, hw, hh, hw, hh, r, &gx, &gy);
      float inside = wv_max(-d, 0.f);
      float bend = BEND * wv_exp(-inside / EDGE);

      // givrage : moyenne de 5 taps autour du point réfracté
      float sx = ox + px - gx * bend, sy = oy + py - gy * bend;
      float rr = 0, gg = 0, bb = 0;
      for (int i = 0; i < 5; i++) {
        float ang = i == 0 ? 0.f : i * 1.5707963f + 0.7853981f;
        float dxs = i == 0 ? 0.f : wv_cos(ang) * FROST;
        float dys = i == 0 ? 0.f : wv_sin(ang) * FROST;
        float sr, sg, sb; bgSample(sx + dxs, sy + dys, &sr, &sg, &sb);
        rr += sr; gg += sg; bb += sb;
      }
      rr /= 5.f; gg /= 5.f; bb /= 5.f;

      // corps vitré : teinte + assombrissement en bas (épaisseur)
      float vert = py / h;
      float bodyA = al * (0.75f + 0.25f * (1.f - vert));
      float R = wv_lerpf(rr, tr, bodyA);
      float G = wv_lerpf(gg, tg, bodyA);
      float B = wv_lerpf(bb, tb, bodyA);

      // rim fresnel : liseré lumineux sur le bord intérieur
      float rim = wv_clampf(1.f - inside / 2.6f, 0.f, 1.f);
      float rimIn = wv_clampf(1.f - inside / 10.f, 0.f, 1.f) * 0.22f;
      R += 255.f * rim * 0.55f + 255.f * rimIn; G += 255.f * rim * 0.55f + 255.f * rimIn; B += 255.f * rim * 0.55f + 255.f * rimIn;

      // reflet spéculaire : bande diagonale haut-gauche
      float dl = (px * 0.82f + py * 0.57f) / wv_sqrt(hw * hw + hh * hh);
      float spec = wv_exp(-wv_fabs(dl - 0.38f) * 8.5f) * wv_clampf(1.f - vert * 1.6f, 0.f, 1.f);
      R += 255.f * spec * 0.30f; G += 255.f * spec * 0.30f; B += 255.f * spec * 0.30f;

      // ombre interne bas (masse de verre)
      float ish = wv_clampf((vert - 0.72f) / 0.28f, 0.f, 1.f) * 0.14f;
      R -= 255.f * ish * (inside > 4.f ? 1.f : inside / 4.f);
      G -= 255.f * ish * (inside > 4.f ? 1.f : inside / 4.f);
      B -= 255.f * ish * (inside > 4.f ? 1.f : inside / 4.f);

      unsigned char *q = g_out + (y * w + x) * 4;
      q[0] = (unsigned char)wv_clampf(R, 0.f, 255.f);
      q[1] = (unsigned char)wv_clampf(G, 0.f, 255.f);
      q[2] = (unsigned char)wv_clampf(B, 0.f, 255.f);
      q[3] = (unsigned char)(cov * 255.f);
    }
  }
}

EXP("wg_glass_size")
void wg_glass_size(int *w, int *h) { *w = g_outW; *h = g_outH; }
