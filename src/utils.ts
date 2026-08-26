import { provinceIndex } from './internal/provinces';
import { districtIndex } from './internal/districts';
import { localLevelIndex } from './internal/localLevels';
import { pickName, validateLanguage } from './internal/common';
import type {
  District,
  GaPa,
  Language,
  NameCodePair,
  Province,
} from './types';

/**
 * Get all provinces with code and name
 */
export function getProvinces(language: Language = 'en'): NameCodePair[] {
  const lang = validateLanguage(language);
  return provinceIndex().list.map((province) => ({
    code: province.code,
    name: pickName(province.nameEn, province.nameNe, lang),
  }));
}

/**
 * Get all districts with code and name
 */
export function getDistricts(language: Language = 'en'): NameCodePair[] {
  const lang = validateLanguage(language);
  return districtIndex().list.map((district) => ({
    code: district.code,
    name: pickName(district.nameEn, district.nameNe, lang),
  }));
}

/**
 * Get all GaPas with code and name
 */
export function getGaPas(language: Language = 'en'): NameCodePair[] {
  const lang = validateLanguage(language);
  return localLevelIndex().list.map((gapa) => ({
    code: gapa.code,
    name: pickName(gapa.nameEn, gapa.nameNe, lang),
    totalWard: gapa.totalWards,
  }));
}

/**
 * Get districts by province ID or code
 */
export function getDistrictsByProvince(
  provinceIdOrCode: number,
  language: Language = 'en'
): NameCodePair[] {
  const lang = validateLanguage(language);
  const provinces = provinceIndex();

  // Province ids and codes are identical, so a single lookup covers both.
  if (!provinces.byCode.has(provinceIdOrCode)) {
    throw new Error(`Province with ID/code ${provinceIdOrCode} not found`);
  }

  const districts = districtIndex().byProvinceCode.get(provinceIdOrCode) || [];
  return districts.map((district) => ({
    code: district.code,
    name: pickName(district.nameEn, district.nameNe, lang),
  }));
}

/**
 * Get GaPas by district ID or code
 */
export function getGaPasByDistrict(
  districtIdOrCode: number,
  language: Language = 'en'
): NameCodePair[] {
  const lang = validateLanguage(language);
  const districts = districtIndex();

  // District ids are 1..77 and district codes are 101..799, so they never collide.
  const district =
    districts.byId.get(districtIdOrCode) ||
    districts.byCode.get(districtIdOrCode);

  if (!district) {
    throw new Error(`District with ID/code ${districtIdOrCode} not found`);
  }

  const gapas = localLevelIndex().byDistrictCode.get(district.code) || [];
  return gapas.map((gapa) => ({
    code: gapa.code,
    name: pickName(gapa.nameEn, gapa.nameNe, lang),
    totalWard: gapa.totalWards,
  }));
}

/**
 * Get detailed province information by ID or code
 */
export function getProvinceDetails(provinceIdOrCode: number): Province | null {
  return provinceIndex().byCode.get(provinceIdOrCode) || null;
}

/**
 * Get detailed district information by ID or code
 */
export function getDistrictDetails(districtIdOrCode: number): District | null {
  const districts = districtIndex();
  return (
    districts.byId.get(districtIdOrCode) ||
    districts.byCode.get(districtIdOrCode) ||
    null
  );
}

/**
 * Get detailed GaPa information by ID or code
 */
export function getGaPaDetails(gapaIdOrCode: number): GaPa | null {
  const localLevels = localLevelIndex();

  // Code takes priority over id, matching the 1.0.x lookup order.
  const byCode = localLevels.byCode.get(gapaIdOrCode);
  if (byCode) return byCode;

  for (const gapa of localLevels.list) {
    if (gapa.id === gapaIdOrCode) return gapa;
  }
  return null;
}
