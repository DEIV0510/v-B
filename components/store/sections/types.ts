export type SectionImage = {
  media: { url: string; altText: string; width: number | null; height: number | null };
};

export type SectionData = {
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  images: SectionImage[];
};
