
import Sidebar      from './Sidebar';
import AppHeader    from './Header';

type MainLayoutProps = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <AppHeader />
        {/* innhold starter 64 px ned = h-16 header */}
        <main className="flex-1 overflow-y-auto px-6 pt-16">{children}</main>
      </div>
    </div>
  );
}
