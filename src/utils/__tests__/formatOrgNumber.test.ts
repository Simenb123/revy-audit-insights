import { describe, it, expect } from 'vitest';
import { formatOrgNumber } from '../formatOrgNumber';

describe('formatOrgNumber', () => {
  it('formats 9 digit numbers with spaces', () => {
    expect(formatOrgNumber('999777888')).toBe('999 777 888');
  });

  it('handles input with existing spaces or non-digits', () => {
    expect(formatOrgNumber('999-777-888')).toBe('999 777 888');
  });

  it('returns empty string for missing input', () => {
    expect(formatOrgNumber()).toBe('');
  });
});
