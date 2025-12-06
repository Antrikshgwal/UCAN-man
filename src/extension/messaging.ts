import { decodeJWT } from "../parser/jwt.js";
import type { WebviewMessage } from "../shared/types.js";
import * as vscode from "vscode";

export function handleMessage(
  msg: WebviewMessage,
  panel: vscode.WebviewPanel
) {
  switch (msg.type) {
    case "decode":
      try {
        const decoded = decodeJWT(msg.ucan);
        panel.webview.postMessage({ type: "decoded", data: decoded });
      } catch (err: any) {
        panel.webview.postMessage({ type: "error", message: err.message });
      }
      break;
  }
}
