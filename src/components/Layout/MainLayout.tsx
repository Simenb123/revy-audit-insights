
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Header onToggle={() => {}} />
        <Sidebar />
        <SidebarInset>
          <main className="mt-16 flex-1 overflow-y-auto px-6 pt-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
