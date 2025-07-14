/**
 * Language options for bilingual support
 */
export type Language = 'en' | 'ne';

/**
 * Province interface
 */
export interface Province {
  id: number;
  code: number;
  nameEn: string;
  nameNe: string;
}

/**
 * District interface
 */
export interface District {
  id: number;
  code: number;
  nameEn: string;
  nameNe: string;
  provinceId: number;
  provinceCode: number;
}

/**
 * GaPa (Gaupalika/Municipality) interface
 */
export interface GaPa {
  id: number;
  code: number;
  nameEn: string;
  nameNe: string;
  districtId: number;
  districtCode: number;
  provinceId: number;
  totalWards: number;
}

/**
 * Raw data structure from the provided JSON
 */
export interface RawAdministrativeData {
  Province: number;
  'Province Name En': string;
  'Province Name Ne': string;
  'District Id': number;
  'District Code': number;
  'District Name En': string;
  'District Name Ne': string;
  'GAPA Id': number;
  'GAPA Code': number;
  'GaPa Name En': string;
  'GaPa Name Ne': string;
  'Total Wards': number;
}

/**
 * Options for filtering and language selection
 */
export interface FilterOptions {
  language?: Language;
}

/**
 * Simple name-code pair for basic listings
 */
export interface NameCodePair {
  code: number;
  name: string;
  totalWard?: number;
}
