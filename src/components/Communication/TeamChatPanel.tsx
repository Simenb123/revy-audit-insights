import React, { useEffect, useRef, useState } from 'react';

interface TeamChatPanelProps {
  /** Whether the panel is currently open */
  isOpen: boolean;
  /** List of messages in the chat */
  messages: string[];
  /** Callback when unread count changes */
  onUnreadChange?: (count: number) => void;
}

/**
 * TeamChatPanel keeps track of unread messages. It increases the unread
 * counter when new messages arrive while the panel is closed and resets the
 * counter when the panel is opened.
 */
const TeamChatPanel: React.FC<TeamChatPanelProps> = ({
  isOpen,
  messages,
  onUnreadChange
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const previousLength = useRef(messages.length);

  // Track new messages and update unread count when panel is closed
  useEffect(() => {
    const prev = previousLength.current;
    if (messages.length > prev) {
      const diff = messages.length - prev;
      if (!isOpen) {
        setUnreadCount((count) => {
          const updated = count + diff;
          onUnreadChange?.(updated);
          return updated;
        });
      }
      previousLength.current = messages.length;
    }
  }, [messages, isOpen, onUnreadChange]);

  // Reset unread count when panel opens
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      setUnreadCount(0);
      onUnreadChange?.(0);
    }
  }, [isOpen, unreadCount, onUnreadChange]);

  return (
    <div className="p-4 space-y-2" data-testid="team-chat-panel">
      {messages.map((m, idx) => (
        <div key={idx}>{m}</div>
      ))}
    </div>
  );
};

export default TeamChatPanel;
