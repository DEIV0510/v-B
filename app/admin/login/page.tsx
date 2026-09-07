import '../admin.css';
import LoginForm from '@/components/admin/LoginForm';

export default function AdminLoginPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>V&amp;B Admin</h1>
        <p>Inicia sesión para administrar la tienda.</p>
        <LoginForm callbackUrl={searchParams.callbackUrl || '/admin'} />
      </div>
    </div>
  );
}
