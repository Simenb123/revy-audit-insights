import React from 'react';

interface HighlightedTextProps {
  text: string;
  query: string;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function HighlightedText({ text, query }: HighlightedTextProps) {
  const t = String(text ?? '');
  const qq = String(query ?? '').trim();
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
