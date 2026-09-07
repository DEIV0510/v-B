type Props = {
  logoFullUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  facebookUrl: string;
};

export default function Footer({ logoFullUrl, instagramUrl, tiktokUrl, facebookUrl }: Props) {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <img src={logoFullUrl} alt="V&B" width={180} height={114} loading="lazy" decoding="async" />
          <p>PERFORMANCE APPAREL</p>
        </div>

        <nav className="footer__links" aria-label="Enlaces del sitio">
          <a href="#inicio">Inicio</a>
          <a href="#productos">Productos</a>
          <a href="#coleccion">Colección</a>
          <a href="#nosotros">Nosotros</a>
        </nav>

        <div className="footer__social" aria-label="Redes sociales">
          <a href={instagramUrl || '#'} aria-label="Instagram">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" /></svg>
          </a>
          <a href={tiktokUrl || '#'} aria-label="TikTok">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 3v11.2a3.6 3.6 0 1 1-3-3.55" strokeLinecap="round" /><path d="M14 3c.5 2.6 2.2 4.3 5 4.7" strokeLinecap="round" /></svg>
          </a>
          <a href={facebookUrl || '#'} aria-label="Facebook">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 8h2V4h-2a4 4 0 0 0-4 4v2H9v4h2v6h4v-6h2.5l.5-4H15V8Z" strokeLinejoin="round" /></svg>
          </a>
        </div>
      </div>

      <div className="footer__bottom">
        <p>&copy; 2026 V&amp;B PERFORMANCE APPAREL</p>
        <p>HECHO PARA <span className="accent">RENDIR.</span></p>
      </div>
    </footer>
  );
}
