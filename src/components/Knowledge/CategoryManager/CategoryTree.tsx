
import React from 'react';
import { Category } from '@/types/classification';
import { Badge } from '@/components/ui/badge';
import { Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';

interface CategoryTreeProps {
  categories: Category[];
  selectedCategory: Category | null;
  expandedCategories: Set<string>;
  articlesCount: number;
  onCategorySelect: (category: Category) => void;
  onToggleCategory: (categoryId: string) => void;
}

const CategoryTree = ({
  categories,
  selectedCategory,
  expandedCategories,
  articlesCount,
  onCategorySelect,
  onToggleCategory
}: CategoryTreeProps) => {
  const buildCategoryTree = (categories: Category[], parentId: string | null = null): Category[] => {
    return categories
      .filter(cat => cat.parent_category_id === parentId)
      .sort((a, b) => a.display_order - b.display_order)
      .map(cat => ({
        ...cat,
        children: buildCategoryTree(categories, cat.id)
      }));
  };

  const renderCategoryTree = (categories: Category[], depth: number = 0) => {
    return categories.map((category) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.has(category.id);
      const isSelected = selectedCategory?.id === category.id;
      
      // Count articles in this specific category
      const articlesInCategory = selectedCategory?.id === category.id ? articlesCount : 0;
      
      // Check if category is empty (no articles and no subcategories)
      const isEmpty = !hasChildren && articlesInCategory === 0;
      
      return (
        <div key={category.id} className="w-full">
          <div 
            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors hover:bg-accent/50 ${
              isSelected ? 'bg-accent border border-primary/20' : ''
            }`}
            style={{ marginLeft: `${depth * 24}px` }}
            onClick={() => onCategorySelect(category)}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCategory(category.id);
                }}
                className="p-1 hover:bg-accent rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            
            {!hasChildren && <div className="w-6" />}
            
            {hasChildren ? (
              <FolderOpen className="h-4 w-4 text-blue-600" />
            ) : (
              <Folder className="h-4 w-4 text-gray-500" />
            )}
            
            <span className={`flex-1 ${isSelected ? 'font-semibold text-primary' : ''}`}>
              {category.name}
            </span>
            
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {category.display_order}
              </Badge>
              {isEmpty && (
                <Badge variant="secondary" className="text-xs text-orange-600">
                  Tom
                </Badge>
              )}
            </div>
          </div>
          
          {hasChildren && isExpanded && (
            <div className="mt-1">
              {renderCategoryTree(category.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const categoryTree = buildCategoryTree(categories);

  return (
    <div className="space-y-1">
      {renderCategoryTree(categoryTree)}
    </div>
  );
};

export default CategoryTree;
