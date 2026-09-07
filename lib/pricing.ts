export type ResolvedCartLine = {
  productId: string;
  name: string;
  size: string;
  qty: number;
  price: number;
  img: string;
  collectionId: string;
};

export type BundleRule = {
  collectionId: string;
  bundleQty: number;
  bundlePrice: number;
};

export type Totals = {
  subtotal: number;
  discount: number;
  bundles: number;
  shipping: number;
  total: number;
};

/**
 * Server-side pricing: prices/qtys come from the DB (looked up by productId),
 * never trusted from the client. Reproduces the storefront's original combo
 * logic but fixes the bug where the discount used the last-iterated item's
 * price instead of grouping by each unit's own price — units are expanded,
 * sorted cheapest-first, and the bundle price is applied to the cheapest
 * complete group so a mixed-price cart still discounts correctly.
 */
export function computeTotals(lines: ResolvedCartLine[], bundleRules: BundleRule[], shippingCost: number): Totals {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

  let discount = 0;
  let totalBundles = 0;

  for (const rule of bundleRules) {
    if (!rule.bundleQty || !rule.bundlePrice) continue;

    const units: number[] = [];
    for (const line of lines) {
      if (line.collectionId !== rule.collectionId) continue;
      for (let i = 0; i < line.qty; i++) units.push(line.price);
    }
    if (!units.length) continue;

    units.sort((a, b) => a - b);
    const bundles = Math.floor(units.length / rule.bundleQty);
    if (bundles <= 0) continue;

    const bundledUnits = units.slice(0, bundles * rule.bundleQty);
    const bundledSum = bundledUnits.reduce((s, p) => s + p, 0);
    discount += bundledSum - bundles * rule.bundlePrice;
    totalBundles += bundles;
  }

  const shipping = lines.length ? shippingCost : 0;
  const total = subtotal - discount + shipping;

  return { subtotal, discount, bundles: totalBundles, shipping, total };
}

export function formatCOP(n: number): string {
  try {
    return '$' + n.toLocaleString('es-CO');
  } catch {
    return '$' + n;
  }
}
