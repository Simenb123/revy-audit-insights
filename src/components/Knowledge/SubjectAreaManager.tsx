import React from 'react';
import GenericManager, { FieldDefinition } from './GenericManager';
import {
  useSubjectAreas,
  useCreateSubjectArea,
  useUpdateSubjectArea,
  useDeleteSubjectArea
} from '@/hooks/knowledge/useSubjectAreas';

const SubjectAreaManager = () => {
  const { data: subjectAreas = [], isLoading } = useSubjectAreas();
  const create = useCreateSubjectArea();
  const update = useUpdateSubjectArea();
  const remove = useDeleteSubjectArea();

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
      title="Emneområder"
      itemLabel="emneområde"
      items={subjectAreas}
      isLoading={isLoading}
      createMutation={create}
      updateMutation={update}
      deleteMutation={remove}
      fields={fields}
    />
  );
};

export default SubjectAreaManager;
