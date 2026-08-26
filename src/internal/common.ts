import { Language } from '../types';

/**
 * Returns the name matching the requested language.
 */
export function pickName(
  nameEn: string,
  nameNe: string,
  language: Language = 'en'
): string {
  return language === 'ne' ? nameNe : nameEn;
}

/**
 * Normalises and validates a language argument.
 */
export function validateLanguage(language?: Language): Language {
  if (language && language !== 'en' && language !== 'ne') {
    throw new Error('Invalid language. Must be "en" or "ne"');
  }
  return language || 'en';
}
