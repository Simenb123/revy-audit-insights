
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Header /> {/* fast header – h-16 = 64 px */}
      <div className="flex">
        <Sidebar /> {/* fast/slide-in sidebar */}
        <main className="flex-1 overflow-y-auto px-6 pt-16">{children}</main>
      </div>
    </>
  );
}
