import * as vscode from "vscode";
import { CarInput } from "../adapters/car-adapter";
import { RequestPayloadInput } from "../adapters/request-payload-adapter";
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

              case "decodePayload":
                try {
                  // Process the payload using the new RequestPayloadInput
                  const result = await RequestPayloadInput(message.data);

                  // Serialize all UCANs for display
                  const serializedUCANs = result.ucans.map((ucan) =>
                    serializeUCANForDisplay(ucan),
                  );

                  // Send the result back to the webview with UCAN count and metadata
                  currentPanel?.webview.postMessage({
                    type: "decoded",
                    data: serializedUCANs,
                    totalUCANs: result.totalUCANs,
                    invocations: result.invocations,
                    metadata: result.metadata,
                  });
                } catch (error) {
                  let errorMsg =
                    error instanceof Error ? error.message : String(error);

                  // Provide helpful context for common errors
                  if (
                    errorMsg.includes("Invalid") ||
                    errorMsg.includes("Unable to extract")
                  ) {
                    errorMsg +=
                      "\n\n💡 Tip: Make sure you're copying the raw request body. Try:\n" +
                      "1. Open browser DevTools (F12)\n" +
                      "2. Go to Network tab\n" +
                      "3. Find the request\n" +
                      "4. Click 'Payload' or 'Request' tab\n" +
                      "5. Copy the raw data (base64, hex, or JSON format)";
                  }

                  currentPanel?.webview.postMessage({
                    type: "error",
                    message: errorMsg,
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
        .metadata {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 8px;
            margin-bottom: 10px;
            border-radius: 3px;
            font-size: 0.9em;
        }
        .section-header {
            font-weight: bold;
            margin-top: 15px;
            margin-bottom: 5px;
            color: var(--vscode-textLink-foreground);
        }
    </style>
</head>
<body>
    <div>
        <h2>UCAN Decoder</h2>
        <div class="input-section">
            <h3>Option 1: Upload CAR file</h3>
            <input type="file" id="fileInput" accept=".car" />
            <button id="decodeButton">Decode CAR File</button>
        </div>
        <div class="input-section">
            <h3>Option 2: Paste Request Payload</h3>
            <textarea id="payloadInput" placeholder="Paste HTTP request payload here...

Supported formats:
• CAR file (base64/base64url encoded)
• CBOR data (base64/base64url/hex encoded)
• JSON with UCAN/invocation fields
• Raw binary data" style="width: 100%; min-height: 120px; font-family: monospace;"></textarea>
            <button id="decodePayloadButton">Decode Payload</button>
            <p style="font-size: 0.9em; color: var(--vscode-descriptionForeground); margin-top: 5px;">
                💡 Tip: Copy raw request body from browser DevTools (Network tab → Payload/Request → Raw/View source)
            </p>
        </div>
        <div id="output">Upload a .car file or paste a request payload above.</div>
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

        document.getElementById('decodePayloadButton').addEventListener('click', () => {
            const payloadInput = document.getElementById('payloadInput');
            const output = document.getElementById('output');

            if (!payloadInput.value.trim()) {
                output.className = 'error';
                output.innerText = '❌ Please paste a request payload first';
                return;
            }

            output.innerText = '⏳ Processing payload...';
            output.className = '';

            // Send payload to extension for processing
            vscode.postMessage({
                type: 'decodePayload',
                data: payloadInput.value
            });
        });

        // Listen for messages from the extension
        window.addEventListener('message', (event) => {
            const message = event.data;
            const output = document.getElementById('output');

            switch (message.type) {
                case 'decoded':
                    output.className = 'success';

                    let displayText = '';

                    // Display metadata if present
                    if (message.metadata) {
                        displayText += \`📋 Format: \${message.metadata.format.toUpperCase()}\\n\`;
                        if (message.metadata.hasInvocations) {
                            displayText += \`✅ Contains invocation data\\n\`;
                        }
                        displayText += '\\n';
                    }

                    // Display UCAN count
                    if (message.totalUCANs) {
                        displayText += \`🔑 Found \${message.totalUCANs} UCAN\${message.totalUCANs > 1 ? 's' : ''}\\n\\n\`;
                    }

                    // Display invocations if present
                    if (message.invocations && message.invocations.length > 0) {
                        displayText += '=== INVOCATIONS ===\\n\\n';
                        message.invocations.forEach((inv, index) => {
                            if (index > 0) displayText += '\\n\\n--- Invocation ' + (index + 1) + ' ---\\n\\n';
                            else displayText += '--- Invocation 1 ---\\n\\n';
                            displayText += JSON.stringify(inv, null, 2);
                        });
                        displayText += '\\n\\n';
                    }

                    // Display UCANs
                    displayText += '=== UCANs ===\\n\\n';
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
