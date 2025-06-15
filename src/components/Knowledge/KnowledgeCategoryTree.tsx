import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeCategory } from '@/types/knowledge';
import { TreeView, TreeItem, TreeViewTrigger, TreeViewContent } from '@/components/ui/tree-view';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Folder, FileText } from 'lucide-react';

const fetchCategories = async () => {
  const { data, error } = await supabase.from('knowledge_categories').select('*').order('display_order');
  if (error) throw error;
  return data as KnowledgeCategory[];
};

type CategoryTreeNode = Omit<KnowledgeCategory, 'children'> & {
  children: CategoryTreeNode[];
};

const buildCategoryTree = (categories: KnowledgeCategory[]): CategoryTreeNode[] => {
  const categoryMap = new Map<string, CategoryTreeNode>();
  categories.forEach(cat => categoryMap.set(cat.id, { ...cat, children: [] }));

  const tree: CategoryTreeNode[] = [];
  categories.forEach(cat => {
    if (cat.parent_category_id && categoryMap.has(cat.parent_category_id)) {
      const parent = categoryMap.get(cat.parent_category_id)!;
      parent.children.push(categoryMap.get(cat.id)!);
    } else {
      tree.push(categoryMap.get(cat.id)!);
    }
  });

  tree.forEach(node => {
    node.children.sort((a, b) => a.display_order - b.display_order);
  });
  
  return tree.sort((a,b) => a.display_order - b.display_order);
};

const CategoryTreeItem = ({ category }: { category: CategoryTreeNode }) => {
  const { categoryId } = useParams<{ categoryId?: string }>();
  const isSelected = category.id === categoryId;
  const hasChildren = category.children && category.children.length > 0;

  if (!hasChildren) {
    return (
      <li className="list-none">
        <Link
          to={`/fag/kategori/${category.id}`}
          className={cn(
            'flex items-center gap-2 p-2 rounded-md hover:bg-accent ml-6',
            isSelected && 'bg-accent font-semibold'
          )}
        >
          <FileText size={16} className="flex-shrink-0" />
          <span className="flex-grow">{category.name}</span>
        </Link>
      </li>
    );
  }

  return (
    <TreeItem value={category.id}>
      <Link to={`/fag/kategori/${category.id}`} className="block text-current no-underline">
        <TreeViewTrigger className={cn(isSelected && 'bg-accent font-semibold')}>
          <div className="flex items-center gap-2">
            <Folder size={16} />
            <span className='font-medium'>{category.name}</span>
          </div>
        </TreeViewTrigger>
      </Link>
      <TreeViewContent>
        {category.children.map(child => (
          <CategoryTreeItem key={child.id} category={child} />
        ))}
      </TreeViewContent>
    </TreeItem>
  );
};

export const KnowledgeCategoryTree = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['knowledge-categories-all'],
    queryFn: fetchCategories,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h2 className="text-lg font-semibold mb-2 px-2">Fagområder</h2>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-4/5 ml-4" />
        <Skeleton className="h-8 w-4/5 ml-4" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/5 ml-4" />
      </div>
    );
  }

  const categoryTree = buildCategoryTree(categories || []);

  return (
    <div>
        <h2 className="text-lg font-semibold mb-2 p-2">Fagområder</h2>
        <TreeView>
          {categoryTree.map(category => (
            <CategoryTreeItem key={category.id} category={category} />
          ))}
        </TreeView>
    </div>
  );
};
