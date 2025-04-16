
import * as React from "react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <ScrollArea className="flex-1">
      <div
        ref={ref}
        data-sidebar="content"
        className={cn(
          "flex flex-col gap-2 p-2 overflow-hidden",
          className
        )}
        {...props}
      />
    </ScrollArea>
  )
})
SidebarContent.displayName = "SidebarContent"
