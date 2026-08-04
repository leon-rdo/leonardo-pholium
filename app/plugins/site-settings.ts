export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig();

  // Derive the locale from the URL prefix (/pt-br/…, /en-us/…) — cookie-less
  // visitors (crawlers, first-time social fetchers) on /en-us pages must get
  // en-us defaults, and the i18n_redirected cookie can't tell us that.
  const path = useRequestURL().pathname;
  const i18nCookie = useCookie("i18n_redirected");
  const localeFromPath = path.match(/^\/(pt-br|en-us)(\/|$)/)?.[1];
  const locale = localeFromPath || i18nCookie.value || "pt-br";

  // Fetch site settings once at app initialization
  try {
    const settings = await $fetch("/api/site-settings/", {
      baseURL: config.public.apiBase,
      headers: {
        "Accept-Language": locale === "pt-br" ? "pt-br" : "en-us",
      },
    });

    // Store in nuxtData for global access
    const nuxtData = useNuxtData("site-settings");
    nuxtData.data.value = settings;
  } catch (error) {
    console.error("Failed to fetch site settings:", error);

    // Set default fallback values
    const nuxtData = useNuxtData("site-settings");
    nuxtData.data.value = {
      site_name: "Leonardo Costa",
      default_title: "Portfolio | Leonardo Costa",
      default_description: "Full Stack Developer",
      default_image: `${config.public.siteUrl}/og-default.jpg`,
    };
  }
});
