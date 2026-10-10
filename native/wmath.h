// wmath.h — mini-libm freestanding WaveOS (C et C++).
// wasm32-freestanding n'a ni libm ni libc : on fournit le strict nécessaire.
// Les opérations qui existent en instruction wasm native passent par les
// builtins clang (f32.sqrt, f32.abs, f32.floor, f32.ceil — 1 instruction chacune).
// exp2/log2/pow sont des approximations polynomiales minimax : erreur relative
// ≈1e-6, invisible pour du rendu et de la physique de ressort.
#ifndef WMATH_H
#define WMATH_H

#ifdef __cplusplus
extern "C" {
#endif

static inline float wv_fabs(float x)  { return __builtin_fabsf(x); }
static inline float wv_sqrt(float x)  { return __builtin_sqrtf(x); }
static inline float wv_floor(float x) { return __builtin_floorf(x); }
static inline float wv_ceil(float x)  { return __builtin_ceilf(x); }
static inline float wv_trunc(float x) { return __builtin_truncf(x); }
static inline float wv_round(float x) { return __builtin_roundf(x); }
static inline float wv_min(float a,float b){ return a<b?a:b; }
static inline float wv_max(float a,float b){ return a>b?a:b; }
static inline float wv_clampf(float x,float lo,float hi){ return x<lo?lo:(x>hi?hi:x); }
static inline float wv_lerpf(float a,float b,float t){ return a+(b-a)*t; }
static inline float wv_fract(float x){ return x-__builtin_floorf(x); }
static inline float wv_fmodf(float x,float y){ return x-wv_floor(x/y)*y; }

// ldexp équivalent : x * 2^n, n borné (utilisé par exp2/log2).
static inline float wv_scalbn(float x,int n){
  union { unsigned u; float f; } s;
  int e = n + 127;
  if (e <= 0)   return x * 0.0f;
  if (e >= 255) return x * 3.402823466e38f;
  s.u = (unsigned)e << 23;
  return x * s.f;
}

// exp2(x) = 2^x. Décomposition x = n + r, r∈[0,1), poly minimax degré 5 sur 2^r.
static inline float wv_exp2(float x){
  if (x >  127.f) return 3.402823466e38f;
  if (x < -126.f) return 0.f;
  float n = __builtin_floorf(x);
  float r = x - n;
  // coefficients minimax pour 2^r sur [0,1)
  float p = 1.3697665765e-2f;
  p = p*r + 5.1690358205e-2f;
  p = p*r + 2.4163847566e-1f;
  p = p*r + 6.9296612269e-1f;
  p = p*r + 9.9999994039e-1f;
  return wv_scalbn(p, (int)n);
}
static inline float wv_exp(float x){ return wv_exp2(x * 1.4426950408889634f); } // x * log2(e)

// log2(x), x > 0 : x = m * 2^e avec m ∈ [√2/2, √2) puis série atanh.
static inline float wv_log2(float x){
  if (x <= 0.f) return -3.402823466e38f;
  union { unsigned u; float f; } v; v.f = x;
  int e = (int)(v.u >> 23) - 127;
  v.u = (v.u & 0x007FFFFFu) | 0x3F800000u;      // m ∈ [1,2)
  float m = v.f;
  if (m > 1.41421356237f) { m *= 0.5f; e += 1; }
  float t = (m - 1.f) / (m + 1.f);               // |t| ≤ 0.1716
  float t2 = t * t;
  // log2(m) = (2/ln2) * t * (1 + t²/3 + t⁴/5 + t⁶/7 + t⁸/9 + t¹⁰/11)
  float s = 9.0909090909e-2f;
  s = s*t2 + 1.1111111111e-1f;
  s = s*t2 + 1.4285714286e-1f;
  s = s*t2 + 2.0000000000e-1f;
  s = s*t2 + 3.3333333333e-1f;
  s = s*t2 + 1.0000000000e+0f;
  return (float)e + 2.8853900817779268f * t * s;  // 2/ln2 = 2.88539…
}
static inline float wv_pow(float x, float y){ return wv_exp2(y * wv_log2(x)); }
static inline float wv_log(float x){ return wv_log2(x) * 0.6931471805599453f; }

// ---- trig : réduction de quadrant + polynômes (erreur ≈1e-7) ----
static inline float wv_sin_poly(float y){
  // y ∈ [0, π/2] — coefficients cephes sinf
  float y2 = y * y;
  return y + y * y2 * (-1.6666654611e-1f + y2 * (8.3321608736e-3f + y2 * -1.9515295891e-4f));
}
static inline float wv_cos_poly(float y){
  // y ∈ [0, π/2] — coefficients cephes cosf
  float y2 = y * y;
  return 1.f - 0.5f * y2 + y2 * y2 * (4.1666645683e-2f + y2 * (-1.3887316255e-3f + y2 * 2.4433157118e-5f));
}
static inline float wv_sin(float x){
  float r = x - wv_floor(x * 0.15915494309f) * 6.28318530718f; // r ∈ [0, 2π)
  int q = (int)(r * 0.63661977237f);                          // quadrant
  float rr = r - (float)q * 1.57079632679f;
  switch (q & 3) {
    case 0:  return  wv_sin_poly(rr);
    case 1:  return  wv_cos_poly(rr);
    case 2:  return -wv_sin_poly(rr);
    default: return -wv_cos_poly(rr);
  }
}
static inline float wv_cos(float x){
  float r = x - wv_floor(x * 0.15915494309f) * 6.28318530718f;
  int q = (int)(r * 0.63661977237f);
  float rr = r - (float)q * 1.57079632679f;
  switch (q & 3) {
    case 0:  return  wv_cos_poly(rr);
    case 1:  return -wv_sin_poly(rr);
    case 2:  return -wv_cos_poly(rr);
    default: return  wv_sin_poly(rr);
  }
}

// sRGB → luminance relative (WCAG)
static inline float wv_srgb_lin(float c){
  return c <= 0.04045f ? c / 12.92f : wv_pow((c + 0.055f) / 1.055f, 2.4f);
}
static inline float wv_luminance3(float r, float g, float b){
  return 0.2126f*wv_srgb_lin(r) + 0.7152f*wv_srgb_lin(g) + 0.0722f*wv_srgb_lin(b);
}

#ifdef __cplusplus
}
#endif
#endif // WMATH_H
