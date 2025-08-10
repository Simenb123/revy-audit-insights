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
  const parts = t.split(new RegExp(`(${escapeRegExp(qq)})`, 'ig'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === qq.toLowerCase() ? (
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
