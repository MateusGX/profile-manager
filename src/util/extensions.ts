import * as vscode from "vscode";
import { IgnoredExtensions } from "../interfaces/ignored";
import { Extension } from "../interfaces/extension";

export function getUserExtensions(): Extension[] {
  let ignoredExtensions: IgnoredExtensions = vscode.workspace
    .getConfiguration()
    .get("profileManager.ignored", { extensions: [] }) as IgnoredExtensions;
  return vscode.extensions.all
    .filter((value) => {
      return (
        !value.packageJSON.isBuiltin &&
        value.packageJSON.name !== "profile-manager" &&
        !hasIgnored(value.id, ignoredExtensions)
      );
    })
    .map((value) => {
      return {
        id: value.id,
        label: value.packageJSON.displayName,
      };
    });
}
export async function installExtensions(
  extensions: Extension[],
  output: vscode.OutputChannel
) {
  for (let i = 0; i < extensions.length; i++) {
    output.appendLine("Installing the extension: " + extensions[i].label);
    await vscode.commands.executeCommand(
      "workbench.extensions.installExtension",
      extensions[i].id
    );
  }
}
export async function uninstallExtensions(
  extensions: Extension[],
  output: vscode.OutputChannel
) {
  for (let i = 0; i < extensions.length; i++) {
    output.appendLine("Removing the extension: " + extensions[i].label);
    await vscode.commands.executeCommand(
      "workbench.extensions.uninstallExtension",
      extensions[i].id
    );
  }
}
function hasIgnored(id: string, config: IgnoredExtensions): boolean {
  let result = false;
  for (let i = 0; i < config.extensions.length; i++) {
    if (config.extensions[i].id === id) {
      result = true;
      break;
    }
  }
  return result;
}
