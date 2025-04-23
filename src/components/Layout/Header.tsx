
import { Menu } from "lucide-react";

interface HeaderProps {
  onToggle: () => void;
}

export default function Header({ onToggle }: HeaderProps) {
  return (
    <header className="fixed top-0 z-70 flex h-16 w-full items-center bg-primary-600 px-4 text-white shadow">
      <button className="lg:hidden mr-2" onClick={onToggle} aria-label="Åpne meny">
        <Menu className="h-6 w-6 text-white" />
      </button>
      <span className="font-bold text-lg tracking-wide">R</span>
    </header>
  );
}
