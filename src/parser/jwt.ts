import { base64urlToJson } from "./utils.js";

export function decodeJWT(ucan: string) {
  const parts = ucan.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid UCAN: expected header.payload.signature");
  }

  const [header, payload, signature] = parts;

  return {
    header: base64urlToJson(header),
    payload: base64urlToJson(payload),
    signature,
    caps: extractCaps(payload),
    proofs: extractProofs(payload),
  };
}

function extractCaps(payload: string) {
  const p = base64urlToJson(payload);
  return p.cap ?? p.att ?? [];
}

function extractProofs(payload: string) {
  const p = base64urlToJson(payload);
  return p.prf ?? [];
}
