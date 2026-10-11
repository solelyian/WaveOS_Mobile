import assert from "node:assert/strict";
import { test } from "node:test";
import { BOOT_DURATION, REDUCED_BOOT_DURATION, bootFrameAt } from "../src/system/bootAnimation.ts";

test("boot phases follow the reference sequence", () => {
  for (const [time, phase] of [[0, "manufacturer"], [4.3, "cloud"], [5.8, "ring"], [6.5, "morph"], [7.3, "wordmark"]] as const) {
    assert.equal(bootFrameAt(time).phase, phase);
  }
  assert.equal(bootFrameAt(BOOT_DURATION - .001).done, false);
  assert.equal(bootFrameAt(BOOT_DURATION).done, true);
});

test("timeline is deterministic, bounded and finite at every frame", () => {
  const bounded = ["manufacturerOpacity", "sweep", "sweepOpacity", "cloudOpacity", "convergence",
    "morph", "wordmarkOpacity", "ringGlyphOpacity", "underlineOpacity", "exitOpacity"] as const;
  for (let i = -10; i <= 1200; i++) {
    const time = i / 120;
    const frame = bootFrameAt(time);
    assert.deepEqual(frame, bootFrameAt(time));
    assert(frame.wordmarkScale >= 1 && frame.wordmarkScale <= 4.9);
    for (const key of bounded) {
      assert(Number.isFinite(frame[key]), `${key} at ${time}`);
      assert(frame[key] >= 0 && frame[key] <= 1, `${key} at ${time}`);
    }
  }
});

test("the particle ring hands off continuously to the O", () => {
  for (let time = 5.8; time <= 7.2; time += 1 / 120) {
    const frame = bootFrameAt(time);
    assert(Math.max(frame.cloudOpacity, frame.ringGlyphOpacity) > .5);
  }
  assert(bootFrameAt(5.95).wordmarkOpacity > 0);
  assert.equal(bootFrameAt(6.6).underlineOpacity, 0);
  assert.equal(bootFrameAt(7.3).underlineOpacity, 1);
});

test("wordmark scale settles monotonically without overshoot", () => {
  let previous = 4.9;
  for (let i = 0; i <= 100; i++) {
    const scale = bootFrameAt(6.45 + i / 100).wordmarkScale;
    assert(scale <= previous);
    previous = scale;
  }
  assert.equal(previous, 1);
});

test("reduced motion omits the light sweep and particles", () => {
  for (let i = 0; i <= 200; i++) {
    const frame = bootFrameAt(i / 100, true);
    assert.equal(frame.phase, "wordmark");
    assert.equal(frame.manufacturerOpacity, 0);
    assert.equal(frame.sweepOpacity, 0);
    assert.equal(frame.cloudOpacity, 0);
    assert.equal(frame.morph, 1);
    assert.equal(frame.wordmarkScale, 1);
  }
  assert.equal(bootFrameAt(REDUCED_BOOT_DURATION - .001, true).done, false);
  assert.equal(bootFrameAt(REDUCED_BOOT_DURATION, true).done, true);
});
