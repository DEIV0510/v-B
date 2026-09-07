import { auth, signOut } from '@/auth';
import AdminNav from '@/components/admin/AdminNav';
import './admin.css';

// El panel siempre lee el estado mas reciente de la base de datos — nunca
// se cachea estaticamente (aqui tambien vive la sesion, que es por request).
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // El login vive fuera de este shell (sin sidebar) — el middleware ya lo
  // excluye del guard, aquí basta con no envolverlo si no hay sesión.
  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <div className="admin__brand">V&amp;B Admin</div>
        <AdminNav />
        <div className="admin__sidebar-foot">
          <span className="admin__user-email">{session.user.email}</span>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/admin/login' });
            }}
          >
            <button type="submit" className="admin-btn admin-btn--small" style={{ width: '100%' }}>
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <div className="admin__main">{children}</div>
    </div>
  );
}
