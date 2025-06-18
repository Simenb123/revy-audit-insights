
import React from 'react';
import { KnowledgeCategory } from '@/types/knowledge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit, Move, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface CategoryDetailsProps {
  selectedCategory: KnowledgeCategory | null;
  categories: KnowledgeCategory[];
  articles: any[];
  editingCategory: KnowledgeCategory | null;
  onEdit: (category: KnowledgeCategory) => void;
  onDelete: () => void;
  onDeleteEmptySubcategories: () => void;
  onMoveArticles: () => void;
  children: React.ReactNode;
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
  children
}: CategoryDetailsProps) => {
  if (!selectedCategory) {
    return (
      <div className="text-muted-foreground">
        Velg en kategori for å se detaljer
      </div>
    );
  }

  if (editingCategory) {
    return children;
  }

  const subcategories = categories.filter(c => c.parent_category_id === selectedCategory.id);
  const articlesCount = articles.length;
  const isEmpty = subcategories.length === 0 && articlesCount === 0;
  
  // Count empty subcategories (no articles and no nested subcategories)
  const emptySubcategories = subcategories.filter(sub => {
    const hasNestedSubcategories = categories.some(c => c.parent_category_id === sub.id);
    // Check if this subcategory has any articles (we'd need to query this, but for now assume 0)
    return !hasNestedSubcategories;
  });
  
  const hasEmptySubcategories = emptySubcategories.length > 0;
  const canDelete = isEmpty;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Kategoridetails</h3>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onEdit(selectedCategory)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {articlesCount > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Move className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Flytt artikler</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>Flytt alle artikler fra "{selectedCategory.name}" til en annen kategori.</p>
                  <Button onClick={onMoveArticles}>
                    Åpne flyttedialog
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button 
            size="sm" 
            variant="destructive"
            onClick={onDelete}
            disabled={!canDelete}
            title={!canDelete ? 'Kategorien kan ikke slettes fordi den ikke er tom' : 'Slett kategori'}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="font-semibold">Navn</Label>
          <p>{selectedCategory.name}</p>
        </div>
        
        {selectedCategory.description && (
          <div>
            <Label className="font-semibold">Beskrivelse</Label>
            <p>{selectedCategory.description}</p>
          </div>
        )}
        
        <div>
          <Label className="font-semibold">ID (for debugging)</Label>
          <p className="text-xs text-muted-foreground font-mono">{selectedCategory.id}</p>
        </div>
        
        <div>
          <Label className="font-semibold">Sorteringsrekkefølge</Label>
          <p>{selectedCategory.display_order}</p>
        </div>
        
        {selectedCategory.parent_category_id && (
          <div>
            <Label className="font-semibold">Overordnet kategori</Label>
            <p>{categories.find(c => c.id === selectedCategory.parent_category_id)?.name}</p>
          </div>
        )}
        
        <div>
          <Label className="font-semibold">Statistikk</Label>
          <div className="space-y-1 text-sm">
            <p>Artikler: {articlesCount}</p>
            <p>Underkategorier: {subcategories.length}</p>
            <p>Status: <Badge variant={isEmpty ? "secondary" : "default"}>{isEmpty ? 'Tom' : 'Inneholder data'}</Badge></p>
            {hasEmptySubcategories && (
              <p>Potensielt tomme underkategorier: {emptySubcategories.length}</p>
            )}
          </div>
        </div>
        
        {hasEmptySubcategories && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Potensielt tomme underkategorier
            </h4>
            <p className="text-sm text-orange-700 mb-3">
              Denne kategorien har {emptySubcategories.length} underkategorier som kan være tomme.
            </p>
            <div className="space-y-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={onDeleteEmptySubcategories}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Slett tomme underkategorier
              </Button>
              <div className="text-xs text-orange-600">
                <p>Underkategorier som vil bli sjekket:</p>
                <ul className="list-disc list-inside">
                  {emptySubcategories.map(sub => (
                    <li key={sub.id} className="font-mono">{sub.name} ({sub.id.slice(0, 8)}...)</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {subcategories.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Underkategorier ({subcategories.length})</h4>
            <div className="text-sm text-blue-700 space-y-1">
              {subcategories.map(sub => (
                <div key={sub.id} className="flex justify-between items-center">
                  <span>{sub.name}</span>
                  <code className="text-xs">{sub.id.slice(0, 8)}...</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {subcategories.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Sletteveiledning</h4>
            <p className="text-sm text-blue-700 mb-3">
              For å slette denne kategorien må du først:
            </p>
            <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
              <li>Flytt eller slett alle artikler ({articlesCount} artikler)</li>
              <li>Slett alle underkategorier ({subcategories.length} kategorier)</li>
              <li>Deretter kan hovedkategorien slettes</li>
            </ol>
          </div>
        )}
        
        {!canDelete && subcategories.length === 0 && articlesCount > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              Kategorien kan ikke slettes fordi den inneholder {articlesCount} artikler. 
              Flytt eller slett artiklene først.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDetails;
