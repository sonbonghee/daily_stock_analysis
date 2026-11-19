import { describe, expect, it } from 'vitest';
import { UI_TEXT, formatUiText } from './uiText';
import { SCREENING_TEXT } from '../locales/screening';
import * as features from '../locales/featureText';

const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
function checkTree(reference: unknown, localized: unknown, path: string): void {
  if (typeof reference === 'string') {
    expect(typeof localized, path).toBe('string');
    expect((localized as string).trim().length, path).toBeGreaterThan(0);
    expect(placeholders(localized as string), path).toEqual(placeholders(reference));
    return;
  }
  if (reference && typeof reference === 'object') {
    expect(Object.keys(localized as object).sort(), path).toEqual(Object.keys(reference).sort());
    for (const [key, value] of Object.entries(reference)) {
      checkTree(value, (localized as Record<string, unknown>)[key], `${path}.${key}`);
    }
  }
}

describe('Korean localization contracts', () => {
  it('covers UI, screening and feature keys without losing interpolation tokens', () => {
    checkTree(UI_TEXT.en, UI_TEXT.ko, 'ui');
    checkTree(SCREENING_TEXT.en, SCREENING_TEXT.ko, 'screening');
    for (const [name, value] of Object.entries(features)) {
      if (value && typeof value === 'object' && 'en' in value && 'ko' in value) {
        checkTree(value.en, value.ko, name);
      }
    }
  });
  it('renders Korean labels and inserts dynamic values', () => {
    expect(UI_TEXT.ko['home.analyze']).toBe('분석');
    expect(UI_TEXT.ko['common.cancel']).toBe('취소');
    expect(formatUiText(UI_TEXT.ko['common.selectedCount'], { count: 3 })).toContain('3');
  });
});
