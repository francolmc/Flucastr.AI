# Propuesta final: kit general de verificación (2026-11-14)

> Los nombres se anonimizaron; se conservan fechas y cifras.

*Nombres de personas y proyectos anonimizados; fechas y cifras originales.*

Reemplaza a `propuesta.md` (cuatro carriles, auditor, candado), que era demasiado grande. Esta se limita a lo que tiene respaldo, y dice dónde no lo tiene.

## 1. Qué sabemos y con qué nivel de evidencia
Niveles: **M** medido por nosotros · **P** documentación oficial o del proveedor · **B** blog o guía de terceros · **I** inferencia nuestra.

| Afirmación | Evidencia | Nivel |
| --- | --- | --- |
| Instalar dependencias antes de copiar el código reduce la reconstrucción | Proyecto.Finanzas: build con caché de ~27 min (mediana) a 109 s, 26 pasos `CACHED` | **M** |
| Mismo patrón en Python (`uv sync --no-install-project` antes de copiar, `UV_LINK_MODE=copy`, cache mount en `/root/.cache/uv`) | docs de uv y de Depot ([uv](https://docs-next.astral.sh/uv/guides/integration/docker), [Depot](https://depot.dev/docs/languages/python-uv-dockerfile)) | **P**, sin probar aquí |
| Un `--no-cache` ya no reutiliza la instalación | corridas finales de F10: 22–24 min, solo 2 pasos `CACHED` | **M** (que los cache mounts mismos se borren: sin probar; un hilo de [Docker forum](https://forums.docker.com/t/is-it-possible-to-build-without-layer-caching-but-keep-buildkits-mount-type-cache/125679) lo pregunta y no hay respuesta oficial recuperada) |
| Los cache mounts no viajan en la exportación de caché a registro | [BuildKit docs](https://github.com/moby/buildkit/blob/1e14e513236d79803c79478a8720635967a34be4/frontend/dockerfile/docs/syntax.md), resumen de terceros | **P/B** |
| Registrar la espera de la respuesta antes de la acción; aserciones con reintento; trace al fallar | guías de [Nx](https://nx.dev/docs/technologies/test-tools/playwright/guides/flaky-tests), [TestDino](https://testdino.com/blog/playwright-flaky-tests) (no se recuperó la página oficial de Playwright) y 4 devoluciones de F10 por ese defecto | **B** + **M** |
| Una capa de verificación barata antes de la cara (tipos y lint → pruebas → integración) | [guías de harness engineering](https://agentic-ai.readthedocs.io/en/latest/AgentHarness/harness-engineering); consistente con 3 de 5 fallos de F04 vistos por `tsc`/lint | **B** + **M** |
| `AGENTS.md` corto, como índice | misma fuente; cifras (50→600 líneas, 72%→45%) son anécdota de un blog | **B** |
| `depends_on` con `service_healthy` y `pg_isready` | [docs de Docker Compose](https://docs.docker.com/compose/how-tos/startup-order.md) | **P** |
| Un healthcheck agresivo puede reiniciar PostgreSQL bajo carga | un hilo de [Appwrite](https://appwrite.io/threads/1561929263135858708) | **B** anecdótico |
| La caché de BuildKit crece sin límite y el VHDX de WSL no se encoge solo | [docs de GC de Docker](https://docs.docker.com/build/cache/garbage-collection) y foros | **P/B** + **M** (101 GB de caché, 964 imágenes) |

**No encontrado:** guía oficial de Expo para una comprobación local rápida previa a EAS (solo hay [caché de builds](https://docs.expo.dev/build-reference/caching.md)); fuente alguna sobre `shm_size`/memoria de WSL2 ligada a P1017; estudios de TypeScript con los modelos que usamos.

## 2. Hallazgo nuevo sobre P1017 y `unhealthy` (Proyecto.Finanzas, `verificacion/compose.yaml`)
- La base usa `tmpfs: [/var/lib/postgresql/data]` **sin tamaño ni límite de memoria**: los datos cuentan contra la RAM del contenedor y de WSL (12 GB).
- La espera es correcta (`up -d --wait` con `pg_isready`, 2 s × 30) antes de migrar; no es una carrera de arranque.
- Por eso P1017 en la novena migración apunta a que PostgreSQL se cae o se reinicia, no a que no esté listo. **Hipótesis, sin probar.** El volcado de logs que añadimos hoy a `verify` es la forma de confirmarlo en la próxima falla.

## 3. Principios del kit (valen para cualquier stack)
1. **Dependencias antes del código** en todo Dockerfile; caché de paquetes cuando el gestor la soporte.
2. **Una línea `Comprobación rápida:`** en `AGENTS.md` (tipos, lint, pruebas del host; sin Docker).
3. **Iterar con caché; sin caché una sola vez, al final.**
4. **Todo fallo deja evidencia antes de limpiar** (logs de los servicios y estado de memoria).
5. **Las esperas de un recorrido se registran antes de la acción, y un fallo muestra lo recibido** (código y cuerpo), no solo «no es igual».
6. **El tramo toca una capa y se verifica sin Docker salvo el final.**

## 4. Recetas por stack (se agregan al usarlas, no antes)
- **Node/pnpm:** probada (Proyecto.Finanzas). `package.json` + lockfile → `pnpm install` con `--mount=type=cache,target=/pnpm/store` → código.
- **Python:** `uv sync --frozen --no-install-project` → código → `uv sync`. **Sin probar y sin proyecto que la necesite hoy.** (Corrección: Proyecto.Servicios NO es Python; es SvelteKit + NestJS/TypeScript con Prisma/MySQL y pnpm, como Proyecto.Finanzas. El Python de `verification/run.py` es solo su runner de verificación.) No se escribe esta receta hasta que exista un proyecto Python.
- **React Native/Expo:** comprobación rápida = `tsc --noEmit` + `jest` en el host; el build nativo no se hace en `verify`. **Sin probar**; se prueba en Proyecto.Móvil.
- **Rust/WASI:** no investigado.

## 5. Qué cambia en el kit (solo texto, sin scripts ni agentes nuevos)
1. `skills/preparar-proyecto/SKILL.md`, sección 2: los principios 1–5 en una sola lista de cinco líneas, con la receta de Node/pnpm como ejemplo.
2. `skills/planificar-cambio/SKILL.md`: el principio 6 como regla de corte de tramo (una capa, ≤3 archivos de producto, ≤5 filas de Aceptación).
3. `agentes/constructor.md`: el principio 5 en una línea.
4. Un bloque de `verify` del kit que exija esas frases (patrón de los bloques 8k/8l).

No se hace: auditor, candado de Docker, carriles, `proceso-rapido`, `una-espera-write-stdin`, `verificacion-general`. Quedan en reserva con la condición de la sección 7.

## 6. Cómo se prueba que generaliza
| Proyecto | Qué se prueba | Éxito |
| --- | --- | --- |
| Proyecto.Móvil `Aplicación móvil` (copia todo en L4 antes de instalar) | reordenar capas | misma corrida con caché pasa de X min a menos de la mitad |
| Proyecto.Servicios (SvelteKit + NestJS, pnpm; 7 repos) | misma receta de Proyecto.Finanzas (6 de sus 7 Dockerfiles copian el código antes o junto con la instalación, según un `grep` por líneas, sin probar) y `Comprobación rápida` | `VERIFY_RAPIDO=1 ./verify` baja a menos de la mitad y la comprobación rápida corre sin Docker en <1 min |
| Proyecto.Plataforma | nada nuevo de velocidad; solo la regla 4 (logs al fallar) | el próximo `unhealthy` deja logs |
Cada fila es un plan corto de un tramo. La sección 5 se escribe **después** de la primera fila que salga bien, no antes.

## 7. Experimentos de 10 minutos (los hace el constructor)
- ¿Un cache mount sobrevive a `--no-cache`? Un Dockerfile mínimo que cuenta archivos en el mount; construir, y volver a construir con `--no-cache`.
- ¿`tmpfs` sin límite explica los cierres de PostgreSQL? Esperar el próximo fallo con logs; si no aparece nada tras 5 corridas, descartar.

## 8. Congelamiento
El kit solo cambia por un dolor medido en dos productos distintos. Hoy hay uno (Proyecto.Finanzas). El segundo lo da Proyecto.Móvil o Proyecto.Servicios.

## Límites de esta investigación
Casi todas las fuentes externas son blogs o resúmenes de búsqueda; no abrí las páginas oficiales una por una. Las cifras de agentes vienen de otros lenguajes. Lo único medido en nuestro entorno es Proyecto.Finanzas.
