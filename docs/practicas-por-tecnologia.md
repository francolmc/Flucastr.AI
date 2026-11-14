# Prácticas por tecnología

Lista que el principal consulta al revisar un cambio que toca una tecnología de aquí (`agentes/principal.md`, paso 5). Sirve para anotar «Mejora sugerida», no para bloquear.

Reglas de la lista:

- Cada práctica lleva su fuente (enlace o ruta de un documento del repo) y su grado de evidencia.
- El grado es uno de: **medido** (lo corrimos nosotros), **oficial** (documentación del proveedor), **blog** (guía de terceros), **inferencia** (deducción nuestra sin probar).
- Una tecnología nueva entra solo al usarla en un proyecto, con su fuente. Nada sin fuente.

## Docker

### Dependencias antes del código
- Práctica: en cada Dockerfile, copiar primero el manifiesto y el lockfile, instalar dependencias y recién después copiar el código.
- Fuente: `cambios/auditoria-verificacion-general/propuesta-final.md` (DonFinancio: build con caché de ~27 min a 109 s, 26 pasos `CACHED`; medido el 2026-11-14).
- Nivel: medido

### Caché de paquetes
- Práctica: montar la caché del gestor de paquetes en el `RUN` de instalación (`RUN --mount=type=cache`), por ejemplo el store de pnpm.
- Fuente: [BuildKit, sintaxis del Dockerfile](https://github.com/moby/buildkit/blob/1e14e513236d79803c79478a8720635967a34be4/frontend/dockerfile/docs/syntax.md); receta probada en DonFinancio (`cambios/auditoria-verificacion-general/propuesta-final.md`, §4). Los cache mounts no viajan en la exportación de caché a registro.
- Nivel: oficial

### Sin `COPY . .` antes de instalar
- Práctica: no copiar todo el proyecto (`COPY . .`) antes del paso de instalación; cualquier cambio de archivo invalida la capa de instalación.
- Fuente: `cambios/auditoria-tests-donfinancio/hallazgo.md` (punto 3: el Dockerfile de la API hace `COPY . .` antes de `pnpm install`).
- Nivel: medido

### Límites y `tmpfs` de la base
- Práctica: a la base de datos con `tmpfs` darle tamaño o límite de memoria, o justificar por qué no lo necesita, porque los datos cuentan contra la RAM del contenedor y de WSL.
- Fuente: `cambios/auditoria-verificacion-general/propuesta-final.md`, §2 (DonFinancio: `tmpfs` sin límite). Hipótesis del P1017, sin probar.
- Nivel: inferencia

### Limpieza de caché
- Práctica: revisar la caché de builds de Docker antes de que crezca sin control; el VHDX de WSL no se encoge solo.
- Fuente: [docs de garbage collection de Docker](https://docs.docker.com/build/cache/garbage-collection); 101 GB de caché y 964 imágenes medidos (`cambios/auditoria-verificacion-general/propuesta-final.md`, §1).
- Nivel: oficial

## Compose y PostgreSQL

### Esperar a la base con `service_healthy`
- Práctica: `depends_on` con `condition: service_healthy` y un `healthcheck` con `pg_isready` antes de migrar o arrancar la API.
- Fuente: [docs de Docker Compose, orden de arranque](https://docs.docker.com/compose/how-tos/startup-order.md); uso en `skills/preparar-proyecto/referencia.md`.
- Nivel: oficial

### Logs antes de limpiar
- Práctica: ante un fallo, volcar los logs de los servicios y su estado de memoria antes de hacer `down` o borrar volúmenes.
- Fuente: `cambios/auditoria-verificacion-general/propuesta-final.md`, §2 y §3 (principio 4). Un `healthcheck` agresivo puede reiniciar PostgreSQL bajo carga (anécdota de un foro).
- Nivel: inferencia

## Playwright

### Registrar la espera antes de la acción
- Práctica: registrar la espera de la respuesta (por ejemplo `Promise.all` con `waitForResponse`) antes del clic que la provoca; no usar esperas fijas.
- Fuente: [guía de Nx sobre tests inestables](https://nx.dev/docs/technologies/test-tools/playwright/guides/flaky-tests) y [TestDino](https://testdino.com/blog/playwright-flaky-tests); 4 devoluciones de F10 por ese defecto (`cambios/auditoria-verificacion-general/propuesta-final.md`, §1).
- Nivel: blog

### Aserciones con reintento
- Práctica: usar aserciones que reintentan (`expect` con espera) en vez de comprobaciones únicas del estado.
- Fuente: las mismas guías de Nx y TestDino; `cambios/auditoria-verificacion-general/propuesta-final.md`, §1.
- Nivel: blog

### Mostrar lo recibido al fallar
- Práctica: al fallar una comprobación, mostrar lo recibido (código y cuerpo de la respuesta), no solo «no es igual».
- Fuente: `cambios/auditoria-verificacion-general/propuesta-final.md`, §3 (principio 5), derivado de las devoluciones de F10.
- Nivel: inferencia

## Comprobación rápida (cualquier stack)

### Línea `Comprobación rápida:` en AGENTS.md
- Práctica: declarar en `AGENTS.md` una línea `Comprobación rápida:` con tipos, lint y pruebas del host, sin Docker, para que el Nivel 1 de `planificar-cambio` (regla 13) exista.
- Fuente: [guías de harness engineering](https://agentic-ai.readthedocs.io/en/latest/AgentHarness/harness-engineering) (blog); 3 de 5 fallos de F04 vistos por `tsc` o lint (`cambios/auditoria-verificacion-general/propuesta-final.md`, §1).
- Nivel: blog
