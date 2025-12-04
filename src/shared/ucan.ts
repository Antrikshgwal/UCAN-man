import { CarReader } from '@ipld/car';
import { decode as cborDecode } from 'cborg';
import * as UCAN from '@ucanto/core';
import { toString as u8ToString } from 'uint8arrays';

const jwtRegex =
  /[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}/g;

/**
 * Parse all UCANs embedded inside a CAR file.
 */
export async function parseUCANsFromCar(bytes: Uint8Array) {
  const results: any[] = [];
  const car = await CarReader.fromBytes(bytes);

  for await (const block of car.blocks()) {
    const raw = block.bytes;

    //
    // 1. Decode as CBOR (most Storacha UCANs live inside CBOR nodes)
    //
    let cborObj: any = null;
    try {
      cborObj = cborDecode(raw);
    } catch {
      // Not CBOR; will fall back to text search
    }

    // 1a. Search UCAN strings inside CBOR object fields
    if (cborObj && typeof cborObj === 'object') {
      const found = extractUCANStrings(cborObj);
      for (const ucanString of found) {
        try {
          const parsed = UCAN.decodeLink(ucanString);
          results.push({ parsed, source: "cbor", rawString: ucanString });
        } catch {
          // not a valid UCAN → skip
        }
      }
    }

    //
    // 2. Fallback: search for JWT-like UCAN strings inside raw bytes
    //
    try {
      const text = u8ToString(raw);
      const matches = text.match(jwtRegex) || [];

      for (const token of matches) {
        try {
          const parsed = UCAN.decodeLink(token);
          results.push({ parsed, source: "regex", rawString: token });
        } catch {}
      }
    } catch {
    }
  }

  return results;
}

/**
 * Recursively search an object for UCAN-like strings.
 */
function extractUCANStrings(obj: any): string[] {
  const out: string[] = [];

  function scan(v: any) {
    if (typeof v === "string") {
      // UCAN tokens always contain 2 dots and are long
      if (v.includes(".") && v.length > 60) out.push(v);
    }

    if (Array.isArray(v)) {
      for (const x of v) scan(x);
      return;
    }

    if (typeof v === "object" && v !== null) {
      for (const k of Object.keys(v)) {
        scan(v[k]);
      }
    }
  }

  scan(obj);
  return out;
}
