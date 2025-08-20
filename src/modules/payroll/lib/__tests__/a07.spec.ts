import { describe, it, expect } from 'vitest';
import { parseA07, validateA07, norm, getInternalCodeForA07 } from '../a07';
import type { AmeldingCode, AmeldingCodeMap } from '../a07';

describe('a07', () => {
  const mockCodes: AmeldingCode[] = [
    {
      id: 'fastloenn',
      label: 'Fastlønn',
      expected_fordel: 'kontantytelse',
      aliases: []
    },
    {
      id: 'elektroniskKommunikasjon',
      label: 'Elektronisk kommunikasjon',
      expected_fordel: 'naturalytelse',
      aliases: []
    },
    {
      id: 'kilometergodtgjoerelseBil',
      label: 'Kilometergodtgjørelse bil',
      expected_fordel: 'utgiftsgodtgjoerelse', // ASCII kanon
      aliases: []
    }
  ];

  const mockCodeMappings: AmeldingCodeMap[] = [
    { a07: 'fastloenn', internal_code: 'fastlon' },
    { a07: 'timeloenn', internal_code: 'timelon' },
    { a07: 'fastTillegg', internal_code: 'fasttillegg' },
  ];

  describe('norm function', () => {
    it('should normalize Norwegian characters correctly', () => {
      expect(norm('Fastlønn')).toBe('fastlonn'); 
      expect(norm('Timelønn')).toBe('timelonn');
      expect(norm('Utgiftsgodtgjørelse')).toBe('utgiftsgodtgjoerelse');
      expect(norm('Feriepenger på årsbasis')).toBe('feriepenger paa aarsbasis');
      expect(norm('Sykelønn ærlighet')).toBe('sykelonn aerlighet');
      expect(norm('')).toBe('');
    });

    it('should handle mixed case', () => {
      expect(norm('FASTLØNN')).toBe('fastlonn');
      expect(norm('FastLønn')).toBe('fastlonn');
    });
  });

  describe('parseA07', () => {
    it('should parse valid A07 JSON correctly', () => {
      const jsonData = [
        { beskrivelse: 'fastloenn', fordel: 'kontantytelse', beloep: 600000 },
        { beskrivelse: 'timeloenn', fordel: 'kontantytelse', beloep: 350000 },
        { beskrivelse: 'fastTillegg', fordel: 'kontantytelse', beloep: 50000 }
      ];

      const result = parseA07(jsonData, mockCodeMappings);

      expect(result.rows).toHaveLength(3);
      expect(result.totals.fastlon).toBe(600000);
      expect(result.totals.timelon).toBe(350000);
      expect(result.totals.fasttillegg).toBe(50000);
    });

    it('should handle empty or invalid data', () => {
      const result1 = parseA07(null, mockCodeMappings);
      expect(result1.rows).toHaveLength(0);

      const result2 = parseA07([], mockCodeMappings);
      expect(result2.rows).toHaveLength(0);

      const result3 = parseA07([{ invalid: 'data' }], mockCodeMappings);
      expect(result3.rows).toHaveLength(0);
    });

    it('should initialize totals for all internal codes', () => {
      const result = parseA07([], mockCodeMappings);
      expect(result.totals.fastlon).toBe(0);
      expect(result.totals.timelon).toBe(0);
      expect(result.totals.fasttillegg).toBe(0);
    });
  });

  describe('validateA07', () => {
    it('should pass validation for correct fordel types', () => {
      const rows = [
        { beskrivelse: 'fastloenn', fordel: 'kontantytelse', beloep: 600000 },
        { beskrivelse: 'elektroniskKommunikasjon', fordel: 'naturalytelse', beloep: 5000 }
      ];

      const errors = validateA07(rows, mockCodes);
      expect(errors).toHaveLength(0);
    });

    it('should detect wrong fordel type', () => {
      const rows = [
        { beskrivelse: 'elektroniskKommunikasjon', fordel: 'kontantytelse', beloep: 5000 } // Wrong fordel
      ];

      const errors = validateA07(rows, mockCodes);
      expect(errors).toHaveLength(1);
      expect(errors[0].error).toContain('Forventet fordel');
      expect(errors[0].beskrivelse).toBe('elektroniskKommunikasjon');
    });

    it('should detect unknown beskrivelse', () => {
      const rows = [
        { beskrivelse: 'ukjentYtelse', fordel: 'kontantytelse', beloep: 10000 }
      ];

      const errors = validateA07(rows, mockCodes);
      expect(errors).toHaveLength(1);
      expect(errors[0].error).toContain('Ukjent beskrivelse');
    });

    it('should handle Norwegian character variants in validation', () => {
      // Test that both ø and oe variants are accepted in fordel
      const rows = [
        { beskrivelse: 'kilometergodtgjoerelseBil', fordel: 'utgiftsgodtgjørelse', beloep: 5000 }, // Using ø
        { beskrivelse: 'kilometergodtgjoerelseBil', fordel: 'utgiftsgodtgjoerelse', beloep: 5000 }  // Using oe
      ];

      const errors1 = validateA07([rows[0]], mockCodes);
      const errors2 = validateA07([rows[1]], mockCodes);
      
      expect(errors1).toHaveLength(0); // ø variant should be accepted
      expect(errors2).toHaveLength(0); // oe variant should be accepted
    });
  });

  describe('getInternalCodeForA07', () => {
    it('should return correct internal code for A07 beskrivelse', () => {
      expect(getInternalCodeForA07('fastloenn', mockCodeMappings)).toBe('fastlon');
      expect(getInternalCodeForA07('timeloenn', mockCodeMappings)).toBe('timelon');
      expect(getInternalCodeForA07('fastTillegg', mockCodeMappings)).toBe('fasttillegg');
    });

    it('should handle case insensitive lookup', () => {
      expect(getInternalCodeForA07('FASTLOENN', mockCodeMappings)).toBe('fastlon');
      expect(getInternalCodeForA07('FastTillegg', mockCodeMappings)).toBe('fasttillegg');
    });

    it('should return undefined for unknown beskrivelse', () => {
      expect(getInternalCodeForA07('ukjentBeskrivelse', mockCodeMappings)).toBeUndefined();
    });
  });

  describe('T4: A07 mapping split scenario', () => {
    it('should correctly map and sum A07 amounts to internal codes', () => {
      const a07Data = [
        { beskrivelse: 'timeloenn', fordel: 'kontantytelse', beloep: 350000 },
        { beskrivelse: 'fastTillegg', fordel: 'kontantytelse', beloep: 50000 },
        { beskrivelse: 'fastloenn', fordel: 'kontantytelse', beloep: 600000 }
      ];

      const result = parseA07(a07Data, mockCodeMappings);

      // Verify the totals match the specification
      expect(result.totals.timelon).toBe(350000);
      expect(result.totals.fasttillegg).toBe(50000);
      expect(result.totals.fastlon).toBe(600000);
    });

    it('should handle multiple entries for same internal code', () => {
      const a07Data = [
        { beskrivelse: 'fastloenn', fordel: 'kontantytelse', beloep: 300000 },
        { beskrivelse: 'fastloenn', fordel: 'kontantytelse', beloep: 300000 }, // Another fastlønn entry
      ];

      const result = parseA07(a07Data, mockCodeMappings);
      expect(result.totals.fastlon).toBe(600000); // Should sum both entries
    });
  });
});