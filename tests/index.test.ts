import {
  getProvinces,
  getDistricts,
  getGaPas,
  getDistrictsByProvince,
  getGaPasByDistrict,
  getProvinceDetails,
  getDistrictDetails,
  getGaPaDetails,
  Language,
} from '../src/index';

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
      // Check if Nepali text is present
      expect(provinces.some((p) => /[\u0900-\u097F]/.test(p.name))).toBe(true);
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
      expect(districts.some((d) => /[\u0900-\u097F]/.test(d.name))).toBe(true);
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
      expect(gapas.some((g) => /[\u0900-\u097F]/.test(g.name))).toBe(true);
    });
  });

  describe('getDistrictsByProvince', () => {
    test('should return districts for a valid province', () => {
      const districts = getDistrictsByProvince(1); // Koshi Province
      expect(districts).toBeDefined();
      expect(Array.isArray(districts)).toBe(true);
      expect(districts.length).toBeGreaterThan(0);
    });

    test('should return districts in Nepali for a province', () => {
      const districts = getDistrictsByProvince(1, 'ne');
      expect(districts).toBeDefined();
      expect(districts.length).toBeGreaterThan(0);
      expect(districts.some((d) => /[\u0900-\u097F]/.test(d.name))).toBe(true);
    });

    test('should throw error for invalid province', () => {
      expect(() => getDistrictsByProvince(999)).toThrow(
        'Province with ID/code 999 not found'
      );
    });
  });

  describe('getGaPasByDistrict', () => {
    test('should return GaPas for a valid district', () => {
      const gapas = getGaPasByDistrict(1); // Taplejung
      expect(gapas).toBeDefined();
      expect(Array.isArray(gapas)).toBe(true);
      expect(gapas.length).toBeGreaterThan(0);
    });

    test('should return GaPas in Nepali for a district', () => {
      const gapas = getGaPasByDistrict(1, 'ne');
      expect(gapas).toBeDefined();
      expect(gapas.length).toBeGreaterThan(0);
      expect(gapas.some((g) => /[\u0900-\u097F]/.test(g.name))).toBe(true);
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
      expect(gapa?.nameEn).toBe('Phaktanlung Gaunpalika');
      expect(gapa?.nameNe).toBe('फक्ताङ्लुङ्ग गाउँपालिका');
    });

    test('should return null for invalid IDs', () => {
      expect(getProvinceDetails(999)).toBeNull();
      expect(getDistrictDetails(999)).toBeNull();
      expect(getGaPaDetails(999)).toBeNull();
    });
  });
});
