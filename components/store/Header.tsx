type Props = {
  logoUrl: string;
};

export default function Header({ logoUrl }: Props) {
  return (
    <>
      <header className="header" id="header">
        <div className="header__row">
          <a href="#inicio" className="header__logo" aria-label="V&B Performance Apparel — Inicio">
            <img src={logoUrl} alt="V&B" width={150} height={78} />
          </a>

          <nav className="nav" id="nav">
            <a href="#inicio" className="nav__link">Inicio</a>
            <a href="#coleccion" className="nav__link">Colección</a>
            <a href="#productos" className="nav__link">Productos</a>
            <a href="#nosotros" className="nav__link">Nosotros</a>
          </nav>

          <div className="header__actions">
            <button className="icon-btn" id="searchToggle" aria-label="Buscar" aria-expanded="false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
            </button>
            <button className="icon-btn icon-btn--cart" id="cartToggle" aria-label="Carrito de compras" aria-expanded="false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 4h2l1.4 12.6a2 2 0 0 0 2 1.8h8.4a2 2 0 0 0 2-1.7L20 8H6" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9.5" cy="20.5" r="1.4" /><circle cx="17" cy="20.5" r="1.4" /></svg>
              <span className="icon-btn__badge" id="cartCount" hidden>0</span>
            </button>
            <button className="burger" id="burger" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>

        <div className="search-panel" id="searchPanel">
          <div className="search-panel__row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
            <input type="text" id="searchInput" placeholder="Buscar TANK o LICRA…" autoComplete="off" />
            <button id="searchClose" aria-label="Cerrar búsqueda">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
            </button>
          </div>
          <p className="search-panel__hint" id="searchHint"></p>
        </div>
      </header>

      <div className="nav-overlay" id="navOverlay"></div>
    </>
  );
}
