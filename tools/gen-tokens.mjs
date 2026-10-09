#!/usr/bin/env node
// gen-tokens.mjs — source unique : tokens.json
//   → src/tokens.gen.ts (TypeScript)
//   → native/tokens.h   (C/C++)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const t = JSON.parse(readFileSync(join(root, "tokens.json"), "utf8"));

const ts = `// GENERATED from tokens.json — ne pas éditer (npm run tokens)
export const tokens = ${JSON.stringify(t, null, 2)} as const;
export type Tokens = typeof tokens;
`;

const def = (name, v) => `#define ${name} ${v}f`;
const guard = `// GENERATED from tokens.json — ne pas éditer
#ifndef WAVE_TOKENS_H
#define WAVE_TOKENS_H
${Object.entries(t.spring).map(([k, s]) =>
  `${def(`WVP_SPRING_${k.toUpperCase()}_K`, s.k)}\n${def(`WVP_SPRING_${k.toUpperCase()}_D`, s.d)}\n${def(`WVP_SPRING_${k.toUpperCase()}_M`, s.m)}`).join("\n")}
${def("WVP_RUBBER", t.motion.rubber)}
#define WVP_SCREEN_W ${t.screen.w}
#define WVP_SCREEN_H ${t.screen.h}
#endif
`;

writeFileSync(join(root, "src/tokens.gen.ts"), ts);
writeFileSync(join(root, "native/tokens.h"), guard);
console.log("tokens.gen.ts + native/tokens.h regenerated");
