import React from 'react';
import TaxonomyTable from './TaxonomyTable';
import { TaxonomyData } from './TaxonomyForm';
import {
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  type Tag as TagType,
} from '@/hooks/knowledge/useTags';

const TagManager = () => {
  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const items = tags.map((tag: TagType) => ({
    id: tag.id,
    name: tag.name,
    display_name: tag.display_name,
    description: tag.description,
    icon: undefined,
    color: tag.color,
    sort_order: tag.sort_order,
    is_active: tag.is_active,
  }));

  return (
    <TaxonomyTable
      title="Tags"
      items={items}
      onCreate={(data) => createTag.mutate({ ...data, color: data.color ?? '#3B82F6', category: undefined })}
      onUpdate={(id, data) => updateTag.mutate({ id, ...data })}
      onDelete={(id) => deleteTag.mutate(id)}
      onToggleActive={(id, active) => updateTag.mutate({ id, is_active: active })}
    />
  );
};

export default TagManager;
