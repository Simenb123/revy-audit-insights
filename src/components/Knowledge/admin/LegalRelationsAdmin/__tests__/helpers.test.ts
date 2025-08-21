import { describe, it, expect } from 'vitest';
import { resolveNodeType, suggestRefType, buildCrossRefPayload } from '../helpers';
import type { DraftRelation, DocumentNodeType } from '@/types/legal-knowledge';

describe('resolveNodeType', () => {
  it('should prefer docType over anchor heuristics', () => {
    expect(resolveNodeType('LOV-1998-07-17-56', 'forskrift')).toBe('forskrift');
    expect(resolveNodeType('FOR-1999-12-11-1319', 'lov')).toBe('lov');
  });

  it('should use anchor heuristics when docType is not provided', () => {
    expect(resolveNodeType('LOV-1998-07-17-56')).toBe('lov');
    expect(resolveNodeType('FOR-1999-12-11-1319')).toBe('forskrift');
    expect(resolveNodeType('HR-2020-1234-A')).toBe('dom');
    expect(resolveNodeType('RS-2020-001')).toBe('rundskriv');
    expect(resolveNodeType('RUN-2020-001')).toBe('rundskriv');
    expect(resolveNodeType('RUND-2020-001')).toBe('rundskriv');
  });

  it('should identify forarbeid patterns', () => {
    expect(resolveNodeType('PROP-1997-98-42')).toBe('forarbeid');
    expect(resolveNodeType('OTPRP-1997-98-42')).toBe('forarbeid');
    expect(resolveNodeType('NOU-2020-1')).toBe('forarbeid');
    expect(resolveNodeType('INNST-2020-123')).toBe('forarbeid');
  });

  it('should return ukjent for unknown patterns', () => {
    expect(resolveNodeType('UNKNOWN-123')).toBe('ukjent');
    expect(resolveNodeType('')).toBe('ukjent');
    expect(resolveNodeType(undefined, 'unknown')).toBe('ukjent');
  });

  it('should be case insensitive', () => {
    expect(resolveNodeType('lov-1998-07-17-56')).toBe('lov');
    expect(resolveNodeType('hr-2020-1234-a')).toBe('dom');
  });
});

describe('suggestRefType', () => {
  it('should suggest enabled_by for forskrift to lov', () => {
    expect(suggestRefType('forskrift', 'lov')).toBe('enabled_by');
  });

  it('should suggest clarifies for rundskriv to lov', () => {
    expect(suggestRefType('rundskriv', 'lov')).toBe('clarifies');
  });

  it('should suggest interprets for dom to lov', () => {
    expect(suggestRefType('dom', 'lov')).toBe('interprets');
  });

  it('should suggest interprets for dom to forskrift', () => {
    expect(suggestRefType('dom', 'forskrift')).toBe('interprets');
  });

  it('should suggest clarifies for forarbeid to lov', () => {
    expect(suggestRefType('forarbeid', 'lov')).toBe('clarifies');
  });

  it('should default to cites for unspecified relationships', () => {
    expect(suggestRefType('lov', 'lov')).toBe('cites');
    expect(suggestRefType('ukjent', 'forskrift')).toBe('cites');
    expect(suggestRefType('lov', 'dom')).toBe('cites');
  });
});

describe('buildCrossRefPayload', () => {
  const mockDraftRelation: DraftRelation = {
    fromProvision: {
      id: '1',
      provision_type: 'paragraph',
      provision_number: '3-1',
      title: 'Test provision',
      law_identifier: 'testlov',
      anchor: 'testlov.§3-1',
      sort_order: 1,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    toProvision: {
      id: '2',
      provision_type: 'paragraph',
      provision_number: '1-1',
      title: 'Target provision',
      law_identifier: 'targetlov',
      anchor: 'targetlov.§1-1',
      sort_order: 1,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    fromDocument: {
      id: '1',
      title: 'Test Law',
      document_type_id: 'lov',
      document_number: 'LOV-1998-07-17-56',
      content: '',
      document_status: 'active',
      is_primary_source: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    toDocument: {
      id: '2',
      title: 'Target Law',
      document_type_id: 'lov',
      document_number: 'LOV-1999-01-15-2',
      content: '',
      document_status: 'active',
      is_primary_source: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    refType: 'cites',
    refText: 'Test reference text',
    tempId: 'temp-123'
  };

  it('should build correct payload with anchor', () => {
    const payload = buildCrossRefPayload(mockDraftRelation, 123);
    
    expect(payload).toEqual({
      from_provision_id: 123,
      to_document_number: 'LOV-1999-01-15-2',
      to_anchor: 'targetlov.§1-1',
      ref_type: 'cites',
      ref_text: 'Test reference text'
    });
  });

  it('should use provision number when anchor is not available', () => {
    const draftWithoutAnchor = {
      ...mockDraftRelation,
      toProvision: {
        ...mockDraftRelation.toProvision,
        anchor: undefined
      }
    };
    
    const payload = buildCrossRefPayload(draftWithoutAnchor, 123);
    
    expect(payload.to_anchor).toBe('1-1');
  });

  it('should handle null refText', () => {
    const draftWithoutRefText = {
      ...mockDraftRelation,
      refText: undefined
    };
    
    const payload = buildCrossRefPayload(draftWithoutRefText, 123);
    
    expect(payload.ref_text).toBeNull();
  });

  it('should throw error for incomplete draft', () => {
    const incompleteDraft = {
      ...mockDraftRelation,
      fromProvision: undefined
    } as any;
    
    expect(() => buildCrossRefPayload(incompleteDraft, 123))
      .toThrow('Incomplete draft relation: missing required fields');
  });

  it('should use document id fallback when document_number is not available', () => {
    const draftWithoutDocNumber = {
      ...mockDraftRelation,
      toDocument: {
        ...mockDraftRelation.toDocument,
        document_number: undefined
      }
    };
    
    const payload = buildCrossRefPayload(draftWithoutDocNumber, 123);
    
    expect(payload.to_document_number).toBe('2');
  });
});