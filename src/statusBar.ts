import * as vscode from "vscode";
import {
  buildProgressBar,
  calculateUsagePercentage,
  formatPercentage,
  formatSpend,
  getProgressRing,
} from "./format";
import { fetchUsageInfo, UsageInfo } from "./usageClient";

const COMMAND_REFRESH = "gptslUsage.refresh";
const COMMAND_OPEN_API_KEY_SETTING = "gptslUsage.openApiKeySetting";
const COMMAND_SET_DISPLAY_MODE = "gptslUsage.setDisplayMode";
const COMMAND_TOGGLE_DISPLAY_MODE = "gptslUsage.toggleDisplayMode";
const CONFIG_SECTION = "gptslUsage";
const CONFIG_API_KEY = "apiKey";
const CONFIG_DISPLAY_MODE = "displayMode";

type DisplayMode = "percentage" | "amount";

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
    this.statusBarItem.text = "$(key) Set Usage API Key";
    this.statusBarItem.tooltip = "Click to open setting: gptslUsage.apiKey";
  }

  private showLoading(): void {
    this.statusBarItem.text = "$(sync~spin) Loading usage...";
    this.statusBarItem.tooltip = "Refreshing GPTSL usage";
  }

  private showUsage(usage: UsageInfo): void {
    const displayMode = getDisplayMode();
    const percentage = calculateUsagePercentage(usage.spend, usage.budgetLimit);

    this.statusBarItem.text = buildStatusBarText(
      usage,
      displayMode,
      percentage,
    );
    this.statusBarItem.tooltip = buildUsageTooltip(
      usage,
      displayMode,
      percentage,
    );
  }

  private showError(error: unknown): void {
    this.statusBarItem.text = "$(warning) Usage fetch failed";
    this.statusBarItem.tooltip = buildErrorTooltip(error);
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

export function getDisplayMode(): DisplayMode {
  const mode = vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .get<string>(CONFIG_DISPLAY_MODE, "percentage");

  return mode === "amount" ? "amount" : "percentage";
}

export async function openApiKeySetting(): Promise<void> {
  await vscode.commands.executeCommand(
    "workbench.action.openSettings",
    `${CONFIG_SECTION}.${CONFIG_API_KEY}`,
  );
}

export async function setDisplayMode(mode: DisplayMode): Promise<void> {
  await vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .update(CONFIG_DISPLAY_MODE, mode, vscode.ConfigurationTarget.Global);
}

function buildStatusBarText(
  usage: UsageInfo,
  displayMode: DisplayMode,
  percentage: number | undefined,
): string {
  if (displayMode === "amount") {
    return `$(graph) ${formatSpend(usage.spend)}`;
  }

  return `${getProgressRing(percentage)} ${formatPercentage(percentage)}`;
}

function buildUsageTooltip(
  usage: UsageInfo,
  displayMode: DisplayMode,
  percentage: number | undefined,
): vscode.MarkdownString {
  const tooltip = new vscode.MarkdownString(undefined, true);
  tooltip.isTrusted = {
    enabledCommands: [
      COMMAND_REFRESH,
      COMMAND_OPEN_API_KEY_SETTING,
      COMMAND_SET_DISPLAY_MODE,
      COMMAND_TOGGLE_DISPLAY_MODE,
    ],
  };
  tooltip.supportThemeIcons = true;
  tooltip.appendMarkdown("**GPTSL Usage**\n\n");

  if (usage.userName) {
    tooltip.appendMarkdown(`- User: \`${usage.userName}\`\n`);
  }

  tooltip.appendMarkdown(`- Current usage: \`${formatSpend(usage.spend)}\`\n`);

  if (usage.budgetLimit !== undefined) {
    tooltip.appendMarkdown(
      `- Budget limit: \`${formatSpend(usage.budgetLimit)}\`\n`,
    );
  }

  tooltip.appendMarkdown(`- Percentage: \`${formatPercentage(percentage)}\`\n`);
  tooltip.appendMarkdown(
    `- Progress: \`${buildProgressBar(percentage)} ${formatPercentage(percentage)}\`\n`,
  );
  tooltip.appendMarkdown(`- Display mode: \`${displayMode}\`\n`);

  if (usage.keyName) {
    tooltip.appendMarkdown(`- Key: \`${usage.keyName}\`\n`);
  }

  if (usage.keyAlias) {
    tooltip.appendMarkdown(`- Alias: \`${usage.keyAlias}\`\n`);
  }

  if (usage.updatedAt) {
    tooltip.appendMarkdown(`- Updated at: \`${usage.updatedAt}\`\n`);
  }

  tooltip.appendMarkdown("\n---\n");
  tooltip.appendMarkdown(`[Refresh](command:${COMMAND_REFRESH})`);
  tooltip.appendMarkdown(" · ");
  tooltip.appendMarkdown(
    `[Set API Key](command:${COMMAND_OPEN_API_KEY_SETTING})`,
  );
  tooltip.appendMarkdown(" · ");
  tooltip.appendMarkdown(
    `[Toggle display mode](command:${COMMAND_TOGGLE_DISPLAY_MODE})`,
  );

  return tooltip;
}

function buildErrorTooltip(error: unknown): vscode.MarkdownString {
  const tooltip = new vscode.MarkdownString(undefined, true);
  tooltip.isTrusted = {
    enabledCommands: [COMMAND_REFRESH, COMMAND_OPEN_API_KEY_SETTING],
  };
  tooltip.appendMarkdown(
    `**Usage fetch failed**\n\n${getErrorMessage(error)}\n\n`,
  );
  tooltip.appendMarkdown(
    "If this only fails on another computer, check whether that computer can access the GenAI endpoint and has a valid `gptslUsage.apiKey`.\n\n",
  );
  tooltip.appendMarkdown(`[Retry](command:${COMMAND_REFRESH})`);
  tooltip.appendMarkdown(" · ");
  tooltip.appendMarkdown(
    `[Set API Key](command:${COMMAND_OPEN_API_KEY_SETTING})`,
  );

  return tooltip;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

export function registerUsageStatusBar(context: vscode.ExtensionContext): void {
  const controller = new UsageStatusBarController();

  context.subscriptions.push(
    controller,
    vscode.commands.registerCommand(COMMAND_REFRESH, () =>
      controller.refresh(),
    ),
    vscode.commands.registerCommand(COMMAND_OPEN_API_KEY_SETTING, () =>
      openApiKeySetting(),
    ),
    vscode.commands.registerCommand(
      COMMAND_SET_DISPLAY_MODE,
      (mode: DisplayMode) => setDisplayMode(mode),
    ),
    vscode.commands.registerCommand(COMMAND_TOGGLE_DISPLAY_MODE, async () => {
      const nextMode = getDisplayMode() === "amount" ? "percentage" : "amount";
      await setDisplayMode(nextMode);
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(CONFIG_SECTION)) {
        controller.updateFromConfiguration();
      }
    }),
  );

  controller.updateFromConfiguration();
}
