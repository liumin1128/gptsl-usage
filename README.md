# GPTSL Usage

Show the current GenAI key spend in the bottom-right VS Code status bar.

## Usage

1. Open VS Code Settings.
2. Search for `gptslUsage.apiKey`.
3. Enter your API Key.
4. Check the usage amount in the bottom-right status bar.

## Behavior

- Without an API Key: the status bar shows `Set Usage API Key`; clicking it opens the related setting.
- With an API Key: clicking the status bar shows a loading state and refreshes the latest `spend` amount.
- On request failure: the status bar shows a failed state; hover to view the error reason.

## Settings

| Setting | Description |
| --- | --- |
| `gptslUsage.apiKey` | API Key used to query GenAI key usage |

> The API Key is read only from VS Code user settings and is never written to source code or logs.
