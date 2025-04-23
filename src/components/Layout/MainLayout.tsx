
import { ReactNode } from "react";
import SidebarNav from "./SidebarNav";
import AppHeader from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: LayoutProps) {
  return (
    <>
      {/* fast header – høyde 64 px */}
      <AppHeader />

      {/* flex-container under header */}
      <div className="flex">
        {/* sidebar – blir sticky rett under header */}
        <aside
          className="
            sticky top-16
            md:top-16
            h-[calc(100vh-64px)]
            w-64 shrink-0
            bg-white border-r
          "
        >
          <SidebarNav />
        </aside>

        {/* hovedinnhold */}
        <main className="flex-1 overflow-y-auto px-6 pt-6">
          {children}
        </main>
      </div>
    </>
  );
}
