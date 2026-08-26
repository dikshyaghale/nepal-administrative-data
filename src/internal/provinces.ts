import { PROVINCE_DATA } from '../data/provinces';
import { base36Slice } from './parse';
import { unpackNepali } from './nepali';
import type { Province } from '../types';

export interface ProvinceIndex {
  /** Provinces ordered by code, where code equals the array position + 1. */
  list: Province[];
  byCode: Map<number, Province>;
  /** Number of districts in each province, parallel to {@link list}. */
  districtCounts: number[];
}

let cache: ProvinceIndex | null = null;

/**
 * Decodes {@link PROVINCE_DATA} on first call and memoises the result.
 *
 * Doing this lazily keeps the cost off the module-load path for consumers that
 * never touch province data, and lets bundlers drop the payload entirely when
 * nothing reaches this module.
 */
export function provinceIndex(): ProvinceIndex {
  if (cache) return cache;

  const list: Province[] = [];
  const byCode = new Map<number, Province>();
  const districtCounts: number[] = [];

  const source = PROVINCE_DATA;
  const length = source.length;

  let cursor = 0;
  let code = 0;
  while (cursor < length) {
    const firstBar = source.indexOf('|', cursor);
    const secondBar = source.indexOf('|', firstBar + 1);
    let recordEnd = source.indexOf('\n', secondBar + 1);
    if (recordEnd === -1) recordEnd = length;

    code++;
    const province: Province = {
      id: code,
      code,
      nameEn: source.slice(cursor, firstBar),
      nameNe: unpackNepali(source, firstBar + 1, secondBar),
    };

    list.push(province);
    byCode.set(code, province);
    districtCounts.push(base36Slice(source, secondBar + 1, recordEnd));

    cursor = recordEnd + 1;
  }

  cache = { list, byCode, districtCounts };
  return cache;
}
