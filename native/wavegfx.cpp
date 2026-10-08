// wavegfx.cpp — moteur graphique WaveOS (C++ freestanding, zéro allocation).
//
// Le compositor natif rendra un jour les panneaux en WebGL/metal ; pour le
// prototype il assume la partie la plus coûteuse à fausser en CSS : le fond.
// `wg_bake_wallpaper` calcule le wallpaper « Rubans » (sombre) ou « Aube »
// (clair) en CPU — dégradé radial, rubans superposés évalués par champ de
// distance capsule puis floutés par un vrai box-blur séparable ×2 (≈gaussien),
// vignette et grain — dans un framebuffer RGBA8 que le JS uploade en ImageData.
// `wg_luminance_region` mesure la luminance moyenne d'une zone du rendu :
// c'est l'entrée du scrim adaptatif de `wc_scrim_tint` (côté wavecore).
#include "wmath.h"
#include "tokens.h"

namespace {

// Dimensions plafond du bake (2× la surface logique 393×852 + marge).
constexpr int MAX_W = 832;
constexpr int MAX_H = 1776;
constexpr int RW_MAX = (MAX_W * 2 + 4) / 5;
constexpr int RH_MAX = (MAX_H * 2 + 4) / 5;

alignas(16) unsigned char g_frame[MAX_W * MAX_H * 4];
alignas(16) float g_rib[RW_MAX * RH_MAX * 3];
alignas(16) float g_tmp[RW_MAX * RH_MAX * 3];

int g_w = 0, g_h = 0, g_rw = 0, g_rh = 0;

struct Vec3 { float r, g, b; };
struct Ribbon {
  float u, v;        // centre, coords normalisées centrées (x∈[-0.5,0.5], y ∈ [-0.5,0.5] relatifs)
  float len, wid;    // demi-longueur et demi-largeur, en unités normalisées
  Vec3  col;
  float intensity;
};

// Inclinaison signature du wallpaper : −16°.
constexpr float K_DIR_X = 0.9612617f;
constexpr float K_DIR_Y = -0.2756374f;

float smoothstep(float a, float b, float x) {
  float t = wv_clampf((x - a) / (b - a), 0.f, 1.f);
  return t * t * (3.f - 2.f * t);
}

Vec3 mix3(Vec3 a, Vec3 b, float t) {
  return { wv_lerpf(a.r, b.r, t), wv_lerpf(a.g, b.g, t), wv_lerpf(a.b, b.b, t) };
}

// Dégradé de base 3 stops + halo radial léger en haut.
Vec3 base_gradient(float nx, float ny, int variant) {
  Vec3 c0, c1, c2, glow;
  if (variant == 0) {                    // « Rubans » — nuit indigo
    c0 = {0.110f, 0.137f, 0.314f};       // #1C2350
    c1 = {0.071f, 0.090f, 0.227f};       // #12173A
    c2 = {0.031f, 0.043f, 0.102f};       // #080B1A
    glow = {0.10f, 0.12f, 0.30f};
  } else {                               // « Aube » — aqua clair
    c0 = {0.918f, 0.973f, 0.945f};       // #EAF8F1
    c1 = {0.757f, 0.918f, 0.894f};       // #C1EAE4
    c2 = {0.612f, 0.827f, 0.847f};       // #9CD3D8
    glow = {0.98f, 1.0f, 0.96f};
  }
  float t = wv_clampf(ny * 1.15f, 0.f, 1.f);
  Vec3 c = t < 0.5f ? mix3(c0, c1, t * 2.f) : mix3(c1, c2, (t - 0.5f) * 2.f);
  float dx = nx - 0.5f, dy = ny - 0.16f;
  float g = wv_exp(-(dx * dx * 4.5f + dy * dy * 7.0f));
  return mix3(c, glow, g * (variant == 0 ? 0.55f : 0.35f));
}

const Ribbon* ribbons_for(int variant, int* count) {
  static const Ribbon dark[] = {
    //   u      v     len   wid      couleur               intensité
    { -0.10f, -0.30f, 0.80f, 0.065f, {0.31f, 0.85f, 1.00f}, 0.85f }, // cyan
    {  0.14f, -0.04f, 0.90f, 0.085f, {0.54f, 0.49f, 1.00f}, 0.78f }, // violet
    { -0.08f,  0.15f, 0.72f, 0.070f, {1.00f, 0.37f, 0.64f}, 0.68f }, // magenta
    {  0.10f,  0.36f, 0.60f, 0.055f, {1.00f, 0.62f, 0.29f}, 0.55f }, // orange
  };
  static const Ribbon light[] = {
    { -0.10f, -0.32f, 0.78f, 0.090f, {1.00f, 1.00f, 1.00f}, 0.38f }, // nacre
    {  0.14f, -0.06f, 0.86f, 0.110f, {0.49f, 0.85f, 0.85f}, 0.42f }, // cyan pâle
    { -0.08f,  0.16f, 0.70f, 0.085f, {0.60f, 0.90f, 0.72f}, 0.36f }, // jade pâle
    {  0.12f,  0.38f, 0.60f, 0.065f, {0.72f, 0.68f, 1.00f}, 0.30f }, // opale
  };
  *count = 4;
  return variant == 0 ? dark : light;
}

// Rasterise les rubans : distance capsule au pixel (repère tourné −16°),
// coverage douce par smoothstep, accumulation additive dans g_rib.
void raster_ribbons(const Ribbon *rb, int n) {
  const float aspect = (float)g_rw / (float)g_rh;
  for (int i = 0; i < n; i++) {
    const Ribbon &R = rb[i];
    for (int y = 0; y < g_rh; y++) {
      float ny = (y + 0.5f) / (float)g_rh - 0.5f;
      // projection dans le repère du ruban
      float py = ny - R.v;
      for (int x = 0; x < g_rw; x++) {
        float nx = ((x + 0.5f) / (float)g_rw - 0.5f) * aspect;
        float px = nx - R.u;
        float proj = px * K_DIR_X + py * K_DIR_Y;   // axe long
        float perp = -px * K_DIR_Y + py * K_DIR_X;  // axe court
        float du = wv_fabs(proj) - R.len;
        float dist = wv_sqrt(wv_max(du, 0.f) * wv_max(du, 0.f) + perp * perp);
        float cov = 1.f - smoothstep(R.wid * 0.30f, R.wid, dist);
        if (cov <= 0.f) continue;
        float a = cov * R.intensity;
        // cœur nacré : le centre du ruban tire vers le blanc — effet soie/
        // aurore au lieu d'une bande de couleur plate.
        float core = 1.f - smoothstep(0.f, R.wid * 0.45f, dist);
        Vec3 col = mix3(R.col, {1.f, 1.f, 1.f}, core * 0.42f);
        float *p = &g_rib[(y * g_rw + x) * 3];
        p[0] += col.r * a; p[1] += col.g * a; p[2] += col.b * a;
      }
    }
  }
}

// Box blur séparable (2 passes = ≈ gaussien suffisant pour des rubans).
void blur_ribbons() {
  const int r = wv_max(6, g_rw / 32);
  const int W = g_rw, H = g_rh;
  // horizontal : g_rib -> g_tmp
  for (int y = 0; y < H; y++) {
    for (int c = 0; c < 3; c++) {
      float acc = 0.f;
      const float *src = &g_rib[y * W * 3 + c];
      float *dst = &g_tmp[y * W * 3 + c];
      for (int x = -r; x <= r; x++) acc += src[(int)wv_clampf((float)x, 0.f, (float)(W - 1)) * 3];
      for (int x = 0; x < W; x++) {
        dst[x * 3] = acc / (float)(2 * r + 1);
        int xa = wv_min(W - 1, x + r + 1), xs = wv_max(0, x - r);
        acc += src[xa * 3] - src[xs * 3];
      }
    }
  }
  // vertical : g_tmp -> g_rib
  for (int y = 0; y < H; y++) {
    for (int x = 0; x < W; x++) {
      float acc0 = 0.f, acc1 = 0.f, acc2 = 0.f;
      for (int yy = -r; yy <= r; yy++) {
        int cy = (int)wv_clampf((float)(y + yy), 0.f, (float)(H - 1));
        const float *s = &g_tmp[(cy * W + x) * 3];
        acc0 += s[0]; acc1 += s[1]; acc2 += s[2];
      }
      float inv = 1.f / (float)(2 * r + 1);
      float *d = &g_rib[(y * W + x) * 3];
      d[0] = acc0 * inv; d[1] = acc1 * inv; d[2] = acc2 * inv;
      // (passe unique verticale — suffisant à cette résolution)
    }
  }
}

float bilinear(const float *buf, float fx, float fy, int chan) {
  int x0 = (int)wv_floor(fx), y0 = (int)wv_floor(fy);
  int x1 = wv_min(x0 + 1, g_rw - 1), y1 = wv_min(y0 + 1, g_rh - 1);
  x0 = wv_max(x0, 0); y0 = wv_max(y0, 0);
  float tx = fx - (float)x0, ty = fy - (float)y0;
  float a = buf[(y0 * g_rw + x0) * 3 + chan], b = buf[(y0 * g_rw + x1) * 3 + chan];
  float c = buf[(y1 * g_rw + x0) * 3 + chan], d = buf[(y1 * g_rw + x1) * 3 + chan];
  return wv_lerpf(wv_lerpf(a, b, tx), wv_lerpf(c, d, tx), ty);
}

unsigned hash2(unsigned x, unsigned y) {
  unsigned h = x * 1973u + y * 9277u + 0x9E3779B9u;
  h ^= h >> 15; h *= 0x85EBCA6Bu; h ^= h >> 13;
  return h;
}

} // namespace

