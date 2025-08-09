
import * as React from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useSidebar } from "./SidebarContext"

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    const width =
      state === "collapsed"
        ? "w-[--sidebar-width-icon]"
        : "w-[--sidebar-width]"

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[var(--sidebar-width)] flex-col bg-sidebar text-sidebar-foreground",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[var(--sidebar-width)] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col overflow-hidden">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        className={cn("group peer hidden md:block text-sidebar-foreground")}
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        <div
          className={cn(
            "duration-300 relative h-full bg-transparent transition-[width] ease-in-out",
            width,
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
              : null,
          )}
        />
        <div
          className={cn(
            "duration-300 fixed bg-sidebar transition-[left,right,width,transform] ease-in-out md:flex",
            width,
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            variant === "floating" || variant === "inset"
              ? "p-2"
              : "group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className
          )}
          style={{
            top: "calc(var(--global-header-height) + var(--sub-header-current-height))",
            height: "calc(100dvh - (var(--global-header-height) + var(--sub-header-current-height)))",
          }}
        >
          <aside
            data-sidebar="sidebar"
            className={cn(
              "flex h-full flex-col overflow-hidden bg-sidebar border-r",
              "data-[state=expanded]:shadow-sm",
              className                /* ev. ekstra klasser som prop */
            )}
          >
  {children}
</aside>

        </div>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SIDEBAR_WIDTH_MOBILE = "18rem"
