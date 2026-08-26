/**
 * The original 1.x test suite, unchanged, plus assertions that pin the exact
 * shapes and error messages the 1.x API produced.
 */
import {
  getProvinces,
  getDistricts,
  getGaPas,
  getDistrictsByProvince,
  getGaPasByDistrict,
  getProvinceDetails,
  getDistrictDetails,
  getGaPaDetails,
  rawData,
  Language,
} from '../src/index';
import defaultExport from '../src/index';

describe('Nepal Administrative Data Package', () => {
  describe('getProvinces', () => {
    test('should return provinces in English by default', () => {
      const provinces = getProvinces();
      expect(provinces).toBeDefined();
      expect(Array.isArray(provinces)).toBe(true);
      expect(provinces.length).toBeGreaterThan(0);
      expect(provinces[0]).toHaveProperty('code');
      expect(provinces[0]).toHaveProperty('name');
      expect(typeof provinces[0].name).toBe('string');
    });

    test('should return provinces in Nepali when specified', () => {
      const provinces = getProvinces('ne');
      expect(provinces).toBeDefined();
      expect(provinces.length).toBeGreaterThan(0);
      expect(provinces.some((p) => /[ऀ-ॿ]/.test(p.name))).toBe(true);
    });

    test('should throw error for invalid language', () => {
      expect(() => getProvinces('invalid' as Language)).toThrow(
        'Invalid language'
      );
    });
  });

  describe('getDistricts', () => {
    test('should return districts in English by default', () => {
      const districts = getDistricts();
      expect(districts).toBeDefined();
      expect(Array.isArray(districts)).toBe(true);
      expect(districts.length).toBeGreaterThan(0);
      expect(districts[0]).toHaveProperty('code');
      expect(districts[0]).toHaveProperty('name');
    });

    test('should return districts in Nepali when specified', () => {
      const districts = getDistricts('ne');
      expect(districts).toBeDefined();
      expect(districts.length).toBeGreaterThan(0);
      expect(districts.some((d) => /[ऀ-ॿ]/.test(d.name))).toBe(true);
    });
  });

  describe('getGaPas', () => {
    test('should return GaPas in English by default', () => {
      const gapas = getGaPas();
      expect(gapas).toBeDefined();
      expect(Array.isArray(gapas)).toBe(true);
      expect(gapas.length).toBeGreaterThan(0);
      expect(gapas[0]).toHaveProperty('code');
      expect(gapas[0]).toHaveProperty('name');
    });

    test('should return GaPas in Nepali when specified', () => {
      const gapas = getGaPas('ne');
      expect(gapas).toBeDefined();
      expect(gapas.length).toBeGreaterThan(0);
      expect(gapas.some((g) => /[ऀ-ॿ]/.test(g.name))).toBe(true);
    });
  });

  describe('getDistrictsByProvince', () => {
    test('should return districts for a valid province', () => {
      const districts = getDistrictsByProvince(1);
      expect(districts).toBeDefined();
      expect(Array.isArray(districts)).toBe(true);
      expect(districts.length).toBeGreaterThan(0);
    });

    test('should return districts in Nepali for a province', () => {
      const districts = getDistrictsByProvince(1, 'ne');
      expect(districts).toBeDefined();
      expect(districts.length).toBeGreaterThan(0);
      expect(districts.some((d) => /[ऀ-ॿ]/.test(d.name))).toBe(true);
    });

    test('should throw error for invalid province', () => {
      expect(() => getDistrictsByProvince(999)).toThrow(
        'Province with ID/code 999 not found'
      );
    });
  });

  describe('getGaPasByDistrict', () => {
    test('should return GaPas for a valid district', () => {
      const gapas = getGaPasByDistrict(1);
      expect(gapas).toBeDefined();
      expect(Array.isArray(gapas)).toBe(true);
      expect(gapas.length).toBeGreaterThan(0);
    });

    test('should return GaPas in Nepali for a district', () => {
      const gapas = getGaPasByDistrict(1, 'ne');
      expect(gapas).toBeDefined();
      expect(gapas.length).toBeGreaterThan(0);
      expect(gapas.some((g) => /[ऀ-ॿ]/.test(g.name))).toBe(true);
    });

    test('should throw error for invalid district', () => {
      expect(() => getGaPasByDistrict(999)).toThrow(
        'District with ID/code 999 not found'
      );
    });
  });

  describe('Details functions', () => {
    test('getProvinceDetails should return province details', () => {
      const province = getProvinceDetails(1);
      expect(province).toBeDefined();
      expect(province?.nameEn).toBe('Koshi Province');
      expect(province?.nameNe).toBe('कोशी प्रदेश');
    });

    test('getDistrictDetails should return district details', () => {
      const district = getDistrictDetails(1);
      expect(district).toBeDefined();
      expect(district?.nameEn).toBe('Taplejung');
      expect(district?.nameNe).toBe('ताप्लेजुङ');
    });

    test('getGaPaDetails should return GaPa details', () => {
      const gapa = getGaPaDetails(1);
      expect(gapa).toBeDefined();
      expect(gapa?.nameEn).toBe('Phaktanlung Rural Municipality');
      expect(gapa?.nameNe).toBe('फक्ताङ्लुङ्ग गाउँपालिका');
    });

    test('should return null for invalid IDs', () => {
      expect(getProvinceDetails(999)).toBeNull();
      expect(getDistrictDetails(999)).toBeNull();
      expect(getGaPaDetails(999)).toBeNull();
    });
  });

  describe('1.x contract details', () => {
    test('counts are unchanged', () => {
      expect(getProvinces()).toHaveLength(7);
      expect(getDistricts()).toHaveLength(77);
      expect(getGaPas()).toHaveLength(753);
    });

    test('getGaPas entries expose totalWard', () => {
      expect(getGaPas()[0]).toEqual({
        code: 10101,
        name: 'Phaktanlung Rural Municipality',
        totalWard: 7,
      });
    });

    test('lookup by code works alongside lookup by id', () => {
      expect(getDistrictDetails(101)?.nameEn).toBe('Taplejung');
      expect(getGaPaDetails(10101)?.nameEn).toBe('Phaktanlung Rural Municipality');
      expect(getGaPasByDistrict(101)).toHaveLength(getGaPasByDistrict(1).length);
    });

    test('district details carry province linkage', () => {
      expect(getDistrictDetails(709)).toMatchObject({
        id: 77,
        code: 709,
        nameEn: 'Kanchanpur',
        provinceId: 7,
        provinceCode: 7,
      });
    });

    test('errors thrown are still plain Errors', () => {
      expect(() => getDistrictsByProvince(999)).toThrow(Error);
      expect(() => getGaPas('xx' as Language)).toThrow(Error);
    });

    test('default export still exposes the original eight functions', () => {
      for (const name of [
        'getProvinces',
        'getDistricts',
        'getGaPas',
        'getDistrictsByProvince',
        'getGaPasByDistrict',
        'getProvinceDetails',
        'getDistrictDetails',
        'getGaPaDetails',
      ]) {
        expect(typeof (defaultExport as Record<string, unknown>)[name]).toBe(
          'function'
        );
      }
    });
  });

  describe('rawData', () => {
    test('behaves like the original array', () => {
      expect(Array.isArray(rawData)).toBe(true);
      expect(rawData).toHaveLength(753);
      expect(rawData[0]).toEqual({
        Province: 1,
        'Province Name En': 'Koshi Province',
        'Province Name Ne': 'कोशी प्रदेश',
        'District Id': 1,
        'District Code': 101,
        'District Name En': 'Taplejung',
        'District Name Ne': 'ताप्लेजुङ',
        'GAPA Id': 1,
        'GAPA Code': 10101,
        'GaPa Name En': 'Phaktanlung Rural Municipality',
        'GaPa Name Ne': 'फक्ताङ्लुङ्ग गाउँपालिका',
        'Total Wards': 7,
      });
    });

    test('supports iteration, spreading and JSON serialisation', () => {
      expect([...rawData]).toHaveLength(753);
      expect(rawData.filter((r) => r.Province === 3).length).toBeGreaterThan(0);
      expect(Object.keys(rawData[0])).toHaveLength(12);
      expect(JSON.parse(JSON.stringify(rawData))).toHaveLength(753);
      let seen = 0;
      for (const _row of rawData) seen++;
      expect(seen).toBe(753);
    });

    test('matches the published 1.x snapshot exactly', () => {
      const source = require('../data/source.json');
      expect(JSON.parse(JSON.stringify(rawData))).toEqual(source);
    });
  });
});
