const vscode = acquireVsCodeApi();

const input = document.getElementById("input") as HTMLTextAreaElement;
const output = document.getElementById("output") as HTMLElement;

document.getElementById("decode")!.addEventListener("click", () => {
  vscode.postMessage({
    type: "decode",
    ucan: input.value
  });
});

window.addEventListener("message", (event) => {
  const msg = event.data;

  if (msg.type === "decoded") {
    output.innerText = JSON.stringify(msg.data, null, 2);
  }

  if (msg.type === "error") {
    output.innerText = "❌ Error: " + msg.message;
  }
});
