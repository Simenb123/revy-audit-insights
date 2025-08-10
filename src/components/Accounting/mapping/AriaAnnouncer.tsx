import React from 'react';

interface AriaAnnouncerProps {
  message: string;
}

export function AriaAnnouncer({ message }: AriaAnnouncerProps) {
  return (
    <div aria-live="polite" role="status" className="sr-only">
      {message}
    </div>
  );
}
