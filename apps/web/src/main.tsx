import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import i18n from "./shared/i18n";
import App from "./App.tsx";
import { initializePreferences } from "./shared/stores/preferencesStore.ts";

// Bootstrap i18n so resources are loaded before the first render. Without this
// the very first `useTranslation()` call returns the raw key.
void i18n;
initializePreferences();

// Older service workers cached authenticated API responses without varying by
// Authorization. The route is gone; purge its cache on upgrade as well.
if ("caches" in window) {
  void window.caches.delete("musicflow-api");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2 * 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
