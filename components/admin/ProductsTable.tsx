'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteProduct, duplicateProduct, toggleProductField } from '@/app/actions/products';

type Row = {
  id: string;
  name: string;
  slug: string;
  price: number;
  status: 'active' | 'inactive';
  isFeatured: boolean;
  isNew: boolean;
  isSoldout: boolean;
  collectionName: string;
  imageUrl: string | null;
};

export default function ProductsTable({ initialProducts }: { initialProducts: Row[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(id: string, field: 'status' | 'isFeatured' | 'isNew' | 'isSoldout') {
    startTransition(async () => {
      await toggleProductField(id, field);
      router.refresh();
    });
  }

  async function onDelete(id: string, name: string) {
    if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  }

  async function onDuplicate(id: string) {
    await duplicateProduct(id);
    router.refresh();
  }

  return (
    <div className="admin-card" style={{ overflowX: 'auto' }}>
      <table className="admin-table">
        <thead>
          <tr>
            <th></th>
            <th>Nombre</th>
            <th>Colección</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Etiquetas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.imageUrl && <img src={p.imageUrl} alt="" />}</td>
              <td>{p.name}</td>
              <td>{p.collectionName}</td>
              <td>${p.price.toLocaleString('es-CO')}</td>
              <td>
                <button
                  type="button"
                  className={`admin-badge ${p.status === 'active' ? 'admin-badge--ok' : 'admin-badge--off'}`}
                  style={{ border: 'none', cursor: 'pointer' }}
                  disabled={pending}
                  onClick={() => toggle(p.id, 'status')}
                >
                  {p.status === 'active' ? 'Activo' : 'Inactivo'}
                </button>
              </td>
              <td>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button type="button" className={`admin-badge ${p.isFeatured ? 'admin-badge--ok' : 'admin-badge--off'}`} style={{ border: 'none', cursor: 'pointer' }} onClick={() => toggle(p.id, 'isFeatured')}>Destacado</button>
                  <button type="button" className={`admin-badge ${p.isNew ? 'admin-badge--ok' : 'admin-badge--off'}`} style={{ border: 'none', cursor: 'pointer' }} onClick={() => toggle(p.id, 'isNew')}>Nuevo</button>
                  <button type="button" className={`admin-badge ${p.isSoldout ? 'admin-badge--warn' : 'admin-badge--off'}`} style={{ border: 'none', cursor: 'pointer' }} onClick={() => toggle(p.id, 'isSoldout')}>Agotado</button>
                </div>
              </td>
              <td>
                <div className="admin-table__actions">
                  <Link href={`/admin/productos/${p.id}`} className="admin-btn admin-btn--small">Editar</Link>
                  <button type="button" className="admin-btn admin-btn--small" onClick={() => onDuplicate(p.id)}>Duplicar</button>
                  <button type="button" className="admin-btn admin-btn--small admin-btn--danger" onClick={() => onDelete(p.id, p.name)}>Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
