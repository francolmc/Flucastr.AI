# Auditoría: dónde se va el tiempo de verificación en DonFinancio (2026-11-13)

Base: `verify` y `verificacion/` de la raíz, Dockerfiles de API y Web, `.dockerignore`, `package.json` de la API, y los logs de Codex del 12 y 13-nov (`~/.codex/sessions/2026/11/1[23]`), en especial la sesión `rollout-2026-11-13T00-33-15` (12 corridas de `verify`). Solo lectura: no corrí `verify`.

## Resumen
Lo que más tiempo consume no son los tests: es **instalar dependencias dentro de Docker en cada corrida**. Los tests (lint + jest y el recorrido de navegador) suman unos 3 a 7 minutos; las instalaciones, de 10 a 20.

## Hechos (comprobados en los logs)
1. En la sesión de 00:33Z hubo 12 corridas, **todas «Build sin caché»** (0 con caché), cada una con un build de 10 a 21 min. El resto de la corrida fue corto: arranque ≤ 1 min, recorrido de navegador 1 a 3,5 min.
2. Pasos más lentos del build (segundos por corrida):
   - `api production-deps`: `pnpm install --prod` → 305 a 610 s (5 a 10 min). Es una **segunda instalación** de la API, además de la del stage `build`.
   - `checks`/`migration` `build`: `pnpm install --frozen-lockfile && pnpm build` → 380 a 640 s.
   - `browser`: `pnpm install` → 60 a 460 s, más `npm install -g corepack` 70 a 190 s.
   - `web`: `pnpm install` → 74 a 170 s.
   - `apt-get install openssl…` repetido en varios stages → 70 a 140 s cada uno.
   - **Los tests**: `pnpm lint && pnpm test --runInBand` (stage `checks`) → 64 a 245 s; `react-router build && node --test` de la Web → 80 a 150 s.
3. El `Dockerfile` de la API hace `COPY . .` **antes** de `pnpm install` (líneas 5-6 y en `production-deps`). Cualquier cambio de archivo invalida la capa de instalación, incluso con `VERIFY_RAPIDO=1`. Ningún Dockerfile usa `RUN --mount=type=cache`.
4. Los `.dockerignore` de API y Web sí excluyen `node_modules`; el contexto de build no es el problema.
5. El `AGENTS.md` de DonFinancio no tiene la línea `Comprobación rápida`, así que el Nivel 1 (tipos, lint y tests del host, segundos) **no existe** ahí. Todo cambio, aunque sea una línea, pasa por Docker.
6. La API tiene 8 archivos de pruebas (≈ 700 líneas, jest `--runInBand`); el peso está en `verificacion/recorrido.mjs` (1525 líneas, un solo recorrido de navegador). Un fallo lo corta y obliga a repetir todo.
7. Ya medido antes: `verify-script.e2e-spec.ts` pasó aislada en 105 s y falló bajo carga por un `spawnSync` de 10 s. Se resolvió en F07.
8. La npm de este entorno descarga a ~21 KiB/s (aviso `[WARN] Tarball download average speed 21 KiB/s` en el log del build). Eso multiplica el costo de cada instalación.

## Causas (inferencias)
- **Por qué 12 corridas sin caché:** el plan de F06 declara «`./verify` completo, sin caché» como verificación del tramo 2, y `experiencia-completa` pide nivel 3 «sin caché» en la corrida final. Es posible que el constructor lo usara como comando de iteración. No lo comprobé en esa sesión.
- **La caché no ayuda al iterar:** por el `COPY . .` previo a la instalación, cada cambio de código reinstala todo, con o sin `--no-cache`. No lo probé con una corrida real.
- **La doble instalación de la API** (`build` y `production-deps`) y la del `browser` repiten descargas sobre una red lenta.

## Lo que no verifiqué
- No medí una corrida rápida con caché y un cambio de código real.
- No sé cuánto de los 305–610 s de `production-deps` es red y cuánto es el disco de Docker en WSL.
- No revisé si `pnpm` tiene almacén compartido entre builds (no hay `--mount=type=cache`).
- No abrí cada suite de `test/` para decir cuáles aportan poco; por tamaño (40 a 90 líneas) no parecen el problema.

## Recomendaciones (por ahorro estimado, de mayor a menor)
1. **Reordenar los Dockerfiles para cachear la instalación**: copiar solo `package.json`, `pnpm-lock.yaml` (y `prisma/`) antes de `pnpm install`, y el resto del código después. Con eso, un cambio de código no reinstala. Ahorro estimado: 10 a 15 min por corrida rápida.
2. **Montar la caché de pnpm** con `RUN --mount=type=cache,target=/root/.local/share/pnpm/store` (o la ruta real del store). Incluso sin caché de capas, las descargas no se repiten. Ahorro estimado: lo que hoy se va en red lenta.
3. **Eliminar la segunda instalación de la API**: obtener las dependencias de producción desde el stage `build` (`pnpm prune --prod` o `pnpm deploy`) en vez de reinstalar. Ahorro estimado: 5 a 10 min por corrida sin caché.
4. **Definir la `Comprobación rápida` en el `AGENTS.md`** (host, sin Docker): lint y jest de la API, tests de la Web. Un cambio chico se verifica en segundos. El comando exacto hay que decidirlo tras probar en el host; falta saber si jest necesita PostgreSQL.
5. **Dejar el nivel 3 (sin caché) solo para la corrida final de aceptación** y que el plan de cada tramo declare el Nivel 2. Ya lo manda `planificar-cambio` (regla 13); hoy DonFinancio lo viola en F06.
6. **Dividir el recorrido por bloques** o hacer que acumule fallos en vez de cortar en el primero. Ahorro estimado: 1 a 3 min por cada reintento de fallo en el recorrido.

No tocar: el aislamiento entre dos identidades, la idempotencia y el cálculo financiero. Ninguna de las recomendaciones anteriores los reduce.

## Siguiente
Dos planes separados en DonFinancio: (a) Dockerfiles y caché (recomendaciones 1 a 3); (b) `Comprobación rápida` y disciplina de niveles (4 y 5). Primero conviene medir una corrida rápida real tras el cambio de Dockerfile, para confirmar el ahorro.
