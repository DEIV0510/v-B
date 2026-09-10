import Link from 'next/link';
import { db } from '@/lib/db';
import { listAuditLog } from '@/app/actions/audit';

export default async function AdminDashboard() {
  const [
    productCount,
    activeCount,
    soldoutCount,
    featuredCount,
    newCount,
    collectionCount,
    mediaCount,
    settings,
    recentLogs
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { status: 'active' } }),
    db.product.count({ where: { isSoldout: true } }),
    db.product.count({ where: { isFeatured: true } }),
    db.product.count({ where: { isNew: true } }),
    db.collection.count(),
    db.media.count(),
    db.siteSettings.findUnique({ where: { id: 'singleton' } }),
    listAuditLog(8)
  ]);

  return (
    <>
      <div className="admin__page-head">
        <div>
          <h1>V&amp;B Admin Panel</h1>
          <p>Resumen general de la tienda.</p>
        </div>
      </div>

      {!settings?.whatsappNumber && (
        <div className="admin-alert admin-alert--error">
          El número de WhatsApp no está configurado — el checkout no puede completarse.{' '}
          <Link href="/admin/configuracion" style={{ textDecoration: 'underline' }}>Configúralo aquí</Link>.
        </div>
      )}
      {settings && !settings.storeActive && (
        <div className="admin-alert admin-alert--error">
          La tienda está en <strong>modo mantenimiento</strong> — los clientes ven una pantalla de espera, no el catálogo.{' '}
          <Link href="/admin/configuracion" style={{ textDecoration: 'underline' }}>Reactivarla aquí</Link>.
        </div>
      )}

      <div className="admin-grid-2">
        <div className="admin-card">
          <strong style={{ fontSize: 28 }}>{productCount}</strong>
          <p style={{ color: 'var(--c-grey-dim)', fontSize: 13 }}>Productos totales</p>
        </div>
        <div className="admin-card">
          <strong style={{ fontSize: 28 }}>{activeCount}</strong>
          <p style={{ color: 'var(--c-grey-dim)', fontSize: 13 }}>Productos activos</p>
        </div>
        <div className="admin-card">
          <strong style={{ fontSize: 28 }}>{soldoutCount}</strong>
          <p style={{ color: 'var(--c-grey-dim)', fontSize: 13 }}>Agotados</p>
        </div>
        <div className="admin-card">
          <strong style={{ fontSize: 28 }}>{featuredCount}</strong>
          <p style={{ color: 'var(--c-grey-dim)', fontSize: 13 }}>Destacados</p>
        </div>
        <div className="admin-card">
          <strong style={{ fontSize: 28 }}>{newCount}</strong>
          <p style={{ color: 'var(--c-grey-dim)', fontSize: 13 }}>Nuevos</p>
        </div>
        <div className="admin-card">
          <strong style={{ fontSize: 28 }}>{collectionCount}</strong>
          <p style={{ color: 'var(--c-grey-dim)', fontSize: 13 }}>Colecciones</p>
        </div>
        <div className="admin-card">
          <strong style={{ fontSize: 28 }}>{mediaCount}</strong>
          <p style={{ color: 'var(--c-grey-dim)', fontSize: 13 }}>Imágenes</p>
        </div>
        <div className="admin-card">
          <strong style={{ fontSize: 28 }}>{settings?.shippingCost ? `$${settings.shippingCost.toLocaleString('es-CO')}` : '—'}</strong>
          <p style={{ color: 'var(--c-grey-dim)', fontSize: 13 }}>Costo de envío</p>
        </div>
      </div>

      <div className="admin-card">
        <h2 style={{ fontSize: 15, marginBottom: 14 }}>Accesos rápidos</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/admin/productos/nuevo" className="admin-btn admin-btn--primary">+ Nuevo producto</Link>
          <Link href="/admin/inicio" className="admin-btn">Editar inicio</Link>
          <Link href="/admin/productos" className="admin-btn">Gestionar productos</Link>
          <Link href="/admin/configuracion" className="admin-btn">Configuración</Link>
        </div>
      </div>

      <div className="admin-card">
        <h2 style={{ fontSize: 15, marginBottom: 14 }}>Actividad reciente</h2>
        {recentLogs.length === 0 ? (
          <p style={{ color: 'var(--c-grey-dim)', fontSize: 13 }}>Aún no hay actividad registrada.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Fecha</th><th>Admin</th><th>Acción</th><th>Detalle</th></tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString('es-CO')}</td>
                  <td>{log.adminUser?.email ?? '—'}</td>
                  <td>{log.action}</td>
                  <td>{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: 14 }}>
          <Link href="/admin/auditoria" style={{ fontSize: 12.5, color: 'var(--c-grey-dim)', textDecoration: 'underline' }}>Ver todo →</Link>
        </div>
      </div>
    </>
  );
}
