/**
 *
 * @param bytes - Uint8Array to decode
 * @returns stringified DID
 */

import { bytes } from "@ucanto/core/schema";
import { CarReader } from "@ipld/car/reader";
import { CAR } from "@ucanto/core";
import { base64url } from "multiformats/bases/base64";
import { CID } from "multiformats";

export function decodeDID(bytes: Uint8Array): string | Uint8Array {
  if (!(bytes instanceof Uint8Array)) {
    return bytes;
  }

  // Check if it starts with CBOR DID tag (0x9D = 157)
  if (bytes[0] === 157) {
    // Skip the tag byte and length byte, decode the rest as UTF-8
    const stringBytes = bytes.slice(2);
    return new TextDecoder().decode(stringBytes);
  }

  // Try regular UTF-8 decode for string DIDs (did:key:, did:mailto:, etc.)
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    // Check if it looks like a DID (starts with "did:" or contains printable chars)
    if (
      decoded.startsWith("did:") ||
      decoded.startsWith("mailto:") ||
      /^[\x20-\x7E]+$/.test(decoded)
    ) {
      return decoded;
    }
  } catch {
    // Not valid UTF-8, continue to return original bytes
  }

  // Return original if we can't decode
  return bytes;
}

/**
 * Convert Uint8Array to base64url string
 */
function uint8ArrayToBase64url(bytes: Uint8Array): string {
  return base64url.encode(bytes);
}

/**
 * Format Unix timestamp to human-readable date
 */
function formatExpiration(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return `${timestamp} (${date.toISOString()})`;
}

/**
 * Serialize UCAN for JSON display, converting Uint8Arrays to readable strings
 */
export function serializeUCANForDisplay(ucan: any, fieldName?: string): any {
  if (ucan instanceof Uint8Array) {
    // Special handling for signature field - always base64url encode
    if (fieldName === "s") {
      return uint8ArrayToBase64url(ucan);
    }

    // Try to decode as DID for iss/aud fields
    if (fieldName === "iss" || fieldName === "aud") {
      const decoded = decodeDID(ucan);
      if (typeof decoded === "string") {
        return decoded;
      }
      // If DID decoding fails, use base64url as fallback
      return uint8ArrayToBase64url(ucan);
    }

    // For other Uint8Array fields, try DID decoding first
    const decoded = decodeDID(ucan);
    if (typeof decoded === "string") {
      return decoded;
    }

    // Fall back to base64url encoding for any binary data
    return uint8ArrayToBase64url(ucan);
  }

  if (ucan && typeof ucan === "object" && ucan.constructor?.name === "CID") {
    return ucan.toString();
  }

  if (Array.isArray(ucan)) {
    return ucan.map((item) => serializeUCANForDisplay(item));
  }

  if (ucan && typeof ucan === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(ucan)) {
      // Handle exp field: null/undefined -> "inherited", numeric -> formatted timestamp
      if (key === "exp") {
        if (value === null || value === undefined) {
          result[key] = "inherited";
        } else if (typeof value === "number") {
          result[key] = formatExpiration(value);
        } else {
          result[key] = value;
        }
        continue;
      }
      // Preserve all other fields including nested objects (nb, att, etc.)
      result[key] = serializeUCANForDisplay(value, key);
    }
    return result;
  }

  return ucan;
}
// /**
//  * Find UCAN block by CID in CAR file
//  */

// export async function FindUCAN(
//   cid: string,
//   carFile: Uint8Array,
// ): Promise<Uint8Array | null> {
//   const bytes = base64url.decode(cid);

//   const reader = await CarReader.fromBytes(carFile);

//   const block = await reader.CAR.get(cidObj);
//   return block ? block.bytes : null;
// }
