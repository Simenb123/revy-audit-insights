import React from 'react';
import RevyAvatar from './RevyAvatar';

const AssistantSidebar = () => {
  return (
    <div className="flex items-center gap-2 p-3 border-b bg-gray-50">
      <RevyAvatar size="sm" variant="chat" />
      <span className="font-semibold text-sm">AI-Revi</span>
      <span className="ml-1 h-2 w-2 bg-green-500 rounded-full" />
    </div>
  );
};

export default AssistantSidebar;
