import { base64url } from "multiformats/bases/base64";
import { CarReader } from "@ipld/car";
import Block from "@ipld/block/defaults"; // Deprecated, use multiformats
import * as CBOR from "@ipld/dag-cbor";
import { decodeDID } from "../shared/utils.js";

export function base64urlToJson(b64: string): any {
  const base64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
  return JSON.parse(jsonStr);
}
/**
 * Decode DID from CBOR-tagged Uint8Array
 * CBOR tag 0x9D (157) is used for DIDs, followed by string length byte
 */

/**
 * Decode email UCAN string into Delegation
 */
async function decodeEmailUCAN(ucanString) {
  // Decode base64url → bytes
  const bytes = base64url.decode(ucanString);
  // console.log("Decoded bytes:", bytes);

  const reader = await CarReader.fromBytes(bytes);
  // console.log("CAR Reader:", reader);

  const blocks = reader.blocks();
  const block = await blocks.next();
  const delegation = block.value.bytes;
  const decodedDelegation = await Block.decoder(delegation, "dag-cbor");
  const finalDelegation = decodedDelegation.decode();

  // Convert Uint8Array fields to readable formats
  const processedDelegation = Object.fromEntries(
    Object.entries(finalDelegation).map(([key, value]) => {
      if (value instanceof Uint8Array) {
        // Signature field - keep as hex string for readability
        if (key === "s") {
          return [key, Buffer.from(value).toString("hex")];
        }
        // For DID fields (aud/iss), decode using decodeDID helper
        if (key === "aud" || key === "iss") {
          return [key, decodeDID(value)];
        }
        // Try to decode as CBOR first for other fields
        try {
          const decoded = CBOR.decode(value);
          return [key, decoded];
        } catch {
          // If not CBOR, try UTF-8 string
          try {
            const decoded = new TextDecoder().decode(value);
            return [key, decoded];
          } catch {
            // Keep as Uint8Array if nothing works
            return [key, value];
          }
        }
      }
      return [key, value];
    })
  );

  console.log("Processed Delegation:", processedDelegation);

  return processedDelegation;
}

/**
 * Format issuer DID
 */
function formatIssuer(did) {
  return did.toString();
}

/**
 * Format audience DID
 */
function formatAudience(did) {
  return did.toString();
}

/**
 * Convert Delegation into UI-friendly object
 */
function formatDelegationForUI(d) {
  return {
    issuer: d.iss || d.issuer,
    audience: d.aud || d.audience,
    capabilities: d.att || d.capabilities,
    expiration: d.exp ? new Date(d.exp * 1000).toLocaleString() : "Never",
    proofs: d.prf || d.proofs || [],
    signature: d.s || d.signature,
  };
}

// ------------------------------------------------
// USAGE
// ------------------------------------------------

const UCAN_STRING =
  "uOqJlcm9vdHOB2CpYJQABcRIgY1N-zV3--Qi_TVI1AjR2tJjVDZbrQ91BT1v_-um8iFRndmVyc2lvbgGgAwFxEiBjU37NXf75CL9NUjUCNHa0mNUNlutD3UFPW__66byIVKdhc1hE7aEDQCG5_qTH8kJ7sTtaKhWC9F52Uyj2NJ63t_Za6Mic4RHSF6ahAxmgSIyPGzSUHaTwBqL1b8D72Ms7TQRVMo6n5w1hdmUwLjkuMWNhdHSBo2JuYqRjYXR0gaFjY2FuYSpjYXVkeDhkaWQ6a2V5Ono2TWtrRExOVXNReUNzblJoemhLNTRMY040V01Kd1JpV1ZDVjhoVkp4OUF5RTJpVmNpc3N4IWRpZDptYWlsdG86Z21haWwuY29tOmFudHJpa3NoZ3dhbGVjYXVzZdgqWCUAAXESIC5K5VPja4NkODsdOemX24nhJe9N069JN0ahF5dTVl3NY2Nhbm5hY2Nlc3MvY29uZmlybWR3aXRoeBtkaWQ6d2ViOnVwLnN0b3JhY2hhLm5ldHdvcmtjYXVkWBmdGndlYjp1cC5zdG9yYWNoYS5uZXR3b3JrY2V4cBppY-WRY2lzc1gZnRp3ZWI6dXAuc3RvcmFjaGEubmV0d29ya2NwcmaA";

const delegation = await decodeEmailUCAN(UCAN_STRING);
const formatted = formatDelegationForUI(delegation);

console.log("---- DELEGATION ----");
console.dir(formatted, { depth: null });
