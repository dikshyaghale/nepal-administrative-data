// Export all types
export * from './types';

// Export all utility functions
export {
  getProvinces,
  getDistricts,
  getGaPas,
  getDistrictsByProvince,
  getGaPasByDistrict,
  getProvinceDetails,
  getDistrictDetails,
  getGaPaDetails,
} from './utils';

import {
  getProvinces,
  getDistricts,
  getGaPas,
  getDistrictsByProvince,
  getGaPasByDistrict,
  getProvinceDetails,
  getDistrictDetails,
  getGaPaDetails,
} from './utils';

import { createLazyRawData } from './internal/rawData';
import { RawAdministrativeData } from './types';

/**
 * Raw administrative data from Nepal - one row per local level.
 *
 * The rows are rebuilt from the encoded store on first access, so importing this
 * module without touching `rawData` costs nothing.
 */
export const rawData: RawAdministrativeData[] = /*#__PURE__*/ createLazyRawData();

// Default export with all functions for convenience
export default {
  getProvinces,
  getDistricts,
  getGaPas,
  getDistrictsByProvince,
  getGaPasByDistrict,
  getProvinceDetails,
  getDistrictDetails,
  getGaPaDetails,
};
