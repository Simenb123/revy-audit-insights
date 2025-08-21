# Right Sidebar Overview

This guide explains how the right sidebar is built and key architectural decisions.

The legacy `Sidebar` and `FloatingRevyAssistant` components have been removed in favor of a unified approach.

## ResizableRightSidebar

`ResizableRightSidebar` manages the width, collapsed state and visibility. The width is stored in `RightSidebarContext` so it persists between pages and can be resized by dragging the divider.

Instead of switching between multiple sidebar components, the current implementation always renders the `AiRevyCard` component. The card adapts based on the current route:

- `detectPageType` categorises the path as `admin`, `knowledge` or `general`.
- `extractClientId` checks the URL for a client identifier.
- These values are passed to `AiRevyCard` to adjust the assistant\'s prompt and context.

On mobile the card is shown inside a `Drawer` with its own header. On desktop it can be collapsed or hidden entirely.

`SmartReviAssistant` is embedded inside `AiRevyCard` and provides the chat interface used across the app. Any new sidebar features should extend this setup so the experience remains consistent.

## AiRevyCard Architecture

### Desktop vs Mobile Rendering

**CRITICAL**: `AiRevyCard` uses two completely different rendering approaches for desktop and mobile to ensure proper layout behavior:

#### Desktop (hideTabs={true})
- Renders content directly in a simple `div` wrapper
- **NO** Radix UI `Tabs` component wrapper
- Uses conditional rendering: `currentTab === 'ai' ? <SmartReviAssistant /> : <GroupChatSidebar />`
- This approach matches `GroupChatSidebar`'s proven structure

#### Mobile (hideTabs={false})
- Uses full Radix UI `Tabs` component with visible `TabsList`
- Renders `TabsContent` components properly
- Tab switching works as expected with visible UI controls

### Why This Separation?

**Problem**: `TabsContent` components have CSS layout issues when their corresponding `TabsList` is hidden. The Radix UI `Tabs` system expects both components to work together.

**Solution**: On desktop, we bypass the `Tabs` wrapper entirely and use simple conditional rendering in a `div`, ensuring the same flexbox layout as `GroupChatSidebar`.

### Layout Structure

```jsx
// Desktop (hideTabs={true})
<div className="flex-1 min-h-0 flex flex-col">
  {currentTab === 'ai' ? <SmartReviAssistant /> : <GroupChatSidebar />}
</div>

// Mobile (hideTabs={false})  
<Tabs className="flex-1 flex flex-col min-h-0">
  <TabsList>...</TabsList>
  <TabsContent className="flex-1 min-h-0 flex flex-col">
    <SmartReviAssistant />
  </TabsContent>
  <TabsContent className="flex-1 min-h-0 flex flex-col">
    <GroupChatSidebar />
  </TabsContent>
</Tabs>
```

## Key CSS Classes

Critical flexbox classes for proper layout:

- `flex-1 min-h-0 flex flex-col` - Allows proper scrolling and input positioning
- `min-h-0` - Essential for nested flex containers to respect parent constraints
- Parent container must have constrained height for flex children to work properly

## Troubleshooting Layout Issues

If input boxes or content don't position correctly:

1. **Check if using `Tabs` when `hideTabs={true}`** - This causes layout problems
2. **Verify flexbox chain**: Each container in the hierarchy needs proper flex classes
3. **Compare with `GroupChatSidebar`** - It uses the proven simple `div` structure
4. **Test on both desktop and mobile** - They use different rendering approaches
