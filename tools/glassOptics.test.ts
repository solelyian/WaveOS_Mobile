import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const { instance } = await WebAssembly.instantiate(readFileSync(new URL("../public/waveos.wasm", import.meta.url)));
const api = instance.exports as unknown as {
  memory: WebAssembly.Memory;
  wg_out_ptr(): number;
  wg_glass_disp(w: number, h: number, r: number, amp: number, depth?: number): void;
  wg_glass_edge(w: number, h: number, r: number, depth?: number): void;
};
const copy = (w: number, h: number) => new Uint8Array(api.memory.buffer, api.wg_out_ptr(), w * h * 4).slice();
const pixel = (map: Uint8Array, w: number, x: number, y: number) => [...map.slice((y * w + x) * 4, (y * w + x + 1) * 4)];

test("control lens ends before the clear center of a circle", () => {
  api.wg_glass_disp(64, 64, 32, 1, 7.68);
  const map = copy(64, 64);
  assert.deepEqual(pixel(map, 64, 32, 32), [128, 128, 0, 255]);
  assert.deepEqual(pixel(map, 64, 32, 12), [128, 128, 0, 255]);
  const top = pixel(map, 64, 32, 0);
  const bottom = pixel(map, 64, 32, 63);
  assert(top[1] < 24);
  assert(bottom[1] > 230);
  assert(top[0] >= 126 && top[0] <= 132);
  assert.equal(pixel(map, 64, 0, 0)[3], 0);
  const magnitude = [0, 2, 4, 6, 8].map(y => Math.abs(pixel(map, 64, 32, y)[1] - 128));
  assert(magnitude.every((v, i) => !i || v <= magnitude[i - 1]));
});

test("capsules keep a clear body and bend only their perimeter", () => {
  api.wg_glass_disp(148, 66, 33, 1, 7.92);
  const map = copy(148, 66);
  for (const [x, y] of [[74, 33], [74, 16], [40, 33], [107, 33]]) {
    assert.deepEqual(pixel(map, 148, x, y), [128, 128, 0, 255]);
  }
  assert(pixel(map, 148, 0, 33)[0] < 24);
  assert(pixel(map, 148, 147, 33)[0] > 230);
  assert(pixel(map, 148, 74, 0)[1] < 24);
  assert.equal(pixel(map, 148, 0, 0)[3], 0);
});

test("legacy glass retains its original 30px profile", () => {
  for (const [w, h, r] of [[40, 40, 20], [148, 66, 33]]) {
    api.wg_glass_disp(w, h, r, 1);
    const legacy = copy(w, h);
    api.wg_glass_disp(w, h, r, 1, 30);
    assert.deepEqual(copy(w, h), legacy);
    api.wg_glass_edge(w, h, r);
    const edge = copy(w, h);
    api.wg_glass_edge(w, h, r, 30);
    assert.deepEqual(copy(w, h), edge);
  }
});

test("control relief follows the same edge band without a central ring", () => {
  api.wg_glass_edge(64, 64, 32, 7.68);
  const map = copy(64, 64);
  assert.equal(pixel(map, 64, 32, 32)[3], 0);
  assert(pixel(map, 64, 32, 0)[3] > pixel(map, 64, 32, 63)[3]);
  assert(pixel(map, 64, 32, 7)[3] > 0);
});
