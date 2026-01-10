import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const time = new Date().toLocaleTimeString();

  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  const disposable = vscode.commands.registerCommand(
    "ucanman.decodeUcan",
    () => {
      vscode.window.showInformationMessage(`UCAN Inspector opened! ${time}`);

      const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;

      if (currentPanel) {
        currentPanel.reveal(columnToShowIn);
      } else {
        currentPanel = vscode.window.createWebviewPanel(
          "ucanMan",
          "UCANman",
          columnToShowIn || vscode.ViewColumn.One,
          {}
        );
      }

      // Setting HTML content
      currentPanel.webview.html = getWebViewContent();
    }
  );

  context.subscriptions.push(disposable);
  console.log("Command registered successfully");
}

function getWebViewContent() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
    <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
</body>
</html>`;
}

export function deactivate() {
  console.log("UCAN-man extension is now deactivated");
}
