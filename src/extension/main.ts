import * as vscode from "vscode";
import { handleMessage } from "./messaging.js";

export function activate(context: vscode.ExtensionContext) {
  console.log("UCANman activated!");

  const disposable = vscode.commands.registerCommand(
    "ucanman.decodeUcan",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "ucanman",
        "UCANman Inspector",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      panel.webview.html = getWebviewContent(panel, context);
      panel.webview.onDidReceiveMessage(
        (msg) => handleMessage(msg, panel),
        null,
        context.subscriptions
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

function getWebviewContent(panel: vscode.WebviewPanel, ctx: vscode.ExtensionContext) {
  const scriptUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(ctx.extensionUri, "dist", "webview.js")
  );
  const styleUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(ctx.extensionUri, "dist", "style.css")
  );

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <link rel="stylesheet" href="${styleUri}">
    </head>
    <body>
      <h1>UCANman Inspector</h1>

      <textarea id="input" placeholder="Paste UCAN here..."></textarea>
      <button id="decode">Decode</button>

      <pre id="output"></pre>

      <script src="${scriptUri}"></script>
    </body>
  </html>
  `;
}
