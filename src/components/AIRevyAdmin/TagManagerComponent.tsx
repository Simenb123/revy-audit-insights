import React from 'react';
import GenericManager, { FieldDefinition } from '../Knowledge/GenericManager';
import {
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag
} from '@/hooks/knowledge/useTags';

const TagManagerComponent = () => {
  const { data: tags = [], isLoading } = useTags();
  const create = useCreateTag();
  const update = useUpdateTag();
  const remove = useDeleteTag();

  const fields: FieldDefinition[] = [
    { name: 'name', label: 'System navn', required: true },
    { name: 'display_name', label: 'Visningsnavn', required: true },
    { name: 'description', label: 'Beskrivelse', type: 'textarea' },
    {
      name: 'category',
      label: 'Kategori',
      type: 'select',
      options: [
        { value: 'isa-standard', label: 'ISA Standard' },
        { value: 'risk-level', label: 'Risikonivå' },
        { value: 'audit-phase', label: 'Revisjonsfase' },
        { value: 'content-type', label: 'Innholdstype' },
        { value: 'subject-area', label: 'Emneområde' },
        { value: 'custom', label: 'Tilpasset' }
      ]
    },
    { name: 'color', label: 'Farge', type: 'color' },
    { name: 'sort_order', label: 'Sortering', type: 'number' },
    { name: 'is_active', label: 'Aktiv', type: 'switch' }
  ];

  return (
    <GenericManager
      title="Tags"
      itemLabel="tag"
      items={tags}
      isLoading={isLoading}
      createMutation={create}
      updateMutation={update}
      deleteMutation={remove}
      fields={fields}
    />
  );
};

export default TagManagerComponent;
