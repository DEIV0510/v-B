'use client';

import { useEffect, useState } from 'react';

const KEY = 'vb_theme';
const DARK_COLOR = '#050505';
const LIGHT_COLOR = '#ffffff';

type Theme = 'light' | 'dark';

function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

// Oscuro es el tema de la marca y no lleva atributo; claro es <html data-theme="light">.
function paint(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'light') root.setAttribute('data-theme', 'light');
  else root.removeAttribute('data-theme');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? LIGHT_COLOR : DARK_COLOR);
}

function saved(): Theme | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

/**
 * Boton sol/luna del header. La eleccion se guarda en localStorage (vb_theme) y la aplica
 * ThemeScript ANTES del primer pintado, asi que aqui solo se sincroniza el boton y se cambia
 * el tema al pulsar. Sin eleccion guardada la tienda queda en oscuro (la identidad de la marca):
 * no se sigue prefers-color-scheme a proposito.
 */
export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    // Respaldo: si se llego por una navegacion del cliente (p. ej. desde /admin) el script
    // previo al pintado no corrio y el tema guardado todavia no esta aplicado.
    const stored = saved();
    if (stored && stored !== currentTheme()) paint(stored);
    setLight(currentTheme() === 'light');

    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      const next: Theme = e.newValue === 'light' ? 'light' : 'dark';
      paint(next);
      setLight(next === 'light');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = () => {
    const next: Theme = currentTheme() === 'light' ? 'dark' : 'light';
    const root = document.documentElement;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.setAttribute('data-theme-anim', '');
      window.setTimeout(() => root.removeAttribute('data-theme-anim'), 380);
    }
    paint(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Navegador en modo privado o con el almacenamiento bloqueado: cambia igual, sin recordarlo.
    }
    setLight(next === 'light');
  };

  return (
    <button
      type="button"
      className="icon-btn theme-toggle"
      id="themeToggle"
      aria-label="Modo claro"
      aria-pressed={light}
      title={light ? 'Volver al modo oscuro' : 'Ver la tienda en modo claro'}
      onClick={toggle}
    >
      <svg className="theme-toggle__sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
      </svg>
      <svg className="theme-toggle__moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.2 8.2 0 1 0 20 14.2Z" />
      </svg>
    </button>
  );
}
