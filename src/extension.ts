import * as vscode from "vscode";
import { ProfileManager, Profile } from "./managers/profileManager";
import { ProfileData, Profiles } from "./interfaces/profile";
import { IgnoredManager, Ignored } from "./managers/ignoredManager";
import { IgnoredExtensions } from "./interfaces/ignored";
import { Extension } from "./interfaces/extension";
import {
  getUserExtensions,
  installExtensions,
  uninstallExtensions,
} from "./util/extensions";

export function activate(context: vscode.ExtensionContext) {
  let profiles: Profiles = vscode.workspace
    .getConfiguration()
    .get("profileManager.profiles", {}) as Profiles;

  let ignoredExtensions: IgnoredExtensions = vscode.workspace
    .getConfiguration()
    .get("profileManager.ignored", { extensions: [] }) as IgnoredExtensions;

  const profileManager = new ProfileManager();
  const ignoredManager = new IgnoredManager();

  const outputChannel = vscode.window.createOutputChannel("Profile Manager");

  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );

  statusBar.text = vscode.workspace
    .getConfiguration()
    .get("profileManager.currentProfile", "None");
  statusBar.name = "Current Profile";
  statusBar.show();

  vscode.window.registerTreeDataProvider(
    "profileManager.profiles",
    profileManager
  );

  vscode.window.registerTreeDataProvider(
    "profileManager.ignored",
    ignoredManager
  );

  vscode.commands.registerCommand("profileManager.profiles.add", async () => {
    let pName = undefined;
    do {
      pName = await vscode.window.showInputBox({
        title: "PROFILE NAME",
        placeHolder: "ex: ReactJS, Java, Study, Work",
        prompt: "Enter a name for the profile to be created.",
      });
      if (Object.keys(profiles).includes(pName || "")) {
        vscode.window.showWarningMessage("Existing profile, use another name.");
        continue;
      } else {
        break;
      }
    } while (true);

    if (pName === undefined || pName.trim().length === 0) {
      vscode.window.showWarningMessage("Invalid profile name.");
      return;
    }

    profiles[pName] = {
      extensions: getUserExtensions(),
      settings: {},
    };

    await vscode.workspace
      .getConfiguration()
      .update(
        "profileManager.profiles",
        profiles,
        vscode.ConfigurationTarget.Global
      );

    profileManager.refresh();
  });

  vscode.commands.registerCommand("profileManager.profiles.update", async (profile: Profile) => {
    if (profile.label === undefined) {
      return;
    }

    profiles[profile.label as string] = {
      extensions: getUserExtensions(),
      settings: {},
    };

    await vscode.workspace
      .getConfiguration()
      .update(
        "profileManager.profiles",
        profiles,
        vscode.ConfigurationTarget.Global
      );

    profileManager.refresh();
  });


  vscode.commands.registerCommand(
    "profileManager.profiles.remove",
    async (profile: Profile) => {
      if (profile.label === undefined) {
        return;
      }

      let result = await vscode.window.showInformationMessage(
        "Do you really want to delete this profile?",
        ...["Yes", "No"]
      );

      if (result === "No") {
        return;
      }

      let newProfiles: Profiles = {};

      Object.keys(profiles).map((key) => {
        if (profile.label !== key) {
          newProfiles[key] = profiles[key];
        }
      });

      profiles = newProfiles;

      await vscode.workspace
        .getConfiguration()
        .update(
          "profileManager.profiles",
          profiles,
          vscode.ConfigurationTarget.Global
        );

      profileManager.refresh();
    }
  );
  vscode.commands.registerCommand(
    "profileManager.profiles.edit",
    async (profile: Profile) => {
      if (profile.label === undefined) {
        return;
      }

      let newProfiles: Profiles = {};
      let oldData = profiles[profile.label as string];

      Object.keys(profiles).map((key) => {
        if (profile.label !== key) {
          newProfiles[key] = profiles[key];
        }
      });

      let pName = undefined;

      do {
        pName = await vscode.window.showInputBox({
          title: "NEW PROFILE NAME",
          placeHolder: "ex: ReactJS, Java, Study, Work",
          prompt: "Enter a new name for the profile to be created.",
        });
        if (Object.keys(newProfiles).includes(pName || "")) {
          vscode.window.showWarningMessage(
            "Existing profile, use another name."
          );
          continue;
        } else {
          break;
        }
      } while (true);

      if (pName === undefined || pName.trim().length === 0) {
        vscode.window.showWarningMessage("Invalid profile name.");
        return;
      }

      newProfiles[pName] = oldData;

      profiles = newProfiles;

      await vscode.workspace
        .getConfiguration()
        .update(
          "profileManager.profiles",
          profiles,
          vscode.ConfigurationTarget.Global
        );

      profileManager.refresh();
    }
  );
  vscode.commands.registerCommand(
    "profileManager.profiles.use",
    async (profile: Profile) => {
      if (profile.label === undefined) {
        return;
      }
      vscode.window.showInformationMessage("Profile change started");
      outputChannel.show();
      outputChannel.appendLine(`Removing Extensions`);
      await uninstallExtensions(getUserExtensions(), outputChannel);
      outputChannel.appendLine(`Installing Extensions`);
      await installExtensions(
        profiles[profile.label as string].extensions,
        outputChannel
      );
      vscode.workspace
        .getConfiguration()
        .update(
          "profileManager.currentProfile",
          profile.label,
          vscode.ConfigurationTarget.Global
        );
      statusBar.text = profile.label as string;
      let result = await vscode.window.showInformationMessage(
        "Do you want to restart VSCODE now?",
        ...["Yes", "No"]
      );
      if (result === "Yes") {
        vscode.commands.executeCommand("workbench.action.reloadWindow");
      }
    }
  );

  vscode.commands.registerCommand(
    "profileManager.ignored.add",
    async (ignored: Ignored) => {
      let result = (await vscode.window.showQuickPick(
        [...getUserExtensions()],
        {
          title: "SELECT EXTENSION",
        }
      )) as Extension;
      if (result === undefined) {
        return;
      }

      ignoredExtensions.extensions.push(result);
      await vscode.workspace
        .getConfiguration()
        .update(
          "profileManager.ignored",
          ignoredExtensions,
          vscode.ConfigurationTarget.Global
        );
      ignoredManager.refresh();
    }
  );

  vscode.commands.registerCommand(
    "profileManager.ignored.remove",
    async (ignored: Ignored) => {
      if (ignored.label === undefined || ignored.extension === undefined) {
        return;
      }

      let result = await vscode.window.showInformationMessage(
        "Are you sure you want to remove this extension from the ignored?",
        ...["Yes", "No"]
      );

      if (result === "No") {
        return;
      }

      for (let i = 0; i < ignoredExtensions.extensions.length; i++) {
        if (ignoredExtensions.extensions[i].id === ignored.extension.id) {
          ignoredExtensions.extensions.splice(i, 1);
          break;
        }
      }

      await vscode.workspace
        .getConfiguration()
        .update(
          "profileManager.ignored",
          ignoredExtensions,
          vscode.ConfigurationTarget.Global
        );

      ignoredManager.refresh();
    }
  );
}

export function deactivate() {}
