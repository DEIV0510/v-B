import Link from 'next/link';
import { listProducts } from '@/app/actions/products';
import ProductsTable from '@/components/admin/ProductsTable';

export default async function ProductsPage() {
  const products = await listProducts();

  return (
    <>
      <div className="admin__page-head">
        <div>
          <h1>Productos</h1>
          <p>{products.length} producto(s) en total.</p>
        </div>
        <Link href="/admin/productos/nuevo" className="admin-btn admin-btn--primary">+ Nuevo producto</Link>
      </div>

      <ProductsTable
        initialProducts={products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          status: p.status,
          isFeatured: p.isFeatured,
          isNew: p.isNew,
          isSoldout: p.isSoldout,
          collectionName: p.collection.name,
          imageUrl: p.mainImage?.url ?? null
        }))}
      />
    </>
  );
}
