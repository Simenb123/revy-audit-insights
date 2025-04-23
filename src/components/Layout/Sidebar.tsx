
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/klienter", icon: "users", label: "Klienter" },
  { to: "/regnskap", icon: "file", label: "Regnskap" },
  { to: "/dashboard", icon: "home", label: "Dashboard" },
  { to: "/analyser", icon: "bar-chart-3", label: "Analyser" },
  { to: "/dokumenter", icon: "file-text", label: "Dokumenter" },
  { to: "/prosjekter", icon: "folder", label: "Prosjekter" },
];

interface DrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: DrawerProps) {
  // Sidebar as drawer on mobile, sticky on desktop
  return (
    <>
      {/* Mobile Drawer */}
      <Drawer open={open} onOpenChange={o => !o && onClose()}>
        <DrawerContent className="block lg:hidden p-0 w-60">
          <aside className="bg-white w-60 h-[calc(100vh-64px)] overflow-auto py-4">
            <nav className="space-y-3 px-6">
              {LINKS.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="flex items-center gap-3 px-3 py-2 rounded hover:bg-muted"
                  onClick={onClose}
                >
                  <i className={`lucide-${l.icon}`} />
                  <span>{l.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </DrawerContent>
      </Drawer>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:block sticky top-16 w-64 h-[calc(100vh-64px)] bg-white border-r shadow z-60"
        )}
      >
        <nav className="p-6 space-y-3">
          {LINKS.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-muted"
              onClick={onClose}
            >
              <i className={`lucide-${l.icon}`} />
              <span>{l.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
