#!/usr/bin/env node
// gen-tokens.mjs — source unique : tokens.json
//   → src/tokens.gen.ts  (consommé par waveui)
//   → native/tokens.h    (consommé par wavecore.c / wavegfx.cpp)
// Les valeurs natives qui pilotent le mouvement et la couleur doivent être
// identiques au pixel et à la milliseconde près dans les deux mondes.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const t = JSON.parse(readFileSync(join(root, "tokens.json"), "utf8"));

const ts = `// GENERATED from tokens.json — ne pas éditer à la main (npm run tokens)
export const tokens = ${JSON.stringify(t, null, 2)} as const;
export type Tokens = typeof tokens;
`;

const guard = `// GENERATED from tokens.json — ne pas éditer à la main
#ifndef WAVE_TOKENS_H
#define WAVE_TOKENS_H

#define WVP_SPRING_SNAPPY_K ${t.spring.snappy.k}f
#define WVP_SPRING_SNAPPY_D ${t.spring.snappy.d}f
#define WVP_SPRING_SOFT_K ${t.spring.soft.k}f
#define WVP_SPRING_SOFT_D ${t.spring.soft.d}f
#define WVP_SPRING_BOUNCE_K ${t.spring.bounce.k}f
#define WVP_SPRING_BOUNCE_D ${t.spring.bounce.d}f
#define WVP_SPRING_SHEET_K ${t.spring.sheet.k}f
#define WVP_SPRING_SHEET_D ${t.spring.sheet.d}f
#define WVP_RUBBER_COEF ${t.duration.rubber}f
#define WVP_SCREEN_W ${t.screen.w}
#define WVP_SCREEN_H ${t.screen.h}
#define WVP_SQUIRCLE_N ${t.radius.squircleN}f

#endif // WAVE_TOKENS_H
`;

writeFileSync(join(root, "src/tokens.gen.ts"), ts);
writeFileSync(join(root, "native/tokens.h"), guard);
console.log("tokens.gen.ts + native/tokens.h regenerated");
