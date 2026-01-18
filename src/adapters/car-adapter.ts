import { CarReader } from "@ipld/car";
import * as CBOR from "@ipld/dag-cbor";
import { parseUCAN } from "../parser/parse-ucan.ts";
import { isUCAN } from "../parser/detect-ucan.ts";
import type { UCAN } from "../shared/types.ts";

export interface CarInputResult {
  ucans: UCAN[]; // All parsed UCANs
  totalUCANs: number;
}

/**
 * Process a .car file and extract UCAN(s)
 */
export async function CarInput(
  fileBuffer: Uint8Array,
): Promise<CarInputResult> {
  const reader = await CarReader.fromBytes(fileBuffer);

  const ucans: UCAN[] = [];

  // Scan ALL blocks for UCANs (not just root - don't assume root is a UCAN)
  for await (const block of reader.blocks()) {
    try {
      const decoded = CBOR.decode(block.bytes);
      if (isUCAN(decoded)) {
        ucans.push(decoded as UCAN);
      }
    } catch {
      // Ignore non-CBOR / non-UCAN blocks
    }
  }

  if (ucans.length === 0) {
    throw new Error("No UCANs found in CAR file");
  }

  const totalUCANs = ucans.length;

  // Parse all UCANs with reader for proof resolution
  const parsedUCANs = await Promise.all(
    ucans.map((ucan) => parseUCAN(ucan, reader)),
  );

  return {
    ucans: parsedUCANs,
    totalUCANs,
  };
}
