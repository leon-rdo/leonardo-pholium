import "@mdi/font/css/materialdesignicons.css";

import "vuetify/styles";
import { createVuetify } from "vuetify";

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    theme: {
      defaultTheme: "light",
      themes: {
        light: {
          colors: {
            primary: "#2563eb",
            secondary: "#64748b",
            accent: "#3b82f6",
            error: "#ef4444",
            success: "#10b981",
            warning: "#f59e0b",
            info: "#0ea5e9",
            background: "#fafafa",
            surface: "#ffffff",
          },
        },
        dark: {
          colors: {
            primary: "#3b82f6",
            secondary: "#64748b",
            accent: "#60a5fa",
            error: "#f87171",
            success: "#34d399",
            warning: "#fbbf24",
            info: "#38bdf8",
            background: "#0f172a",
            surface: "#1e293b",
          },
        },
      },
    },
    defaults: {
      VBtn: {
        style: {
          textTransform: "none",
          letterSpacing: "normal",
        },
      },
      VCard: {
        elevation: 0,
      },
    },
  });
  app.vueApp.use(vuetify);
});
