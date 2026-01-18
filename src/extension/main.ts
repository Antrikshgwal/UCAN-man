import * as vscode from "vscode";
import { CarInput } from "../adapters/car-adapter";
import { serializeUCANForDisplay } from "../shared/utils";
import type { UCAN } from "../shared/types";

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
          {
            enableScripts: true,
            retainContextWhenHidden: true,
          },
        );

        // Handle panel disposal
        currentPanel.onDidDispose(() => {
          currentPanel = undefined;
        });

        // Handle messages from the webview
        currentPanel.webview.onDidReceiveMessage(
          async (message) => {
            switch (message.type) {
              case "decodeCAR":
                try {
                  // Convert base64 data to Uint8Array
                  const base64Data = message.data.split(",")[1] || message.data;
                  const binaryString = Buffer.from(base64Data, "base64");
                  const fileBuffer = new Uint8Array(binaryString);

                  // Process the CAR file
                  const result = await CarInput(fileBuffer);

                  // Serialize all UCANs for display
                  const serializedUCANs = result.ucans.map((ucan) =>
                    serializeUCANForDisplay(ucan),
                  );

                  // Send the result back to the webview with UCAN count
                  currentPanel?.webview.postMessage({
                    type: "decoded",
                    data: serializedUCANs,
                    totalUCANs: result.totalUCANs,
                  });
                } catch (error) {
                  currentPanel?.webview.postMessage({
                    type: "error",
                    message:
                      error instanceof Error ? error.message : String(error),
                  });
                }
                break;
            }
          },
          undefined,
          context.subscriptions,
        );
      }

      // Setting HTML content
      currentPanel.webview.html = getWebViewContent();
    },
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
    <title>UCAN Inspector</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
        }
        h2 {
            margin-top: 0;
        }
        .input-section {
            margin-bottom: 20px;
        }
        #fileInput {
            margin: 10px 0;
            display: block;
        }
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            margin-top: 10px;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        #output {
            white-space: pre-wrap;
            border: 1px solid var(--vscode-panel-border);
            padding: 10px;
            margin-top: 10px;
            min-height: 200px;
            overflow: auto;
            background: var(--vscode-editor-background);
        }
        .error {
            color: var(--vscode-errorForeground);
        }
        .success {
            color: var(--vscode-charts-green);
        }
    </style>
</head>
<body>
    <div>
        <h2>UCAN Decoder</h2>
        <div class="input-section">
            <h3>Upload CAR file</h3>
            <input type="file" id="fileInput" accept=".car" />
            <button id="decodeButton">Decode UCAN</button>
        </div>
        <div id="output">No file loaded. Please select a .car file and click Decode UCAN.</div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        document.getElementById('decodeButton').addEventListener('click', async () => {
            const fileInput = document.getElementById('fileInput');
            const output = document.getElementById('output');

            if (!fileInput.files || fileInput.files.length === 0) {
                output.className = 'error';
                output.innerText = '❌ Please select a .car file first';
                return;
            }

            const file = fileInput.files[0];
            output.innerText = '⏳ Processing CAR file...';
            output.className = '';

            try {
                // Read the file as ArrayBuffer
                const arrayBuffer = await file.arrayBuffer();

                // Convert to base64 for sending to extension
                const uint8Array = new Uint8Array(arrayBuffer);
                const binaryString = String.fromCharCode(...uint8Array);
                const base64Data = btoa(binaryString);

                // Send to extension for processing
                vscode.postMessage({
                    type: 'decodeCAR',
                    data: base64Data
                });
            } catch (error) {
                output.className = 'error';
                output.innerText = '❌ Error reading file: ' + error.message;
            }
        });

        // Listen for messages from the extension
        window.addEventListener('message', (event) => {
            const message = event.data;
            const output = document.getElementById('output');

            switch (message.type) {
                case 'decoded':
                    output.className = 'success';
                    // Display UCAN count before the JSON
                    const countInfo = message.totalUCANs
                        ? \`Found \${message.totalUCANs} UCAN\${message.totalUCANs > 1 ? 's' : ''} in CAR file\\n\\n\`
                        : '';
                    // Display all UCANs with separators
                    let displayText = countInfo;
                    if (Array.isArray(message.data)) {
                        message.data.forEach((ucan, index) => {
                            if (index > 0) displayText += '\\n\\n--- UCAN ' + (index + 1) + ' ---\\n\\n';
                            else displayText += '--- UCAN 1 ---\\n\\n';
                            displayText += JSON.stringify(ucan, null, 2);
                        });
                    } else {
                        displayText += JSON.stringify(message.data, null, 2);
                    }
                    output.innerText = displayText;
                    break;
                case 'error':
                    output.className = 'error';
                    output.innerText = '❌ Error: ' + message.message;
                    break;
            }
        });
    </script>
</body>
</html>`;
}

export function deactivate() {
  console.log("UCAN-man extension is now deactivated");
}
