import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts } from '@/lib/store-data';
import ProductGallery from '@/components/store/ProductGallery';
import ProductCard from '@/components/store/ProductCard';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};
  return {
    title: `${product.name} | V&B Performance Apparel`,
    description: product.shortDescription || product.description || undefined
  };
}

const SWATCH_BY_COLOR: Record<string, string> = {
  negro: 'swatch--black',
  blanco: 'swatch--white',
  merlot: 'swatch--merlot',
  gris: 'swatch--gray'
};

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  if (!product || product.status !== 'active') notFound();

  const sizes = (product.sizes as string[]).length ? (product.sizes as string[]) : ['S', 'M', 'L', 'XL'];
  const defaultSize = sizes.includes('M') ? 'M' : sizes[0];
  const gallery = product.images.length ? product.images.map((i) => i.media) : product.mainImage ? [product.mainImage] : [];
  const swatchClass = SWATCH_BY_COLOR[product.color.trim().toLowerCase()] ?? '';
  const shopAnchor = product.collection.slug === 'licra' ? '/#productos' : '/#tank';

  const related = await getRelatedProducts(product.id, product.collectionId, 4);

  return (
    <>
      <nav className="product-detail__breadcrumb" aria-label="Ruta de navegación">
        <a href="/">Inicio</a>
        <span>/</span>
        <a href={shopAnchor}>{product.collection.name}</a>
        <span>/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <section className="product-detail">
        <ProductGallery images={gallery} />

        <div className="product-detail__info">
          <p className="eyebrow">{product.collection.name}</p>
          <div className="product-detail__row">
            <h1 className="product-detail__title">{product.name}</h1>
            {swatchClass && <span className={`swatch ${swatchClass}`} aria-hidden="true"></span>}
          </div>
          <p className="product-detail__price">
            ${product.price.toLocaleString('es-CO')}
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="product-detail__compare">${product.compareAtPrice.toLocaleString('es-CO')}</span>
            )}
          </p>

          {(product.description || product.shortDescription) && (
            <p className="product-detail__desc">{product.description || product.shortDescription}</p>
          )}

          {product.isSoldout ? (
            <>
              <div className="size-picker" role="group" aria-label={`Talla — ${product.name}`} aria-disabled="true">
                {sizes.map((size) => (
                  <button type="button" className="size-pill" disabled key={size}>{size}</button>
                ))}
              </div>
              <button type="button" className="btn btn--buy" disabled>
                <span>Agotado</span>
              </button>
            </>
          ) : (
            <>
              <div className="size-picker" role="group" aria-label={`Talla — ${product.name}`}>
                {sizes.map((size) => (
                  <button type="button" className={`size-pill${size === defaultSize ? ' is-active' : ''}`} key={size}>{size}</button>
                ))}
              </div>
              <button
                type="button"
                className="btn btn--buy"
                data-add-cart=""
                data-id={product.id}
                data-name={product.name}
                data-price={product.price}
                data-img={gallery[0]?.url ?? ''}
                data-collection={product.collectionId}
              >
                <span>Comprar ahora</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </>
          )}

          <a href="/#productos" className="btn btn--ghost product-detail__back">Volver a la tienda</a>

          <div className="product-detail__tags">
            <span className="product-detail__tags-label">Buscar más</span>
            <a className="product-detail__tag" href={shopAnchor}>{product.collection.name}</a>
            {product.isNew && <a className="product-detail__tag" href={shopAnchor}>Nuevo</a>}
            {product.isFeatured && <a className="product-detail__tag" href={shopAnchor}>Destacado</a>}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="product-detail__related">
          <p className="eyebrow reveal">TE PUEDE INTERESAR</p>
          <h2 className="section-title reveal">
            <span className="line">TAMBIÉN TE PUEDE</span>
            <span className="line accent">GUSTAR.</span>
          </h2>
          <div className="shop__grid">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  slug: p.slug,
                  name: p.name,
                  price: p.price,
                  color: p.color,
                  isSoldout: p.isSoldout,
                  mediaVariant: p.mediaVariant,
                  collectionId: p.collectionId,
                  sizes: p.sizes as string[],
                  mainImage: p.mainImage
                }}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
