type Locale = "en-US" | "pt-BR";

const dateLocale: Record<string, Locale> = {
  "en-us": "en-US",
  "pt-br": "pt-BR",
};

export const formatShortMonthYearOrPresent = (
  date: string | null,
  locale: string,
  presentText: string
) => {
  if (!date) return presentText;

  return new Date(date + "T00:00:00").toLocaleDateString(dateLocale[locale], {
    year: "numeric",
    month: "short",
  });
};

export const formatShortMonthDay = (date: string | null, locale: string) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString(dateLocale[locale], {
    month: "short",
    day: "numeric",
  });
};

export const formatYearMonthDay = (date: string | null, locale: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString(dateLocale[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatYearShortMonthDay = (
  date: string | null,
  locale: string
) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString(dateLocale[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
