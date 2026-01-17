import * as CBOR from "@ipld/dag-cbor";
import { CarReader } from "@ipld/car";
import { isUCAN } from "./detect-ucan.ts";
import type { UCAN } from "../shared/types.ts";

async function resolveValue(value: any, reader: CarReader): Promise<any> {
  if (value?.constructor?.name === "CID") {
    const block = await reader.get(value);
    if (!block) return value;

    try {
      const decoded = CBOR.decode(block.bytes);
      if (isUCAN(decoded)) {
        return await parseUCAN(decoded as UCAN, reader);
      }
      return decoded;
    } catch {
      return value;
    }
  }

  if (Array.isArray(value)) {
    return Promise.all(value.map((v) => resolveValue(v, reader)));
  }

  if (value && typeof value === "object" && value.constructor === Object) {
    const entries = await Promise.all(
      Object.entries(value).map(async ([k, v]) => [
        k,
        await resolveValue(v, reader),
      ]),
    );
    return Object.fromEntries(entries);
  }

  return value;
}

export async function parseUCAN(ucan: UCAN, reader: CarReader): Promise<UCAN> {
  const entries = await Promise.all(
    Object.entries(ucan).map(async ([k, v]) => [
      k,
      await resolveValue(v, reader),
    ]),
  );

  return Object.fromEntries(entries) as UCAN;
}
