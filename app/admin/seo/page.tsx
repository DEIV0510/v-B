import { getSeoSettings } from '@/app/actions/settings';
import SeoForm from '@/components/admin/SeoForm';

export default async function SeoPage() {
  const seo = await getSeoSettings('home');

  return (
    <>
      <div className="admin__page-head">
        <div>
          <h1>SEO</h1>
          <p>Título y descripción que ven Google y redes sociales para la página de inicio.</p>
        </div>
      </div>
      <SeoForm
        page="home"
        initial={{
          title: seo?.title ?? '',
          metaDescription: seo?.metaDescription ?? '',
          ogTitle: seo?.ogTitle ?? '',
          ogDescription: seo?.ogDescription ?? '',
          ogImageId: seo?.ogImageId ?? null,
          canonicalUrl: seo?.canonicalUrl ?? ''
        }}
      />
    </>
  );
}
