import React from 'react';
import RevyAvatar from './RevyAvatar';

const RevySidebarFigure = () => (
  <div className="flex flex-col items-center text-center mb-4">
    <RevyAvatar size="lg" />
    <span className="mt-2 text-sm font-semibold">AI-Revy</span>
  </div>
);

export default RevySidebarFigure;
