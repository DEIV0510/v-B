import Link from 'next/link';
import { listCollections } from '@/app/actions/collections';

export default async function CollectionsPage() {
  const collections = await listCollections();

  return (
    <>
      <div className="admin__page-head">
        <div>
          <h1>Colecciones</h1>
          <p>{collections.length} colección(es).</p>
        </div>
        <Link href="/admin/colecciones/nueva" className="admin-btn admin-btn--primary">+ Nueva colección</Link>
      </div>

      <div className="admin-card" style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr><th></th><th>Nombre</th><th>Slug</th><th>Productos</th><th>Combo</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {collections.map((c) => (
              <tr key={c.id}>
                <td>{c.image && <img src={c.image.url} alt="" />}</td>
                <td>{c.name}</td>
                <td>{c.slug}</td>
                <td>{c._count.products}</td>
                <td>{c.bundleQty && c.bundlePrice ? `${c.bundleQty}x $${c.bundlePrice.toLocaleString('es-CO')}` : '—'}</td>
                <td><span className={`admin-badge ${c.status === 'active' ? 'admin-badge--ok' : 'admin-badge--off'}`}>{c.status === 'active' ? 'Activa' : 'Inactiva'}</span></td>
                <td><Link href={`/admin/colecciones/${c.id}`} className="admin-btn admin-btn--small">Editar</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
