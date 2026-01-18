import { decode as decodeCBOR } from "cborg";
import { CID } from "multiformats/cid";
import * as DAGCBOR from "@ipld/dag-cbor";
import { CarInputResult } from "./car-adapter";
import { isUCAN } from "../parser/detect-ucan";
import type { UCAN } from "../shared/types";

// Better CID Decoder for cborg fallback
const tags: any = [];
tags[42] = (obj: Uint8Array) => {
  // CID bytes in CBOR usually have a leading 0x00 (multibase identity)
  // Strip it if it exists before decoding
  const bytes = obj[0] === 0 ? obj.slice(1) : obj;
  return CID.decode(bytes);
};

export async function PayloadInput(
  payloadText: string,
): Promise<CarInputResult> {
  // Robust String-to-Buffer conversion
  let buffer = stringToUint8Array(payloadText.trim());

  // Handle the 'ucanto' prefix - often messages are prefixed with ":" (0x3a)
  if (buffer[0] === 0x3a) {
    console.log("[PayloadInput] Stripping ':' prefix");
    buffer = buffer.slice(1);
  }

  try {
    // Use DAG-CBOR - it handles CID (Tag 42) automatically
    console.log("[PayloadInput] Attempting DAG-CBOR decode...");
    const decoded = DAGCBOR.decode(buffer);
    console.log(
      "[PayloadInput] DAG-CBOR decoded successfully:",
      typeof decoded === "object" && decoded
        ? Object.keys(decoded)
        : typeof decoded,
    );

    const ucans: UCAN[] = [];
    extractUCANsFromObject(decoded, ucans);

    if (ucans.length === 0) {
      throw new Error("No UCANs found in payload");
    }

    return { ucans, totalUCANs: ucans.length };
  } catch (e) {
    console.error("[PayloadInput] DAG-CBOR decode failed:", e);

    // Fallback to standard CBOR with manual tags
    try {
      console.log("[PayloadInput] Trying cborg with custom tags...");
      const decoded = decodeCBOR(buffer, { tags });
      const ucans: UCAN[] = [];
      extractUCANsFromObject(decoded, ucans);

      if (ucans.length === 0) {
        throw new Error("No UCANs found in payload");
      }

      return { ucans, totalUCANs: ucans.length };
    } catch (err2) {
      console.error("[PayloadInput] All decoding attempts failed:", err2);
      throw new Error(`Failed to decode payload: ${err2}`);
    }
  }
}

/**
 * Recursively extract UCAN objects from a decoded CBOR structure
 */
function extractUCANsFromObject(obj: any, ucans: UCAN[]): void {
  if (!obj || typeof obj !== "object") {
    return;
  }

  // Check if this object is a UCAN
  if (isUCAN(obj)) {
    console.log("[extractUCANsFromObject] Found UCAN");
    ucans.push(obj as UCAN);
    return;
  }

  // Recursively search in arrays and objects
  if (Array.isArray(obj)) {
    for (const item of obj) {
      extractUCANsFromObject(item, ucans);
    }
  } else {
    for (const value of Object.values(obj)) {
      extractUCANsFromObject(value, ucans);
    }
  }
}

/**
 * Converts a raw binary string to Uint8Array.
 * Handles the case where binary data was interpreted as UTF-8 characters.
 */
function stringToUint8Array(str: string): Uint8Array {
  // If the input is already in hex format (like from a hex editor), decode it directly
  const hexTest = str.replace(/\s/g, "");
  if (
    /^[0-9a-fA-F]+$/.test(hexTest) &&
    hexTest.length % 2 === 0 &&
    hexTest.length > 50
  ) {
    console.log("[stringToUint8Array] Detected hex format");
    return new Uint8Array(
      hexTest.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
    );
  }

  // For raw binary strings, use charCodeAt to get byte values
  // This preserves byte values from Latin-1/ISO-8859-1 encoded strings
  console.log("[stringToUint8Array] Processing as raw binary");
  console.log(
    "[stringToUint8Array] First 10 char codes:",
    Array.from(str.substring(0, 10))
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(" "),
  );

  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    arr[i] = code & 0xff;

    // Warn if we're losing data (character code > 255)
    if (code > 255) {
      console.warn(
        `[stringToUint8Array] Character at position ${i} has code ${code} (> 255), truncating to ${code & 0xff}`,
      );
    }
  }

  console.log(
    "[stringToUint8Array] First 20 bytes as hex:",
    Array.from(arr.slice(0, 20))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" "),
  );

  return arr;
}
