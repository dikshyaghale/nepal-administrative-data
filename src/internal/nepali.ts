import { NE_ALPHABET, NE_POOL } from '../data/nepaliAlphabet';

/**
 * ASCII code -> Devanagari character, for the 63 characters the dataset uses.
 *
 * Built on first use so that consumers who never read a Nepali name never pay
 * for it. A flat array indexed by character code is the cheapest lookup
 * available; `NE_POOL` only contains printable ASCII, so 128 slots suffice.
 */
let table: string[] | null = null;

function lookupTable(): string[] {
  if (table) return table;
  const built = new Array<string>(128).fill('');
  for (let i = 0; i < NE_POOL.length; i++) {
    built[NE_POOL.charCodeAt(i)] = NE_ALPHABET[i];
  }
  table = built;
  return table;
}

/**
 * Expands `source[start..end)` from packed ASCII back to Devanagari.
 *
 * Reading straight out of the encoded blob avoids allocating the packed slice
 * that would otherwise be thrown away immediately.
 */
export function unpackNepali(
  source: string,
  start: number,
  end: number
): string {
  const map = lookupTable();
  let out = '';
  for (let i = start; i < end; i++) {
    out += map[source.charCodeAt(i)];
  }
  return out;
}
