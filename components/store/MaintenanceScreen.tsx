type Props = {
  storeName: string;
  whatsappNumber: string;
};

export default function MaintenanceScreen({ storeName, whatsappNumber }: Props) {
  return (
    <div className="maintenance">
      <div className="maintenance__mark">V&amp;B</div>
      <p className="maintenance__eyebrow">PERFORMANCE APPAREL</p>
      <h1 className="maintenance__title">
        <span className="line">VOLVEMOS</span>
        <span className="line accent">PRONTO.</span>
      </h1>
      <p className="maintenance__text">{storeName} está en mantenimiento — estamos preparando algo mejor.</p>
      {whatsappNumber && (
        <a className="btn btn--primary" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener">
          Escríbenos por WhatsApp
        </a>
      )}
    </div>
  );
}
