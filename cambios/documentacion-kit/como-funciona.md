# Flucastr.AI — cómo funciona (2026-11-14)

Documento de lectura para Franco. Todo lo que dice "medido" salió de corridas reales de esta semana; lo que dice "no probado" no lo hemos visto funcionar. Está escrito desde el código y los textos del repo, no desde la memoria.

## 1. Qué es, en una frase
Un kit de dos agentes (`principal` y `constructor`) y seis skills que se instalan en Claude Code, Pi y Codex. El principal piensa y revisa; el constructor edita código siguiendo un plan escrito; tú apruebas el plan y revisas la evidencia. Lo único que viaja entre los agentes es `cambios/<nombre>/plan.md`.

## 2. Mapa del repositorio
| Ruta | Para qué sirve | Tamaño |
| --- | --- | --- |
| `agentes/principal.md`, `agentes/constructor.md` | Las instrucciones de cada agente | 67 y 35 líneas |
| `skills/` (6) | Procedimientos que los agentes cargan: `planificar-cambio`, `ejecutar-plan`, `preparar-proyecto`, `definir-proyecto`, `migrar-proyecto`, `disenar-experiencia` | 42–115 líneas cada una |
| `modelos.json` | Fuente única de qué modelo y esfuerzo usa cada agente en cada herramienta | 65 líneas |
| `instalar.sh` / `desinstalar.sh` | Instalan agentes, skills, lanzadores y reglas de permisos | 1.092 líneas |
| `verify` | Comprueba el propio kit (offline, ~1.200 líneas, bloques 1 a 8t) | |
| `scripts/` | `resolver.mjs` (traduce niveles a modelos y reglas de Codex), `kit-run.mjs` (ejecuta un plan en Codex de punta a punta), `uso.mjs` (mide tokens y créditos), `observar.mjs` (mide Docker) | |
| `docs/` | Prácticas por tecnología, reglas deny, `kit run`, evaluaciones e investigaciones | |
| `cambios/` | Un directorio por cambio con su `plan.md`; `hechos/` es el archivo | |
| `old/v1/` | La versión 1, no se ejecuta | |

## 3. El ciclo de un cambio
```
 Franco pide algo
        │
        ▼
 principal: entiende, lee AGENTS.md, diagnostica con evidencia
        │
        ├── ¿cambio pequeño? (6 condiciones) ──► lo edita en línea ──► Franco commitea
        │
        ▼ (todo lo demás)
 principal escribe cambios/<n>/plan.md  (estado: borrador)
        │
        ▼
 ★ PUERTA 1: Franco dice "sí" ──► estado: aprobado
        │
        ▼
 principal comprueba base limpia ──► lanza al constructor (subagente o ventana propia)
        │
        ▼
 constructor: crea la rama, hace los pasos, corre verify, escribe Evidencia
        │            └─ si no puede: PAUSA (plan queda "parcial")
        ▼
 principal revisa: diff + Aceptación (+ verify una vez si el riesgo es alto)
        │            └─ defecto ──► DEVUELTO (hasta 2 relanzamientos)
        ▼
 ★ PUERTA 2: Franco revisa la evidencia ──► principal cierra (AGENTS.md + mueve a hechos/)
        │
        ▼
 Franco hace commit, push y PR
```
Por tramos: un plan largo se parte en `### Tramo N`; el constructor hace uno, el principal lo revisa, y recién entonces avanza.

## 4. Los dos agentes
**Principal** (nivel medio). Puede leer, correr comandos de lectura y escribir solo en `cambios/` (más `AGENTS.md` y `docs/proyecto.md` al cerrar). Desde hoy edita en línea un "cambio pequeño". Nunca: commit, push, PR, merge, despliegue, leer `.env`. Único git de escritura: `switch -c` para crear la rama. Termina cada respuesta en ≤5 líneas.

**Constructor** (nivel bajo). Solo arranca con `estado: aprobado`. Cambia código solo dentro de *Alcance*; en el plan solo escribe casillas, *Evidencia* y *Notas*. No pregunta ni llama a otros agentes: si no puede, devuelve `PAUSA`. Su primera línea final es `COMPLETADO: …` o `PAUSA: … motivo=<ambiguo|diseño|alcance|acceso|verify>`.

**Cambio pequeño** (definición cerrada en `agentes/principal.md`): una intención, un repo, ≤2 archivos de producto y ≤30 líneas, sin funcionalidad nueva, sin tocar datos/seguridad/dinero/contratos/migraciones/dependencias/Docker/`verify`/despliegue, con comprobación escrita antes. Ante la duda, constructor. Tú puedes vetar diciendo "por plan".

## 5. El plan (`plan.md`)
Frontmatter: `estado`, `rama`, `base`, `repos`, `ejecutor`, `tramo`, `tipo`. Secciones: Objetivo, Supuestos, Alcance, Decisiones ya tomadas, Escenarios, **Aceptación** (tabla A1, A2… con comprobación y resultado esperado), Verificación, Pasos, Evidencia, Notas.

Estados: `borrador` (principal) → `aprobado` (tú, vía el principal) → `en curso` (constructor) → `listo` o `parcial`. Al cerrar, la carpeta se mueve a `cambios/hechos/` **sin cambiar el estado**: la carpeta es la marca.

Reglas del buen plan (resumen de las 14 de `planificar-cambio`): un solo plan por recorrido completo; un comando de verificación; pasos atómicos; decisiones cerradas antes de aprobar; duración estimada en pasos pesados; tramos si pasa de ≈6 pasos o ≈20 min; niveles de verificación; `tipo: docs` con verificación liviana.

