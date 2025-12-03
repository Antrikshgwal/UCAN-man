import { CarReader } from "@ipld/car";
import * as Core from '@ucanto/core';

export async function parseUCAN(blob: Uint8Array) {
  try {
    const car = await CarReader.fromBytes(blob);

    const roots = await car.getRoots();
    if (roots.length === 0) {
      throw new Error("No UCAN invocation found in CAR file.");
    }

    const rootCid = roots[0];

    const blocksMap = new Map();
    for await (const block of car.blocks()) {
      blocksMap.set(block.cid.toString(), block);
    }

    const rootBlock = blocksMap.get(rootCid.toString());
    if (!rootBlock) {
      throw new Error("Root UCAN block not found in CAR.");
    }

    const invocation = Core.Invocation.view({
      root: rootCid as any,
      blocks: blocksMap as any
    });

    return {
      issuer: invocation.issuer?.did() || null,
      audience: invocation.audience?.did() || null,
      expiration: invocation.expiration || null,
      capabilities: invocation.capabilities || [],
      proofs: invocation.proofs || [],
      facts: invocation.facts || [],
      cid: rootCid.toString(),
      raw: invocation
    };
  } catch (err: any) {
    return {
      error: err.message || "Unknown UCAN parsing error",
      raw: null
    };
  }
}
