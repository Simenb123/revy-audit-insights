
import AppHeader from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Fast, full‑bredde header */}
      <AppHeader className="fixed top-0 z-50 h-16 w-full" />

      {/* Hoved­layout */}
      <div className="flex h-screen">
        {/* Sidebar begynner rett under header */}
        <aside className="sticky top-16 w-64 shrink-0 border-r bg-white">
          <Sidebar />
        </aside>

        {/* Sideinnhold */}
        <main className="flex-1 overflow-y-auto px-6 pt-16">
          {children}
        </main>
      </div>
    </>
  );
}
