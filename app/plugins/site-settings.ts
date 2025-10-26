export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig();

  // Get locale from cookie or default
  const i18nCookie = useCookie("i18n_redirected");
  const locale = i18nCookie.value || "pt-br";

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
      default_image: `${config.public.apiBase}/static/og-default.jpg`,
    };
  }
});
