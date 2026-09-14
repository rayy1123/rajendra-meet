import { describe, it, expect } from 'vitest';
import { OFFICIAL_DQ_CODES, getDqCodeDefinition, formatOfficialDqText } from '../dq-codes';

describe('Official Disqualification (DQ) Codes', () => {
  it('should have key swimming rule definitions', () => {
    expect(OFFICIAL_DQ_CODES.length).toBeGreaterThanOrEqual(15);
    const falseStart = getDqCodeDefinition('SW 4.4');
    expect(falseStart).not.toBeNull();
    expect(falseStart?.ruleName).toBe('False Start');
  });

  it('should format official DQ text properly', () => {
    expect(formatOfficialDqText('SW 4.4')).toBe('DQ (SW 4.4 - False Start)');
    expect(formatOfficialDqText('SW 7.1')).toBe('DQ (SW 7.1 - Breaststroke Kick after Start/Turn)');
    expect(formatOfficialDqText(null)).toBe('DQ');
  });
});
