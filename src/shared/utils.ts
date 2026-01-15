/**
 *
 * @param bytes - Uint8Array to decode
 * @returns stringified DID
 */

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

