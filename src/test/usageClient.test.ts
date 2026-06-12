import assert from "node:assert/strict";
import test from "node:test";
import { parseUsageInfo, parseUserName } from "../usageClient";

test("parseUsageInfo extracts spend and optional metadata", () => {
  const usage = parseUsageInfo({
    info: {
      key_alias: "Claude Code - min_liu",
      key_name: "sk-...GMcA",
      model_max_budget: {
        "claude-opus-4-6": {
          budget_limit: 50,
          time_period: "30d",
        },
      },
      spend: 11.2091181,
      updated_at: "2026-06-12T03:11:05.466000+00:00",
    },
  });

  assert.deepEqual(usage, {
    budgetLimit: 50,
    keyAlias: "Claude Code - min_liu",
    keyName: "sk-...GMcA",
    spend: 11.2091181,
    updatedAt: "2026-06-12T03:11:05.466000+00:00",
    userName: "min_liu",
  });
});

test("parseUserName extracts the suffix from key alias", () => {
  assert.equal(parseUserName("Claude Code - min_liu"), "min_liu");
});

test("parseUserName falls back to the full alias", () => {
  assert.equal(parseUserName("min_liu"), "min_liu");
});

test("parseUsageInfo uses max_budget before model_max_budget", () => {
  const usage = parseUsageInfo({
    info: {
      max_budget: 100,
      model_max_budget: {
        modelA: {
          budget_limit: 50,
        },
      },
      spend: 150,
    },
  });

  assert.equal(usage.budgetLimit, 100);
  assert.equal(usage.spend, 150);
});

test("parseUsageInfo uses the largest model budget limit", () => {
  const usage = parseUsageInfo({
    info: {
      model_max_budget: {
        modelA: {
          budget_limit: 50,
        },
        modelB: {
          budget_limit: 75,
        },
      },
      spend: 120,
    },
  });

  assert.equal(usage.budgetLimit, 75);
});

test("parseUsageInfo rejects missing spend", () => {
  assert.throws(() => parseUsageInfo({ info: {} }), /info\.spend/);
});
