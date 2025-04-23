
import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Header onToggle={() => setOpen(true)} />
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <main className="mt-16 flex-1 overflow-y-auto px-6 pt-6">{children}</main>
    </>
  );
}
