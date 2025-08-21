import type { DocumentNodeType, DraftRelation, LegalCrossRef } from '@/types/legal-knowledge';

/**
 * Resolves document node type from anchor and document type
 * Prefers docType, fallback to heuristics on anchor prefix
 */
export function resolveNodeType(anchor?: string, docType?: string): DocumentNodeType {
  // Prefer explicit document type
  if (docType) {
    const type = docType.toLowerCase();
    if (['lov', 'forskrift', 'dom', 'rundskriv', 'forarbeid'].includes(type)) {
      return type as DocumentNodeType;
    }
  }

  // Fallback to anchor-based heuristics
  if (anchor) {
    const upperAnchor = anchor.toUpperCase();
    
    // Forarbeid patterns
    if (upperAnchor.startsWith('PROP-') || 
        upperAnchor.startsWith('OTPRP-') || 
        upperAnchor.startsWith('NOU-') || 
        upperAnchor.startsWith('INNST-')) {
      return 'forarbeid';
    }
    
    // Dom patterns
    if (upperAnchor.startsWith('HR-') || 
        upperAnchor.startsWith('RT-') ||
        upperAnchor.includes('HØYESTERETT')) {
      return 'dom';
    }
    
    // Forskrift patterns
    if (upperAnchor.startsWith('FOR-')) {
      return 'forskrift';
    }
    
    // Lov patterns
    if (upperAnchor.startsWith('LOV-')) {
      return 'lov';
    }
    
    // Rundskriv patterns
    if (upperAnchor.startsWith('RUN-') || 
        upperAnchor.startsWith('RUND-') || 
        upperAnchor.startsWith('RS-')) {
      return 'rundskriv';
    }
  }

  return 'ukjent';
}

/**
 * Suggests relation type based on source and destination document types
 */
export function suggestRefType(
  srcType: DocumentNodeType, 
  dstType: DocumentNodeType
): LegalCrossRef['ref_type'] {
  // Specific mapping rules
  if (srcType === 'forskrift' && dstType === 'lov') {
    return 'enabled_by';
  }
  
  if (srcType === 'rundskriv' && dstType === 'lov') {
    return 'clarifies';
  }
  
  if (srcType === 'dom' && (dstType === 'lov' || dstType === 'forskrift')) {
    return 'interprets';
  }
  
  if (srcType === 'forarbeid' && dstType === 'lov') {
    return 'clarifies';
  }
  
  // Default fallback
  return 'cites';
}

/**
 * Builds cross-reference payload for database insertion
 * @param draft - Draft relation object
 * @param resolvedFromId - Resolved from provision ID (numeric)
 * @returns Payload ready for Supabase insertion
 */
export function buildCrossRefPayload(
  draft: DraftRelation, 
  resolvedFromId: number
) {
  if (!draft.fromProvision || !draft.toProvision || !draft.toDocument) {
    throw new Error('Incomplete draft relation: missing required fields');
  }

  // Use provision number if anchor not available
  const toAnchor = draft.toProvision.anchor || 
    draft.toProvision.provision_number;

  return {
    from_provision_id: resolvedFromId,
    to_document_number: draft.toDocument.document_number || draft.toDocument.id,
    to_anchor: toAnchor,
    ref_type: draft.refType,
    ref_text: draft.refText || null
  };
}

/**
 * Returns CSS styling for document node types
 */
export function styleByType(type: DocumentNodeType) {
  const styles = {
    lov: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800'
    },
    forskrift: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800'
    },
    dom: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800'
    },
    rundskriv: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800'
    },
    forarbeid: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800'
    },
    ukjent: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-600'
    }
  };

  return styles[type] || styles.ukjent;
}