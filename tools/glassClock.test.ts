import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const { instance } = await WebAssembly.instantiate(readFileSync(new URL("../public/waveos.wasm", import.meta.url)));
const api = instance.exports as unknown as {
  memory: WebAssembly.Memory;
  wg_out_ptr(): number;
  wg_glyph_mask_ptr(): number;
  wg_glyph_edge_ptr(): number;
  wg_glyph_render(w: number, h: number, depth: number, pixelRatio: number): number;
};
const w = 64, h = 64;
const mask = new Uint8Array(api.memory.buffer, api.wg_glyph_mask_ptr(), w * h);
const pixel = (buf: Uint8Array, x: number, y: number) => [...buf.subarray((y * w + x) * 4, (y * w + x + 1) * 4)];

test("glyph material follows each contour, including the counter of a digit", () => {
  mask.fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const r = Math.hypot(x - 32, y - 32);
    if (r > 10 && r < 20) mask[y * w + x] = 255;
  }
  assert.equal(api.wg_glyph_render(w, h, 4, 2), 1);
  const lens = new Uint8Array(api.memory.buffer, api.wg_out_ptr(), w * h * 4).slice();
  const relief = new Uint8Array(api.memory.buffer, api.wg_glyph_edge_ptr(), w * h * 4).slice();
  assert.deepEqual(pixel(lens, 32, 32), [128, 128, 0, 0]);
  assert.deepEqual(pixel(relief, 32, 32), [0, 0, 0, 0]);
  assert(pixel(lens, 32, 13)[1] < 128);
  assert(pixel(lens, 32, 21)[1] > 128);
  assert(pixel(relief, 32, 13)[3] > pixel(relief, 32, 51)[3]);
  assert(pixel(relief, 32, 21)[3] > 0);
});

test("clear core, antialiasing, and bounds preserve older glass buffers", () => {
  mask.fill(0);
  for (let y = 10; y < 43; y++) for (let x = 10; x < 43; x++) mask[y * w + x] = 255;
  mask[20 * w + 10] = 80;
  assert.equal(api.wg_glyph_render(w, h, 4, 2), 1);
  const lens = new Uint8Array(api.memory.buffer, api.wg_out_ptr(), w * h * 4).slice();
  assert.deepEqual(pixel(lens, 20, 20), [128, 128, 0, 255]);
  assert.equal(pixel(lens, 10, 20)[3], 80);
  assert.equal(pixel(lens, 9, 20)[3], 0);
  assert.equal(api.wg_glyph_render(513, h, 4, 2), 0);
  assert.deepEqual(new Uint8Array(api.memory.buffer, api.wg_out_ptr(), w * h * 4), lens);
});
