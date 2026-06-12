# GPTSL Usage

Show the current GenAI key spend or budget percentage in the bottom-right VS Code status bar.

## Usage

1. Open VS Code Settings.
2. Search for `gptslUsage.apiKey`.
3. Enter your API Key.
4. Choose `gptslUsage.displayMode` if you want percentage or amount display.
5. Check the usage value in the bottom-right status bar.

## Behavior

- Without an API Key: the status bar shows `Set Usage API Key`; clicking it opens the related setting.
- With an API Key: clicking the status bar shows a loading state and refreshes the latest usage data.
- Percentage mode shows `spend / budget limit`, for example `◔ 22.4%` or `● 150.0%`.
- Amount mode shows only the used spend, for example `$75.00`.
- The tooltip shows the username parsed from `key_alias`, detailed usage, budget limit, percentage, and a text progress bar.
- The tooltip also provides actions to refresh usage, open the API Key setting, and switch display mode.
- Values are not capped at the budget limit, so percentages above 100% are displayed as-is.
- On request failure: the status bar shows a failed state; hover to view the error reason.

## Settings

| Setting | Description |
| --- | --- |
| `gptslUsage.apiKey` | API Key used to query GenAI key usage |
| `gptslUsage.displayMode` | `percentage` or `amount`; defaults to `percentage` |

> The API Key is read only from VS Code user settings and is never written to source code or logs.
