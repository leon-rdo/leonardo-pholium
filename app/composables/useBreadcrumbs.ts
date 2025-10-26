export interface BreadcrumbItem {
  title: string;
  to?: string;
  disabled?: boolean;
}

export const useBreadcrumbs = () => {
  const config = useRuntimeConfig();
  const route = useRoute();

  const setBreadcrumbsSchema = (items: BreadcrumbItem[]) => {
    const itemListElement = items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      ...(item.to && { item: `${config.public.siteUrl}${item.to}` }),
    }));

    useHead({
      script: [
        {
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
