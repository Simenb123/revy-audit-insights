import createTaxonomyHooks, { TaxonomyBase } from './useTaxonomy';

export interface ContentType extends TaxonomyBase {
  icon?: string;
}

const {
  useTaxonomies: useContentTypes,
  useTaxonomyById: useContentTypeById,
  useCreateTaxonomy: useCreateContentType,
  useUpdateTaxonomy: useUpdateContentType,
  useDeleteTaxonomy: useDeleteContentType,
} = createTaxonomyHooks<ContentType>('content_types', 'Innholdstype');

export {
  useContentTypes,
  useContentTypeById,
  useCreateContentType,
  useUpdateContentType,
  useDeleteContentType,
};
