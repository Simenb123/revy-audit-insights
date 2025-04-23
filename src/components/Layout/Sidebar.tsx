
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils"; // shadcn-helper

const LINKS = [
  { to: "/clients",     icon: "users",        label: "Klienter" },
  { to: "/ledger",      icon: "file",         label: "Regnskap" },
  { to: "/dashboard",   icon: "home",         label: "Dashboard" },
  { to: "/analysis",    icon: "bar-chart-3",  label: "Analyser" },
  { to: "/documents",   icon: "file-text",    label: "Dokumenter" },
  { to: "/projects",    icon: "folder",       label: "Prosjekter" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* backdrop for mobile */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 bg-black/40 transition-opacity lg:hidden z-30",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        className={cn(
          "fixed top-16 left-0 w-64 bg-white h-[calc(100vh-64px)] border-r shadow z-40 transition-transform",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"        // desktop alltid synlig
        )}
      >
        <nav className="p-6 space-y-3">
          {LINKS.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <i className={`lucide-${l.icon}`} />
              <span>{l.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* hamburger – mobil */}
      <button
        className="absolute left-4 top-[72px] p-2 rounded lg:hidden bg-primary text-white z-50"
        onClick={() => setOpen(!open)}
      >
        <i className="lucide-menu" />
      </button>
    </>
  );
}
