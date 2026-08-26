/**
 * Decodes a single base36 digit from its character code.
 *
 * `parseInt(char, 36)` costs roughly an order of magnitude more, and the decoders
 * call this several thousand times while building their indexes.
 */
export function base36(charCode: number): number {
  // '0'-'9' are 48-57, 'a'-'z' are 97-122.
  return charCode < 58 ? charCode - 48 : charCode - 87;
}

/**
 * Reads a base36 integer of any length from `source[start..end)`.
 */
export function base36Slice(
  source: string,
  start: number,
  end: number
): number {
  let value = 0;
  for (let i = start; i < end; i++) {
    value = value * 36 + base36(source.charCodeAt(i));
  }
  return value;
}
