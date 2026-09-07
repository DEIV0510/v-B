import CollectionForm from '@/components/admin/CollectionForm';

export default function NewCollectionPage() {
  return (
    <>
      <div className="admin__page-head">
        <div>
          <h1>Nueva colección</h1>
        </div>
      </div>
      <CollectionForm mode="create" />
    </>
  );
}
