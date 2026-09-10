import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getSpinFrames } from '@/app/actions/spin';
import Spin360Editor from '@/components/admin/Spin360Editor';

export default async function Spin360Page({ params }: { params: { id: string } }) {
  const product = await db.product.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, slug: true, spinEnabled: true, spinReverse: true }
  });
  if (!product) notFound();

  const frames = await getSpinFrames(product.id);

  return (
    <>
      <div className="admin__page-head">
        <div>
          <h1>Visor 360°</h1>
          <p>{product.name}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={`/admin/productos/${product.id}`} className="admin-btn">← Volver al producto</Link>
          <Link href={`/producto/${product.slug}`} target="_blank" className="admin-btn">Ver en la tienda</Link>
        </div>
      </div>

      <Spin360Editor
        productId={product.id}
        productName={product.name}
        initialFrames={frames}
        initialEnabled={product.spinEnabled}
        initialReverse={product.spinReverse}
      />
    </>
  );
}