## 6. Verificación en tres niveles
1. **Nivel 1 `Comprobación rápida`** (línea de `AGENTS.md`): lint y pruebas en el host, sin Docker, segundos.
2. **Nivel 2 `VERIFY_RAPIDO=1 ./verify`**: Docker con caché. Medido en DonFinancio: 109 s con los Dockerfiles nuevos.
3. **Nivel 3 `./verify` sin caché**: aceptación final. Medido: 22–24 min, igual que antes (la caché de pnpm no se reutiliza con `--no-cache`).

"Hecho" = `./verify` pasa desde cero. Tope del constructor: 3 corridas finales.

## 7. Modelos y herramientas
`modelos.json` define tres niveles (alto/medio/bajo) y los traduce por herramienta:
- Claude Code: Opus 5.5 / Sonnet 5.5 / Haiku 5.5.
- Pi y Codex: gpt-6.1-sol / gpt-6.1-terra / gpt-6-luna.
Hoy: principal = nivel medio, esfuerzo `medium`; constructor = nivel bajo, esfuerzo `high`.

`instalar.sh` crea agentes (copia), skills (enlaces), lanzadores `claude-/pi-/codex-<agente>` y, con `--proyecto`, reglas deny (sin commit/push/merge/PR, sin `bash -c`, sin leer `.env` en Claude). Codex además recibe reglas `allow` por prefijo (`./verify`, `docker compose …`, `pnpm …`): son la causa de que algunos comandos pidan permiso y otros no.

**`kit run`** (solo Codex): ejecuta constructor → verificación → revisión de solo lectura, con hasta 2 relanzamientos. Existe y pasa sus pruebas simuladas; en una corrida real de piloto la revisión costó 6,6 veces la del constructor (meta: 3).

## 8. Medición
- `node scripts/uso.mjs [--sesiones]`: tokens y créditos por día, proyecto y modelo.
- `node scripts/observar.mjs start|status|stop|informe`: observador de Docker de solo lectura (memoria, OOM, unhealthy, caché de builds). **Hoy está corriendo.** Muere con reinicio o `wsl --shutdown`.

## 9. Cómo se garantiza que el kit mismo funciona
`./verify` del kit comprueba, sin red: que `modelos.json` coincide con los agentes, que las skills están completas, que `instalar.sh --simular` no escribe, las reglas deny, y que cada regla de texto importante sigue escrita (bloques 8k, 8l, 8t…, cada uno con una copia negativa que debe fallar). **No mide si el modelo obedece**: solo que el texto está.

## 10. Lo que NO está probado
- Una sesión completa de Codex con el kit actual (hay uso real, no una evaluación).
- Que el principal respete la definición de "cambio pequeño" (recién escrita).
- La receta de Docker fuera de Node/pnpm.
- Que PostgreSQL se cierre por memoria (hipótesis); el volcado de logs y el observador existen para probarlo.
- Que `proceso-liviano` ahorre algo: criterio de éxito = 3 cambios seguidos con un cambio pequeño en 1 ventana.

## 11. Inconsistencias que encontré al escribir esto (para corregir)
1. `README.md` y `AGENTS.md` dicen principal `low` y constructor `medium`; `modelos.json` dice `medium` y `high`. El `verify` no lo detecta.
2. `README.md` lista 3 skills (y "las tres skills" en Estructura); son 6.
3. `README.md` dice que Codex está "sin probar en una sesión real"; ya se usó.
4. `AGENTS.md` línea del medidor y el nombre `Mejora sugerida` están bien, pero el README no menciona `docs/practicas-por-tecnologia.md`.

## 12. Dónde se puede mejorar (ordenado por evidencia, no por gusto)
| # | Mejora | Evidencia | Costo |
| --- | --- | --- | --- |
| 1 | Corregir las 4 inconsistencias de arriba (y un chequeo en `verify` para modelos/esfuerzo) | Hallazgo directo de hoy | Bajo |
| 2 | Reducir el costo de revisión (6,6× el del constructor): prefijo fijo de ≈19 mil tokens | Medido en el piloto A4 | Medio; hipótesis sin probar |
| 3 | Evitar que el recorrido de navegador falle sin decir qué recibió (`ERR_ASSERTION` mudo) | 4 devoluciones en F10 y 2 fallos de hoy | Bajo, en cada proyecto |
| 4 | Aplicar la receta de Docker a Andes (6 de 7 Dockerfiles) y DASH `MobileRider` | `grep` por líneas; sin medir | Bajo por proyecto |
| 5 | Declarar `Comprobación rápida` en los proyectos que no la tienen | Ningún proyecto la declaraba | Bajo |
| 6 | `una-espera-write-stdin` (avisos de permiso de Codex por cada `write_stdin`) | 179–330 llamadas medidas por sesión | Medio |
| 7 | Cortar tramos por capa | Propuesta de un informe externo; sin medir | Bajo, solo texto |
Reserva (no hacer sin dolor medido en 2 productos): auditor de verificación, candado de Docker, carriles `static/int/stack/release`, `proceso-rapido`.

## 13. Decisiones que son tuyas
- Si el principal debe poder cambiar de rama o hacer más git (hoy solo `switch -c`).
- Si `kit run` se extiende a Claude Code y Pi, o se congela hasta que el piloto A4 cumpla.
- La fecha de congelamiento del kit (el informe externo propuso el 17-nov) y qué producto va primero.
