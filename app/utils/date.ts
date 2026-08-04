type Locale = "en-US" | "pt-BR";

const dateLocale: Record<string, Locale> = {
  "en-us": "en-US",
  "pt-br": "pt-BR",
};

// Date-only strings ("2025-12-01") parse as UTC midnight, so reading them in
// a UTC-negative timezone shifts to the previous day and SSR/client render
// different dates. Parsing them as local midnight keeps both sides equal.
const parseLocal = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(date + "T00:00:00") : new Date(date);

export const formatShortMonthYearOrPresent = (
  date: string | null,
  locale: string,
  presentText: string
) => {
  if (!date) return presentText;

  return parseLocal(date).toLocaleDateString(dateLocale[locale], {
    year: "numeric",
    month: "short",
  });
};

export const formatShortMonthDay = (date: string | null, locale: string) => {
  if (!date) return "";

  return parseLocal(date).toLocaleDateString(dateLocale[locale], {
    month: "short",
    day: "numeric",
  });
};

export const formatYearMonthDay = (date: string | null, locale: string) => {
  if (!date) return "";
  return parseLocal(date).toLocaleDateString(dateLocale[locale], {
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
  return parseLocal(date).toLocaleDateString(dateLocale[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
