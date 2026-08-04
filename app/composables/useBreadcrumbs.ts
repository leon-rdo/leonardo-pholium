export interface BreadcrumbItem {
  title: string;
  to?: string;
  disabled?: boolean;
}

export const useBreadcrumbs = () => {
  const config = useRuntimeConfig();
  const localePath = useLocalePath();

  const setBreadcrumbsSchema = (items: BreadcrumbItem[]) => {
    const itemListElement = items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      // localePath: `to` values are locale-less (/blog); the schema must
      // point at the real prefixed URLs or every breadcrumb item 404s.
      ...(item.to && { item: `${config.public.siteUrl}${localePath(item.to)}` }),
    }));

    useHead({
      script: [
        {
          key: "ld-breadcrumbs",
          type: "application/ld+json",
          innerHTML: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement,
          }),
        },
      ],
    });
  };

  return {
    setBreadcrumbsSchema,
  };
};
