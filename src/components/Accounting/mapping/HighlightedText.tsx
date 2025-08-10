import React from 'react';

/**
 * HighlightedText
 * - ranges: valgfrie [start, end]-indekser (inklusive) fra fuzzy-søk for presis markering
 * - query: brukes som fallback til enkel token-basert markering når ranges ikke finnes
 */
interface HighlightedTextProps {
  text: string;
  query: string;
  ranges?: Array<[number, number]>;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function HighlightedText({ text, query, ranges }: HighlightedTextProps) {
  const t = String(text ?? '');
  const qq = String(query ?? '').trim();

  // If explicit index ranges are provided (from fuzzy matching), use them
  if (ranges && ranges.length > 0 && t.length > 0) {
    // sanitize and merge overlapping ranges, clamp to string bounds
    const merged: Array<[number, number]> = [];
    [...ranges]
      .map(([s, e]) => [Math.max(0, s), Math.min(t.length - 1, e)] as [number, number])
      .filter(([s, e]) => s <= e)
      .sort((a, b) => a[0] - b[0])
      .forEach(([s, e]) => {
        if (!merged.length) {
          merged.push([s, e]);
        } else {
          const last = merged[merged.length - 1];
          if (s <= last[1] + 1) {
            last[1] = Math.max(last[1], e);
          } else {
            merged.push([s, e]);
          }
        }
      });

    const parts: React.ReactNode[] = [];
    let cursor = 0;
    merged.forEach(([s, e], idx) => {
      if (cursor < s) {
        parts.push(<React.Fragment key={`n-${idx}-pre`}>{t.slice(cursor, s)}</React.Fragment>);
      }
      parts.push(
        <mark key={`h-${idx}`} className="bg-muted text-foreground rounded px-0.5">
          {t.slice(s, e + 1)}
        </mark>
      );
      cursor = e + 1;
    });
    if (cursor < t.length) {
      parts.push(<React.Fragment key="tail">{t.slice(cursor)}</React.Fragment>);
    }
    return <>{parts}</>;
  }

  // Fallback: simple token-based highlight using the raw query
  if (!qq) return <>{t}</>;
  const tokens = qq.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return <>{t}</>;
  const regex = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'ig');
  const parts = t.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        tokens.some((tok) => part.toLowerCase() === tok.toLowerCase()) ? (
          <mark key={i} className="bg-muted text-foreground rounded px-0.5">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}
