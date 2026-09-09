'use server';

import { db } from '@/lib/db';
import { computeTotals, formatCOP, type ResolvedCartLine, type BundleRule } from '@/lib/pricing';

export type CartLineInput = { productId: string; size: string; qty: number };

export async function getCartSummary(lines: CartLineInput[]) {
  const safeLines = lines.filter((l) => l.qty > 0).slice(0, 50);
  if (!safeLines.length) {
    return {
      lines: [] as ResolvedCartLine[],
      totals: computeTotals([], [], (await getSettings()).shippingCost),
      whatsappUrl: null as string | null
    };
  }

  const products = await db.product.findMany({
    where: { id: { in: safeLines.map((l) => l.productId) }, status: 'active' },
    include: { mainImage: true, collection: true }
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const resolved: ResolvedCartLine[] = [];
  for (const line of safeLines) {
    const product = byId.get(line.productId);
    if (!product || product.isSoldout) continue;
    resolved.push({
      productId: product.id,
      name: product.name,
      size: line.size,
      qty: Math.min(line.qty, 20),
      price: product.price,
      img: product.mainImage?.url ?? '',
      collectionId: product.collectionId
    });
  }

  const bundleRules: BundleRule[] = products
    .map((p) => p.collection)
    .filter((c, idx, arr) => arr.findIndex((x) => x.id === c.id) === idx)
    .filter((c) => c.bundleQty && c.bundlePrice)
    .map((c) => ({ collectionId: c.id, bundleQty: c.bundleQty as number, bundlePrice: c.bundlePrice as number }));

  const settings = await getSettings();
  const totals = computeTotals(resolved, bundleRules, settings.shippingCost);

  let whatsappUrl: string | null = null;
  if (settings.whatsappNumber && resolved.length) {
    const orderLines = resolved.map(
      (l) => `• ${l.name} (talla ${l.size}) x${l.qty} — ${formatCOP(l.price * l.qty)}`
    );
    const summary = ['', `Subtotal: ${formatCOP(totals.subtotal)}`];
    if (totals.discount > 0) summary.push(`Descuento combo (${totals.bundles}x): -${formatCOP(totals.discount)}`);
    summary.push(`Envío: ${formatCOP(totals.shipping)}`);
    summary.push(`Total: ${formatCOP(totals.total)}`);

    const text =
      `${settings.whatsappMessageTemplate}\n\n` +
      orderLines.join('\n') +
      '\n' +
      summary.join('\n');

    whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(text)}`;
  }

  return { lines: resolved, totals, whatsappUrl };
}

async function getSettings() {
  const settings = await db.siteSettings.findUnique({ where: { id: 'singleton' } });
  return (
    settings ?? {
      shippingCost: 14900,
      whatsappNumber: '',
      whatsappMessageTemplate: 'Hola V&B, quiero hacer este pedido:'
    }
  );
}
