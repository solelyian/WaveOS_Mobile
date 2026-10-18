import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const { instance } = await WebAssembly.instantiate(readFileSync(new URL("../public/waveos.wasm", import.meta.url)));
const api = instance.exports as unknown as {
  memory: WebAssembly.Memory;
  wg_out_ptr(): number;
  wg_aqua_disp(w: number, h: number, r: number, depth: number, zoom: number): number;
  wg_aqua_edge(w: number, h: number, r: number, depth: number): number;
  wg_aqua_lens(w: number, h: number, r: number, depth: number, thickness: number,
              ior: number, zoom: number, padding: number): number;
  wg_aqua_reflection_ptr(): number;
  wg_aqua_relief_ptr(): number;
  wg_glyph_mask_ptr(): number;
  wg_glyph_edge_ptr(): number;
  wg_aqua_glyph_render(w: number, h: number, depth: number, pixelRatio: number): number;
};
const copy = (w: number, h: number, ptr = api.wg_out_ptr()) =>
  new Uint8Array(api.memory.buffer, ptr, w * h * 4).slice();
const pixel = (map: Uint8Array, w: number, x: number, y: number) =>
  [...map.subarray((y * w + x) * 4, (y * w + x + 1) * 4)];

test("Aqua magnifies the body, not just its perimeter", () => {
  assert.equal(api.wg_aqua_disp(148, 66, 33, 10, 1.12), 1);
  const map = copy(148, 66);
  assert(pixel(map, 148, 48, 33)[0] > 128);
  assert(pixel(map, 148, 100, 33)[0] < 128);
  assert(pixel(map, 148, 74, 20)[1] > 128);
  assert(pixel(map, 148, 74, 46)[1] < 128);
  assert.deepEqual(pixel(map, 148, 0, 0), [128, 128, 0, 255]);
  assert.equal(api.wg_aqua_disp(148, 66, 33, 10, 1), 1);
  assert.deepEqual(pixel(copy(148, 66), 148, 48, 33), [128, 128, 0, 255]);
});

test("Aqua has separate directional front and inset contours", () => {
  assert.equal(api.wg_aqua_edge(64, 64, 32, 10), 1);
  const map = copy(64, 64);
  assert(pixel(map, 64, 32, 0)[3] > pixel(map, 64, 32, 63)[3]);
  assert(pixel(map, 64, 32, 2)[3] > pixel(map, 64, 32, 1)[3]);
  assert.equal(pixel(map, 64, 32, 32)[3], 0);
  assert.equal(pixel(map, 64, 0, 0)[3], 0);
});

test("invalid Aqua dimensions leave existing output untouched", () => {
  api.wg_aqua_disp(64, 64, 32, 10, 1.12);
  const valid = copy(64, 64);
  for (const [w, h] of [[0, 64], [64, 0], [-1, 64], [513, 64], [64, 641]]) {
    assert.equal(api.wg_aqua_disp(w, h, 32, 10, 1.12), 0);
    assert.equal(api.wg_aqua_edge(w, h, 32, 10), 0);
    assert.deepEqual(copy(64, 64), valid);
  }
  for (const [w, h] of [[0, 64], [64, 0], [-1, 64], [1025, 64], [64, 641]]) {
    assert.equal(api.wg_aqua_glyph_render(w, h, 8, 2), 0);
    assert.deepEqual(copy(64, 64), valid);
  }
});

test("Aqua glyphs support triple-resolution masks without changing legacy bounds", () => {
  const w = 1024, h = 588;
  const mask = new Uint8Array(api.memory.buffer, api.wg_glyph_mask_ptr(), w * h);
  mask.fill(0);
  for (let y = 12; y < 90; y++) for (let x = 12; x < 60; x++) mask[y * w + x] = 255;
  assert.equal(api.wg_aqua_glyph_render(w, h, 18, 3), 1);
  assert.equal(pixel(copy(w, h), w, 40, 40)[3], 255);
  const valid = copy(w, h);
  assert.equal(api.wg_aqua_glyph_render(1025, h, 18, 3), 0);
  assert.deepEqual(copy(w, h), valid);
});

test("Aqua glyphs retain counters and refract their tubular bodies", () => {
  const w = 64, h = 64;
  const mask = new Uint8Array(api.memory.buffer, api.wg_glyph_mask_ptr(), w * h);
  mask.fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const r = Math.hypot(x - 32, y - 32);
    if (r > 10 && r < 20) mask[y * w + x] = 255;
  }
  assert.equal(api.wg_aqua_glyph_render(w, h, 8, 2), 1);
  const map = copy(w, h), edge = copy(w, h, api.wg_glyph_edge_ptr());
  assert.deepEqual(pixel(map, w, 32, 32), [128, 128, 0, 255]);
  assert.deepEqual(pixel(edge, w, 32, 32), [0, 0, 0, 0]);
  assert(pixel(map, w, 32, 13)[1] > 128);
  assert(pixel(map, w, 32, 21)[1] < 128);
  assert(pixel(edge, w, 32, 13)[3] > pixel(edge, w, 32, 51)[3]);
});

