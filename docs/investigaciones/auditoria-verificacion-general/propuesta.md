# Propuesta: verificación robusta y eficiente para cualquier proyecto y stack (2026-11-13)

*Nombres de personas y proyectos anonimizados; fechas y cifras originales.*

Parte de `hallazgo.md` (medido) y de la investigación web de hoy. Lo marcado **[fuente]** viene de una búsqueda; lo marcado **[mío]** es razonamiento propio, sin respaldo externo. Nada de esto está probado en vuestros proyectos.

## Qué pidió la persona usuaria
Un diseño que aguante: más de dos proyectos a la vez sin colapsar Docker, validaciones que no siempre necesitan Docker, y otros stacks y lenguajes. Docker se conserva para desplegar en el VPS.

## Principios
1. **La verificación se divide en carriles de costo creciente**; el agente usa el más barato que cubre su cambio, y el más caro una sola vez. **[fuente]** pirámide/trofeo de pruebas: pocas pruebas E2E sobre caminos críticos, más pruebas baratas debajo; ninguna fuente fija números. El reparto en cuatro carriles es **[mío]**.
2. **El kit no conoce los stacks; cada proyecto declara sus comandos.** Un contrato único por proyecto, y el kit solo lo hace cumplir. **[mío]** Las herramientas políglotas (Nx, Moon, Bazel) existen pero son pesadas; `just` y Taskfile solo unifican comandos; mise tiene tareas de monorepo experimentales **[fuente]**.
3. **Docker es un recurso compartido y escaso**; se coordina y se limita, no se asume infinito. **[fuente]** sin límites, un contenedor puede agotar la memoria y activar el OOM killer; los límites de Compose (`mem_limit`, `cpus`) son estándar. Que sea esta la causa de los cierres de PostgreSQL es **[mío]** y sigue sin probar.
4. **Todo fallo deja evidencia antes de limpiar.** **[mío]** (hoy cada `verify` borra el contenedor antes de poder mirarlo).

## Los cuatro carriles (comandos por proyecto, mismo nombre en todos)
| Carril | Qué corre | Docker | Orden de magnitud | Quién lo usa |
| --- | --- |
| 1 `rapida` | tipos, lint, pruebas unitarias y de módulos, con las herramientas del host | No | segundos | cada paso del constructor |
| 2 `integracion` | API y Web en el host contra dependencias en contenedor (PostgreSQL, correo) que quedan levantadas entre corridas | Solo las dependencias | 1–3 min | el tramo que conecta el flujo |
| 3 `stack` | imágenes de producción con caché, recorrido de navegador del flujo tocado | Sí | 5–10 min | cierre de un tramo |
| 4 `aceptacion` | build sin caché, recorrido completo y limpieza | Sí | 15–20 min | una vez, al final |

- El carril 2 sigue el patrón **[fuente]** «Compose con dependencias levantadas con `up -d --wait`» (o Testcontainers para aislamiento por prueba). Que sea el más rápido es **[mío]**.
- Los carriles 3 y 4 usan **los mismos Dockerfiles que producción**; así el VPS queda cubierto.
- Hoy los proyectos solo tienen 3 y 4. El 1 está en la regla 13 pero ningún proyecto lo declaró.

## El contrato por proyecto (opciones)
- **A. Líneas en `AGENTS.md`** (`Comprobación rápida: …`, `Integración: …`): ya existe una; costo mínimo; sin ejecutable único.
- **B. `./verify` con nivel** (`./verify 1|2|3|4`): un solo punto de entrada, igual en todo stack; el proyecto implementa cada nivel como quiera. Recomendada.
- **C. Un ejecutor de tareas** (mise, just, Moon, Nx): más potente (caché de resultados, pruebas afectadas); dependencia nueva y curva; solo vale la pena en un monorepo políglota como Proyecto.Móvil. **[fuente]**

## Coordinación entre proyectos (opciones)
- **Candado único** (el plan `cola-docker`): simple; serializa todo, incluso lo que cabría en paralelo.
- **Ranuras con presupuesto de memoria** (N candados): permite dos corridas ligeras o una pesada. Más fino, más código. **[mío]**
- **Límites por servicio** en cada compose (`mem_limit`, `shm_size` de PostgreSQL): evita que un servicio tumbe a los demás. **[fuente]** Combina con cualquiera de las dos.
- **Diagnóstico al fallar** (`OOMKilled`, logs de `db` y `api`, `free -m`) antes de limpiar: decide cuál de las anteriores hace falta.

