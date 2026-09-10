import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct } from '@/app/actions/products';
import { listCollections } from '@/app/actions/collections';
import ProductForm from '@/components/admin/ProductForm';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, collections] = await Promise.all([getProduct(params.id), listCollections()]);
  if (!product) notFound();

  return (
    <>
      <div className="admin__page-head">
        <div>
          <h1>Editar producto</h1>
          <p>{product.name}</p>
        </div>
      </div>
      <ProductForm
        mode="edit"
        productId={product.id}
        collections={collections.map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          slug: product.slug,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          shortDescription: product.shortDescription,
          description: product.description,
          sku: product.sku,
          color: product.color,
          sizes: product.sizes as string[],
          stock: product.stock,
          collectionId: product.collectionId,
          mediaVariant: product.mediaVariant,
          mainImageId: product.mainImageId,
          galleryMediaIds: product.images.map((i) => i.mediaId),
          status: product.status,
          isFeatured: product.isFeatured,
          isNew: product.isNew,
          isSoldout: product.isSoldout
        }}
      />

      {/* Fuera del <form> de ProductForm a proposito: anidar formularios rompe
          la hidratacion de React (mismo motivo documentado en MediaPicker). */}
      <div className="admin-card" style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 15, marginBottom: 6 }}>Visor 360°</h2>
        <p style={{ fontSize: 13, color: 'var(--c-grey-dim)', marginBottom: 14 }}>
          {product._count.spinFrames === 0
            ? 'Sin secuencia. Puedes subir fotos del producto girando para que el cliente lo vea en 360°.'
            : `${product._count.spinFrames} foto(s) · ${product.spinEnabled ? 'Visible en la tienda' : 'Apagado'}`}
        </p>
        <Link href={`/admin/productos/${product.id}/360`} className="admin-btn">
          Configurar visor 360°
        </Link>
      </div>
    </>
  );
}