test("glyph displacement remains continuous across curved stroke medial seams", () => {
  const w = 128, h = 128;
  const mask = new Uint8Array(api.memory.buffer, api.wg_glyph_mask_ptr(), w * h);
  mask.fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const r = Math.hypot(x - 64, y - 64);
    if (r > 34 && r < 48) mask[y * w + x] = 255;
  }
  assert.equal(api.wg_aqua_glyph_render(w, h, 14, 2), 1);
  const map = copy(w, h);
  let maxStep = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    if (!mask[y * w + x]) continue;
    for (const [xx, yy] of [[x + 1, y], [x, y + 1]]) {
      if (!mask[yy * w + xx]) continue;
      const a = pixel(map, w, x, y), b = pixel(map, w, xx, yy);
      maxStep = Math.max(maxStep, Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
    }
  }
  assert(maxStep < 30, `adjacent displacement jump: ${maxStep}/255`);
});

test("volume lens separates transmission, reflection and Fresnel weighting", () => {
  const w = 80, h = 54, padding = 49, mw = w + padding * 2, mh = h + padding * 2;
  assert.equal(api.wg_aqua_lens(w, h, 27, 19, 9, 1.46, 1.18, padding), 1);
  const transmission = copy(mw, mh);
  const reflection = copy(mw, mh, api.wg_aqua_reflection_ptr());
  const relief = copy(mw, mh, api.wg_aqua_relief_ptr());
  const at = (map: Uint8Array, x: number, y: number) => pixel(map, mw, x + padding, y + padding);
  assert(at(transmission, 24, 27)[0] > 128);
  assert(at(transmission, 56, 27)[0] < 128);
  assert(at(transmission, 40, 3)[1] > 128);
  assert(at(reflection, 40, 3)[1] < 128);
  assert(at(reflection, 40, 50)[1] > 128);
  assert(at(transmission, 40, 0)[2] > at(transmission, 40, 27)[2]);
  assert(at(transmission, 40, 27)[2] > 0);
  assert(at(relief, 40, 50)[3] > at(relief, 40, 27)[3]);
  assert(at(reflection, 40, 0)[2] > at(reflection, 40, 53)[2]);
  assert(at(reflection, 79, 27)[2] > at(reflection, 0, 27)[2]);
  assert.equal(at(reflection, 40, 27)[2], 0);
  assert(at(relief, 8, 9)[3] > at(relief, 71, 9)[3]);
  for (const map of [transmission, reflection]) {
    assert.deepEqual(pixel(map, mw, 0, 0), [128, 128, 0, 255]);
    assert.deepEqual(pixel(map, mw, mw - 1, mh - 1), [128, 128, 0, 255]);
  }
  assert.deepEqual(pixel(relief, mw, 0, 0), [0, 0, 0, 0]);
});

test("index-matched lens has no bending, reflection or interface lighting", () => {
  const w = 80, h = 54, padding = 49, mw = w + padding * 2, mh = h + padding * 2;
  assert.equal(api.wg_aqua_lens(w, h, 27, 19, 9, 1, 1, padding), 1);
  const map = copy(mw, mh), relief = copy(mw, mh, api.wg_aqua_relief_ptr());
  const reflection = copy(mw, mh, api.wg_aqua_reflection_ptr());
  for (let i = 0; i < map.length; i += 4) {
    assert.deepEqual([...map.subarray(i, i + 4)], [128, 128, 0, 255]);
    assert.equal(relief[i + 3], 0);
    assert.equal(reflection[i + 2], 0);
  }
});

test("volume lighting grades the upper face and brightens the lower face", () => {
  const w = 80, h = 54, padding = 49, mw = w + padding * 2, mh = h + padding * 2;
  assert.equal(api.wg_aqua_lens(w, h, 27, 19, 9, 1.46, 1, padding), 1);
  const relief = copy(mw, mh, api.wg_aqua_relief_ptr());
  const at = (y: number) => pixel(relief, mw, 40 + padding, y + padding);
  assert.deepEqual(at(3).slice(0, 3), [0, 0, 0]);
  assert(at(3)[3] > at(15)[3]);
  assert.equal(at(27)[3], 0);
  assert.deepEqual(at(42).slice(0, 3), [255, 255, 255]);
  assert(at(42)[3] > 0);
});

test("invalid volume dimensions or optical parameters leave all fields intact", () => {
  assert.equal(api.wg_aqua_lens(80, 54, 27, 19, 9, 1.46, 1.18, 49), 1);
  const pointers = [api.wg_out_ptr(), api.wg_aqua_reflection_ptr(), api.wg_aqua_relief_ptr()];
  const saved = pointers.map(ptr => copy(178, 152, ptr));
  const invalid = [
    [0, 54, 27, 19, 9, 1.46, 1.18, 49],
    [1025, 54, 27, 19, 9, 1.46, 1.18, 0],
    [80, 641, 27, 19, 9, 1.46, 1.18, 0],
    [80, 54, 27, 19, 9, 1.46, 1.18, -1],
    [80, 54, 27, 19, 9, 1.46, 1.18, 257],
    [80, 54, 27, 19, 9, NaN, 1.18, 49],
    [80, 54, 27, 19, Infinity, 1.46, 1.18, 49],
    [80, 54, -1, 19, 9, 1.46, 1.18, 49],
    [80, 54, 27, 0, 9, 1.46, 1.18, 49]
  ];
  for (const [w, h, r, depth, thickness, ior, zoom, padding] of invalid) {
    assert.equal(api.wg_aqua_lens(w, h, r, depth, thickness, ior, zoom, padding), 0);
    pointers.forEach((ptr, i) => assert.deepEqual(copy(178, 152, ptr), saved[i]));
  }
});
