---
estado: borrador
rama: feature/principal-sin-ejecutar
base: main
repos: [.]
ejecutor: constructor
tramo: 1
---
# El principal planifica y revisa; no ejecuta

## Objetivo
El principal deja de editar código, pruebas y documentos del producto, de depurar entornos y de rehacer la verificación del constructor. Revisa con diff y una sola corrida de `verify`, devuelve los defectos y se detiene con un veredicto. Aplica a Claude Code, Codex y Pi (los tres leen el mismo `agentes/principal.md`).

## Supuestos
- Evidencia (Codex, 9 nov, README de Memory-AI): el constructor hizo el cambio por 0,7 créditos; el principal gastó 10 en 58 llamadas revisando, editó el README, escribió un script que levantó un servidor, corrió el `verify` con Docker para un cambio de documentos y depuró imágenes. También editó `test/pi-context.test.ts` y `test/memory-actions.test.ts` en revisiones de código.
- Causa (dos investigaciones externas y el texto propio): `agentes/principal.md` autoriza esas conductas («Sin límites de trabajo», «editas lo que el trabajo pida», «lo haces tú», «comprobación propia… que el plan no dictó») y no da criterio de parada.
- Todo defecto se devuelve al constructor, incluso una errata de una línea; si Franco prefiere una excepción, cambia un párrafo de `tramo-1.md`.
- Bloqueos duros (hooks, `tools` por agente) y `cambios/kit-run/` se deciden después de medir con el tramo 3. Si Franco los quiere ya, se agrega un tramo.
- Los precios Sol/Luna de `scripts/tarifas.json` son 10x (caché) y 20x (entrada y salida).

## Alcance
`agentes/principal.md`, `skills/planificar-cambio/SKILL.md`, `skills/ejecutar-plan/SKILL.md`, `agentes/constructor.md` (solo la línea del tipo), `verify` (nuevo paso 8i), `scripts/uso.mjs`, `pruebas/uso/`, `docs/evaluaciones/costos.md`, `AGENTS.md` (una línea).
Fuera: `modelos.json`, `instalar.sh`, `scripts/resolver.mjs`, otras skills (`definir-proyecto`, `preparar-proyecto`, `migrar-proyecto`), hooks y permisos, `cambios/hechos/`, `old/`.

## Decisiones ya tomadas
- La restricción va en el texto del principal y en la revisión acotada; los bloqueos duros esperan a la medición (en Codex los subagentes heredan el sandbox del padre y sus hooks no son una frontera completa).
- El principal sigue corriendo `verify` una vez porque la evidencia del constructor es autoinformada; lo que se elimina es el sondeo, la depuración y las comprobaciones propias. En `tipo: docs` esa corrida es la verificación liviana del plan.
- Escribe solo en `cambios/<nombre>/`, y en `AGENTS.md` y `docs/proyecto.md` durante el cierre o cuando `definir-proyecto`/`preparar-proyecto` se lo indiquen. `ejecutor: principal` sigue existiendo solo por petición expresa de Franco.
- Máximo 2 relanzamientos por defectos; después el cambio queda `parcial` y se avisa a Franco.
- No se crean `evidencia.md` ni hashes: la evidencia sigue en el plan.
- `verify` conserva todas las cadenas que ya comprueba en `agentes/principal.md` (p. ej. `Nunca decides tú`, `ceremonia de cierre`, `docker system prune`, `carga la skill \`ejecutar-plan\``).
- Ejecutor: constructor, porque los textos exactos, los archivos y las comprobaciones están escritos en los tramos y no se toca producción ni credenciales.

## Escenarios
- CUANDO se lee el principal instalado ENTONCES ninguna frase autoriza a editar el producto, hacer arreglos propios o comprobar por cuenta propia, y sí hay lista de lo permitido (A1).
- CUANDO el constructor devuelve COMPLETADO ENTONCES la revisión es diff + una corrida de `verify` + veredicto con presupuesto, y los defectos van al plan y se relanza (A2).
- CUANDO un cambio solo toca documentos ENTONCES el plan declara `tipo: docs` con verificación liviana sin build ni Docker, y el constructor pausa si el diff toca otra cosa (A3).
- CUANDO se mide una sesión ENTONCES se ven ediciones del principal fuera de lo permitido y corridas de `verify` (A4).
- CUANDO se corre `./verify` ENTONCES una copia del principal con las frases viejas falla (A5).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Principal sin permisos amplios | `rg -n 'Sin límites\|no tienes límites\|lo haces tú\|comprobación propia' agentes/principal.md` y `rg -n 'Solo creas o editas' agentes/principal.md` | Primera búsqueda sin coincidencias, segunda con una |
| A2 | Revisión acotada con veredicto | `rg -n 'APROBADO\|DEVUELTO\|PAUSA' agentes/principal.md`; revisión manual del párrafo COMPLETADO | Veredicto, presupuesto 6/15, 2 relanzamientos y «no corriges» presentes |
| A3 | `tipo: docs` definido | `rg -n 'tipo: docs' skills/planificar-cambio/SKILL.md skills/ejecutar-plan/SKILL.md` | Presente en ambas; el constructor pausa con `motivo=alcance` si el diff no es solo documentos |
| A4 | Medidor de invasión | `node pruebas/uso/probar.mjs` con fixtures de ediciones fuera de lo permitido | Pasa; un fixture sin ediciones da 0 y otro con una edición en `src/` da 1 |
| A5 | verify protege el cambio | `./verify` y la copia con una frase vieja | Verde con el principal nuevo; el paso 8i falla con la copia vieja |
| A6 | Tamaño del principal | `wc -c agentes/principal.md` | ≤ 8000 bytes (hoy 9973) |

Sensibilidad: el paso 8i del `verify` debe fallar con una copia de `agentes/principal.md` a la que se le restituya «Fuera de eso no tienes límites» o se le quite «Solo creas o editas».

## Verificación
`./verify` — corrida final desde cero (duración sin medir; anótala en Notas).

## Pasos
Un plan por tramos; cada tramo está en su archivo, que el constructor lee junto a este índice.

| Tramo | Archivo | Resultado | Estado |
| --- | --- | --- | --- |
| 1 | `tramo-1.md` | Principal reescrito con lista de permitidos, revisión acotada y veredicto | pendiente |
| 2 | `tramo-2.md` | `tipo: docs` y verificación liviana en planificar-cambio y ejecutar-plan | pendiente |
| 3 | `tramo-3.md` | Medidor de ediciones fuera de lo permitido, paso 8i en `verify`, informe | pendiente |

## Evidencia
(la escribe el constructor)

## Notas
(la escribe el constructor)