extern "C" {

__attribute__((export_name("wg_bake_wallpaper")))
int wg_bake_wallpaper(int variant, int w, int h) {
  if (w <= 0 || h <= 0 || w > MAX_W || h > MAX_H) return 0;
  g_w = w; g_h = h; g_rw = w * 2 / 5; g_rh = h * 2 / 5;

  int n; const Ribbon *rb = ribbons_for(variant, &n);
  // couche rubans basse résolution → blur → upsample bilinéaire au composite
  for (int i = 0; i < g_rw * g_rh * 3; i++) g_rib[i] = 0.f;
  raster_ribbons(rb, n);
  blur_ribbons(); blur_ribbons();            // 2 passes ≈ diffusion gaussienne

  const float scale = (float)g_rw / (float)g_w;
  for (int y = 0; y < h; y++) {
    float ny = (y + 0.5f) / (float)h;
    unsigned char *row = &g_frame[y * w * 4];
    for (int x = 0; x < w; x++) {
      float nx = (x + 0.5f) / (float)w;
      Vec3 base = base_gradient(nx, ny, variant);
      // lumière ambiante haut-gauche (même direction que le gloss des
      // icônes) — lève le coin éclairé et donne une direction de lumière.
      if (variant == 0) {
        float ax = nx + 0.18f, ay = ny + 0.02f;
        float amb = wv_exp(-(ax * ax * 2.0f + ay * ay * 2.6f));
        base.r += amb * 0.055f; base.g += amb * 0.065f; base.b += amb * 0.085f;
      }
      // screen blend : out = 1-(1-a)(1-b), rubans upsamplés
      float fy = (y + 0.5f) * scale - 0.5f, fx = (x + 0.5f) * scale - 0.5f;
      for (int c = 0; c < 3; c++) {
        float rbv = wv_min(bilinear(g_rib, fx, fy, c), 1.f);
        float v = 1.f - (1.f - (&base.r)[c]) * (1.f - rbv);
        (&base.r)[c] = v;
      }
      // vignette douce
      float vx = nx - 0.5f, vy = ny - 0.5f;
      float vig = 1.f - 0.34f * smoothstep(0.52f, 0.95f, wv_sqrt(vx * vx * 2.f + vy * vy));
      // grain fin ±2.2/255 — casse le banding des dégradés
      float grain = ((float)(hash2((unsigned)x, (unsigned)y) & 0xFF) / 255.f - 0.5f) * 4.4f / 255.f;
      for (int c = 0; c < 3; c++) {
        float v = (&base.r)[c] * vig + grain;
        row[x * 4 + c] = (unsigned char)(wv_clampf(v, 0.f, 1.f) * 255.f + 0.5f);
      }
      row[x * 4 + 3] = 255;
    }
  }
  return (int)(unsigned long)g_frame;
}

__attribute__((export_name("wg_frame_ptr"))) int wg_frame_ptr(void) { return (int)(unsigned long)g_frame; }
__attribute__((export_name("wg_frame_w")))   int wg_frame_w(void)   { return g_w; }
__attribute__((export_name("wg_frame_h")))   int wg_frame_h(void)   { return g_h; }

// Luminance moyenne d'une zone (coords en px du framebuffer) — pour le scrim
// adaptatif. Échantillonnée en pas de 4 : précision suffisante, coût nul.
__attribute__((export_name("wg_luminance_region")))
float wg_luminance_region(int x, int y, int w, int h) {
  if (!g_w) return 0.f;
  int x0 = wv_max(0, x), y0 = wv_max(0, y);
  int x1 = wv_min(g_w, x + w), y1 = wv_min(g_h, y + h);
  if (x1 <= x0 || y1 <= y0) return 0.f;
  double acc = 0.0; long cnt = 0;
  for (int yy = y0; yy < y1; yy += 4) {
    const unsigned char *row = &g_frame[(yy * g_w + x0) * 4];
    for (int xx = x0; xx < x1; xx += 4) {
      const unsigned char *p = &row[(xx - x0) * 4];
      acc += wv_luminance3(p[0] / 255.f, p[1] / 255.f, p[2] / 255.f);
      cnt++;
    }
  }
  return cnt ? (float)(acc / (double)cnt) : 0.f;
}

} // extern "C"
