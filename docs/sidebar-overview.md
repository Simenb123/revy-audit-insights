# Right Sidebar Overview

This guide explains how the assistant sidebar on the right side of the screen is built.

The legacy `Sidebar` and `FloatingRevyAssistant` components have been removed in favor of a unified approach.

## AssistantSidebar

`AssistantSidebar` is a wrapper that shows the sidebar as a drawer on small screens and as a panel on desktop. Inside it we render `ResizableRightSidebar`, which holds the actual content.

## ResizableRightSidebar

`ResizableRightSidebar` manages the width, collapsed state and visibility. The header and collapse toggle are provided via `SidebarHeader`. The width is stored in `RightSidebarContext` so it persists between pages and can be resized by dragging the divider.

Instead of switching between multiple sidebar components, the current implementation always renders the `AiRevyCard` component. The card adapts based on the current route:

- `detectPageType` categorises the path as `admin`, `knowledge` or `general`.
- `extractClientId` checks the URL for a client identifier.
- These values are passed to `AiRevyCard` to adjust the assistant\'s prompt and context.

On mobile the card is shown inside a `Drawer` with its own header. On desktop it can be collapsed or hidden entirely.

`SmartReviAssistant` is embedded inside `AiRevyCard` and provides the chat interface used across the app. Any new sidebar features should extend this setup so the experience remains consistent.
