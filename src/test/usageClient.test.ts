import assert from "node:assert/strict";
import test from "node:test";
import { parseUsageInfo } from "../usageClient";

test("parseUsageInfo extracts spend and optional metadata", () => {
  const usage = parseUsageInfo({
    info: {
      key_name: "sk-...GMcA",
      spend: 11.2091181,
      updated_at: "2026-06-12T03:11:05.466000+00:00",
    },
  });

  assert.deepEqual(usage, {
    keyName: "sk-...GMcA",
    spend: 11.2091181,
    updatedAt: "2026-06-12T03:11:05.466000+00:00",
  });
});

test("parseUsageInfo rejects missing spend", () => {
  assert.throws(() => parseUsageInfo({ info: {} }), /info\.spend/);
});
