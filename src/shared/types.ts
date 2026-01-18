import { CID } from "multiformats/cid";

export interface WebviewMessage {
  type: "decode";
  ucan: string;
}

export interface UCAN {
  v?: string;
  iss: Uint8Array;
  aud: Uint8Array;
  att: any[];
  exp?: number;
  nbf?: number;
  prf?: CID[];
  s?: Uint8Array;
}

export interface AnalyzedCAR {
  blocks: Map<string, Uint8Array>;
  ucans: ParsedUCAN[];
}

export interface ParsedUCAN {
  cid: CID;
  ucan: UCAN;
  raw: Uint8Array;
}
