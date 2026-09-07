'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Panel', exact: true },
  { href: '/admin/productos', label: 'Productos' },
  { href: '/admin/colecciones', label: 'Colecciones' },
  { href: '/admin/inicio', label: 'Inicio' },
  { href: '/admin/banners', label: 'Banners' },
  { href: '/admin/imagenes', label: 'Imágenes' },
  { href: '/admin/seo', label: 'SEO' },
  { href: '/admin/configuracion', label: 'Configuración' },
  { href: '/admin/auditoria', label: 'Auditoría' }
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav>
      {LINKS.map((link) => {
        const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link key={link.href} href={link.href} className={`admin__nav-link${isActive ? ' is-active' : ''}`}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
