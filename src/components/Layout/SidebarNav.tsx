
import { Link } from "react-router-dom";
import { Users, Home, BarChart2, FileText, FolderOpen, Settings, HelpCircle } from "lucide-react";

export default function SidebarNav() {
  return (
    <nav className="flex flex-col h-full justify-between p-2">
      <div className="space-y-1">
        <Link 
          to="/klienter" 
          className="flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100 text-revio-900"
        >
          <Users size={20} />
          <span className="truncate">Klienter</span>
        </Link>
        <Link 
          to="/regnskap" 
          className="flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100 text-revio-900"
        >
          <FileText size={20} />
          <span className="truncate">Regnskap</span>
        </Link>
        <Link 
          to="/" 
          className="flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100 text-revio-900"
        >
          <Home size={20} />
          <span className="truncate">Dashboard</span>
        </Link>
        <Link 
          to="/analyser" 
          className="flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100 text-revio-900"
        >
          <BarChart2 size={20} />
          <span className="truncate">Analyser</span>
        </Link>
        <Link 
          to="/dokumenter" 
          className="flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100 text-revio-900"
        >
          <FileText size={20} />
          <span className="truncate">Dokumenter</span>
        </Link>
        <Link 
          to="/prosjekter" 
          className="flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100 text-revio-900"
        >
          <FolderOpen size={20} />
          <span className="truncate">Prosjekter</span>
        </Link>
      </div>
      <div className="space-y-1 pt-2 border-t">
        <Link 
          to="/innstillinger" 
          className="flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100 text-revio-900"
        >
          <Settings size={20} />
          <span className="truncate">Innstillinger</span>
        </Link>
        <Link 
          to="/hjelp" 
          className="flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100 text-revio-900"
        >
          <HelpCircle size={20} />
          <span className="truncate">Hjelp</span>
        </Link>
      </div>
    </nav>
  );
}
