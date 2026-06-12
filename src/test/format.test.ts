import assert from "node:assert/strict";
import test from "node:test";
import { formatSpend } from "../format";

test("formatSpend formats finite numbers as USD", () => {
  assert.equal(formatSpend(11.2091181), "$11.21");
});

test("formatSpend falls back for invalid values", () => {
  assert.equal(formatSpend(Number.NaN), "$--.--");
});
