import { listAuditLog } from '@/app/actions/audit';

export default async function AuditPage() {
  const logs = await listAuditLog(200);

  return (
    <>
      <div className="admin__page-head">
        <div>
          <h1>Auditoría</h1>
          <p>Registro de todos los cambios hechos desde el panel.</p>
        </div>
      </div>

      <div className="admin-card">
        {logs.length === 0 ? (
          <p style={{ color: 'var(--c-grey-dim)', fontSize: 13 }}>Aún no hay actividad registrada.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Fecha</th><th>Admin</th><th>Tipo</th><th>Acción</th><th>Detalle</th></tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString('es-CO')}</td>
                  <td>{log.adminUser?.email ?? '—'}</td>
                  <td>{log.entityType}</td>
                  <td>{log.action}</td>
                  <td>{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
