import { expect, test } from "@playwright/test";

test("login stays usable without an API response", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Bienvenido de nuevo" })).toBeVisible();
  const submit = page.getByRole("button", { name: /Iniciar Sesión/i });
  await expect(submit).toBeDisabled();

  await page.getByLabel("Correo electrónico").fill("listener@musicflow.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("secret123");
  await expect(submit).toBeEnabled();

  await page.getByRole("button", { name: "Mostrar contraseña" }).click();
  await expect(
    page.getByLabel("Contraseña", { exact: true }),
  ).toHaveAttribute("type", "text");
});

test("client login shows the headphones tip before entering the library", async ({
  page,
}) => {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "listener-1",
          email: "listener@musicflow.test",
          username: "Listener",
          role: "CLIENT",
          isPremium: false,
          avatar: null,
        },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      }),
    }),
  );
  await page.goto("/");
  await page.getByLabel("Correo electrónico").fill("listener@musicflow.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("secret123");
  await page.getByRole("button", { name: /Iniciar Sesión/i }).click();

  await expect(
    page.getByRole("heading", { name: "Mejor experiencia con audifonos" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/headphones-tip$/);
});

test("a persisted client session resumes when the root page is reopened", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "musicflow-auth",
      JSON.stringify({
        state: {
          user: {
            id: "listener-1",
            email: "listener@musicflow.test",
            username: "Listener",
            role: "CLIENT",
            isPremium: false,
            avatar: null,
          },
          accessToken: "access-token",
          refreshToken: "refresh-token",
          isAuthenticated: true,
        },
        version: 0,
      }),
    );
  });
  await page.route("**/api/**", (route) =>
    route.fulfill({ contentType: "application/json", body: "[]" }),
  );

  await page.goto("/");
  await expect(page).toHaveURL(/\/library$/);
});
