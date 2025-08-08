# Right Sidebar Overview

This guide explains how the right sidebar is built.

The legacy `Sidebar` and `FloatingRevyAssistant` components have been removed in favor of a unified approach.

## ResizableRightSidebar

`ResizableRightSidebar` manages the width, collapsed state and visibility. The width is stored in `RightSidebarContext` so it persists between pages and can be resized by dragging the divider.

The sidebar now supports two views: an AI assistant and a team chat. The active view is chosen from header icons—robot for the AI assistant and users for team chat. Clicking an icon swaps the panel.

When the AI view is active the `AiRevyCard` component is rendered. It adapts based on the current route:

- `detectPageType` categorises the path as `admin`, `knowledge` or `general`.
- `extractClientId` checks the URL for a client identifier.
- These values are passed to `AiRevyCard` to adjust the assistant\'s prompt and context.

On mobile the card is shown inside a `Drawer` with its own header. On desktop it can be collapsed or hidden entirely.

`SmartReviAssistant` is embedded inside `AiRevyCard` and provides the chat interface used across the app. The team chat currently shows a placeholder component (`TeamChatPanel`) until further functionality is added. Any new sidebar features should extend this setup so the experience remains consistent.
