import { CarReader } from "@ipld/car";
import * as CBOR from "@ipld/dag-cbor";
import { base64url } from "multiformats/bases/base64";
import { parseUCAN } from "../parser/parse-ucan.ts";
import { isUCAN } from "../parser/detect-ucan.ts";
import type { UCAN } from "../shared/types.ts";

export interface RequestPayloadResult {
  ucans: UCAN[]; // All parsed UCANs
  totalUCANs: number;
  invocations?: any[]; // Extracted invocations if present
  metadata?: {
    format: "car" | "cbor" | "json" | "multipart";
    hasInvocations: boolean;
  };
}

/**
 * Detect if the input contains an invocation structure
 */
function isInvocation(obj: any): boolean {
  return (
    obj &&
    typeof obj === "object" &&
    ("invocation" in obj || "task" in obj || "capabilities" in obj)
  );
}

/**
 * Extract UCANs from a nested object structure
 */
async function extractUCANsFromObject(
  obj: any,
  reader?: CarReader,
): Promise<{ ucans: UCAN[]; invocations: any[] }> {
  const ucans: UCAN[] = [];
  const invocations: any[] = [];

  async function traverse(value: any, path: string = ""): Promise<void> {
    // Check if this is a UCAN
    if (isUCAN(value)) {
      ucans.push(value as UCAN);
      return;
    }

    // Check if this is an invocation
    if (isInvocation(value)) {
      invocations.push(value);
      // Continue traversing to find nested UCANs
    }

    // Handle CID references if we have a reader
    if (value?.constructor?.name === "CID" && reader) {
      try {
        const block = await reader.get(value);
        if (block) {
          const decoded = CBOR.decode(block.bytes);
          await traverse(decoded, `${path}[cid:${value.toString()}]`);
        }
      } catch {
        // Ignore CID resolution failures
      }
      return;
    }

    // Traverse arrays
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        await traverse(value[i], `${path}[${i}]`);
      }
      return;
    }

    // Traverse objects
    if (value && typeof value === "object" && !ArrayBuffer.isView(value)) {
      for (const [key, val] of Object.entries(value)) {
        await traverse(val, path ? `${path}.${key}` : key);
      }
    }
  }

  await traverse(obj);
  return { ucans, invocations };
}

/**
 * Try to decode input as base64url
 */
function tryBase64urlDecode(input: string): Uint8Array | null {
  try {
    // Remove whitespace
    const cleaned = input.trim();
    // Try base64url decode
    return base64url.decode(cleaned);
  } catch {
    return null;
  }
}

/**
 * Try to decode input as base64
 */
function tryBase64Decode(input: string): Uint8Array | null {
  try {
    const cleaned = input.trim();
    const buffer = Buffer.from(cleaned, "base64");
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

/**
 * Try to decode input as hex
 */
function tryHexDecode(input: string): Uint8Array | null {
  try {
    const cleaned = input.trim().replace(/[^0-9a-fA-F]/g, "");
    if (cleaned.length % 2 !== 0) {
      return null;
    }
    const buffer = Buffer.from(cleaned, "hex");
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

/**
 * Process CAR-formatted request payload
 */
async function processCAR(
  bytes: Uint8Array,
): Promise<{ ucans: UCAN[]; reader: CarReader }> {
  const reader = await CarReader.fromBytes(bytes);
  const ucans: UCAN[] = [];

  // Scan all blocks for UCANs
  for await (const block of reader.blocks()) {
    try {
      const decoded = CBOR.decode(block.bytes);
      if (isUCAN(decoded)) {
        ucans.push(decoded as UCAN);
      }
    } catch {
      // Ignore non-CBOR blocks
    }
  }

  return { ucans, reader };
}

/**
 * Process CBOR-encoded payload
 */
async function processCBOR(bytes: Uint8Array): Promise<{
  ucans: UCAN[];
  invocations: any[];
}> {
  try {
    const decoded = CBOR.decode(bytes);
    return await extractUCANsFromObject(decoded);
  } catch (error) {
    throw new Error(
      `Failed to decode CBOR: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Process JSON payload
 */
async function processJSON(input: string): Promise<{
  ucans: UCAN[];
  invocations: any[];
}> {
  try {
    const parsed = JSON.parse(input);
    return await extractUCANsFromObject(parsed);
  } catch (error) {
    throw new Error(
      `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Main entry point: Process request payload and extract UCANs
 */
export async function RequestPayloadInput(
  input: string | Uint8Array,
): Promise<RequestPayloadResult> {
  let bytes: Uint8Array | null = null;
  let format: "car" | "cbor" | "json" | "multipart" = "json";


  if (typeof input === "string") {

    bytes = tryBase64urlDecode(input);
    if (!bytes) {
      bytes = tryBase64Decode(input);
    }
    if (!bytes) {
      bytes = tryHexDecode(input);
    }

    // If still no bytes, try parsing as JSON
    if (!bytes) {
      const jsonResult = await processJSON(input);
      if (jsonResult.ucans.length === 0) {
        throw new Error(
          "No UCANs found in payload. Supported formats: CAR (base64/base64url), CBOR (base64/base64url), JSON with UCAN fields",
        );
      }

      return {
        ucans: jsonResult.ucans,
        totalUCANs: jsonResult.ucans.length,
        invocations: jsonResult.invocations,
        metadata: {
          format: "json",
          hasInvocations: jsonResult.invocations.length > 0,
        },
      };
    }
  } else {
    bytes = input;
  }


  try {
    const carResult = await processCAR(bytes);
    if (carResult.ucans.length > 0) {
      format = "car";

      const parsedUCANs = await Promise.all(
        carResult.ucans.map((ucan) => parseUCAN(ucan, carResult.reader)),
      );

      const { invocations } = await extractUCANsFromObject(
        carResult.ucans,
        carResult.reader,
      );

      return {
        ucans: parsedUCANs,
        totalUCANs: parsedUCANs.length,
        invocations,
        metadata: {
          format,
          hasInvocations: invocations.length > 0,
        },
      };
    }
  } catch {
    // Not a CAR file, try other formats
  }

  try {
    const cborResult = await processCBOR(bytes);
    if (cborResult.ucans.length > 0) {
      format = "cbor";
      return {
        ucans: cborResult.ucans,
        totalUCANs: cborResult.ucans.length,
        invocations: cborResult.invocations,
        metadata: {
          format,
          hasInvocations: cborResult.invocations.length > 0,
        },
      };
    }
  } catch {
    // Not valid CBOR
  }

  // If all else fails, throw an error
  throw new Error(
    "Unable to extract UCANs from payload. Ensure the payload contains valid CAR, CBOR, or JSON data with UCAN structures.",
  );
}
