import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/store-data';
import TiltImage from '@/components/store/TiltImage';

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

  return (
    <section className="product-detail">
      <div className="product-detail__gallery corner-frame">
        {gallery[0] && (
          <TiltImage
            className="product-detail__main"
            src={gallery[0].url}
            alt={gallery[0].altText}
            width={gallery[0].width ?? undefined}
            height={gallery[0].height ?? undefined}
          />
        )}
        {gallery.length > 1 && (
          <div className="product-detail__thumbs">
            {gallery.slice(1).map((img, idx) => (
              <img key={idx} src={img.url} alt={img.altText} width={img.width ?? undefined} height={img.height ?? undefined} loading="lazy" decoding="async" />
            ))}
          </div>
        )}
      </div>

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
      </div>
    </section>
  );
}
