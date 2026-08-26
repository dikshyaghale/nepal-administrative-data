import { DISTRICT_DATA } from '../data/districts';
import { provinceIndex } from './provinces';
import { base36Slice } from './parse';
import { unpackNepali } from './nepali';
import type { District } from '../types';

export interface DistrictIndex {
  /** Districts ordered by id, 1-based ids matching the array position + 1. */
  list: District[];
  byCode: Map<number, District>;
  byId: Map<number, District>;
  byProvinceCode: Map<number, District[]>;
  /** Number of local levels in each district, parallel to {@link list}. */
  localLevelCounts: number[];
}

let cache: DistrictIndex | null = null;

/**
 * Decodes {@link DISTRICT_DATA} on first call and memoises the result.
 *
 * District codes are not stored: they are `provinceCode * 100 + n`, where `n` is
 * the 1-based position of the district within its province. The province each
 * district belongs to is recovered by walking the per-province district counts.
 */
export function districtIndex(): DistrictIndex {
  if (cache) return cache;

  const provinceCounts = provinceIndex().districtCounts;
  const list: District[] = [];
  const byCode = new Map<number, District>();
  const byId = new Map<number, District>();
  const byProvinceCode = new Map<number, District[]>();
  const localLevelCounts: number[] = [];

  const source = DISTRICT_DATA;
  const length = source.length;

  let provinceIdx = 0;
  let remainingInProvince = provinceCounts[0];
  let positionInProvince = 0;
  let siblings: District[] = [];

  let cursor = 0;
  let id = 0;
  while (cursor < length) {
    const firstBar = source.indexOf('|', cursor);
    const secondBar = source.indexOf('|', firstBar + 1);
    let recordEnd = source.indexOf('\n', secondBar + 1);
    if (recordEnd === -1) recordEnd = length;

    while (remainingInProvince === 0) {
      provinceIdx++;
      positionInProvince = 0;
      remainingInProvince = provinceCounts[provinceIdx];
    }
    const provinceCode = provinceIdx + 1;
    if (positionInProvince === 0) {
      siblings = [];
      byProvinceCode.set(provinceCode, siblings);
    }
    remainingInProvince--;
    positionInProvince++;
    id++;

    const district: District = {
      id,
      code: provinceCode * 100 + positionInProvince,
      nameEn: source.slice(cursor, firstBar),
      nameNe: unpackNepali(source, firstBar + 1, secondBar),
      provinceId: provinceCode,
      provinceCode,
    };

    list.push(district);
    byCode.set(district.code, district);
    byId.set(id, district);
    siblings.push(district);
    localLevelCounts.push(base36Slice(source, secondBar + 1, recordEnd));

    cursor = recordEnd + 1;
  }

  cache = { list, byCode, byId, byProvinceCode, localLevelCounts };
  return cache;
}
