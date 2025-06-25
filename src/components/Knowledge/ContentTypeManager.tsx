import React from 'react';
import TaxonomyTable from './TaxonomyTable';
import { TaxonomyData } from './TaxonomyForm';
import {
  useContentTypes,
  useCreateContentType,
  useUpdateContentType,
  useDeleteContentType,
  ContentType,
} from '@/hooks/knowledge/useContentTypes';

const ContentTypeManager = () => {
  const { data: contentTypes = [] } = useContentTypes();
  const createType = useCreateContentType();
  const updateType = useUpdateContentType();
  const deleteType = useDeleteContentType();

  const items = contentTypes.map((ct: ContentType) => ({
    id: ct.id,
    name: ct.name,
    display_name: ct.display_name,
    description: ct.description,
    icon: ct.icon,
    color: ct.color,
    sort_order: ct.sort_order,
    is_active: ct.is_active,
  }));

  return (
    <TaxonomyTable
      title="Innholdstyper"
      items={items}
      onCreate={(data) => createType.mutate(data)}
      onUpdate={(id, data) => updateType.mutate({ id, ...data })}
      onDelete={(id) => deleteType.mutate(id)}
      onToggleActive={(id, active) => updateType.mutate({ id, is_active: active })}
    />
  );
};

export default ContentTypeManager;
