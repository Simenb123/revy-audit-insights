import createTaxonomyHooks from './useTaxonomy';
import type { ContentType } from '@/types/classification';

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

export type { ContentType };
