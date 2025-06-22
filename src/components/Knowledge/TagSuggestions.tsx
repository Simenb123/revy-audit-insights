
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { useUnifiedTags } from '@/hooks/knowledge/useUnifiedTags';

interface TagSuggestionsProps {
  currentTags: string;
  onTagsChange: (tags: string) => void;
  onCreateNewTag?: (tagName: string) => void;
}

const TagSuggestions = ({ 
  currentTags, 
  onTagsChange, 
  onCreateNewTag 
}: TagSuggestionsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const { data: availableTags = [] } = useUnifiedTags();

  const currentTagList = currentTags
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);

  const filteredTags = availableTags.filter(tag =>
    tag.display_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !currentTagList.includes(tag.display_name)
  );

  const addTag = (tagName: string) => {
    const newTags = currentTagList.includes(tagName) 
      ? currentTagList 
      : [...currentTagList, tagName];
    onTagsChange(newTags.join(', '));
  };

  const removeTag = (tagName: string) => {
    const newTags = currentTagList.filter(tag => tag !== tagName);
    onTagsChange(newTags.join(', '));
  };

  const handleCreateNewTag = () => {
    if (newTagName.trim() && onCreateNewTag) {
      onCreateNewTag(newTagName.trim());
      addTag(newTagName.trim());
      setNewTagName('');
    }
  };

  // Popular tags based on usage
  const popularTags = availableTags
    .filter(tag => !currentTagList.includes(tag.display_name))
    .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tag-forslag</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current tags */}
        {currentTagList.length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Valgte tags:
            </label>
            <div className="flex flex-wrap gap-1 mt-1">
              {currentTagList.map((tag) => (
                <Badge
                  key={tag}
                  variant="default"
                  className="cursor-pointer"
                  onClick={() => removeTag(tag)}
                >
                  {tag}
                  <span className="ml-1 text-xs">×</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Search tags */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Søk etter eksisterende tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {searchTerm && (
            <div className="flex flex-wrap gap-1">
              {filteredTags.slice(0, 15).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => addTag(tag.display_name)}
                >
                  {tag.display_name}
                  <Plus className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {filteredTags.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Ingen tags funnet for "{searchTerm}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Create new tag */}
        {onCreateNewTag && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Opprett ny tag:
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Navn på ny tag..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateNewTag()}
              />
              <Button 
                onClick={handleCreateNewTag}
                disabled={!newTagName.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Popular tags */}
        {!searchTerm && popularTags.length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Populære tags:
            </label>
            <div className="flex flex-wrap gap-1 mt-1">
              {popularTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent text-xs"
                  onClick={() => addTag(tag.display_name)}
                >
                  {tag.display_name}
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({tag.usage_count})
                  </span>
                  <Plus className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TagSuggestions;
