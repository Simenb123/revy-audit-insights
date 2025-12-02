import { describe, it, expect } from 'vitest';
import { validateResponseFields, calculateCompletionPercentage, ResponseField } from '../useResponseFieldValidation';

describe('validateResponseFields', () => {
  it('returnerer valid når ingen felter er definert', () => {
    const result = validateResponseFields(undefined, {});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returnerer valid når ingen felter er obligatoriske', () => {
    const fields: ResponseField[] = [
      { id: 'field1', required: false },
      { id: 'field2', required: false }
    ];
    const result = validateResponseFields(fields, {});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returnerer invalid når obligatorisk felt mangler', () => {
    const fields: ResponseField[] = [
      { id: 'field1', required: true },
      { id: 'field2', required: false }
    ];
    const result = validateResponseFields(fields, {});
    expect(result.isValid).toBe(false);
    expect(result.errors.field1).toBe('Dette feltet er obligatorisk');
  });

  it('returnerer valid når alle obligatoriske felter er fylt ut', () => {
    const fields: ResponseField[] = [
      { id: 'field1', required: true },
      { id: 'field2', required: true }
    ];
    const values = { field1: 'verdi1', field2: 'verdi2' };
    const result = validateResponseFields(fields, values);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('behandler tomt array som ugyldig for obligatoriske felter', () => {
    const fields: ResponseField[] = [
      { id: 'field1', required: true }
    ];
    const values = { field1: [] as string[] };
    const result = validateResponseFields(fields, values);
    expect(result.isValid).toBe(false);
    expect(result.errors.field1).toBe('Dette feltet er obligatorisk');
  });

  it('behandler array med verdier som gyldig', () => {
    const fields: ResponseField[] = [
      { id: 'field1', required: true }
    ];
    const values = { field1: ['verdi1'] };
    const result = validateResponseFields(fields, values);
    expect(result.isValid).toBe(true);
  });
});

describe('calculateCompletionPercentage', () => {
  it('returnerer 0 når ingen felter er definert', () => {
    const percentage = calculateCompletionPercentage(undefined, {});
    expect(percentage).toBe(0);
  });

  it('returnerer 100 når ingen felter er obligatoriske', () => {
    const fields: ResponseField[] = [
      { id: 'field1', required: false },
      { id: 'field2', required: false }
    ];
    const percentage = calculateCompletionPercentage(fields, {});
    expect(percentage).toBe(100);
  });

  it('beregner korrekt prosent for delvis utfylte felter', () => {
    const fields: ResponseField[] = [
      { id: 'field1', required: true },
      { id: 'field2', required: true },
      { id: 'field3', required: true },
      { id: 'field4', required: true }
    ];
    const values = { field1: 'verdi1', field2: 'verdi2' };
    const percentage = calculateCompletionPercentage(fields, values);
    expect(percentage).toBe(50); // 2 av 4 = 50%
  });

  it('returnerer 100 når alle obligatoriske felter er fylt ut', () => {
    const fields: ResponseField[] = [
      { id: 'field1', required: true },
      { id: 'field2', required: true }
    ];
    const values = { field1: 'verdi1', field2: 'verdi2' };
    const percentage = calculateCompletionPercentage(fields, values);
    expect(percentage).toBe(100);
  });

  it('ignorerer ikke-obligatoriske felter i beregningen', () => {
    const fields: ResponseField[] = [
      { id: 'field1', required: true },
      { id: 'field2', required: false },
      { id: 'field3', required: true }
    ];
    const values = { field1: 'verdi1' };
    const percentage = calculateCompletionPercentage(fields, values);
    expect(percentage).toBe(50); // 1 av 2 obligatoriske = 50%
  });

  it('behandler array-verdier korrekt', () => {
    const fields: ResponseField[] = [
      { id: 'field1', required: true },
      { id: 'field2', required: true }
    ];
    const values = { field1: ['verdi1'], field2: [] as string[] };
    const percentage = calculateCompletionPercentage(fields, values);
    expect(percentage).toBe(50); // Tomt array teller ikke som fylt ut
  });

  it('runder av til nærmeste heltall', () => {
    const fields: ResponseField[] = [
      { id: 'field1', required: true },
      { id: 'field2', required: true },
      { id: 'field3', required: true }
    ];
    const values = { field1: 'verdi1' };
    const percentage = calculateCompletionPercentage(fields, values);
    expect(percentage).toBe(33); // 1/3 = 33.33... → 33
  });
});
