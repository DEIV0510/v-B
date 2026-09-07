'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct, updateProduct, type ProductInput } from '@/app/actions/products';
import MediaPicker from '@/components/admin/MediaPicker';

type Collection = { id: string; name: string };

type Props = {
  mode: 'create' | 'edit';
  productId?: string;
  collections: Collection[];
  initial?: Partial<ProductInput>;
};

const ALL_SIZES = ['S', 'M', 'L', 'XL'];
// Combining diacritical marks (U+0300-U+036F), stripped after NFD normalization.
const DIACRITICS_RE = /[̀-ͯ]/g;

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ProductForm({ mode, productId, collections, initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [compareAtPrice, setCompareAtPrice] = useState<number | ''>(initial?.compareAtPrice ?? '');
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [sku, setSku] = useState(initial?.sku ?? '');
  const [color, setColor] = useState(initial?.color ?? '');
  const [sizes, setSizes] = useState<string[]>(initial?.sizes ?? ALL_SIZES);
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [collectionId, setCollectionId] = useState(initial?.collectionId ?? collections[0]?.id ?? '');
  const [mediaVariant, setMediaVariant] = useState<'cover' | 'contain'>(initial?.mediaVariant ?? 'cover');
  const [mainImageId, setMainImageId] = useState<string | null>(initial?.mainImageId ?? null);
  const [galleryMediaIds, setGalleryMediaIds] = useState<string[]>(initial?.galleryMediaIds ?? []);
  const [status, setStatus] = useState<'active' | 'inactive'>(initial?.status ?? 'active');
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [isNew, setIsNew] = useState(initial?.isNew ?? false);
  const [isSoldout, setIsSoldout] = useState(initial?.isSoldout ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSize(size: string) {
    setSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const input: ProductInput = {
      slug: slug || slugify(name),
      name,
      price: Number(price),
      compareAtPrice: compareAtPrice === '' ? null : Number(compareAtPrice),
      shortDescription,
      description,
      sku,
      color,
      sizes,
      stock: Number(stock),
      collectionId,
      mediaVariant,
      mainImageId,
      galleryMediaIds,
      status,
      isFeatured,
      isNew,
      isSoldout
    };

    try {
      if (mode === 'create') {
        await createProduct(input);
      } else if (productId) {
        await updateProduct(productId, input);
      }
      router.push('/admin/productos');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto');
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <div className="admin-field">
        <label htmlFor="name">Nombre</label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </div>

      <div className="admin-field">
        <label htmlFor="slug">Slug (URL)</label>
        <input id="slug" type="text" required value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} />
        <small>Se usa en /producto/{slug || '...'}</small>
      </div>

      <div className="admin-grid-2">
        <div className="admin-field">
          <label htmlFor="price">Precio (COP)</label>
          <input id="price" type="number" required min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </div>
        <div className="admin-field">
          <label htmlFor="compareAtPrice">Precio antes de descuento (opcional)</label>
          <input id="compareAtPrice" type="number" min={0} value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
      </div>

      <div className="admin-field">
        <label htmlFor="collection">Colección</label>
        <select id="collection" value={collectionId} onChange={(e) => setCollectionId(e.target.value)} required>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="admin-grid-2">
        <div className="admin-field">
          <label htmlFor="color">Color</label>
          <input id="color" type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Negro, Blanco, Merlot, Gris…" />
        </div>
        <div className="admin-field">
          <label htmlFor="sku">SKU (opcional)</label>
          <input id="sku" type="text" value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>
      </div>

      <div className="admin-field">
        <label>Tallas disponibles</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {ALL_SIZES.map((size) => (
            <label key={size} className="admin-field--row" style={{ fontSize: 13 }}>
              <input type="checkbox" checked={sizes.includes(size)} onChange={() => toggleSize(size)} /> {size}
            </label>
          ))}
        </div>
      </div>

      <div className="admin-field">
        <label htmlFor="stock">Stock</label>
        <input id="stock" type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} />
      </div>

      <div className="admin-field">
        <label htmlFor="shortDescription">Descripción corta</label>
        <input id="shortDescription" type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
      </div>
      <div className="admin-field">
        <label htmlFor="description">Descripción completa</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="admin-field">
        <label htmlFor="mediaVariant">Ajuste de la foto en la tarjeta</label>
        <select id="mediaVariant" value={mediaVariant} onChange={(e) => setMediaVariant(e.target.value as 'cover' | 'contain')}>
          <option value="cover">Cover (llena el marco, recorta bordes)</option>
          <option value="contain">Contain (foto completa, para prendas como la licra)</option>
        </select>
      </div>

      <MediaPicker label="Imagen principal" value={mainImageId} onChange={setMainImageId} />
      <MediaPicker label="Galería (fotos adicionales)" multiple value={galleryMediaIds} onChange={setGalleryMediaIds} />

      <fieldset className="admin-fieldset">
        <legend>Estado</legend>
        <label className="admin-field--row"><input type="checkbox" checked={status === 'active'} onChange={(e) => setStatus(e.target.checked ? 'active' : 'inactive')} /> Visible en la tienda</label>
        <label className="admin-field--row"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Destacado</label>
        <label className="admin-field--row"><input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} /> Nuevo</label>
        <label className="admin-field--row"><input type="checkbox" checked={isSoldout} onChange={(e) => setIsSoldout(e.target.checked)} /> Agotado</label>
      </fieldset>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
        </button>
        <button type="button" className="admin-btn" onClick={() => router.push('/admin/productos')}>Cancelar</button>
      </div>
    </form>
  );
}
