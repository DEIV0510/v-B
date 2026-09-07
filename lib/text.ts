/** Los títulos de las secciones de inicio se guardan con saltos de línea
 * reales (uno por cada `.line` apilado del diseño Anton) — el admin controla
 * los saltos escribiendo en un textarea. */
export function splitLines(title: string): string[] {
  return title.split('\n').map((l) => l.trim()).filter(Boolean);
}
