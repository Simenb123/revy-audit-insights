
import * as React from "react"

export const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className="truncate" {...props} />
))
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"
