import { localLevelIndex } from './localLevels';
import { districtIndex } from './districts';
import { provinceIndex } from './provinces';
import type { RawAdministrativeData } from '../types';

let materialised: RawAdministrativeData[] | null = null;

/**
 * Rebuilds the fully denormalised table that this package shipped before 2.0.
 *
 * The rows are byte-identical to the previous `rawData` export, including key
 * order, so consumers that iterate it or feed it to a CSV writer are unaffected.
 */
export function buildRawData(): RawAdministrativeData[] {
  if (materialised) return materialised;

  const provinces = provinceIndex();
  const districts = districtIndex();
  const localLevels = localLevelIndex();

  materialised = localLevels.list.map((localLevel) => {
    const district = districts.byCode.get(localLevel.districtCode)!;
    const province = provinces.byCode.get(district.provinceCode)!;
    return {
      Province: province.code,
      'Province Name En': province.nameEn,
      'Province Name Ne': province.nameNe,
      'District Id': district.id,
      'District Code': district.code,
      'District Name En': district.nameEn,
      'District Name Ne': district.nameNe,
      'GAPA Id': localLevel.id,
      'GAPA Code': localLevel.code,
      'GaPa Name En': localLevel.nameEn,
      'GaPa Name Ne': localLevel.nameNe,
      'Total Wards': localLevel.totalWards,
    };
  });

  return materialised;
}

/**
 * Creates an array-shaped lazy view over {@link buildRawData}.
 *
 * `rawData` has to stay a plain array-like value for backwards compatibility, but
 * eagerly denormalising 753 rows on every `import` would undo the lazy decoding
 * this package is built around. A proxy over a real array keeps `Array.isArray`,
 * spreading, `for...of`, `JSON.stringify` and mutation working while deferring the
 * cost until the first property access.
 */
export function createLazyRawData(): RawAdministrativeData[] {
  const target: RawAdministrativeData[] = [];
  let populated = false;

  const fill = (): RawAdministrativeData[] => {
    if (!populated) {
      populated = true;
      target.push(...buildRawData().map((row) => ({ ...row })));
    }
    return target;
  };

  return new Proxy(target, {
    get(_t, prop, receiver) {
      return Reflect.get(fill(), prop, receiver);
    },
    has(_t, prop) {
      return Reflect.has(fill(), prop);
    },
    ownKeys() {
      return Reflect.ownKeys(fill());
    },
    getOwnPropertyDescriptor(_t, prop) {
      return Reflect.getOwnPropertyDescriptor(fill(), prop);
    },
    set(_t, prop, value) {
      return Reflect.set(fill(), prop, value);
    },
    deleteProperty(_t, prop) {
      return Reflect.deleteProperty(fill(), prop);
    },
  });
}
