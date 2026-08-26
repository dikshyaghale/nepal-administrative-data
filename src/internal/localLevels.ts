import { LOCAL_LEVEL_DATA } from '../data/localLevels';
import { EN_SUFFIXES, NE_SUFFIXES } from '../data/dictionaries';
import { districtIndex } from './districts';
import { base36 } from './parse';
import { unpackNepali } from './nepali';
import type { GaPa } from '../types';

export interface LocalLevelIndex {
  /** Local levels ordered by code. */
  list: GaPa[];
  byCode: Map<number, GaPa>;
  byDistrictCode: Map<number, GaPa[]>;
  /** Sum of `totalWards` across every local level. */
  totalWards: number;
}

let cache: LocalLevelIndex | null = null;

/**
 * Decodes {@link LOCAL_LEVEL_DATA} on first call and memoises the result.
 *
 * Each record is `stemEn|stemNe|flags`, where `flags` is four base36 characters:
 * the English suffix index, the Nepali suffix index, a bitmask recording trailing
 * whitespace present in the official source, and the ward count. Codes are
 * `districtCode * 100 + n` with `n` the 1-based position within the district.
 *
 * The 753 records are scanned in a single pass over the source string. Splitting
 * into an array of lines and then into fields, and using `parseInt(c, 36)` for the
 * flags, measured about 8x slower for the same result.
 */
export function localLevelIndex(): LocalLevelIndex {
  if (cache) return cache;

  const districts = districtIndex();
  const districtList = districts.list;
  const counts = districts.localLevelCounts;

  const list: GaPa[] = [];
  const byCode = new Map<number, GaPa>();
  const byDistrictCode = new Map<number, GaPa[]>();
  let totalWards = 0;

  const source = LOCAL_LEVEL_DATA;
  const length = source.length;

  let districtIdx = 0;
  let remainingInDistrict = counts[0];
  let positionInDistrict = 0;
  let siblings: GaPa[] = [];
  let district = districtList[0];

  let cursor = 0;
  while (cursor < length) {
    const firstBar = source.indexOf('|', cursor);
    const secondBar = source.indexOf('|', firstBar + 1);
    let recordEnd = source.indexOf('\n', secondBar + 1);
    if (recordEnd === -1) recordEnd = length;

    while (remainingInDistrict === 0) {
      districtIdx++;
      positionInDistrict = 0;
      remainingInDistrict = counts[districtIdx];
      district = districtList[districtIdx];
      siblings = [];
    }
    if (positionInDistrict === 0) {
      siblings = [];
      byDistrictCode.set(district.code, siblings);
    }
    remainingInDistrict--;
    positionInDistrict++;

    const enIdx = base36(source.charCodeAt(secondBar + 1)) - 1;
    const neIdx = base36(source.charCodeAt(secondBar + 2)) - 1;
    const spaceBits = base36(source.charCodeAt(secondBar + 3));
    const wards = base36(source.charCodeAt(secondBar + 4));

    const localLevel: GaPa = {
      id: positionInDistrict,
      code: district.code * 100 + positionInDistrict,
      nameEn:
        source.slice(cursor, firstBar) +
        ' ' +
        EN_SUFFIXES[enIdx] +
        (spaceBits & 1 ? ' ' : ''),
      nameNe:
        unpackNepali(source, firstBar + 1, secondBar) +
        ' ' +
        NE_SUFFIXES[neIdx] +
        (spaceBits & 2 ? ' ' : ''),
      districtId: district.id,
      districtCode: district.code,
      provinceId: district.provinceCode,
      totalWards: wards,
    };

    list.push(localLevel);
    byCode.set(localLevel.code, localLevel);
    siblings.push(localLevel);
    totalWards += wards;

    cursor = recordEnd + 1;
  }

  cache = { list, byCode, byDistrictCode, totalWards };
  return cache;
}
