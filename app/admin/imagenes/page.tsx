import { listMedia } from '@/app/actions/media';
import MediaLibrary from '@/components/admin/MediaLibrary';

export default async function MediaPage() {
  const media = await listMedia();

  return (
    <>
      <div className="admin__page-head">
        <div>
          <h1>Imágenes</h1>
          <p>{media.length} imagen(es). Las nuevas se suben a Vercel Blob.</p>
        </div>
      </div>
      <MediaLibrary initialMedia={media.map((m) => ({ id: m.id, url: m.url, filename: m.filename, altText: m.altText, sizeBytes: m.sizeBytes }))} />
    </>
  );
}
