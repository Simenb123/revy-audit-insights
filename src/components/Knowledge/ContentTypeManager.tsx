import React from 'react';
import GenericManager, { FieldDefinition } from './GenericManager';
import {
  useContentTypes,
  useCreateContentType,
  useUpdateContentType,
  useDeleteContentType
} from '@/hooks/knowledge/useContentTypes';

const ContentTypeManager = () => {
  const { data: contentTypes = [], isLoading } = useContentTypes();
  const create = useCreateContentType();
  const update = useUpdateContentType();
  const remove = useDeleteContentType();

  const fields: FieldDefinition[] = [
    { name: 'name', label: 'Navn (teknisk)', required: true },
    { name: 'display_name', label: 'Visningsnavn', required: true },
    { name: 'description', label: 'Beskrivelse', type: 'textarea' },
    { name: 'icon', label: 'Ikon (Lucide-navn)' },
    { name: 'color', label: 'Farge', type: 'color' },
    { name: 'sort_order', label: 'Sorteringsrekkefølge', type: 'number' },
    { name: 'is_active', label: 'Aktiv', type: 'switch' }
  ];

  return (
    <GenericManager
      title="Innholdstyper"
      itemLabel="innholdstype"
      items={contentTypes}
      isLoading={isLoading}
      createMutation={create}
      updateMutation={update}
      deleteMutation={remove}
      fields={fields}
    />
  );
};

export default ContentTypeManager;
