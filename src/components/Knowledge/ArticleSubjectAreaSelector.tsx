
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useSubjectAreasHierarchical } from '@/hooks/knowledge/useSubjectAreas';
import { useArticleSubjectAreas, useConnectArticleSubjectArea, useDisconnectArticleSubjectArea } from '@/hooks/knowledge/useArticleSubjectAreas';
import HierarchicalSubjectAreaSelector from './HierarchicalSubjectAreaSelector';

interface ArticleSubjectAreaSelectorProps {
  articleId?: string;
  onSelectionChange?: (selectedAreaIds: string[]) => void;
}

const ArticleSubjectAreaSelector: React.FC<ArticleSubjectAreaSelectorProps> = ({
  articleId,
  onSelectionChange
}) => {
  const { data: allSubjectAreas = [], isLoading: loadingAreas } = useSubjectAreasHierarchical();
  const { data: articleSubjectAreas = [], isLoading: loadingArticleAreas } = useArticleSubjectAreas(articleId);
  const connectMutation = useConnectArticleSubjectArea();
  const disconnectMutation = useDisconnectArticleSubjectArea();

  const selectedAreaIds = articleSubjectAreas.map(asa => asa.subject_area_id);

  const handleSelectionChange = async (newSelectedIds: string[]) => {
    if (!articleId) {
      // If no articleId, just notify parent component for preview/editing purposes
      onSelectionChange?.(newSelectedIds);
      return;
    }

    const currentIds = selectedAreaIds;
    const toAdd = newSelectedIds.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter(id => !newSelectedIds.includes(id));

    // Add new connections
    for (const subjectAreaId of toAdd) {
      await connectMutation.mutateAsync({ articleId, subjectAreaId });
    }

    // Remove old connections
    for (const subjectAreaId of toRemove) {
      await disconnectMutation.mutateAsync({ articleId, subjectAreaId });
    }

    onSelectionChange?.(newSelectedIds);
  };

  const handleRemoveArea = async (subjectAreaId: string) => {
    if (!articleId) return;
    await disconnectMutation.mutateAsync({ articleId, subjectAreaId });
  };

  if (loadingAreas || loadingArticleAreas) {
    return <div>Laster emneområder...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Emneområder</label>
        <p className="text-xs text-gray-600">
          Velg hvilke emneområder denne artikkelen tilhører
        </p>
      </div>

      {/* Currently selected areas */}
      {selectedAreaIds.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Valgte emneområder:</label>
          <div className="flex flex-wrap gap-2">
            {articleSubjectAreas.map((asa) => (
              <Badge
                key={asa.id}
                variant="secondary"
                className="flex items-center gap-1"
                style={{ backgroundColor: asa.subject_area.color + '20' }}
              >
                <span>{asa.subject_area.display_name}</span>
                {articleId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto w-auto p-0 hover:bg-transparent"
                    onClick={() => handleRemoveArea(asa.subject_area_id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Subject area selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Legg til emneområder:</label>
        <HierarchicalSubjectAreaSelector
          subjectAreas={allSubjectAreas}
          selectedIds={selectedAreaIds}
          onSelectionChange={handleSelectionChange}
          allowMultiple={true}
        />
      </div>
    </div>
  );
};

export default ArticleSubjectAreaSelector;
