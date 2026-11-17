# Receta de Node/pnpm

Receta de Node/pnpm; ejemplo, no obligación. Léela solo si el stack del proyecto es Node. El contrato de verificación sigue en `nucleo/contrato/verificacion.md`.

## Instalación desde el lock

- Con `package-lock.json`: `npm ci`.
- Con `pnpm-lock.yaml`: `pnpm install --frozen-lockfile`.

Instalar sin el lock puede resolver otras versiones que las probadas.

## Dependencias declaradas

Declara en `package.json` todo lo que el código importa directamente. Un paquete que solo llega como dependencia de otro (por ejemplo `express` vía el adaptador de NestJS) funciona en tu máquina y falla en un build limpio.

En TypeScript, la regla `import/no-extraneous-dependencies` de ESLint lo detecta.
