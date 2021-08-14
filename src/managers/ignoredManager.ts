import * as vscode from "vscode";
import { Extension } from "../interfaces/extension";
import { IgnoredExtensions } from "../interfaces/ignored";
import * as path from "path";

export class IgnoredManager implements vscode.TreeDataProvider<Ignored> {
  private _onDidChangeTreeData: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> =
    this._onDidChangeTreeData.event;

  getTreeItem(element: Ignored): vscode.TreeItem {
    return element;
  }
  getChildren(element?: Ignored): vscode.ProviderResult<Ignored[]> {
    let result: Array<Ignored> = [];

    let extIngnored = (
      vscode.workspace
        .getConfiguration()
        .get("profileManager.ignored", { extensions: [] }) as IgnoredExtensions
    ).extensions;

    for (let i = 0; i < extIngnored.length; i++) {
      result.push(new Ignored(extIngnored[i]));
    }

    return result;
  }
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

export class Ignored extends vscode.TreeItem {
  contextValue = "profileManager.ignored";
  iconPath = {
    light: path.join(__filename, "..", "..", "..", "resources", "extDLight.svg"),
    dark: path.join(__filename, "..", "..", "..", "resources", "extDark.svg"),
  };
  constructor(public extension: Extension) {
    super(extension.label);
  }
}
