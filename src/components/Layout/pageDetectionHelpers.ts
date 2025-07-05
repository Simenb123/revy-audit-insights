
export const detectPageType = (pathname: string) => {
  // Admin pages
  if (pathname.startsWith('/ai-revy-admin') || 
      pathname.startsWith('/user-admin') || 
      pathname.startsWith('/ai-usage') ||
      pathname.startsWith('/audit-logs')) {
    return 'admin';
  }

  // Knowledge base pages
  if (pathname.startsWith('/fag')) {
    return 'knowledge';
  }

  return 'general';
};

export const extractClientId = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean);

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const orgPattern = /^\d{9}$/; // standard Norwegian org number
  const numericPattern = /^\d{5,}$/; // shorter numeric IDs (5+ digits)
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)+$/i; // allow slugs like "acme-inc"

  // First, check for "clients" or "klienter" prefix to avoid false positives
  for (let i = 0; i < segments.length; i++) {
    if (segments[i] === 'clients' || segments[i] === 'klienter') {
      const candidate = segments[i + 1];
      if (candidate && (uuidPattern.test(candidate) || orgPattern.test(candidate) || numericPattern.test(candidate) || slugPattern.test(candidate))) {
        return candidate;
      }
    }
  }

  // Fallback scan for UUID or org number anywhere in the path
  for (const seg of segments) {
    if (uuidPattern.test(seg) || orgPattern.test(seg) || numericPattern.test(seg)) {
      return seg;
    }
  }

  return '';
};
