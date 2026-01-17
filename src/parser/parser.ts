// import { base64url } from "multiformats/bases/base64";
// import { CarReader } from "@ipld/car";
// import { decode } from "multiformats/block"; // Deprecated, use multiformats
// import * as CBOR from "@ipld/dag-cbor";
// import { CID } from "multiformats/cid";
// import { decodeDID } from "../shared/utils.ts";

// export function base64urlToJson(b64: string): any {
//   const base64 = b64.replace(/-/g, "+").replace(/_/g, "/");
//   const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
//   return JSON.parse(jsonStr);
// }
// /**
//  * Decode DID from CBOR-tagged Uint8Array
//  * CBOR tag 0x9D (157) is used for DIDs, followed by string length byte
//  */

// /**
//  * Recursively process values to convert CIDs and Uint8Arrays to readable formats
//  */
// async function processValue(value: any, reader?: CarReader): Promise<any> {
//   // Handle CID objects - check if they reference a UCAN block
//   if (value && typeof value === "object" && value.constructor?.name === "CID") {
//     if (reader) {
//       try {
//         // Try to fetch the block from CAR reader
//         const block = await reader.get(value);
//         if (block) {
//           // Decode the UCAN block
//           const decoded = await CBOR.decode(block.bytes);
//           // Recursively process the nested UCAN
//           return await processDecodedUCAN(decoded, reader);
//         }
//       } catch (err) {
//         // If block not found, just return CID string
//         console.log("Block not found for CID:", value.toString());
//       }
//     }
//     return value.toString();
//   }

//   // Handle arrays
//   if (Array.isArray(value)) {
//     return Promise.all(value.map((v) => processValue(v, reader)));
//   }

//   // Handle plain objects
//   if (value && typeof value === "object" && value.constructor === Object) {
//     const entries = await Promise.all(
//       Object.entries(value).map(async ([k, v]) => [
//         k,
//         await processValue(v, reader),
//       ]),
//     );
//     return Object.fromEntries(entries);
//   }

//   // Handle Uint8Array
//   if (value instanceof Uint8Array) {
//     // First check if it starts with CBOR DID tag (0xD8, 0x9D)
//     if (value.length > 2 && value[0] === 0xd8 && value[1] === 0x9d) {
//       try {
//         const decoded = decodeDID(value);
//         if (decoded.startsWith("did:")) {
//           return decoded;
//         }
//       } catch {
//         // Fall through to other handlers
//       }
//     }

//     // Try UTF-8 decode
//     try {
//       const decoded = new TextDecoder().decode(value);
//       // Check if it's printable ASCII/UTF-8
//       if (/^[\x20-\x7E\s]*$/.test(decoded)) {
//         return decoded;
//       }
//     } catch {
//       // Fall through
//     }

//     // Keep as hex string as last resort
//     return Buffer.from(value).toString("hex");
//   }

//   return value;
// }

// /**
//  * Process a decoded UCAN delegation object
//  */
// async function processDecodedUCAN(decodedDelegation: any, reader: CarReader) {
//   const entries = await Promise.all(
//     Object.entries(decodedDelegation).map(async ([key, value]) => {
//       if (value instanceof Uint8Array) {
//         // Signature field - keep as hex string
//         if (key === "s") {
//           return [key, Buffer.from(value).toString("hex")];
//         }
//         // For DID fields (aud/iss), decode using decodeDID helper
//         if (key === "aud" || key === "iss") {
//           return [key, decodeDID(value)];
//         }
//         // Try to decode as CBOR first for other fields
//         try {
//           const decoded = CBOR.decode(value);
//           return [key, await processValue(decoded, reader)];
//         } catch {
//           // If not CBOR, try UTF-8 string
//           try {
//             const decoded = new TextDecoder().decode(value);
//             return [key, decoded];
//           } catch {
//             return [key, value];
//           }
//         }
//       }
//       // Recursively process all other values
//       return [key, await processValue(value, reader)];
//     }),
//   );

//   return Object.fromEntries(entries);
// }

// /**
//  * Decode email UCAN string into Delegation
//  */
// async function decodeEmailUCAN(ucanString: string) {
//   // Decode base64url → bytes
//   const bytes = base64url.decode(ucanString);
// console.log("Decoded bytes:", bytes); // Debug output
//   const reader = await CarReader.fromBytes(bytes);
//   console.log("CarReader.fromBytes succeeded: ", reader); // Debug output

//   const blocks = reader.blocks();
//   console.log("Reader blocks iterator obtained: ", blocks); // Debug output
//   const block = await blocks.next();
//   const delegation = block.value.bytes;
//   const decodedDelegation = await CBOR.decode(delegation);

//   // Process the delegation with recursive UCAN decoding
//   const processedDelegation = await processDecodedUCAN(
//     decodedDelegation,
//     reader,
//   );

//   return processedDelegation;
// }

// /**
//  * Format issuer DID
//  */
// // function formatIssuer(did) {
// //   return did.toString();
// // }

// /**
//  * Format audience DID
//  */
// // function formatAudience(did) {
// //   return did.toString();
// // }

// /**
//  * Convert Delegation into UI-friendly object
//  */
// function formatDelegationForUI(d: any) {
//   return {
//     issuer: d.iss || d.issuer,
//     audience: d.aud || d.audience,
//     capabilities: d.att || d.capabilities,
//     expiration: d.exp ? new Date(d.exp * 1000).toLocaleString() : "Never",
//     proofs: d.prf || d.proofs || [],
//     signature: d.s || d.signature,
//   };
// }

// // ------------------------------------------------
// // USAGE
// // ------------------------------------------------

// const UCAN_STRING =
//   "uOqJlcm9vdHOB2CpYJQABcRIgY1N-zV3--Qi_TVI1AjR2tJjVDZbrQ91BT1v_-um8iFRndmVyc2lvbgGgAwFxEiBjU37NXf75CL9NUjUCNHa0mNUNlutD3UFPW__66byIVKdhc1hE7aEDQCG5_qTH8kJ7sTtaKhWC9F52Uyj2NJ63t_Za6Mic4RHSF6ahAxmgSIyPGzSUHaTwBqL1b8D72Ms7TQRVMo6n5w1hdmUwLjkuMWNhdHSBo2JuYqRjYXR0gaFjY2FuYSpjYXVkeDhkaWQ6a2V5Ono2TWtrRExOVXNReUNzblJoemhLNTRMY040V01Kd1JpV1ZDVjhoVkp4OUF5RTJpVmNpc3N4IWRpZDptYWlsdG86Z21haWwuY29tOmFudHJpa3NoZ3dhbGVjYXVzZdgqWCUAAXESIC5K5VPja4NkODsdOemX24nhJe9N069JN0ahF5dTVl3NY2Nhbm5hY2Nlc3MvY29uZmlybWR3aXRoeBtkaWQ6d2ViOnVwLnN0b3JhY2hhLm5ldHdvcmtjYXVkWBmdGndlYjp1cC5zdG9yYWNoYS5uZXR3b3JrY2V4cBppY-WRY2lzc1gZnRp3ZWI6dXAuc3RvcmFjaGEubmV0d29ya2NwcmaA";

// const delegation = await decodeEmailUCAN(UCAN_STRING);
// const formatted = formatDelegationForUI(delegation);

// console.log("---- DELEGATION ----");
// console.dir(formatted, { depth: null });
