'use client';

import { useEffect } from 'react';
import { computeTotals, formatCOP, type BundleRule } from '@/lib/pricing';
import { getCartSummary } from '@/app/actions/checkout';

export type SearchableProduct = { id: string; slug: string; name: string };

type Props = {
  bundleRules: BundleRule[];
  shippingCost: number;
  searchProducts: SearchableProduct[];
};

type CartItem = {
  key: string;
  id: string;
  name: string;
  price: number;
  img: string;
  size: string;
  qty: number;
  collectionId: string;
};

/**
 * Ported 1:1 from the original vanilla js/main.js so the exact interactions/
 * animation timings survive the move to Next.js. Pricing shown live in the
 * drawer uses the same data the server just rendered (instant, no round
 * trip); the WhatsApp checkout re-verifies against the database via the
 * getCartSummary Server Action right before opening the chat, so a tampered
 * client price can never reach the actual order message.
 */
export default function SiteScript({ bundleRules, shippingCost, searchProducts }: Props) {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------- LOADER ---------------- */
    // Navegación interna (html.is-warm): la cortina no se muestra, así que
    // tampoco arrancamos el contador ni los temporizadores de ocultado.
    const warmNav = document.documentElement.classList.contains('is-warm');
    if (warmNav) document.getElementById('loader')?.remove();
    const loader = warmNav ? null : document.getElementById('loader');
    const loaderFill = document.getElementById('loaderFill');
    const loaderDigits = document.getElementById('loaderDigits');
    let loaderProgress = 0;
    let loaderDone = false;

    function setLoaderProgress(v: number) {
      loaderProgress = v;
      if (loaderFill) loaderFill.style.transform = 'scaleX(' + v / 100 + ')';
      if (loaderDigits) loaderDigits.textContent = (v < 10 ? '0' : '') + Math.round(v);
      if (loader) loader.setAttribute('aria-valuenow', String(Math.round(v)));
    }
    function hideLoader() {
      if (!loader || loaderDone) return;
      loaderDone = true;
      setLoaderProgress(100);
      window.setTimeout(() => {
        loader.classList.add('is-hidden');
        window.setTimeout(() => {
          if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
        }, reducedMotion ? 50 : 900);
      }, reducedMotion ? 300 : 260);
    }

    let loaderTick: number | undefined;
    if (loader && !reducedMotion) {
      loaderTick = window.setInterval(() => {
        if (loaderDone) {
          window.clearInterval(loaderTick);
          return;
        }
        setLoaderProgress(Math.min(loaderProgress + (100 - loaderProgress) * 0.16 + 1, 92));
      }, 90);
    } else if (loader) {
      setLoaderProgress(100);
    }

    const loaderTimer = window.setTimeout(hideLoader, reducedMotion ? 550 : 1600);
    const onLoad = () => {
      window.clearTimeout(loaderTimer);
      window.setTimeout(hideLoader, reducedMotion ? 450 : 320);
    };
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad);

    /* ---------------- BLOQUEO DE SCROLL ----------------
       document.body.style.overflow = 'hidden' NO bloqueaba nada: el overflow
       del <body> solo se propaga al viewport si el del elemento raiz es
       'visible', y app/globals.css tiene "html, body{ overflow-x: clip }".
       Con el carrito o el menu abierto la pagina seguia scrolleando detras.
       Se bloquea en <html> (lo que Chrome/Firefox respetan) y ademas se fija el
       body con position:fixed, que es lo unico fiable en iOS Safari; al soltar
       se devuelve la posicion de scroll exacta. */
    const scrollLocks = new Set<'cart' | 'nav'>();
    let lockedScrollY = 0;
    function lockScroll(owner: 'cart' | 'nav', on: boolean) {
      const root = document.documentElement;
      const wasLocked = scrollLocks.size > 0;
      if (on) scrollLocks.add(owner);
      else scrollLocks.delete(owner);
      const isLocked = scrollLocks.size > 0;
      if (isLocked === wasLocked) return;

      if (isLocked) {
        lockedScrollY = window.scrollY;
        root.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = -lockedScrollY + 'px';
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
      } else {
        root.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, lockedScrollY);
      }
    }

    /* ---------------- HEADER SCROLL ---------------- */
    const header = document.getElementById('header');
    function onScroll() {
      if (!header) return;
      if (window.scrollY > 40) header.classList.add('header--scrolled');
      else header.classList.remove('header--scrolled');
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------------- MOBILE NAV ---------------- */
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');
    const navOverlay = document.getElementById('navOverlay');

    function openNav() {
      nav?.classList.add('is-open');
      navOverlay?.classList.add('is-open');
      burger?.setAttribute('aria-expanded', 'true');
      lockScroll('nav', true);
    }
    function closeNav() {
      nav?.classList.remove('is-open');
      navOverlay?.classList.remove('is-open');
      burger?.setAttribute('aria-expanded', 'false');
      lockScroll('nav', false);
    }
    const onBurgerClick = () => {
      burger?.getAttribute('aria-expanded') === 'true' ? closeNav() : openNav();
    };
    burger?.addEventListener('click', onBurgerClick);
    navOverlay?.addEventListener('click', closeNav);
    const navLinks = nav ? Array.from(nav.querySelectorAll<HTMLAnchorElement>('.nav__link')) : [];
    navLinks.forEach((link) => link.addEventListener('click', closeNav));

    const onKeydownNav = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeNav();
    };
    document.addEventListener('keydown', onKeydownNav);

    /* ---------------- SEARCH ---------------- */
    const searchToggle = document.getElementById('searchToggle');
    const searchPanel = document.getElementById('searchPanel');
    const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
    const searchClose = document.getElementById('searchClose');
    const searchHint = document.getElementById('searchHint');

    function openSearch() {
      searchPanel?.classList.add('is-open');
      searchToggle?.setAttribute('aria-expanded', 'true');
      window.setTimeout(() => searchInput?.focus(), 200);
    }
    function closeSearch() {
      searchPanel?.classList.remove('is-open');
      searchToggle?.setAttribute('aria-expanded', 'false');
      if (searchInput) searchInput.value = '';
      if (searchHint) searchHint.textContent = '';
    }
    const onSearchToggle = () => {
      searchPanel?.classList.contains('is-open') ? closeSearch() : openSearch();
    };
    searchToggle?.addEventListener('click', onSearchToggle);
    searchClose?.addEventListener('click', closeSearch);

    function findProduct(q: string) {
      const query = q.trim().toUpperCase();
      if (!query) return undefined;
      return searchProducts.find((p) => p.name.toUpperCase().indexOf(query) !== -1);
    }
    const onSearchInput = () => {
      if (!searchInput || !searchHint) return;
      const q = searchInput.value;
      if (!q.trim()) {
        searchHint.textContent = '';
        return;
      }
      const match = findProduct(q);
      searchHint.textContent = match ? 'Pulsa Enter para ver ' + match.name : 'Sin resultados. Prueba "TANK" o "LICRA".';
    };
    const onSearchKeydown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !searchInput) return;
      const match = findProduct(searchInput.value);
      if (!match) return;
      const el = document.getElementById('card-' + match.id);
      if (el) {
        closeSearch();
        el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        el.classList.add('is-highlight');
        window.setTimeout(() => el.classList.remove('is-highlight'), 1400);
        return;
      }
      // La tarjeta no esta en esta pagina (p. ej. estamos en /producto/<slug>, o la
      // seccion de esa coleccion esta apagada): se va a la ficha, que siempre existe.
      closeSearch();
      window.location.href = '/producto/' + match.slug;
    };
    searchInput?.addEventListener('input', onSearchInput);
    searchInput?.addEventListener('keydown', onSearchKeydown);

    /* ---------------- SIZE PICKER ---------------- */
    const sizeGroups = Array.from(document.querySelectorAll<HTMLElement>('.size-picker'));
    const onSizeGroupClick = (group: HTMLElement) => (e: Event) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('.size-pill') as HTMLElement | null;
      if (!btn || btn.hasAttribute('disabled')) return;
      group.querySelectorAll('.size-pill').forEach((p) => p.classList.remove('is-active'));
      btn.classList.add('is-active');
    };
    const sizeGroupHandlers = sizeGroups.map((group) => {
      const handler = onSizeGroupClick(group);
      group.addEventListener('click', handler);
      return { group, handler };
    });

    /* ---------------- CART ---------------- */
    const CART_KEY = 'vb_cart';
    const cartState: { items: CartItem[]; hydrated: boolean } = { items: [], hydrated: false };

    function loadCart() {
      try {
        const raw = window.localStorage.getItem(CART_KEY);
        cartState.items = raw ? JSON.parse(raw) : [];
      } catch {
        cartState.items = [];
      }
      cartState.hydrated = true;
    }
    function saveCart() {
      if (!cartState.hydrated) return;
      try {
        window.localStorage.setItem(CART_KEY, JSON.stringify(cartState.items));
      } catch {
        /* ignore */
      }
    }

    const cartToggle = document.getElementById('cartToggle');
    const cartEl = document.getElementById('cart');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartClose = document.getElementById('cartClose');
    const cartItemsEl = document.getElementById('cartItems');
    const cartSubtotalEl = document.getElementById('cartSubtotal');
    const cartDiscountRowEl = document.getElementById('cartDiscountRow');
    const cartDiscountEl = document.getElementById('cartDiscount');
    const cartShippingRowEl = document.getElementById('cartShippingRow');
    const cartShippingEl = document.getElementById('cartShipping');
    const cartTotalEl = document.getElementById('cartTotal');
    const cartCountEl = document.getElementById('cartCount');
    const cartCheckoutBtn = document.getElementById('cartCheckout') as HTMLButtonElement | null;

    function openCart() {
      cartEl?.classList.add('is-open');
      cartOverlay?.classList.add('is-open');
      cartToggle?.setAttribute('aria-expanded', 'true');
      lockScroll('cart', true);
    }
    function closeCart() {
      cartEl?.classList.remove('is-open');
      cartOverlay?.classList.remove('is-open');
      cartToggle?.setAttribute('aria-expanded', 'false');
      lockScroll('cart', false);
    }
    const onCartToggleClick = () => {
      cartEl?.classList.contains('is-open') ? closeCart() : openCart();
    };
    cartToggle?.addEventListener('click', onCartToggleClick);
    cartOverlay?.addEventListener('click', closeCart);
    cartClose?.addEventListener('click', closeCart);
    const onKeydownCart = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    document.addEventListener('keydown', onKeydownCart);

    function renderCart() {
      if (!cartItemsEl) return;
      cartItemsEl.innerHTML = '';

      if (!cartState.items.length) {
        const empty = document.createElement('p');
        empty.className = 'cart__empty';
        empty.innerHTML = 'Tu carrito está vacío.<br>Elige tu color y empieza a rendir.';
        cartItemsEl.appendChild(empty);
      } else {
        cartState.items.forEach((item) => {
          const row = document.createElement('div');
          row.className = 'cart-item';
          row.innerHTML =
            '<img src="' + item.img + '" alt="" width="62" height="78" loading="lazy">' +
            '<div class="cart-item__info">' +
            '<h4>' + item.name + '</h4>' +
            '<span>Talla ' + item.size + '</span>' +
            '<div class="cart-item__qty">' +
            '<button type="button" data-qty="-1" aria-label="Restar unidad">&minus;</button>' +
            '<span>' + item.qty + '</span>' +
            '<button type="button" data-qty="1" aria-label="Sumar unidad">+</button>' +
            '</div>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px;">' +
            '<span class="cart-item__price">' + formatCOP(item.price * item.qty) + '</span>' +
            '<button type="button" class="cart-item__remove">Quitar</button>' +
            '</div>';

          row.querySelectorAll('[data-qty]').forEach((btn) => {
            btn.addEventListener('click', () => {
              changeQty(item.key, parseInt(btn.getAttribute('data-qty') || '0', 10));
            });
          });
          row.querySelector('.cart-item__remove')?.addEventListener('click', () => removeItem(item.key));

          cartItemsEl.appendChild(row);
        });
      }

      const resolvedLines = cartState.items.map((i) => ({
        productId: i.id,
        name: i.name,
        size: i.size,
        qty: i.qty,
        price: i.price,
        img: i.img,
        collectionId: i.collectionId
      }));
      const t = computeTotals(resolvedLines, bundleRules, shippingCost);
      const count = cartState.items.reduce((sum, i) => sum + i.qty, 0);

      if (cartSubtotalEl) cartSubtotalEl.textContent = formatCOP(t.subtotal);
      if (cartDiscountRowEl && cartDiscountEl) {
        if (t.discount > 0) {
          (cartDiscountRowEl as HTMLElement).hidden = false;
          cartDiscountEl.textContent = '-' + formatCOP(t.discount);
        } else {
          (cartDiscountRowEl as HTMLElement).hidden = true;
        }
      }
      if (cartShippingRowEl && cartShippingEl) {
        (cartShippingRowEl as HTMLElement).hidden = !cartState.items.length;
        cartShippingEl.textContent = formatCOP(t.shipping);
      }
      if (cartTotalEl) cartTotalEl.textContent = formatCOP(t.total);
      if (cartCountEl) {
        if (count > 0) {
          (cartCountEl as HTMLElement).hidden = false;
          cartCountEl.textContent = String(count);
        } else {
          (cartCountEl as HTMLElement).hidden = true;
        }
      }

      if (cartCheckoutBtn) cartCheckoutBtn.disabled = !cartState.items.length;

      saveCart();
    }

    function addToCart(data: { id: string; name: string; price: number; img: string; size: string; collectionId: string }) {
      const key = data.id + '-' + data.size;
      const existing = cartState.items.find((i) => i.key === key);
      if (existing) existing.qty += 1;
      else cartState.items.push({ key, id: data.id, name: data.name, price: data.price, img: data.img, size: data.size, qty: 1, collectionId: data.collectionId });
      renderCart();
    }
    function changeQty(key: string, delta: number) {
      const item = cartState.items.find((i) => i.key === key);
      if (!item) return;
      item.qty += delta;
      if (item.qty <= 0) cartState.items = cartState.items.filter((i) => i.key !== key);
      renderCart();
    }
    function removeItem(key: string) {
      cartState.items = cartState.items.filter((i) => i.key !== key);
      renderCart();
    }

    const addButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-add-cart]'));
    const onAddClick = (btn: HTMLButtonElement) => () => {
      // .product-card en la home; .product-detail__info en la ficha del producto
      // (sin este segundo selector la ficha siempre mandaba talla "M").
      const scope = btn.closest('.product-card, .product-detail__info');
      const activeSize = scope?.querySelector('.size-pill.is-active');
      addToCart({
        id: btn.getAttribute('data-id') || '',
        name: btn.getAttribute('data-name') || '',
        price: parseInt(btn.getAttribute('data-price') || '0', 10),
        img: btn.getAttribute('data-img') || '',
        size: activeSize ? (activeSize.textContent || '').trim() : 'M',
        collectionId: btn.getAttribute('data-collection') || ''
      });

      const label = btn.querySelector('span');
      const original = label?.textContent ?? '';
      btn.classList.add('is-added');
      if (label) label.textContent = 'Añadido ✓';
      window.setTimeout(() => {
        btn.classList.remove('is-added');
        if (label) label.textContent = original;
      }, 1300);

      openCart();
    };
    const addHandlers = addButtons.map((btn) => {
      const handler = onAddClick(btn);
      btn.addEventListener('click', handler);
      return { btn, handler };
    });

    /* ---------------- CHECKOUT WHATSAPP ----------------
       El precio SIEMPRE se re-verifica en el servidor con getCartSummary: el
       carrito del cliente solo aporta productId/size/qty, nunca el importe.

       Antes esto usaba window.open('', '_blank', 'noopener'), que por
       especificacion HTML devuelve NULL cuando la feature 'noopener' esta
       presente (el navegador descarta a proposito la referencia). Con win
       siempre null, la whatsappUrl valida nunca se usaba y salia el aviso de
       "configura el numero" aunque el numero si estuviera puesto: el boton
       "Finalizar por WhatsApp" no llevaba a ningun lado.

       Ahora la pestaña se abre dentro del gesto sincronico del click (unico
       momento en que Android Chrome / iOS Safari no lo tratan como popup) SIN
       la feature noopener, y se anula opener a mano: misma garantia de
       seguridad conservando la referencia. Si aun asi se bloquea, se navega en
       la MISMA pestaña; wa.me es universal link, abre la app de WhatsApp y la
       tienda queda en el historial. */
    let checkoutBusy = false;
    const onCheckoutClick = () => {
      if (!cartState.items.length || checkoutBusy) return;
      checkoutBusy = true;

      // Feedback visible: el server action tarda y parecia que el boton no hacia nada.
      const checkoutLabel = cartCheckoutBtn?.querySelector('span') ?? null;
      const checkoutLabelText = checkoutLabel?.textContent ?? '';
      if (cartCheckoutBtn) {
        cartCheckoutBtn.disabled = true;
        cartCheckoutBtn.setAttribute('aria-busy', 'true');
        cartCheckoutBtn.classList.add('is-busy');
      }
      if (checkoutLabel) checkoutLabel.textContent = 'Preparando pedido…';
      const restoreCheckoutBtn = () => {
        checkoutBusy = false;
        if (cartCheckoutBtn) {
          cartCheckoutBtn.disabled = false;
          cartCheckoutBtn.removeAttribute('aria-busy');
          cartCheckoutBtn.classList.remove('is-busy');
        }
        if (checkoutLabel) checkoutLabel.textContent = checkoutLabelText;
      };

      let win: Window | null = null;
      try {
        win = window.open('', '_blank');
        // Equivalente a rel="noopener": about:blank todavia es same-origin aqui,
        // asi que se corta el vinculo antes de navegar a wa.me.
        if (win) win.opener = null;
      } catch {
        win = null;
      }

      const openWhatsapp = (url: string) => {
        if (win && !win.closed) {
          try {
            win.location.href = url;
            return;
          } catch {
            /* la pestaña murio entre medias: cae al fallback */
          }
        }
        // Popup bloqueado, cerrado o inutilizable: misma pestaña en vez de nada.
        window.location.assign(url);
      };

      getCartSummary(cartState.items.map((i) => ({ productId: i.id, size: i.size, qty: i.qty })))
        .then((summary) => {
          if (summary.whatsappUrl) {
            openWhatsapp(summary.whatsappUrl);
            restoreCheckoutBtn();
            return;
          }
          if (win && !win.closed) win.close();
          // whatsappUrl es null por DOS motivos (checkout.ts): falta el numero o
          // no quedo ninguna linea valida. No culpar al numero si lo que pasa es
          // que el producto se desactivo o se agoto.
          window.alert(
            summary.lines.length
              ? 'Tu pedido está listo, pero falta configurar el número de WhatsApp de la tienda. Inténtalo de nuevo en unos minutos.'
              : 'Los productos de tu carrito ya no están disponibles. Actualiza la página y vuelve a elegir.'
          );
          restoreCheckoutBtn();
        })
        .catch(() => {
          if (win && !win.closed) win.close();
          window.alert('No se pudo preparar el pedido. Revisa tu conexión e inténtalo de nuevo.');
          restoreCheckoutBtn();
        });
    };
    cartCheckoutBtn?.addEventListener('click', onCheckoutClick);

    loadCart();
    renderCart();

    /* ---------------- SCROLL REVEAL ---------------- */
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    let io: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window && !reducedMotion) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.01, rootMargin: '0px 0px -12% 0px' }
      );
      revealEls.forEach((el) => io?.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    }

    return () => {
      window.removeEventListener('load', onLoad);
      window.removeEventListener('scroll', onScroll);
      burger?.removeEventListener('click', onBurgerClick);
      navOverlay?.removeEventListener('click', closeNav);
      navLinks.forEach((link) => link.removeEventListener('click', closeNav));
      document.removeEventListener('keydown', onKeydownNav);
      document.removeEventListener('keydown', onKeydownCart);
      searchToggle?.removeEventListener('click', onSearchToggle);
      searchClose?.removeEventListener('click', closeSearch);
      searchInput?.removeEventListener('input', onSearchInput);
      searchInput?.removeEventListener('keydown', onSearchKeydown);
      sizeGroupHandlers.forEach(({ group, handler }) => group.removeEventListener('click', handler));
      cartToggle?.removeEventListener('click', onCartToggleClick);
      cartOverlay?.removeEventListener('click', closeCart);
      cartClose?.removeEventListener('click', closeCart);
      addHandlers.forEach(({ btn, handler }) => btn.removeEventListener('click', handler));
      cartCheckoutBtn?.removeEventListener('click', onCheckoutClick);
      io?.disconnect();
      window.clearTimeout(loaderTimer);
      if (loaderTick) window.clearInterval(loaderTick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
