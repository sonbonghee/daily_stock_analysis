import { describe, expect, it } from 'vitest';
import { resolveFocusSymbol, isFocusStock } from './focusMarkets';
import type { StockIndexItem } from '../types/stockIndex';

describe('three-market symbol routing', () => {
  it('never guesses a market for bare numeric input', () => {
    expect(resolveFocusSymbol('005930', 'auto')).toBeNull();
    expect(resolveFocusSymbol('7203', 'auto')).toBeNull();
    expect(resolveFocusSymbol('005930', 'kospi')).toBe('005930.KS');
    expect(resolveFocusSymbol('247540', 'kosdaq')).toBe('247540.KQ');
    expect(resolveFocusSymbol('7203', 'jp')).toBe('7203.T');
    expect(resolveFocusSymbol('130A', 'jp')).toBe('130A.T');
  });
  it('preserves explicit symbols and rejects exchange mismatches', () => {
    expect(resolveFocusSymbol(' aapl ', 'us')).toBe('AAPL');
    expect(resolveFocusSymbol('BRK.B', 'us')).toBe('BRK.B');
    expect(resolveFocusSymbol('005930.KS', 'auto')).toBe('005930.KS');
    expect(resolveFocusSymbol('005930.KS', 'kosdaq')).toBeNull();
    expect(resolveFocusSymbol('7203.T', 'us')).toBeNull();
    expect(resolveFocusSymbol('600519.SH', 'auto')).toBeNull();
    expect(resolveFocusSymbol('삼성전자', 'kospi')).toBeNull();
  });
  it('keeps same-number Chinese matches out of the focused suggestion list', () => {
    const item = { market: 'CN', canonicalCode: '005930.SZ' } as StockIndexItem;
    expect(isFocusStock(item, 'auto')).toBe(false);
    expect(isFocusStock({ ...item, market: 'KR', canonicalCode: '005930.KS' }, 'kospi')).toBe(true);
    expect(isFocusStock({ ...item, market: 'KR', canonicalCode: '005930.KS' }, 'kosdaq')).toBe(false);
  });
});
