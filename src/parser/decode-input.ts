import { base64url } from "multiformats/bases/base64";
import { CarReader } from "@ipld/car";
import * as CBOR from "@ipld/dag-cbor";
import { isUCAN } from "./detect-ucan.ts";

export async function decodeEmailCAR(input: string) {
  const bytes = base64url.decode(input);
  const reader = await CarReader.fromBytes(bytes);

  for await (const block of reader.blocks()) {
    try {
      const decoded = CBOR.decode(block.bytes);
      if (isUCAN(decoded)) {
        return { reader, root: decoded };
      }
    } catch {}
  }

  throw new Error("No UCAN delegation found in CAR");
}
