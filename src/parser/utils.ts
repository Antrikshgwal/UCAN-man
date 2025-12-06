export function base64urlToJson(b64: string): any {
  const base64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
  return JSON.parse(jsonStr);
}
