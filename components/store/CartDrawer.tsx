export default function CartDrawer() {
  return (
    <>
      <div className="cart-overlay" id="cartOverlay"></div>
      <aside className="cart" id="cart" aria-label="Carrito de compras">
        <div className="cart__head">
          <h2>Tu carrito</h2>
          <button id="cartClose" aria-label="Cerrar carrito">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="cart__items" id="cartItems">
          <p className="cart__empty" id="cartEmpty">Tu carrito está vacío.<br />Elige tu color y empieza a rendir.</p>
        </div>
        <div className="cart__foot">
          <div className="cart__row">
            <span>Subtotal</span>
            <strong id="cartSubtotal">$0</strong>
          </div>
          <div className="cart__row cart__row--discount" id="cartDiscountRow" hidden>
            <span>Descuento combo licra</span>
            <strong id="cartDiscount">-$0</strong>
          </div>
          <div className="cart__row" id="cartShippingRow" hidden>
            <span>Envío</span>
            <strong id="cartShipping">$0</strong>
          </div>
          <div className="cart__total">
            <span>Total</span>
            <strong id="cartTotal">$0</strong>
          </div>
          <button className="btn btn--primary btn--full" id="cartCheckout">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Zm4.4-5.6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-1.3-.6-2.1-1.1-3-2.5-.2-.4.2-.4.6-1.2.1-.1 0-.3 0-.4-.1-.1-.5-1.3-.7-1.7-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 3.9 3.5.5.2.9.4 1.3.5.5.2 1 .1 1.3-.1.4-.2 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.4-.3Z" /></svg>
            <span>Finalizar por WhatsApp</span>
          </button>
        </div>
      </aside>
    </>
  );
}
