
import Sidebar from "@/components/Layout/Sidebar";
import AppHeader from "@/components/Layout/AppHeader";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 shrink-0 border-r bg-white mt-16 md:block">
        <Sidebar />
      </aside>
      <section className="flex flex-col flex-1">
        <AppHeader data-cy="main-header" />
        <main className="flex-1 overflow-y-auto p-6 pt-16">
          <Outlet />
        </main>
      </section>
    </div>
  );
}
