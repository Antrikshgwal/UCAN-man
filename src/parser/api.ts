import { decodeEmailCAR } from "./decode-input.ts";
import { parseUCAN } from "./parse-ucan.ts";
import { UCAN } from "../shared/types.ts";

export async function parseEmailUCAN(input: string) {
  const { reader, root } = await decodeEmailCAR(input);
  return parseUCAN(root as UCAN, reader);
}