## Caché y red
- Caché de paquetes en el Dockerfile con `--mount=type=cache`, tras copiar solo los manifiestos. **[fuente]** (pnpm, Depot).
- Esas cachés **no** viajan en la exportación de caché de BuildKit; en CI hay que usar un directorio local o un registro. **[fuente]** Qué ocurre con `--no-cache` sobre un mount no está confirmado: hay que medirlo.
- Un builder remoto con caché compartida (Depot u otro) es otra salida, con costo y cuenta externa. **[fuente]** Sin evaluar.

## Pruebas que no fallen por carrera (E2E)
Las devoluciones de F10 fueron defectos de las pruebas. **[fuente]** reglas de Playwright: registrar la espera de la respuesta **antes** de la acción que la provoca (`Promise.all`), aserciones con reintento en vez de comprobaciones únicas, sin esperas fijas ni subir el timeout para esconder una carrera. Van a una regla corta en el constructor y en la skill de verificación.

## Stacks distintos
El contrato B no depende del lenguaje: un proyecto Python o Rust implementa `./verify 1` con `ruff` y `pytest` o `cargo test`. El auditor y el kit solo comprueban que cada nivel exista, tenga tiempo impreso y deje diagnóstico al fallar. Qué carril 2 aplica a un stack sin servidor local (móvil, WASI) hay que decidirlo caso por caso. **[mío]**

## Cómo introducirlo con poco riesgo (propuesta, no plan)
1. Medir primero: tiempos por fase y diagnóstico al fallar en los tres `verify`.
2. Un proyecto piloto con los cuatro carriles. Mejor Proyecto.Finanzas: ya tiene el recorrido y el peor Dockerfile.
3. Si el piloto confirma el ahorro, escribir la convención en `preparar-proyecto` y el auditor.
4. Los otros proyectos adoptan el contrato por planes derivados del auditor.

## Decisión de la persona usuaria (13-nov): sin confirmación humana en `release`
`./verify release` es parte del proceso y no pide permiso. El control vive **dentro de `./verify`**, no en una regla de Codex ni en un hook que pregunte:
- **Resultado cacheado por contenido:** si ese nivel ya pasó para exactamente el mismo árbol de archivos (hash del diff), no se repite; imprime el resultado anterior.
- **Sin repetir a ciegas:** si el último intento falló y el árbol no cambió, se niega con el mensaje «nada cambió desde el último fallo; corrige o usa `stack`».
- **`timeout` interno** por nivel y **candado** para los niveles con Docker (ranuras según lo que muestre el experimento).
- **Registro JSONL** por corrida (nivel, duración, resultado, causa) para medir.
- Cualquier decisión de qué nivel corre en cada tramo sigue en el plan (`Verificación del tramo:`).

## No verificado
- Que el carril 2 acelere de verdad en Proyecto.Finanzas.
- Que la memoria sea la causa de los cierres de PostgreSQL.
- El efecto de `--no-cache` sobre los mounts de caché, y cualquier opción de builder remoto.
- Cómo aplicar los carriles a móvil (Proyecto.Móvil) y a WASI (Proyecto.Plataforma).

## Fuentes
- https://pnpm.io/docker
- https://depot.dev/docs/container-builds/optimal-dockerfiles/node-pnpm-dockerfile.md
- https://docs.docker.com/build/ci/github-actions/cache/
- https://docs.docker.com/build/cache/backends/local/
- https://testcontainers.com/getting-started/
- https://qaskills.sh/compare/testcontainers-vs-docker-compose
- https://www.pkgpulse.com/guides/best-monorepo-tools-2026
- https://www.pkgpulse.com/guides/turborepo-vs-nx-vs-moon-build-tools-2026
- https://oneuptime.com/blog/post/2026-01-25-docker-container-resource-constraints/view
- https://webcrawlerapi.com/glossary/playwright/how-to-fix-playwright-waitforresponse-race-condition
- https://betterstack.com/community/guides/testing/avoid-flaky-playwright-tests/
- https://www.baytechconsulting.com/blog/test-pyramid-vs-testing-trophy-whats-the-difference.md
