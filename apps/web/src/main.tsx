import { StrictMode } from "react";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
