import { describe, it, expect } from 'vitest';
import { extractClientId } from '../pageDetectionHelpers';

describe('extractClientId', () => {
  it('detects org numbers in klienter routes', () => {
    expect(extractClientId('/klienter/123456789')).toBe('123456789');
    expect(extractClientId('/klienter/123456789/regnskap')).toBe('123456789');
  });

  it('detects uuid in nested routes', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(extractClientId(`/clients/${uuid}`)).toBe(uuid);
  });

  it('detects short numeric ids', () => {
    expect(extractClientId('/clients/12345/overview')).toBe('12345');
  });

  it('detects slug ids', () => {
    expect(extractClientId('/clients/acme-inc/documents')).toBe('acme-inc');
  });

  it('returns empty string when no id present', () => {
    expect(extractClientId('/dashboard')).toBe('');
  });
});
