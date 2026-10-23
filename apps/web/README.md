# MusicFlow Web + Desktop

<p align="center"><img src="src/assets/Logo_Music_Flow.webp" alt="MusicFlow" width="140"></p>
<p align="center"><strong>Tu música, tus reglas</strong></p>

Cliente React para navegador y Electron. La misma interfaz sirve a clientes y
administradores, con reproductor, cola, letras, EQ, catálogo, FlowIA y analítica.

## Tecnologías

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111)](https://react.dev) [![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org) [![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev) [![Electron](https://img.shields.io/badge/Electron-42-47848F?logo=electron&logoColor=white)](https://electronjs.org)

React Router, Zustand y TanStack Query separan navegación, estado local y
estado remoto; Axios centraliza autenticación y errores. Chart.js, WaveSurfer,
Motion, Tailwind y Lucide cubren analítica, audio, estilos e iconografía.
Electron usa `contextIsolation` y `nodeIntegration: false`; electron-builder
genera instaladores para Windows, macOS y Linux.

## Comandos

Desde `apps/web/`:

```bash
pnpm install
pnpm dev
pnpm electron
pnpm build
pnpm dist:win
pnpm dist:mac
pnpm dist:linux
pnpm lint
pnpm test:e2e
```

Los prerrequisitos y verificaciones están en [COMMANDS.md](../../COMMANDS.md).

## Integración

Consume la API NestJS de `apps/backend/`. El catálogo usa URLs canónicas de
Cloudflare R2 y mantiene colaboradores como artistas independientes cuando
existen, o como texto no registrado cuando no existe su perfil.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
