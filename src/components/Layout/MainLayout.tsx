
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
        <AppHeader 
          data-cy="main-header" 
          className="fixed top-0 z-50 w-full h-16 bg-revio-500 text-white flex items-center px-6 shadow" 
        />
        <main className="flex-1 overflow-y-auto p-6 pt-16">
          <Outlet />
        </main>
      </section>
    </div>
  );
}
