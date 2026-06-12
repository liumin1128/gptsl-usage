# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run compile    # TypeScript compile (tsc)
npm run watch      # TypeScript watch mode for development
npm run test       # compile then run all tests
npm run package    # build .vsix package for distribution
```

Run a single test file:
```bash
node --test out/test/format.test.js
```

To debug the extension in VSCode, use **Run > Start Debugging** (F5), which launches the Extension Development Host via `.vscode/launch.json`.

## Architecture

This is a VSCode extension that polls a GenAI key usage endpoint and displays the current spend or budget percentage in the status bar.

Data flows in one direction:

```
usageClient.ts  →  statusBar.ts  →  VS Code status bar
format.ts       ↗
```

- **[src/extension.ts](src/extension.ts)** — Entry point. Calls `registerUsageStatusBar` and nothing else.
- **[src/statusBar.ts](src/statusBar.ts)** — All VSCode integration: `UsageStatusBarController` class owns the `StatusBarItem`, handles the refresh lifecycle (race condition is avoided via an integer `refreshToken`), registers commands, and listens for configuration changes. `registerUsageStatusBar` wires everything into `context.subscriptions`.
- **[src/usageClient.ts](src/usageClient.ts)** — Fetches from the internal endpoint and parses the raw response into a `UsageInfo` object. Budget limit resolution prefers `max_budget`, falls back to the max value across `model_max_budget` entries. Username is extracted from `key_alias` by taking everything after the last ` - ` separator.
- **[src/format.ts](src/format.ts)** — Pure formatting utilities: USD currency, percentage, progress ring (○◔◑◕●), text progress bar. All functions are side-effect free and tested independently.

## Tests

Tests are in `src/test/*.test.ts`, compiled to `out/test/`, and run with Node.js built-in test runner (`node:test` + `node:assert/strict`). No third-party test framework is used.

Only pure functions in `format.ts` and `usageClient.ts` are unit-tested. VSCode API-dependent code in `statusBar.ts` is not tested.

## Configuration

Extension settings are under the `gptslUsage` namespace:

| Key | Values | Default |
|---|---|---|
| `gptslUsage.apiKey` | string | `""` |
| `gptslUsage.displayMode` | `"percentage"` \| `"amount"` | `"percentage"` |

Configuration changes trigger an immediate refresh via `onDidChangeConfiguration`.
