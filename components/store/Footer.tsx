type Props = {
  logoFullUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  facebookUrl: string;
};

/**
 * Solo http/https llega al DOM. Una URL vacía devuelve null y el ícono no se
 * renderiza: antes salía <a href="#"> y al pulsarlo no pasaba nada. Un esquema
 * raro guardado en la BD (javascript:, data:) también devuelve null, así que
 * nunca se convierte en un href navegable.
 */
function safeUrl(raw: string): string | null {
  const value = (raw ?? '').trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

const ICONS = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" /></svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 3v11.2a3.6 3.6 0 1 1-3-3.55" strokeLinecap="round" /><path d="M14 3c.5 2.6 2.2 4.3 5 4.7" strokeLinecap="round" /></svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 8h2V4h-2a4 4 0 0 0-4 4v2H9v4h2v6h4v-6h2.5l.5-4H15V8Z" strokeLinejoin="round" /></svg>
  )
} as const;

type Social = { key: keyof typeof ICONS; label: string; href: string };

export default function Footer({ logoFullUrl, instagramUrl, tiktokUrl, facebookUrl }: Props) {
  const candidatos: { key: keyof typeof ICONS; label: string; href: string | null }[] = [
    { key: 'instagram', label: 'Instagram', href: safeUrl(instagramUrl) },
    { key: 'tiktok', label: 'TikTok', href: safeUrl(tiktokUrl) },
    { key: 'facebook', label: 'Facebook', href: safeUrl(facebookUrl) }
  ];
  const socials = candidatos.filter((s): s is Social => s.href !== null);

  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <img src={logoFullUrl} alt="V&B" width={180} height={114} loading="lazy" decoding="async" />
          <p>PERFORMANCE APPAREL</p>
        </div>

        {/* Anclas absolutas: el footer también se pinta en /producto/<slug>, donde
            estos id no existen. Con "/#..." desde la home sigue siendo scroll sin
            recarga, y desde la ficha navega a la home y cae en la sección. */}
        <nav className="footer__links" aria-label="Enlaces del sitio">
          <a href="/#inicio">Inicio</a>
          <a href="/#productos">Productos</a>
          <a href="/#coleccion">Colección</a>
          <a href="/#nosotros">Nosotros</a>
        </nav>

        {socials.length > 0 && (
          <nav className="footer__social" aria-label="Redes sociales">
            {socials.map((s) => (
              <a key={s.key} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer">
                {ICONS[s.key]}
              </a>
            ))}
          </nav>
        )}
      </div>

      <div className="footer__bottom">
        <p>&copy; 2026 V&amp;B PERFORMANCE APPAREL</p>
        <p>HECHO PARA <span className="accent">RENDIR.</span></p>
      </div>
    </footer>
  );
}
