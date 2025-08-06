import { describe, it, expect } from 'vitest';
import { detectCSVHeaderRow } from '../fileProcessing';

describe('detectCSVHeaderRow', () => {
  it('detects header row with minor spelling errors', () => {
    const rows = [
      ['noe', 'annet'],
      ['knto', 'beløpp', 'beskrvelse'],
      ['1000', '200', 'test']
    ];
    expect(detectCSVHeaderRow(rows)).toBe(1);
  });

  it('prefers first row when it looks like header despite typos', () => {
    const rows = [
      ['kontonmmer', 'salddo'],
      ['1000', '200'],
      ['2000', '300']
    ];
    expect(detectCSVHeaderRow(rows)).toBe(0);
  });
});
