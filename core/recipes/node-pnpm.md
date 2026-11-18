# Node/pnpm Recipe

This Node/pnpm recipe is an example, not a requirement. Read it only when the project's stack is Node. The verification contract remains in `nucleo/contrato/verificacion.md`.

## Install from the lockfile

- With `package-lock.json`: `npm ci`.
- With `pnpm-lock.yaml`: `pnpm install --frozen-lockfile`.

Installing without the lockfile may resolve different versions from the ones that were tested.

## Declared dependencies

Declare in `package.json` every package imported directly by the code. A package that arrives only as another package's dependency (for example, `express` through the NestJS adapter) works on your machine and fails in a clean build.

In TypeScript, ESLint's `import/no-extraneous-dependencies` rule detects this.
