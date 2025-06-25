import createTaxonomyHooks, { TaxonomyBase } from './useTaxonomy';

export interface Tag extends TaxonomyBase {
  category?: string;
}

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
