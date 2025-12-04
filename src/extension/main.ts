import { CarReader } from '@ipld/car';
import * as UCAN from '@ucanto/core';
import { decode as cborDecode } from 'cborg';
import { toString as u8ToString } from 'uint8arrays';

const jwtLike = /[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;

export async function parseUCANsFromCar(carBytes: Uint8Array) {
  const results: Array<any> = [];

  const car = await CarReader.fromBytes(carBytes);

  for await (const block of car.blocks()) {
    const bytes = block.bytes;

    try {
      const node = cborDecode(bytes);

      const candidates = [
        node?.ucan,
        node?.delegation,
        node?.invocation?.ucan,
        node?.cap,
        node?.capabilities,
        node?.proof || node?.proofs,
        node?.attestation,
      ];

      for (const cand of candidates) {
        if (!cand) continue;
        if (typeof cand === 'string') {
          try {
            const parsed = UCAN.decodeLink(cand);
            results.push({ parsed, source: 'cbor-field', field: cand });
            continue;
          } catch (err) {
          }
        }
        if (Array.isArray(cand)) {
          for (const elt of cand) {
            if (typeof elt === 'string') {
              try {
                const parsed = UCAN.decodeLink(elt);
                results.push({ parsed, source: 'cbor-array', field: elt });
              } catch {}
            }
          }
        }
      }

    } catch (err) {
    }

    try {
      const text = u8ToString(bytes);
      const matches = text.match(jwtLike);
      if (matches && matches.length) {
        for (const token of matches) {
          try {
            const parsed = UCAN.decodeLink(token);
            results.push({ parsed, source: 'jwt-regex', token });
          } catch {
          }
        }
      }
    } catch {
    }
  }

  return results;
}
