import type { StockIndexItem } from '../types/stockIndex';

export type FocusExchange = 'auto' | 'us' | 'kospi' | 'kosdaq' | 'jp';
export const FOCUS_REGIONS = ['us', 'kr', 'jp'] as const;
export const FOCUS_EXCHANGES: FocusExchange[] = ['auto', 'us', 'kospi', 'kosdaq', 'jp'];
export const FOCUS_EXCHANGE_LABELS = {
  auto: 'US · KR · JP', us: '미국 / US · USD', kospi: 'KOSPI · KRW',
  kosdaq: 'KOSDAQ · KRW', jp: '일본 / JP · JPY',
};

/** Explicit exchange selection is required for bare numeric tickers. */
export function resolveFocusSymbol(input: string, exchange: FocusExchange): string | null {
  const code = input.trim().toUpperCase();
  if (!code) return null;
  if (/^\d{6}\.KS$/.test(code)) return exchange === 'auto' || exchange === 'kospi' ? code : null;
  if (/^\d{6}\.KQ$/.test(code)) return exchange === 'auto' || exchange === 'kosdaq' ? code : null;
  if (/^[0-9][0-9A-Z]{3}\.T$/.test(code)) return exchange === 'auto' || exchange === 'jp' ? code : null;
  if (exchange === 'kospi' && /^\d{6}$/.test(code)) return `${code}.KS`;
  if (exchange === 'kosdaq' && /^\d{6}$/.test(code)) return `${code}.KQ`;
  if (exchange === 'jp' && /^[0-9][0-9A-Z]{3}$/.test(code)) return `${code}.T`;
  // US share classes may use a period or hyphen. Foreign exchange suffixes are not US symbols.
  if (/\.(KS|KQ|T|TW|TWO|HK|SH|SZ|SS|BJ|L|TO|AX)$/i.test(code)) return null;
  if ((exchange === 'auto' || exchange === 'us') && /^[A-Z][A-Z0-9]*(?:[.-][A-Z])?$/.test(code)) return code;
  return null;
}

export function isFocusStock(item: StockIndexItem, exchange: FocusExchange): boolean {
  return ['US', 'KR', 'JP'].includes(item.market) && resolveFocusSymbol(item.canonicalCode, exchange) !== null;
}
