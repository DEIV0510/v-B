type Props = {
  logoMarkLgUrl: string;
};

export default function Loader({ logoMarkLgUrl }: Props) {
  return (
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
  );
}
