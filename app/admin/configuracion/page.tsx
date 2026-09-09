import { getSiteSettings } from '@/app/actions/settings';
import SettingsForm from '@/components/admin/SettingsForm';

export default async function SettingsPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <div className="admin__page-head">
        <div>
          <h1>Configuración</h1>
          <p>WhatsApp, redes sociales, envío y marca.</p>
        </div>
      </div>
      <SettingsForm
        initial={{
          storeName: settings.storeName,
          logoMediaId: settings.logoMediaId,
          faviconMediaId: settings.faviconMediaId,
          whatsappNumber: settings.whatsappNumber,
          whatsappMessageTemplate: settings.whatsappMessageTemplate,
          instagramUrl: settings.instagramUrl,
          tiktokUrl: settings.tiktokUrl,
          facebookUrl: settings.facebookUrl,
          email: settings.email,
          address: settings.address,
          hours: settings.hours,
          shippingCost: settings.shippingCost,
          trustBadgeEnabled: settings.trustBadgeEnabled,
          trustBadgeBaseCount: settings.trustBadgeBaseCount
        }}
        visitorCount={settings.visitorCount}
      />
    </>
  );
}
