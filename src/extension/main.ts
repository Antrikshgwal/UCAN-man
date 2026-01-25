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
                    outputId: message.outputId,
                    statusId: message.statusId,
                  });
                } catch (error) {
                  currentPanel?.webview.postMessage({
                    type: "error",
                    message:
                      error instanceof Error ? error.message : String(error),
                    outputId: message.outputId,
                    statusId: message.statusId,
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
                    outputId: message.outputId,
                    statusId: message.statusId,
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
                    outputId: message.outputId,
                    statusId: message.statusId,
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
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            background-color: var(--vscode-sideBar-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .header-icon {
            font-size: 24px;
        }

        .header-title {
            font-size: 16px;
            font-weight: 600;
        }

        .header-subtitle {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 2px;
        }

        .tabs {
            display: flex;
            background-color: var(--vscode-editorGroupHeader-tabsBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding: 0 20px;
        }

        .tab {
            padding: 10px 16px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            color: var(--vscode-descriptionForeground);
            font-size: 13px;
            transition: all 0.2s;
        }

        .tab:hover {
            color: var(--vscode-foreground);
        }

        .tab.active {
            color: var(--vscode-textLink-activeForeground);
            border-bottom-color: var(--vscode-textLink-activeForeground);
        }

        .content {
            flex: 1;
            overflow: auto;
            display: flex;
            flex-direction: column;
        }

        .tab-content {
            display: none;
            flex: 1;
            padding: 20px;
        }

        .tab-content.active {
            display: flex;
            flex-direction: column;
        }

        .input-area {
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        .input-section {
            margin-bottom: 16px;
        }

        .input-label {
            display: block;
            margin-bottom: 8px;
            font-size: 13px;
            font-weight: 500;
        }

        .file-upload-area {
            border: 2px dashed var(--vscode-panel-border);
            border-radius: 8px;
            padding: 32px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            background-color: var(--vscode-input-background);
        }

        .file-upload-area:hover {
            border-color: var(--vscode-textLink-activeForeground);
            background-color: var(--vscode-editor-inactiveSelectionBackground);
        }

        .file-upload-icon {
            font-size: 48px;
            margin-bottom: 12px;
            opacity: 0.6;
        }

        .file-upload-text {
            font-size: 14px;
            margin-bottom: 4px;
        }

        .file-upload-hint {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }

        #fileInput {
            display: none;
        }

        textarea {
            width: 100%;
            height: 200px;
            max-height: 300px;
            padding: 12px;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 13px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            resize: vertical;
        }

        textarea::placeholder {
            color: var(--vscode-input-placeholderForeground);
        }

        textarea:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }

        .info-box {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textLink-activeForeground);
            padding: 12px;
            margin-top: 12px;
            border-radius: 4px;
            font-size: 12px;
        }

        .info-box-title {
            font-weight: 600;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .info-box ul {
            margin-left: 20px;
            margin-top: 6px;
        }

        .info-box li {
            margin-bottom: 4px;
        }

        .action-bar {
            display: flex;
            gap: 12px;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
        }

        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .response-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        .response-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background-color: var(--vscode-sideBar-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            border-top: 1px solid var(--vscode-panel-border);
        }

        .response-title {
            font-weight: 600;
            font-size: 13px;
        }

        .response-status {
            font-size: 12px;
            padding: 4px 10px;
            border-radius: 12px;
        }

        .response-status.success {
            background-color: rgba(0, 150, 136, 0.2);
            color: var(--vscode-charts-green);
        }

        .response-status.error {
            background-color: rgba(244, 67, 54, 0.2);
            color: var(--vscode-errorForeground);
        }

        .response-content {
            flex: 1;
            overflow: auto;
            background-color: var(--vscode-editor-background);
        }

        #output {
            padding: 16px;
            min-height: 200px;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            min-height: 300px;
            color: var(--vscode-descriptionForeground);
        }

        .empty-state-icon {
            font-size: 72px;
            margin-bottom: 16px;
            opacity: 0.4;
        }

        .empty-state-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .empty-state-text {
            font-size: 13px;
            text-align: center;
            max-width: 400px;
            line-height: 1.5;
        }

        .ucan-card {
            background-color: var(--vscode-sideBar-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            margin-bottom: 12px;
            overflow: hidden;
        }

        .ucan-card-header {
            padding: 12px 16px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            user-select: none;
        }

        .ucan-card-title {
            font-weight: 600;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .collapse-icon {
            transition: transform 0.2s;
        }

        .ucan-card.collapsed .collapse-icon {
            transform: rotate(-90deg);
        }

        .ucan-card-body {
            padding: 16px;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 12px;
            overflow: auto;
            max-height: 400px;
        }

        .ucan-card.collapsed .ucan-card-body {
            display: none;
        }

        .json-container {
            white-space: pre-wrap;
            word-break: break-word;
        }

        .metadata-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 11px;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            margin-left: 8px;
        }

        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 32px;
        }

        .spinner {
            border: 2px solid var(--vscode-panel-border);
            border-top: 2px solid var(--vscode-textLink-activeForeground);
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .error-message {
            padding: 16px;
            background-color: rgba(244, 67, 54, 0.1);
            border-left: 3px solid var(--vscode-errorForeground);
            color: var(--vscode-errorForeground);
            border-radius: 4px;
            white-space: pre-wrap;
            font-size: 13px;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-icon">🔐</div>
        <div>
            <div class="header-title">UCAN Inspector</div>
            <div class="header-subtitle">Decode and inspect UCAN tokens and CAR files</div>
        </div>
    </div>

    <div class="tabs">
        <div class="tab active" data-tab="car">📦 CAR File</div>
        <div class="tab" data-tab="payload">📄 Request Payload</div>
        <div class="tab" data-tab="help">❓ Help</div>
    </div>

    <div class="content">
        <!-- CAR File Tab -->
        <div class="tab-content active" id="car-tab">
            <div class="input-area">
                <div class="input-section">
                    <label class="input-label">Upload CAR File</label>
                    <div class="file-upload-area" onclick="document.getElementById('fileInput').click()">
                        <div class="file-upload-icon">📦</div>
                        <div class="file-upload-text">Click to browse or drag & drop your .car file here</div>
                        <div class="file-upload-hint">Supports .car files containing UCAN tokens</div>
                    </div>
                    <input type="file" id="fileInput" accept=".car" />
                    <div id="selectedFile" style="margin-top: 8px; font-size: 12px; color: var(--vscode-descriptionForeground);"></div>
                </div>

                <div class="action-bar">
                    <button id="decodeButton">🔍 Decode CAR File</button>
                    <button class="secondary" onclick="document.getElementById('fileInput').value=''; document.getElementById('selectedFile').innerText=''">Clear</button>
                </div>
            </div>

            <div class="response-section">
                <div class="response-header">
                    <div class="response-title">Response</div>
                    <div class="response-status" id="car-status" style="display: none;"></div>
                </div>
                <div class="response-content">
                    <div id="car-output">
                        <div class="empty-state">
                            <div class="empty-state-icon">🚀</div>
                            <div class="empty-state-title">Ready to decode</div>
                            <div class="empty-state-text">Upload a .car file above and click "Decode" to inspect UCAN tokens and analyze the content</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Request Payload Tab -->
        <div class="tab-content" id="payload-tab">
            <div class="input-area">
                <div class="input-section">
                    <label class="input-label">Paste Request Payload</label>
                    <textarea id="payloadInput" placeholder="Paste your HTTP request payload here...

Example formats:
• Base64-encoded CAR file
• Base64/hex-encoded CBOR data
• JSON with UCAN or invocation fields
• Raw binary data"></textarea>

                    <div class="info-box">
                        <div class="info-box-title">💡 How to get request payload</div>
                        <ul>
                            <li>Open Browser DevTools (F12 or Cmd/Ctrl+Shift+I)</li>
                            <li>Go to the <strong>Network</strong> tab</li>
                            <li>Find your UCAN-related API request</li>
                            <li>Click on it and go to <strong>Payload</strong> or <strong>Request</strong> tab</li>
                            <li>Copy the raw data (look for "View source" or "Raw" option)</li>
                            <li>Paste it above and click Decode</li>
                        </ul>
                    </div>
                </div>

                <div class="action-bar">
                    <button id="decodePayloadButton">🔍 Decode Payload</button>
                    <button class="secondary" onclick="document.getElementById('payloadInput').value=''">Clear</button>
                </div>
            </div>

            <div class="response-section">
                <div class="response-header">
                    <div class="response-title">Response</div>
                    <div class="response-status" id="payload-status" style="display: none;"></div>
                </div>
                <div class="response-content">
                    <div id="payload-output">
                        <div class="empty-state">
                            <div class="empty-state-icon">📨</div>
                            <div class="empty-state-title">Ready to decode</div>
                            <div class="empty-state-text">Paste a request payload above and click "Decode" to extract and inspect UCAN tokens</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Help Tab -->
        <div class="tab-content" id="help-tab">
            <div style="padding: 20px; max-width: 800px;">
                <h2 style="margin-bottom: 20px;">📚 UCAN Inspector Guide</h2>

                <div class="ucan-card">
                    <div class="ucan-card-header">
                        <div class="ucan-card-title">
                            <span class="collapse-icon">▼</span>
                            What is UCAN?
                        </div>
                    </div>
                    <div class="ucan-card-body">
                        <p style="line-height: 1.6; font-family: var(--vscode-font-family);">
                            UCAN (User Controlled Authorization Network) is a capability-based authorization system that uses cryptographic tokens to delegate permissions between users and services. UCANs are self-contained, tamper-proof, and can be shared across different platforms without requiring a centralized authority.
                        </p>
                    </div>
                </div>

                <div class="ucan-card">
                    <div class="ucan-card-header">
                        <div class="ucan-card-title">
                            <span class="collapse-icon">▼</span>
                            Supported Formats
                        </div>
                    </div>
                    <div class="ucan-card-body" style="font-family: var(--vscode-font-family);">
                        <ul style="line-height: 1.8; list-style: none; padding-left: 0;">
                            <li>✅ <strong>CAR Files:</strong> Content Addressable aRchive files containing UCAN tokens</li>
                            <li>✅ <strong>JWT Format:</strong> JSON Web Token encoded UCANs</li>
                            <li>✅ <strong>CBOR:</strong> Compact Binary Object Representation (base64/hex encoded)</li>
                            <li>✅ <strong>JSON Payloads:</strong> Raw JSON with UCAN structures</li>
                            <li>✅ <strong>Invocations:</strong> UCAN invocation detection and parsing</li>
                        </ul>
                    </div>
                </div>

                <div class="ucan-card">
                    <div class="ucan-card-header">
                        <div class="ucan-card-title">
                            <span class="collapse-icon">▼</span>
                            Quick Start Guide
                        </div>
                    </div>
                    <div class="ucan-card-body" style="font-family: var(--vscode-font-family);">
                        <p style="margin-bottom: 12px;"><strong>Method 1: CAR File Upload</strong></p>
                        <ol style="line-height: 1.8; margin-bottom: 20px;">
                            <li>Click on the "📦 CAR File" tab</li>
                            <li>Click the upload area or drag & drop your .car file</li>
                            <li>Click "🔍 Decode CAR File"</li>
                            <li>View the extracted UCANs and their details</li>
                        </ol>

                        <p style="margin-bottom: 12px;"><strong>Method 2: Request Payload</strong></p>
                        <ol style="line-height: 1.8;">
                            <li>Open Browser DevTools (F12)</li>
                            <li>Navigate to Network tab</li>
                            <li>Find the request containing UCAN data</li>
                            <li>Copy the raw request payload</li>
                            <li>Switch to "📄 Request Payload" tab</li>
                            <li>Paste the data and click "🔍 Decode Payload"</li>
                        </ol>
                    </div>
                </div>

                <div class="ucan-card">
                    <div class="ucan-card-header">
                        <div class="ucan-card-title">
                            <span class="collapse-icon">▼</span>
                            Understanding the Output
                        </div>
                    </div>
                    <div class="ucan-card-body" style="font-family: var(--vscode-font-family);">
                        <ul style="line-height: 1.8; list-style: none; padding-left: 0;">
                            <li>🔑 <strong>Issuer (iss):</strong> Who created the UCAN token</li>
                            <li>👤 <strong>Audience (aud):</strong> Who can use the UCAN token</li>
                            <li>⚡ <strong>Capabilities (att):</strong> What actions are authorized</li>
                            <li>⏰ <strong>Expiration (exp):</strong> When the token expires</li>
                            <li>🔗 <strong>Proofs (prf):</strong> Chain of authorization</li>
                            <li>📋 <strong>Invocations:</strong> Specific action requests using UCANs</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;

                // Update active tab
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update active content
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                document.getElementById(tabName + '-tab').classList.add('active');
            });
        });

        // Collapsible cards
        document.querySelectorAll('.ucan-card-header').forEach(header => {
            header.addEventListener('click', () => {
                header.parentElement.classList.toggle('collapsed');
            });
        });

        // File input handler
        document.getElementById('fileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('selectedFile').innerText = \`✅ Selected: \${file.name} (\${(file.size / 1024).toFixed(2)} KB)\`;
            }
        });

        // Decode CAR file
        document.getElementById('decodeButton').addEventListener('click', async () => {
            const fileInput = document.getElementById('fileInput');
            const output = document.getElementById('car-output');
            const status = document.getElementById('car-status');

            if (!fileInput.files || fileInput.files.length === 0) {
                output.innerHTML = '<div class="error-message">❌ Please select a .car file first</div>';
                status.style.display = 'inline-block';
                status.className = 'response-status error';
                status.innerText = 'Error';
                return;
            }

            const file = fileInput.files[0];
            output.innerHTML = '<div class="loading"><div class="spinner"></div><span>Processing CAR file...</span></div>';
            status.style.display = 'none';

            try {
                const arrayBuffer = await file.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                const binaryString = String.fromCharCode(...uint8Array);
                const base64Data = btoa(binaryString);

                vscode.postMessage({
                    type: 'decodeCAR',
                    data: base64Data,
                    outputId: 'car-output',
                    statusId: 'car-status'
                });
            } catch (error) {
                output.innerHTML = \`<div class="error-message">❌ Error reading file: \${error.message}</div>\`;
                status.style.display = 'inline-block';
                status.className = 'response-status error';
                status.innerText = 'Error';
            }
        });

        // Decode payload
        document.getElementById('decodePayloadButton').addEventListener('click', () => {
            const payloadInput = document.getElementById('payloadInput');
            const output = document.getElementById('payload-output');
            const status = document.getElementById('payload-status');

            if (!payloadInput.value.trim()) {
                output.innerHTML = '<div class="error-message">❌ Please paste a request payload first</div>';
                status.style.display = 'inline-block';
                status.className = 'response-status error';
                status.innerText = 'Error';
                return;
            }

            output.innerHTML = '<div class="loading"><div class="spinner"></div><span>Processing payload...</span></div>';
            status.style.display = 'none';

            vscode.postMessage({
                type: 'decodePayload',
                data: payloadInput.value,
                outputId: 'payload-output',
                statusId: 'payload-status'
            });
        });

        // Listen for messages from extension
        window.addEventListener('message', (event) => {
            const message = event.data;
            const output = document.getElementById(message.outputId || 'car-output');
            const status = document.getElementById(message.statusId || 'car-status');

            switch (message.type) {
                case 'decoded':
                    let html = '';

                    // Display metadata
                    if (message.metadata) {
                        html += \`<div style="margin-bottom: 16px; padding: 12px; background-color: var(--vscode-textBlockQuote-background); border-radius: 6px;">
                            <div style="font-weight: 600; margin-bottom: 8px;">📊 Metadata</div>
                            <div style="font-size: 12px;">
                                <div>Format: <span class="metadata-badge">\${message.metadata.format.toUpperCase()}</span></div>
                                \${message.metadata.hasInvocations ? '<div style="margin-top: 4px;">✅ Contains invocation data</div>' : ''}
                            </div>
                        </div>\`;
                    }

                    // Display UCAN count
                    if (message.totalUCANs) {
                        html += \`<div style="font-size: 14px; font-weight: 600; margin-bottom: 16px; color: var(--vscode-charts-green);">
                            🔑 Found \${message.totalUCANs} UCAN\${message.totalUCANs > 1 ? 's' : ''}
                        </div>\`;
                    }

                    // Display invocations
                    if (message.invocations && message.invocations.length > 0) {
                        message.invocations.forEach((inv, index) => {
                            html += \`<div class="ucan-card">
                                <div class="ucan-card-header">
                                    <div class="ucan-card-title">
                                        <span class="collapse-icon">▼</span>
                                        ⚡ Invocation \${index + 1}
                                    </div>
                                </div>
                                <div class="ucan-card-body">
                                    <div class="json-container">\${JSON.stringify(inv, null, 2)}</div>
                                </div>
                            </div>\`;
                        });
                    }

                    // Display UCANs
                    if (Array.isArray(message.data)) {
                        message.data.forEach((ucan, index) => {
                            html += \`<div class="ucan-card">
                                <div class="ucan-card-header">
                                    <div class="ucan-card-title">
                                        <span class="collapse-icon">▼</span>
                                        🔐 UCAN \${index + 1}
                                    </div>
                                </div>
                                <div class="ucan-card-body">
                                    <div class="json-container">\${JSON.stringify(ucan, null, 2)}</div>
                                </div>
                            </div>\`;
                        });
                    } else {
                        html += \`<div class="ucan-card">
                            <div class="ucan-card-header">
                                <div class="ucan-card-title">
                                    <span class="collapse-icon">▼</span>
                                    🔐 UCAN
                                </div>
                            </div>
                            <div class="ucan-card-body">
                                <div class="json-container">\${JSON.stringify(message.data, null, 2)}</div>
                            </div>
                        </div>\`;
                    }

                    output.innerHTML = html;
                    status.style.display = 'inline-block';
                    status.className = 'response-status success';
                    status.innerText = 'Success';

                    // Re-attach collapse handlers
                    output.querySelectorAll('.ucan-card-header').forEach(header => {
                        header.addEventListener('click', () => {
                            header.parentElement.classList.toggle('collapsed');
                        });
                    });
                    break;

                case 'error':
                    output.innerHTML = \`<div class="error-message">❌ \${message.message}</div>\`;
                    status.style.display = 'inline-block';
                    status.className = 'response-status error';
                    status.innerText = 'Error';
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
