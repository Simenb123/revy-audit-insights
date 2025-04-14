
import * as React from "react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <ScrollArea className="h-full">
      <div
        ref={ref}
        data-sidebar="content"
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 p-2 group-data-[collapsible=icon]:overflow-hidden",
          className
        )}
        {...props}
      />
    </ScrollArea>
  )
})
SidebarContent.displayName = "SidebarContent"
