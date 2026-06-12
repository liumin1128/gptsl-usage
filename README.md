# GPTSL Usage

在 VS Code 右下角状态栏展示 GenAI Key 当前使用额度。

## 使用方式

1. 打开 VS Code 设置。
2. 搜索 `gptslUsage.apiKey`。
3. 填入 API Key。
4. 查看右下角状态栏显示的使用金额。

## 交互

- 未配置 API Key：状态栏显示 `设置额度 API Key`，点击会打开对应设置。
- 已配置 API Key：点击状态栏会显示 loading，并刷新最新 `spend` 金额。
- 请求失败：状态栏显示失败状态，鼠标悬停可查看错误原因。

## 设置项

| 设置 | 说明 |
| --- | --- |
| `gptslUsage.apiKey` | 查询 GenAI Key 使用额度的 API Key |

> API Key 仅从 VS Code 用户设置读取，不会写入源码或日志。
