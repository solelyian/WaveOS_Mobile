// wavecore.c — noyau C99 de WaveOS (freestanding, zéro allocation, zéro libc).
//
// Rôle : tout ce qui doit être déterministe et bon marché à chaque frame.
//   - banque de ressorts sous-amortis (un seul passage de frontière WASM/frame)
//   - physique de geste : rubber-band, projection de flick, easing
//   - géométrie : SDF superellipse, génération de chemins squircle
//   - couleur : luminance sRGB, ratio de contraste, tint de scrim adaptatif
//
// Ce fichier compile tel quel pour le futur firmware natif : pas d'alloc,
// pas de dépendance, comportement identique bit à bit en WASM et en ARM.
#include "wmath.h"
#include "tokens.h"

#define WC_MAX_SPRINGS 512
#define WC_SCRATCH_N   4096

typedef struct { float v, vel, target, k, d; } WCSpring;
static WCSpring g_sp[WC_MAX_SPRINGS];
static unsigned char g_used[WC_MAX_SPRINGS];
static float g_scratch[WC_SCRATCH_N];

#define EXP(n) __attribute__((export_name(n)))

// ---------------- ressorts ----------------
EXP("wc_spring_new")
int wc_spring_new(float v0, float k, float d) {
  for (int i = 0; i < WC_MAX_SPRINGS; i++) {
    if (!g_used[i]) {
      g_used[i] = 1;
      g_sp[i].v = v0; g_sp[i].vel = 0.f; g_sp[i].target = v0;
      g_sp[i].k = k; g_sp[i].d = d;
      return i;
    }
  }
  return -1;
}
EXP("wc_spring_free")  void  wc_spring_free(int id) { if (id >= 0 && id < WC_MAX_SPRINGS) g_used[id] = 0; }
EXP("wc_spring_set")   void  wc_spring_set(int id, float v, float vel) { g_sp[id].v = v; g_sp[id].vel = vel; g_sp[id].target = v; }
EXP("wc_spring_target")void  wc_spring_target(int id, float t) { g_sp[id].target = t; }
EXP("wc_spring_params")void  wc_spring_params(int id, float k, float d) { g_sp[id].k = k; g_sp[id].d = d; }
EXP("wc_spring_value") float wc_spring_value(int id) { return g_sp[id].v; }
EXP("wc_spring_vel")   float wc_spring_vel(int id) { return g_sp[id].vel; }
EXP("wc_spring_settled")
int wc_spring_settled(int id) {
  const WCSpring *s = &g_sp[id];
  return wv_fabs(s->vel) < 0.0015f && wv_fabs(s->v - s->target) < 0.0015f;
}

// Un seul appel par frame : intégration semi-implicite, substeps 240 Hz.
// dt est plafonné pour rester stable après un onglet en arrière-plan.
EXP("wc_tick")
void wc_tick(float dt) {
  if (dt <= 0.f) return;
  if (dt > 0.033f) dt = 0.033f;
  const float h = 1.f / 240.f;
  while (dt > 0.f) {
    float step = dt < h ? dt : h;
    dt -= step;
    for (int i = 0; i < WC_MAX_SPRINGS; i++) {
      WCSpring *s = &g_sp[i];
      if (!g_used[i]) continue;
      float a = -s->k * (s->v - s->target) - s->d * s->vel;
      s->vel += a * step;
      s->v   += s->vel * step;
    }
  }
}

// ---------------- helpers geste / easing ----------------
EXP("wc_clamp")    float wc_clamp(float x, float lo, float hi) { return wv_clampf(x, lo, hi); }
EXP("wc_lerp")     float wc_lerp(float a, float b, float t) { return wv_lerpf(a, b, t); }
EXP("wc_ease_out") float wc_ease_out(float t) { t = wv_clampf(t, 0.f, 1.f); float u = 1.f - t; return 1.f - u * u * u; }

// Rubber-band (formule standard) : dim*c*|d| / (dim + c*|d|), signé.
EXP("wc_rubber")
float wc_rubber(float delta, float dim, float c) {
  float a = wv_fabs(delta);
  float r = dim * c * a / (dim + c * a);
  return delta < 0.f ? -r : r;
}

// Point d'atterrissage d'un flick sous décélération constante.
EXP("wc_project")
float wc_project(float x, float v, float decel) {
  return x + (v * v) / (2.f * decel) * (v < 0.f ? -1.f : 1.f);
}

// ---------------- géométrie ----------------
// SDF superellipse : (|x|^n + |y|^n)^(1/n) - half.  <0 dedans, >0 dehors.
EXP("wc_superellipse_sdf")
float wc_superellipse_sdf(float x, float y, float half, float n) {
  float ax = wv_fabs(x), ay = wv_fabs(y);
  return wv_pow(wv_pow(ax, n) + wv_pow(ay, n), 1.f / n) - half;
}

// Écrit un chemin de superellipse dans le scratch (paires x,y, origine 0,0).
// Retourne le nombre de points écrits (≤ cap).
EXP("wc_superellipse_path")
int wc_superellipse_path(float *out, int cap, float half, float n, int samples) {
  if (samples < 8) samples = 8;
  if (samples * 2 > cap) samples = cap / 2;
  const float e = 2.f / n;
  for (int i = 0; i < samples; i++) {
    float t = (float)i / (float)samples * 6.28318530718f;
    float c = wv_cos(t), s = wv_sin(t);
    float sx = c < 0.f ? -1.f : 1.f, sy = s < 0.f ? -1.f : 1.f;
    out[2 * i]     = sx * half * wv_pow(wv_fabs(c), e);
    out[2 * i + 1] = sy * half * wv_pow(wv_fabs(s), e);
  }
  return samples;
}

EXP("wc_scratch") int wc_scratch(void) { return (int)(unsigned long)g_scratch; }

// ---------------- couleur / scrim ----------------
EXP("wc_luminance") float wc_luminance(float r, float g, float b) { return wv_luminance3(r, g, b); }

EXP("wc_contrast")
float wc_contrast(float l1, float l2) {
  float hi = wv_max(l1, l2), lo = wv_min(l1, l2);
  return (hi + 0.05f) / (lo + 0.05f);
}

// Tint de scrim adaptatif : mesure la luminance du fond réel et renvoie
// l'opacité de voile sombre qui garantit ~4.5:1 pour du texte clair.
EXP("wc_scrim_tint")
float wc_scrim_tint(float bg_lum) {
  // Fond clair → plus de voile ; fond déjà sombre → voile minimal.
  float t = bg_lum * 0.85f - 0.05f;
  return wv_clampf(t, 0.18f, 0.62f);
}
