---
estado: borrador
rama: fix/una-espera-write-stdin
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Una sola espera con `write_stdin`: menos avisos «Send input to terminal»

## Objetivo
Que en Codex un `verify` largo pida a Franco permiso una vez al esperar, no 20 a 300 veces. Cada `write_stdin` a una terminal lanzada fuera del sandbox (Docker) pregunta «Would you like to send input to terminal N?».

## Supuestos
- El número de avisos es el de llamadas `write_stdin` (no se puede aprobar por regla: no es un comando). Si Franco quiere además silenciar los avisos desde Codex, es configuración de Codex y queda fuera de este plan.
- `yield_time_ms: 1800000` lo admite el lanzador porque `codex-<agente>` ya fija `background_terminal_max_timeout=1800000`. Si una sesión lo rechaza, el agente usa el valor más alto que acepte, nunca un bucle.

## Alcance
Puede cambiar: `skills/ejecutar-plan/SKILL.md` (línea de comandos largos), `agentes/constructor.md` (la misma línea), `agentes/principal.md` (viñeta de Codex del paso 5) y `verify` (bloque nuevo 8p).
Fuera: `modelos.json`, `instalar.sh`, `scripts/`, los proyectos que usan el kit.

## Decisiones ya tomadas
- Ejecutor: constructor, porque los cuatro sí de la prueba: texto y comprobaciones definidos, archivos accesibles, sin credenciales ni producción.
- Evidencia (`~/.codex/sessions/2026/11/1[0-3]`, conteo de `write_stdin` por sesión): DonFinancio 236, 329 y 179; Byteria 330. Casi todos con `yield_time_ms` de 30000 o 1000, es decir, sondeo cada 30 s o cada 1 s.
- La instrucción actual solo cubre «cell ID N → `wait`». Cuando `exec_command` devuelve un `session_id`, el agente no tiene receta y sondea. Se añade esa receta, sin quitar la de `wait`.
- Receta nueva, en una línea: si `exec_command` devuelve un `session_id`, **una sola** llamada `write_stdin` con `chars` vacío y `yield_time_ms: 1800000`; repetirla solo mientras siga corriendo, nunca cada 30 s ni cada 1 s.
- Se conservan «una sola espera» y `yield_time_ms: 300000` de `principal.md` (los exigen los bloques 8k y 8l de `verify`).

## Escenarios
- CUANDO se leen `ejecutar-plan` y `constructor.md` ENTONCES traen la receta de `session_id` con `write_stdin` y `yield_time_ms: 1800000` (A1).
- CUANDO se lee `principal.md` ENTONCES su viñeta de Codex menciona `session_id` y prohíbe repetir `write_stdin` cada pocos segundos (A2).
- CUANDO una copia de `ejecutar-plan` pierde `1800000` ENTONCES el bloque 8p de `verify` falla (A3).
- CUANDO se corre el kit ENTONCES los bloques existentes siguen pasando (A4).
- CUANDO se usa Codex de verdad tras reinstalar ENTONCES un `verify` largo tiene como mucho 2 llamadas `write_stdin` (A5, revisión manual).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Receta en skill y agente | `grep -cF '1800000'` en `skills/ejecutar-plan/SKILL.md` y `agentes/constructor.md` | 1 o más en cada uno |
| A2 | Receta en principal | `grep -nF 'session_id' agentes/principal.md` | una coincidencia dentro de la viñeta de Codex del paso 5 |
| A3 | El chequeo es sensible | copia de `ejecutar-plan` con `sed` que cambia `1800000`; correr la función del bloque 8p | falla para la copia, pasa para el original |
| A4 | No se rompe lo vecino | `./verify` | exit 0 con `ok 8k`, `ok 8l` y `ok 8p` |
| A5 | Efecto real | tras `bash instalar.sh`, un plan con `verify`; luego `node scripts/uso.mjs --sesiones` o contar `write_stdin` en el log | 2 o menos por corrida (lo mira Franco o el principal en un uso real) |

## Verificación
`./verify` — offline, sin Docker del proyecto; debe terminar en exit 0.

## Pasos
- [ ] En `skills/ejecutar-plan/SKILL.md`, línea de comandos largos: añade al final de la receta de Codex «Si devuelve un `session_id`, una sola llamada `write_stdin` con `chars` vacío y `yield_time_ms: 1800000`; no la repitas cada pocos segundos» (A1)
- [ ] En `agentes/constructor.md`, la misma línea con la misma frase, igual que la skill (A1)
- [ ] En `agentes/principal.md`, viñeta de Codex del paso 5: añade la misma regla para `session_id` y deja intactas «una sola llamada `wait`» y `yield_time_ms: 300000` (A2)
- [ ] En `verify`, bloque 8p copiando el patrón del 8l: exige `1800000` en `ejecutar-plan` y `constructor.md` y `session_id` en `principal.md`; copia negativa con `sed` (A3)
- [ ] Corre `./verify` y pega la cola en *Evidencia* (A4)

## Evidencia
(la escribe el constructor)

## Notas
(la escribe el constructor)
