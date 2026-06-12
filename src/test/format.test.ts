import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProgressBar,
  calculateUsagePercentage,
  formatPercentage,
  formatSpend,
  getProgressRing,
} from "../format";

test("formatSpend formats finite numbers as USD", () => {
  assert.equal(formatSpend(11.2091181), "$11.21");
});

test("formatSpend falls back for invalid values", () => {
  assert.equal(formatSpend(Number.NaN), "$--.--");
});

test("calculateUsagePercentage allows values above 100 percent", () => {
  assert.equal(calculateUsagePercentage(75, 50), 150);
});

test("calculateUsagePercentage rejects missing or invalid limits", () => {
  assert.equal(calculateUsagePercentage(75, undefined), undefined);
  assert.equal(calculateUsagePercentage(75, 0), undefined);
});

test("formatPercentage keeps values above 100 percent", () => {
  assert.equal(formatPercentage(150), "150.0%");
});

test("getProgressRing returns a text ring indicator", () => {
  assert.equal(getProgressRing(undefined), "○");
  assert.equal(getProgressRing(10), "◔");
  assert.equal(getProgressRing(35), "◑");
  assert.equal(getProgressRing(60), "◕");
  assert.equal(getProgressRing(150), "●");
});

test("buildProgressBar renders a detailed text progress bar", () => {
  assert.equal(buildProgressBar(undefined, 10), "[----------]");
  assert.equal(buildProgressBar(50, 10), "[█████-----]");
  assert.equal(buildProgressBar(150, 10), "[██████████]");
});
