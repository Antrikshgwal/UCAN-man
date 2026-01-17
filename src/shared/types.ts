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
