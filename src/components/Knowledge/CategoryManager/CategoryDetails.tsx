import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Move, Trash, Loader2 } from 'lucide-react';
import { Category } from '@/types/classification';

interface CategoryDetailsProps {
  selectedCategory: Category | null;
  categories: Category[];
  articles: any[];
  editingCategory: Category | null;
  onEdit: (category: Category) => void;
  onDelete: () => void;
  onDeleteEmptySubcategories: () => void;
  onMoveArticles: () => void;
  isDeleting: boolean;
  isDeletingEmpty: boolean;
  children?: React.ReactNode;
}

const CategoryDetails = ({
  selectedCategory,
  categories,
  articles,
  editingCategory,
  onEdit,
  onDelete,
  onDeleteEmptySubcategories,
  onMoveArticles,
  isDeleting,
  isDeletingEmpty,
  children
}: CategoryDetailsProps) => {
  if (!selectedCategory) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Velg en kategori for å se detaljer
      </div>
    );
  }

  const subcategories = categories.filter(c => c.parent_category_id === selectedCategory.id);
  const isEmpty = subcategories.length === 0 && articles.length === 0;
  const emptySubcategories = subcategories.filter(sub => {
    const hasNestedSubcategories = categories.some(c => c.parent_category_id === sub.id);
    return !hasNestedSubcategories;
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{selectedCategory.name}</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(selectedCategory)}
              disabled={!!editingCategory}
            >
              <Edit className="h-4 w-4 mr-1" />
              Rediger
            </Button>
            {isEmpty && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                Slett
              </Button>
            )}
          </div>
        </div>

        {selectedCategory.description && (
          <p className="text-sm text-muted-foreground">
            {selectedCategory.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Underkategorier:</span> {subcategories.length}
          </div>
          <div>
            <span className="font-medium">Artikler:</span> {articles.length}
          </div>
          <div>
            <span className="font-medium">Sorteringsrekkefølge:</span> {selectedCategory.display_order}
          </div>
          <div>
            <span className="font-medium">Ikon:</span> {selectedCategory.icon || 'Ingen'}
          </div>
        </div>

        {selectedCategory.applicable_phases && selectedCategory.applicable_phases.length > 0 && (
          <div>
            <span className="text-sm font-medium">Gjeldende faser:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedCategory.applicable_phases?.map((phase: string) => (
                <Badge key={phase} variant="outline" className="text-xs">
                  {phase}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {children}

      {subcategories.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Handlinger</h4>
          <div className="flex flex-wrap gap-2">
            {articles.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={onMoveArticles}
              >
                <Move className="h-4 w-4 mr-1" />
                Flytt artikler
              </Button>
            )}
            
            {emptySubcategories.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={onDeleteEmptySubcategories}
                disabled={isDeletingEmpty}
              >
                {isDeletingEmpty ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Trash className="h-4 w-4 mr-1" />
                )}
                Slett tomme underkategorier ({emptySubcategories.length})
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDetails;
