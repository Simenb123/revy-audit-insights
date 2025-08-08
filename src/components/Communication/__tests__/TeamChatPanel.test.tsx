import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import TeamChatPanel from '../TeamChatPanel';

const Wrapper = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<string[]>([]);
  const [unread, setUnread] = React.useState(0);

  return (
    <div>
      <button data-testid="toggle" onClick={() => setIsOpen(true)}>
        open
      </button>
      <button
        data-testid="add"
        onClick={() => setMessages([...messages, `message ${messages.length}`])}
      >
        add
      </button>
      {unread > 0 && <span data-testid="badge">{unread}</span>}
      <TeamChatPanel
        isOpen={isOpen}
        messages={messages}
        onUnreadChange={setUnread}
      />
    </div>
  );
};

describe('TeamChatPanel', () => {
  it('updates unread indicator when new messages arrive and resets on open', async () => {
    render(<Wrapper />);
    const add = screen.getByTestId('add');

    fireEvent.click(add);
    await waitFor(() => expect(screen.getByTestId('badge')).toHaveTextContent('1'));

    fireEvent.click(add);
    await waitFor(() => expect(screen.getByTestId('badge')).toHaveTextContent('2'));

    fireEvent.click(screen.getByTestId('toggle'));
    await waitFor(() => expect(screen.queryByTestId('badge')).toBeNull());

    fireEvent.click(add);
    await waitFor(() => expect(screen.queryByTestId('badge')).toBeNull());
  });
});
