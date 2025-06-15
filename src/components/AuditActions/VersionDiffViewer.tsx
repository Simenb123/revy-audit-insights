
import React, { useState, useEffect } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';

interface VersionDiffViewerProps {
  oldContent: string;
  newContent: string;
}

const getTextFromHtml = (html: string): string => {
  // This function is intended to run on the client side only.
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

const VersionDiffViewer: React.FC<VersionDiffViewerProps> = ({ oldContent, newContent }) => {
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // When the component mounts, we know we're on the client.
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only process text when on the client.
    if (isClient) {
      setOldText(getTextFromHtml(oldContent));
      setNewText(getTextFromHtml(newContent));
    }
  }, [oldContent, newContent, isClient]);

  if (!isClient) {
    // Render a loading state or null during SSR to avoid errors.
    return (
      <div className="border rounded-md p-4 bg-muted/50 h-60 animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
    );
  }

  // Check for dark mode on the client.
  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div className="max-h-[60vh] overflow-auto rounded-md border">
      <ReactDiffViewer 
        oldValue={oldText} 
        newValue={newText} 
        splitView={true} 
        useDarkTheme={isDarkMode}
        compareMethod={DiffMethod.WORDS}
      />
    </div>
  );
};

export default VersionDiffViewer;
