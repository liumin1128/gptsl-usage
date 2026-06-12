import * as vscode from "vscode";
import { registerUsageStatusBar } from "./statusBar";

export function activate(context: vscode.ExtensionContext): void {
  registerUsageStatusBar(context);
}

export function deactivate(): void {}
