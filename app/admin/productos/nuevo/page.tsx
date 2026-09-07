import { listCollections } from '@/app/actions/collections';
import ProductForm from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  const collections = await listCollections();

  return (
    <>
      <div className="admin__page-head">
        <div>
          <h1>Nuevo producto</h1>
          <p>Se guarda directamente en la base de datos — no se toca código.</p>
        </div>
      </div>
      <ProductForm mode="create" collections={collections.map((c) => ({ id: c.id, name: c.name }))} />
    </>
  );
}
