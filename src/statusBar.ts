import * as vscode from "vscode";
import { formatSpend } from "./format";
import { fetchUsageInfo, UsageInfo } from "./usageClient";

const COMMAND_REFRESH = "gptslUsage.refresh";
const CONFIG_SECTION = "gptslUsage";
const CONFIG_API_KEY = "apiKey";

export class UsageStatusBarController implements vscode.Disposable {
  private readonly statusBarItem: vscode.StatusBarItem;
  private refreshToken = 0;
  private disposed = false;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      "gptslUsage.statusBar",
      vscode.StatusBarAlignment.Right,
      100,
    );
    this.statusBarItem.name = "GPTSL Usage";
    this.statusBarItem.command = COMMAND_REFRESH;
    this.statusBarItem.show();
  }

  async refresh(): Promise<void> {
    const apiKey = getApiKey();

    if (!apiKey) {
      await openApiKeySetting();
      this.showMissingApiKey();
      return;
    }

    const currentToken = ++this.refreshToken;
    this.showLoading();

    try {
      const usage = await fetchUsageInfo(apiKey);

      if (this.shouldIgnore(currentToken)) {
        return;
      }

      this.showUsage(usage);
    } catch (error) {
      if (this.shouldIgnore(currentToken)) {
        return;
      }

      this.showError(error);
    }
  }

  updateFromConfiguration(): void {
    if (getApiKey()) {
      void this.refresh();
      return;
    }

    this.refreshToken++;
    this.showMissingApiKey();
  }

  dispose(): void {
    this.disposed = true;
    this.statusBarItem.dispose();
  }

  private showMissingApiKey(): void {
    this.statusBarItem.text = "$(key) 设置额度 API Key";
    this.statusBarItem.tooltip = "点击打开设置：gptslUsage.apiKey";
  }

  private showLoading(): void {
    this.statusBarItem.text = "$(sync~spin) 加载额度...";
    this.statusBarItem.tooltip = "正在刷新 GPTSL 使用额度";
  }

  private showUsage(usage: UsageInfo): void {
    this.statusBarItem.text = `$(graph) ${formatSpend(usage.spend)}`;
    this.statusBarItem.tooltip = buildUsageTooltip(usage);
  }

  private showError(error: unknown): void {
    this.statusBarItem.text = "$(warning) 额度获取失败";
    this.statusBarItem.tooltip = `点击重试。${getErrorMessage(error)}`;
  }

  private shouldIgnore(token: number): boolean {
    return this.disposed || token !== this.refreshToken;
  }
}

export function getApiKey(): string {
  return vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .get<string>(CONFIG_API_KEY, "")
    .trim();
}

export async function openApiKeySetting(): Promise<void> {
  await vscode.commands.executeCommand(
    "workbench.action.openSettings",
    `${CONFIG_SECTION}.${CONFIG_API_KEY}`,
  );
}

function buildUsageTooltip(usage: UsageInfo): string {
  const lines = [`当前使用额度：${formatSpend(usage.spend)}`];

  if (usage.keyName) {
    lines.push(`Key：${usage.keyName}`);
  }

  if (usage.updatedAt) {
    lines.push(`更新时间：${usage.updatedAt}`);
  }

  lines.push("点击刷新最新数据");
  return lines.join("\n");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "未知错误";
}

export function registerUsageStatusBar(context: vscode.ExtensionContext): void {
  const controller = new UsageStatusBarController();

  context.subscriptions.push(
    controller,
    vscode.commands.registerCommand(COMMAND_REFRESH, () =>
      controller.refresh(),
    ),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(`${CONFIG_SECTION}.${CONFIG_API_KEY}`)) {
        controller.updateFromConfiguration();
      }
    }),
  );

  controller.updateFromConfiguration();
}
