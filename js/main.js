(function(){
  'use strict';

  // TODO: reemplazar por el número real de WhatsApp de V&B (formato 57XXXXXXXXXX)
  var WHATSAPP_NUMBER = '';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     LOADER
  --------------------------------------------------------- */
  var loader = document.getElementById('loader');
  var loaderFill = document.getElementById('loaderFill');
  var loaderDigits = document.getElementById('loaderDigits');
  var loaderProgress = 0;
  var loaderDone = false;

  function setLoaderProgress(v){
    loaderProgress = v;
    if (loaderFill) loaderFill.style.transform = 'scaleX(' + (v / 100) + ')';
    if (loaderDigits) loaderDigits.textContent = (v < 10 ? '0' : '') + Math.round(v);
    if (loader) loader.setAttribute('aria-valuenow', String(Math.round(v)));
  }

  function hideLoader(){
    if (!loader || loaderDone) return;
    loaderDone = true;
    setLoaderProgress(100);
    window.setTimeout(function(){
      loader.classList.add('is-hidden');
      window.setTimeout(function(){ if (loader && loader.parentNode) loader.parentNode.removeChild(loader); }, 900);
    }, reducedMotion ? 0 : 260);
  }

  if (loader && !reducedMotion){
    var loaderTick = window.setInterval(function(){
      if (loaderDone){ window.clearInterval(loaderTick); return; }
      setLoaderProgress(Math.min(loaderProgress + (100 - loaderProgress) * 0.16 + 1, 92));
    }, 90);
  } else if (loader){
    setLoaderProgress(100);
  }

  var loaderTimer = window.setTimeout(hideLoader, reducedMotion ? 0 : 1600);
  window.addEventListener('load', function(){
    window.clearTimeout(loaderTimer);
    window.setTimeout(hideLoader, reducedMotion ? 0 : 320);
  });

  /* ---------------------------------------------------------
     HEADER SCROLL STATE
  --------------------------------------------------------- */
  var header = document.getElementById('header');
  function onScroll(){
    if (!header) return;
    if (window.scrollY > 40) header.classList.add('header--scrolled');
    else header.classList.remove('header--scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------------------------------------------------
     MOBILE NAV
  --------------------------------------------------------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  var navOverlay = document.getElementById('navOverlay');

  function openNav(){
    nav.classList.add('is-open');
    navOverlay.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeNav(){
    nav.classList.remove('is-open');
    navOverlay.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  if (burger){
    burger.addEventListener('click', function(){
      burger.getAttribute('aria-expanded') === 'true' ? closeNav() : openNav();
    });
  }
  if (navOverlay) navOverlay.addEventListener('click', closeNav);
  if (nav){
    nav.querySelectorAll('.nav__link').forEach(function(link){
      link.addEventListener('click', closeNav);
    });
  }
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeNav();
  });

  /* ---------------------------------------------------------
     SEARCH
  --------------------------------------------------------- */
  var searchToggle = document.getElementById('searchToggle');
  var searchPanel = document.getElementById('searchPanel');
  var searchInput = document.getElementById('searchInput');
  var searchClose = document.getElementById('searchClose');
  var searchHint = document.getElementById('searchHint');

  var PRODUCTS = [
    { id: 'tank-black', name: 'TANK BLACK', selector: '#card-black' },
    { id: 'tank-white', name: 'TANK WHITE', selector: '#card-white' },
    { id: 'tank-merlot', name: 'TANK MERLOT', selector: '#card-merlot' },
    { id: 'licra-black', name: 'LICRA BLACK', selector: '#card-licra-black' },
    { id: 'licra-white', name: 'LICRA WHITE', selector: '#card-licra-white' },
    { id: 'licra-gray', name: 'LICRA GRAY', selector: '#card-licra-gray' }
  ];

  function openSearch(){
    searchPanel.classList.add('is-open');
    searchToggle.setAttribute('aria-expanded', 'true');
    window.setTimeout(function(){ searchInput.focus(); }, 200);
  }
  function closeSearch(){
    searchPanel.classList.remove('is-open');
    searchToggle.setAttribute('aria-expanded', 'false');
    searchInput.value = '';
    searchHint.textContent = '';
  }
  if (searchToggle){
    searchToggle.addEventListener('click', function(){
      searchPanel.classList.contains('is-open') ? closeSearch() : openSearch();
    });
  }
  if (searchClose) searchClose.addEventListener('click', closeSearch);

  if (searchInput){
    searchInput.addEventListener('input', function(){
      var q = searchInput.value.trim().toUpperCase();
      if (!q){ searchHint.textContent = ''; return; }
      var match = PRODUCTS.find(function(p){ return p.name.indexOf(q) !== -1 || p.id.toUpperCase().indexOf(q) !== -1; });
      searchHint.textContent = match ? ('Pulsa Enter para ver ' + match.name) : 'Sin resultados. Prueba "TANK" o "LICRA".';
    });
    searchInput.addEventListener('keydown', function(e){
      if (e.key !== 'Enter') return;
      var q = searchInput.value.trim().toUpperCase();
      var match = PRODUCTS.find(function(p){ return p.name.indexOf(q) !== -1 || p.id.toUpperCase().indexOf(q) !== -1; });
      if (match){
        var el = document.querySelector(match.selector);
        if (el){
          closeSearch();
          el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
          el.classList.add('is-highlight');
          window.setTimeout(function(){ el.classList.remove('is-highlight'); }, 1400);
        }
      }
    });
  }

  /* ---------------------------------------------------------
     SIZE PICKER
  --------------------------------------------------------- */
  document.querySelectorAll('.size-picker').forEach(function(group){
    group.addEventListener('click', function(e){
      var btn = e.target.closest('.size-pill');
      if (!btn) return;
      group.querySelectorAll('.size-pill').forEach(function(p){ p.classList.remove('is-active'); });
      btn.classList.add('is-active');
    });
  });

  /* ---------------------------------------------------------
     CART (localStorage con guardia de hidratación)
  --------------------------------------------------------- */
  var CART_KEY = 'vb_cart';
  var cartState = { items: [], hydrated: false };

  function loadCart(){
    try {
      var raw = window.localStorage.getItem(CART_KEY);
      cartState.items = raw ? JSON.parse(raw) : [];
    } catch (e) { cartState.items = []; }
    cartState.hydrated = true;
  }
  function saveCart(){
    if (!cartState.hydrated) return;
    try { window.localStorage.setItem(CART_KEY, JSON.stringify(cartState.items)); } catch (e) {}
  }
  function formatCOP(n){
    try { return '$' + n.toLocaleString('es-CO'); }
    catch (e) { return '$' + n; }
  }

  var cartToggle = document.getElementById('cartToggle');
  var cart = document.getElementById('cart');
  var cartOverlay = document.getElementById('cartOverlay');
  var cartClose = document.getElementById('cartClose');
  var cartItemsEl = document.getElementById('cartItems');
  var cartEmptyEl = document.getElementById('cartEmpty');
  var cartTotalEl = document.getElementById('cartTotal');
  var cartCountEl = document.getElementById('cartCount');
  var cartCheckoutBtn = document.getElementById('cartCheckout');

  function openCart(){
    cart.classList.add('is-open');
    cartOverlay.classList.add('is-open');
    cartToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeCart(){
    cart.classList.remove('is-open');
    cartOverlay.classList.remove('is-open');
    cartToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = nav.classList.contains('is-open') ? 'hidden' : '';
  }
  if (cartToggle) cartToggle.addEventListener('click', function(){
    cart.classList.contains('is-open') ? closeCart() : openCart();
  });
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeCart();
  });

  function renderCart(){
    if (!cartItemsEl) return;
    cartItemsEl.innerHTML = '';

    if (!cartState.items.length){
      var empty = document.createElement('p');
      empty.className = 'cart__empty';
      empty.innerHTML = 'Tu carrito está vacío.<br>Elige tu color y empieza a rendir.';
      cartItemsEl.appendChild(empty);
    } else {
      cartState.items.forEach(function(item){
        var row = document.createElement('div');
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

        row.querySelectorAll('[data-qty]').forEach(function(btn){
          btn.addEventListener('click', function(){
            changeQty(item.key, parseInt(btn.getAttribute('data-qty'), 10));
          });
        });
        row.querySelector('.cart-item__remove').addEventListener('click', function(){
          removeItem(item.key);
        });

        cartItemsEl.appendChild(row);
      });
    }

    var total = cartState.items.reduce(function(sum, i){ return sum + i.price * i.qty; }, 0);
    var count = cartState.items.reduce(function(sum, i){ return sum + i.qty; }, 0);
    cartTotalEl.textContent = formatCOP(total);
    if (count > 0){ cartCountEl.hidden = false; cartCountEl.textContent = String(count); }
    else { cartCountEl.hidden = true; }

    saveCart();
  }

  function addToCart(data){
    var key = data.id + '-' + data.size;
    var existing = cartState.items.find(function(i){ return i.key === key; });
    if (existing) existing.qty += 1;
    else cartState.items.push({ key: key, id: data.id, name: data.name, price: data.price, img: data.img, size: data.size, qty: 1 });
    renderCart();
  }
  function changeQty(key, delta){
    var item = cartState.items.find(function(i){ return i.key === key; });
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cartState.items = cartState.items.filter(function(i){ return i.key !== key; });
    renderCart();
  }
  function removeItem(key){
    cartState.items = cartState.items.filter(function(i){ return i.key !== key; });
    renderCart();
  }

  document.querySelectorAll('[data-add-cart]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var card = btn.closest('.product-card');
      var activeSize = card ? card.querySelector('.size-pill.is-active') : null;
      addToCart({
        id: btn.getAttribute('data-id'),
        name: btn.getAttribute('data-name'),
        price: parseInt(btn.getAttribute('data-price'), 10),
        img: btn.getAttribute('data-img'),
        size: activeSize ? activeSize.textContent.trim() : 'M'
      });

      var label = btn.querySelector('span');
      var original = label.textContent;
      btn.classList.add('is-added');
      label.textContent = 'Añadido ✓';
      window.setTimeout(function(){ btn.classList.remove('is-added'); label.textContent = original; }, 1300);

      openCart();
    });
  });

  if (cartCheckoutBtn){
    cartCheckoutBtn.addEventListener('click', function(){
      if (!cartState.items.length) return;
      var lines = cartState.items.map(function(i){
        return '• ' + i.name + ' (talla ' + i.size + ') x' + i.qty + ' — ' + formatCOP(i.price * i.qty);
      });
      var total = cartState.items.reduce(function(sum, i){ return sum + i.price * i.qty; }, 0);
      var text = 'Hola V&B, quiero hacer este pedido:%0A%0A' + encodeURIComponent(lines.join('\n')) + '%0A%0ATotal: ' + encodeURIComponent(formatCOP(total));
      if (WHATSAPP_NUMBER){
        window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + text, '_blank', 'noopener');
      } else {
        window.alert('Pedido listo. Configura el número de WhatsApp de V&B para completar el checkout.');
      }
    });
  }

  loadCart();
  renderCart();

  /* ---------------------------------------------------------
     SCROLL REVEAL
  --------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

})();
