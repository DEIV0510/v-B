import { splitLines } from '@/lib/text';
import ProductCard from '@/components/store/ProductCard';
import type { SectionData } from './types';

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  color: string;
  isSoldout: boolean;
  mediaVariant: 'cover' | 'contain';
  collectionId: string;
  sizes: string[];
  mainImage: { url: string; altText: string; width: number | null; height: number | null } | null;
};

type Props = {
  section: SectionData;
  variant: 'licra' | 'tank';
  sectionId: string;
  products: Product[];
  bundleQty?: number | null;
  bundlePrice?: number | null;
};

export default function ShopSection({ section, variant, sectionId, products, bundleQty, bundlePrice }: Props) {
  const lines = splitLines(section.title);
  const lastLine = lines[lines.length - 1] ?? '';
  const leadingLines = lines.slice(0, -1);
  const isLicra = variant === 'licra';
  const referencePrice = products.length ? Math.min(...products.map((p) => p.price)) : 0;
  const showPromo = isLicra && !!bundleQty && !!bundlePrice && referencePrice > 0;
  const savings = showPromo ? bundleQty! * referencePrice - bundlePrice! : 0;

  return (
    <section className={`shop${isLicra ? ' shop--licra' : ''}`} id={sectionId}>
      <div className="shop__head">
        <p className="eyebrow reveal">{section.subtitle}</p>
        <h2 className="section-title reveal">
          {leadingLines.map((line, idx) => (
            <span className="line" key={idx}>{line}</span>
          ))}
          <span className="line accent">{lastLine}</span>
        </h2>
        {section.body && <p className="shop__lede reveal">{section.body}</p>}

        {showPromo && (
          <div className="promo-banner reveal">
            <span className="promo-banner__tag">Promo</span>
            <p className="promo-banner__text">
              1 unidad <strong>${referencePrice.toLocaleString('es-CO')}</strong>
              &nbsp;·&nbsp;
              {bundleQty} unidades <strong>${bundlePrice!.toLocaleString('es-CO')}</strong>
            </p>
            <span className="promo-banner__save">Ahorras ${savings.toLocaleString('es-CO')}</span>
          </div>
        )}
      </div>

      {isLicra && (
        <ul className="features features--compact reveal">
          <li>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2Z" strokeLinejoin="round" /></svg>
            <span>Tela premium</span>
          </li>
          <li>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 12h16" strokeLinecap="round" /><path d="M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span>Alta elasticidad</span>
          </li>
          <li>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 3c3.5 4.2 6 7.8 6 11a6 6 0 1 1-12 0c0-3.2 2.5-6.8 6-11Z" strokeLinejoin="round" /></svg>
            <span>Secado rápido</span>
          </li>
        </ul>
      )}

      <div className="shop__grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
