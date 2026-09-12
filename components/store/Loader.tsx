type Props = {
  logoMarkLgUrl: string;
};

export default function Loader({ logoMarkLgUrl }: Props) {
  return (
    <>
      {/* Solo la primera carga de la sesión ve la cortina. Toda la tienda navega
          con <a href> plano (carga de documento completa), así que sin esto el
          loader se repetía en cada clic a un producto: pantalla negra y contador
          00→100% otra vez sobre una página que ya estaba lista. El script va en
          línea a propósito: tiene que correr ANTES del primer pintado, no tras
          la hidratación, o la cortina alcanza a verse igual. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(sessionStorage.getItem('vb_seen')){document.documentElement.classList.add('is-warm')}else{sessionStorage.setItem('vb_seen','1')}}catch(e){}"
        }}
      />
    <div
      id="loader"
      className="loader"
      aria-hidden="true"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      aria-label="Cargando V&B Performance Apparel"
    >
      <span className="loader__panel loader__panel--l"></span>
      <span className="loader__panel loader__panel--r"></span>

      <div className="loader__content">
        <div className="loader__mark">
          <img src={logoMarkLgUrl} alt="" width={480} height={249} />
        </div>
        <p className="loader__tag">PERFORMANCE APPAREL</p>
        <div className="loader__meter">
          <span className="loader__digits" id="loaderDigits">00</span>
          <div className="loader__track"><span className="loader__fill" id="loaderFill"></span></div>
          <span className="loader__pct">%</span>
        </div>
      </div>
    </div>
    </>
  );
}
