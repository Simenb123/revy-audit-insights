# Right Sidebar Overview

This guide explains how the assistant sidebar on the right side of the screen is built.

## AssistantSidebar

`AssistantSidebar` is a wrapper component that displays the sidebar as a drawer on small screens and as a normal panel on desktop. Inside it we render `ResizableRightSidebar` which holds the actual content.

## ResizableRightSidebar

`ResizableRightSidebar` manages the width, collapsed state and what content is shown. The width is stored in `RightSidebarContext` so it persists between pages. The sidebar can be resized by dragging the divider.

The component looks at the current route to decide which section to render:

- **AdminSidebarSection** – shown when the path points to admin pages.
- **KnowledgeSidebarSection** – shown on knowledge base pages.
- **StreamlinedClientSidebar** – shown when a client id is found in the URL. This section always embeds `SmartReviAssistant` so the assistant can answer questions about the selected client.
- **GeneralSidebarSection** – used on all other pages. It shows a simplified card with quick help.

A loading or error state will display `LoadingErrorSection` instead when client data is still being fetched.

`SmartReviAssistant` is the main chat interface used across the app. The dedicated `RightSidebar/AssistantSidebar` component uses it directly, and `StreamlinedClientSidebar` embeds it with client information for contextual replies.

