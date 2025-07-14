import {
  Province,
  District,
  GaPa,
  RawAdministrativeData,
  Language,
  NameCodePair,
} from './types';
import { rawData } from './data';

/**
 * Cached processed data for performance
 */
let processedData: {
  provinces: Map<number, Province>;
  districts: Map<number, District>;
  gapas: Map<number, GaPa>;
  districtsByProvince: Map<number, number[]>;
  gapasByDistrict: Map<number, number[]>;
} | null = null;

/**
 * Clear the cached data (useful for debugging)
 */
export function clearCache() {
  processedData = null;
}

/**
 * Process raw data and create optimized lookup structures
 */
function processData() {
  if (processedData) {
    return processedData;
  }

  const provinces = new Map<number, Province>();
  const districts = new Map<number, District>();
  const gapas = new Map<number, GaPa>();
  const districtsByProvince = new Map<number, number[]>();
  const gapasByDistrict = new Map<number, number[]>();

  rawData.forEach((item: RawAdministrativeData) => {
    // Process Province
    if (!provinces.has(item.Province)) {
      provinces.set(item.Province, {
        id: item.Province,
        code: item.Province,
        nameEn: item['Province Name En'],
        nameNe: item['Province Name Ne'],
      });
    }

    // Process District
    if (!districts.has(item['District Id'])) {
      districts.set(item['District Id'], {
        id: item['District Id'],
        code: item['District Code'],
        nameEn: item['District Name En'],
        nameNe: item['District Name Ne'],
        provinceId: item.Province,
        provinceCode: item.Province,
      });

      // Add district to province mapping
      if (!districtsByProvince.has(item.Province)) {
        districtsByProvince.set(item.Province, []);
      }
      districtsByProvince.get(item.Province)!.push(item['District Id']);
    }

    // Process GaPa - Use GAPA Code as unique key since GAPA Id repeats across districts
    if (!gapas.has(item['GAPA Code'])) {
      gapas.set(item['GAPA Code'], {
        id: item['GAPA Id'],
        code: item['GAPA Code'],
        nameEn: item['GaPa Name En'],
        nameNe: item['GaPa Name Ne'],
        districtId: item['District Id'],
        districtCode: item['District Code'],
        provinceId: item.Province,
        totalWards: item['Total Wards'],
      });

      // Add gapa to district mapping
      if (!gapasByDistrict.has(item['District Id'])) {
        gapasByDistrict.set(item['District Id'], []);
      }
      gapasByDistrict.get(item['District Id'])!.push(item['GAPA Code']);
    }
  });

  processedData = {
    provinces,
    districts,
    gapas,
    districtsByProvince,
    gapasByDistrict,
  };

  return processedData;
}

/**
 * Get name based on language preference
 */
function getName(
  nameEn: string,
  nameNe: string,
  language: Language = 'en'
): string {
  return language === 'ne' ? nameNe : nameEn;
}

/**
 * Validate language parameter
 */
function validateLanguage(language?: Language): Language {
  if (language && !['en', 'ne'].includes(language)) {
    throw new Error('Invalid language. Must be "en" or "ne"');
  }
  return language || 'en';
}

/**
 * Get all provinces with code and name
 */
export function getProvinces(language: Language = 'en'): NameCodePair[] {
  const validatedLanguage = validateLanguage(language);
  const data = processData();

  return Array.from(data.provinces.values()).map((province) => ({
    code: province.code,
    name: getName(province.nameEn, province.nameNe, validatedLanguage),
  }));
}

/**
 * Get all districts with code and name
 */
export function getDistricts(language: Language = 'en'): NameCodePair[] {
  const validatedLanguage = validateLanguage(language);
  const data = processData();

  return Array.from(data.districts.values()).map((district) => ({
    code: district.code,
    name: getName(district.nameEn, district.nameNe, validatedLanguage),
  }));
}

/**
 * Get all GaPas with code and name
 */
export function getGaPas(language: Language = 'en'): NameCodePair[] {
  const validatedLanguage = validateLanguage(language);
  const data = processData();

  return Array.from(data.gapas.values()).map((gapa) => ({
    code: gapa.code,
    name: getName(gapa.nameEn, gapa.nameNe, validatedLanguage),
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
  const validatedLanguage = validateLanguage(language);
  const data = processData();

  // Find province by ID or code
  let provinceId: number | undefined;
  for (const [id, province] of data.provinces) {
    if (
      province.id === provinceIdOrCode ||
      province.code === provinceIdOrCode
    ) {
      provinceId = id;
      break;
    }
  }

  if (!provinceId) {
    throw new Error(`Province with ID/code ${provinceIdOrCode} not found`);
  }

  const districtIds = data.districtsByProvince.get(provinceId) || [];

  return districtIds.map((districtId) => {
    const district = data.districts.get(districtId)!;
    return {
      code: district.code,
      name: getName(district.nameEn, district.nameNe, validatedLanguage),
    };
  });
}

/**
 * Get GaPas by district ID or code
 */
export function getGaPasByDistrict(
  districtIdOrCode: number,
  language: Language = 'en'
): NameCodePair[] {
  const validatedLanguage = validateLanguage(language);
  const data = processData();

  // Find district by ID or code
  let districtId: number | undefined;
  for (const [id, district] of data.districts) {
    if (
      district.id === districtIdOrCode ||
      district.code === districtIdOrCode
    ) {
      districtId = id;
      break;
    }
  }

  if (!districtId) {
    throw new Error(`District with ID/code ${districtIdOrCode} not found`);
  }

  const gapaCodes = data.gapasByDistrict.get(districtId) || [];

  return gapaCodes.map((gapaCode) => {
    const gapa = data.gapas.get(gapaCode)!;
    return {
      code: gapa.code,
      name: getName(gapa.nameEn, gapa.nameNe, validatedLanguage),
      totalWard: gapa.totalWards,
    };
  });
}

/**
 * Get detailed province information by ID or code
 */
export function getProvinceDetails(provinceIdOrCode: number): Province | null {
  const data = processData();

  for (const province of data.provinces.values()) {
    if (
      province.id === provinceIdOrCode ||
      province.code === provinceIdOrCode
    ) {
      return province;
    }
  }

  return null;
}

/**
 * Get detailed district information by ID or code
 */
export function getDistrictDetails(districtIdOrCode: number): District | null {
  const data = processData();

  for (const district of data.districts.values()) {
    if (
      district.id === districtIdOrCode ||
      district.code === districtIdOrCode
    ) {
      return district;
    }
  }

  return null;
}

/**
 * Get detailed GaPa information by ID or code
 */
export function getGaPaDetails(gapaIdOrCode: number): GaPa | null {
  const data = processData();

  // First try by code (which is the key in our Map)
  if (data.gapas.has(gapaIdOrCode)) {
    return data.gapas.get(gapaIdOrCode)!;
  }

  // Then try by id for backward compatibility
  for (const gapa of data.gapas.values()) {
    if (gapa.id === gapaIdOrCode) {
      return gapa;
    }
  }

  return null;
}
