
import React from 'react';
import { diffWords } from 'diff';

interface VersionDiffViewerProps {
  oldContent: string;
  newContent: string;
}

const getTextFromHtml = (html: string): string => {
  if (typeof window === 'undefined') {
    return html;
  }
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

const VersionDiffViewer: React.FC<VersionDiffViewerProps> = ({ oldContent, newContent }) => {
  const differences = diffWords(getTextFromHtml(oldContent), getTextFromHtml(newContent));

  return (
    <div className="whitespace-pre-wrap font-mono text-sm p-4 bg-gray-50 rounded-md border max-h-[60vh] overflow-auto">
      {differences.map((part, index) => {
        const style = part.added
          ? { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#047857' }
          : part.removed
          ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', textDecoration: 'line-through' }
          : { color: '#6b7280' };
        return (
          <span key={index} style={style}>
            {part.value}
          </span>
        );
      })}
    </div>
  );
};

export default VersionDiffViewer;
