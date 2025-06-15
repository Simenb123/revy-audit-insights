
import * as React from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const TreeViewContext = React.createContext<{
  openItems: string[];
  setOpenItems: React.Dispatch<React.SetStateAction<string[]>>;
  selectedItem: string | null;
  setSelectedItem: React.Dispatch<React.SetStateAction<string | null>>;
}>({
  openItems: [],
  setOpenItems: () => {},
  selectedItem: null,
  setSelectedItem: () => {},
});

const TreeView = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const [openItems, setOpenItems] = React.useState<string[]>([]);
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null);

  return (
    <TreeViewContext.Provider value={{ openItems, setOpenItems, selectedItem, setSelectedItem }}>
      <div ref={ref} className={cn('space-y-1', className)} {...props} />
    </TreeViewContext.Provider>
  );
});
TreeView.displayName = 'TreeView';

const TreeItemContext = React.createContext<{ id: string }>({ id: '' });

const TreeItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement> & { value: string }
>(({ className, value, ...props }, ref) => {
  return (
    <TreeItemContext.Provider value={{ id: value }}>
      <li ref={ref} className={cn('space-y-1', className)} {...props} />
    </TreeItemContext.Provider>
  );
});
TreeItem.displayName = 'TreeItem';

const TreeViewTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { openItems, setOpenItems, setSelectedItem } = React.useContext(TreeViewContext);
  const { id } = React.useContext(TreeItemContext);
  const isOpen = openItems.includes(id);

  const handleToggle = () => {
    setOpenItems((prev) =>
      isOpen ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };
  
  const handleSelect = () => {
    setSelectedItem(id);
  }

  return (
    <div ref={ref} className={cn('flex items-center p-2 cursor-pointer rounded-md hover:bg-accent', className)} {...props}>
      <div onClick={handleToggle} className="mr-2">
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </div>
      <div onClick={handleSelect} className="flex-grow">{children}</div>
    </div>
  );
});
TreeViewTrigger.displayName = 'TreeViewTrigger';

const TreeViewContent = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, children, ...props }, ref) => {
  const { openItems } = React.useContext(TreeViewContext);
  const { id } = React.useContext(TreeItemContext);
  const isOpen = openItems.includes(id);

  if (!isOpen) {
    return null;
  }

  return (
    <ul ref={ref} className={cn('pl-6 space-y-1', className)} {...props}>
      {children}
    </ul>
  );
});
TreeViewContent.displayName = 'TreeViewContent';

export { TreeView, TreeItem, TreeViewTrigger, TreeViewContent };
