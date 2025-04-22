
import Sidebar from "@/components/Layout/Sidebar";
import AppHeader from "@/components/Layout/AppHeader";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <section className="flex flex-col flex-1 mt-16">
        <AppHeader data-cy="main-header" />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </section>
    </div>
  );
}
