import * as vscode from "vscode";
import * as path from "path";

import { ProfileData, Profiles } from "../interfaces/profile";

export class ProfileManager implements vscode.TreeDataProvider<Profile | Ext> {
  private _onDidChangeTreeData: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> =
    this._onDidChangeTreeData.event;

  getTreeItem(element: Profile | Ext): vscode.TreeItem {
    return element;
  }
  getChildren(element?: Profile): vscode.ProviderResult<Profile[] | Ext[]> {

    if(element){
      let profile = vscode.workspace.getConfiguration().get("profileManager.profiles", {}) as Profiles;
      if(profile[element.label as string] !== undefined){
        let result: Array<Ext> = [];
        profile[element.label as string].extensions.map(ext => {
          result.push(new Ext(ext.label));
        });
        return result;
      }
      return [];
    }

    let result: Array<Profile> = [];
    Object.keys(
      <Profiles>vscode.workspace.getConfiguration().get("profileManager.profiles", {})
    ).map((key) => {
      result.push(new Profile(key));
    });

    return result;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

export class Profile extends vscode.TreeItem {
  contextValue = "profileManager.profile";
  iconPath = {
    light: path.join(__filename, "..", "..", "..", "resources", "profileDLight.svg"),
    dark: path.join(__filename, "..", "..", "..", "resources", "profileDark.svg")
  };
  constructor(public name: string) {
    super(name, vscode.TreeItemCollapsibleState.Collapsed);
  }
}

export class Ext extends vscode.TreeItem {
  contextValue = "profileManager.ext";

  iconPath = {
    light: path.join(__filename, "..", "..", "..", "resources", "extDLight.svg"),
    dark: path.join(__filename, "..", "..", "..", "resources", "extDark.svg")
  };

  constructor(public name: string) {
    super(name);
  }
}