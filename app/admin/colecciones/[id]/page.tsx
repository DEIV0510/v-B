import { notFound } from 'next/navigation';
import { getCollection } from '@/app/actions/collections';
import CollectionForm from '@/components/admin/CollectionForm';

export default async function EditCollectionPage({ params }: { params: { id: string } }) {
  const collection = await getCollection(params.id);
  if (!collection) notFound();

  return (
    <>
      <div className="admin__page-head">
        <div>
          <h1>Editar colección</h1>
          <p>{collection.name}</p>
        </div>
      </div>
      <CollectionForm
        mode="edit"
        collectionId={collection.id}
        initial={{
          slug: collection.slug,
          name: collection.name,
          description: collection.description,
          imageId: collection.imageId,
          status: collection.status,
          bundleQty: collection.bundleQty,
          bundlePrice: collection.bundlePrice
        }}
      />
    </>
  );
}
