type ProductCardData = {
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

const SWATCH_BY_COLOR: Record<string, string> = {
  negro: 'swatch--black',
  blanco: 'swatch--white',
  merlot: 'swatch--merlot',
  gris: 'swatch--gray'
};

export default function ProductCard({ product }: { product: ProductCardData }) {
  const swatchClass = SWATCH_BY_COLOR[product.color.trim().toLowerCase()] ?? '';
  const isLight = product.color.trim().toLowerCase() === 'blanco';
  const sizes = product.sizes.length ? product.sizes : ['S', 'M', 'L', 'XL'];
  const defaultSize = sizes.includes('M') ? 'M' : sizes[0];

  const cardClass = ['product-card', isLight ? 'product-card--light' : '', product.isSoldout ? 'product-card--soldout' : '', 'reveal']
    .filter(Boolean)
    .join(' ');
  const mediaClass = ['product-card__media', product.mediaVariant === 'contain' ? 'product-card__media--contain' : ''].filter(Boolean).join(' ');

  return (
    <article className={cardClass} data-name={product.name} id={`card-${product.id}`}>
      {product.isSoldout && <span className="product-card__flag">Agotado</span>}
      <div className={mediaClass}>
        {product.mainImage && (
          <img
            src={product.mainImage.url}
            alt={product.mainImage.altText}
            width={product.mainImage.width ?? undefined}
            height={product.mainImage.height ?? undefined}
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
      <div className="product-card__body">
        <div className="product-card__row">
          <h3><a href={`/producto/${product.slug}`}>{product.name}</a></h3>
          {swatchClass ? (
            <span className={`swatch ${swatchClass}`} aria-hidden="true"></span>
          ) : (
            <span className="swatch" aria-hidden="true" style={{ background: '#6b6b6b' }}></span>
          )}
        </div>
        <p className="product-card__price">${product.price.toLocaleString('es-CO')}</p>
        <div className="size-picker" role="group" aria-label={`Talla — ${product.name}`} aria-disabled={product.isSoldout}>
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              className={`size-pill${size === defaultSize && !product.isSoldout ? ' is-active' : ''}`}
              disabled={product.isSoldout}
            >
              {size}
            </button>
          ))}
        </div>
        {product.isSoldout ? (
          <button type="button" className="btn btn--buy" disabled>
            <span>Agotado</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--buy"
            data-add-cart=""
            data-id={product.id}
            data-name={product.name}
            data-price={product.price}
            data-img={product.mainImage?.url ?? ''}
            data-collection={product.collectionId}
          >
            <span>Comprar ahora</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}
      </div>
    </article>
  );
}
