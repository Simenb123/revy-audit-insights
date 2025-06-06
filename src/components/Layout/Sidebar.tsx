
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import SidebarNav from "./SidebarNav";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: DrawerProps) {
  return (
    <>
      {/* Mobile Drawer */}
      <Drawer open={open} onOpenChange={o => !o && onClose()}>
        <DrawerContent 
          data-cy="sidebar" 
          className="block lg:hidden p-0 w-60"
        >
          <aside className="bg-white w-60 h-[calc(100vh-64px)] overflow-auto py-4">
            <SidebarNav />
          </aside>
        </DrawerContent>
      </Drawer>
      {/* Desktop Sidebar */}
      <aside
        data-cy="sidebar"
        className={cn(
          "hidden lg:block sticky top-16 w-64 h-[calc(100vh-64px)] bg-white border-r shadow z-60"
        )}
      >
        <SidebarNav />
      </aside>
    </>
  );
}
