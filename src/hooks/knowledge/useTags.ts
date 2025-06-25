import createTaxonomyHooks from './useTaxonomy';
import type { Tag } from '@/types/classification';

const {
  useTaxonomies: useTags,
  useTaxonomyById: useTagById,
  useCreateTaxonomy: useCreateTag,
  useUpdateTaxonomy: useUpdateTag,
  useDeleteTaxonomy: useDeleteTag,
} = createTaxonomyHooks<Tag>('tags', 'Tag');

export {
  useTags,
  useTagById,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
};

export type { Tag };
