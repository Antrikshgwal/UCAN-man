/**
 *
 * @param bytes - Uint8Array to decode
 * @returns stringified DID
 */

import { bytes } from "@ucanto/core/schema";
import { CarReader } from "@ipld/car";
import { CAR } from "@ucanto/core";
import { base64url } from "multiformats/bases/base64";

export function decodeDID(bytes: Uint8Array) {
  if (!(bytes instanceof Uint8Array)) {
    return bytes;
  }

  // Check if it starts with CBOR DID tag (0x9D = 157)
  if (bytes[0] === 157) {
    // Skip the tag byte and length byte, decode the rest as UTF-8
    const stringBytes = bytes.slice(2);
    return new TextDecoder().decode(stringBytes);
  }

  // Not a tagged DID, try regular UTF-8 decode
  try {
    return new TextDecoder().decode(bytes);
  } catch {
    return bytes;
  }
}

export function FindUCAN(cid: string, carFile: Uint8Array): Uint8Array | null {
  const bytes = base64url.decode(cid);
  const reader = await CarReader.fromBytes(carFile);

  const block = await reader.get(CAR.codec.decode(bytes));
  return block ? block.bytes : null;
}
