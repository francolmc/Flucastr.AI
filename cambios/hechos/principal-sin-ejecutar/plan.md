---
estado: listo
rama: feature/principal-sin-ejecutar
base: main
repos: [.]
ejecutor: constructor
tramo: 3
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
| 1 | `tramo-1.md` | Principal reescrito con lista de permitidos, revisión acotada y veredicto | listo |
| 2 | `tramo-2.md` | `tipo: docs` y verificación liviana en planificar-cambio y ejecutar-plan | listo |
| 3 | `tramo-3.md` | Medidor de ediciones fuera de lo permitido, paso 8i en `verify`, informe | listo |

## Evidencia
Tramo 1.

$ rg -n 'Sin límites|no tienes límites|lo haces tú|comprobación propia' agentes/principal.md
(sin coincidencias)

$ rg -n 'Solo creas o editas' agentes/principal.md
15:- Puedes leer y correr comandos de lectura. Solo creas o editas archivos dentro de `cambios/<nombre>/`, …

$ wc -c agentes/principal.md
7998 agentes/principal.md

$ ./verify
 A5b: Créditos y sondeos de Pi con tarifa de fixture; una tarifa distinta cambia creditos (sensibilidad)
ok A5c: Sin tarifa del modelo, creditos es null (no 0); los sondeos se miden igual; tarifas.json trae las tres tarifas
ok A5d: Tarifas ilegibles avisan y dejan creditos en null sin salir con error
pruebas del medidor: 18 de 18 ok
ok 12: pruebas del medidor pasaron sobre los fixtures
VERIFY OK
exit 0

(`./verify` corrió dos veces: la primera con el principal de 8011 bytes, pasó; esta es la corrida final, con 7998 bytes.)

Relanzamiento 1 (constructor, tramo 1, sección «Correcciones de la revisión»). `wc -c agentes/principal.md` = 7956.

$ ./verify
... (cola, salida completa en la corrida) ...
pruebas del medidor: 18 de 18 ok
ok 12: pruebas del medidor pasaron sobre los fixtures
VERIFY OK
exit 0

Aviso no bloqueante de `./verify`: «AVISO 10: falta pruebas/comparar-openspec/ (pruebas/ está en .gitignore); paso omitido». No cambia el exit.

Tramo 2 (constructor).

$ rg -n '^tipo:' skills/planificar-cambio/SKILL.md
27:tipo: codigo   # docs si el cambio solo toca documentos (regla 12)

$ wc -c agentes/principal.md skills/planificar-cambio/SKILL.md skills/ejecutar-plan/SKILL.md
7980 agentes/principal.md
10279 skills/planificar-cambio/SKILL.md
5941 skills/ejecutar-plan/SKILL.md

$ rg -c 'Solo creas o editas' agentes/principal.md
1

$ ./verify
ok A5d: Tarifas ilegibles avisan y dejan creditos en null sin salir con error
pruebas del medidor: 18 de 18 ok
ok 12: pruebas del medidor pasaron sobre los fixtures
VERIFY OK
exit 0

## Notas
- Tramo 2 (constructor): `tramo-2.md` no trae encabezado `### Tramo 2`; se ejecutaron sus pasos (sección «## Pasos») como los del tramo. `estado: en curso` se puso tras los pasos de edición, no al inicio (omisión menor, corregida antes del verify).
- Tramo 2: `agentes/constructor.md` no se cambió; su *Límites* (líneas 11, 16 y 23) remite a `ejecutar-plan`.
- Tramo 2: el paso 12 cambió solo «dentro de `cambios/<nombre>/`» por «dentro de `cambios/`» y añadió «(y el `.gitignore` del workspace)». `agentes/principal.md` queda en 7980 bytes.
- Paso 2: la frase citada «El diagnóstico lo haces tú…» contiene «lo haces tú», que la comprobación A1 prohíbe. Se redactó «El diagnóstico es tuyo…» con el resto igual. Si Franco prefiere la frase literal, A1 falla y hay que cambiar el criterio.
- Paso 5: el texto citado dice «no lo corriges»; se escribió «no corriges;» en la misma frase, porque A2 busca «no corriges».
- Recorte a 7998 bytes (A6): «Lectura» se condensó en una línea del paso 1; «Cuándo preguntar» en dos frases; «Revisión por tramo» pasó de viñetas a párrafo; la espera de Codex, Claude Code y Pi en «Cómo trabajas» 4 quedó resumida. Ninguna cadena de `verify` ni de *Decisiones* se perdió.
- Paso 19 (fuera de alcance, no cambiado): `skills/preparar-proyecto/SKILL.md` línea 90 manda crear `verify` y `cambios/` en la raíz del workspace, y `skills/definir-proyecto/SKILL.md` línea 26 crea `cambios/.gitkeep`. Ambas quedan fuera de la lista de escritura del principal (`cambios/<nombre>/`, `AGENTS.md`, `docs/proyecto.md`). Franco decide si la lista se amplía.
- Duración de `./verify`: no medida.
- Fuera de tramo 1 no se tocó nada: ni `tramo-2.md`, ni `tramo-3.md`, ni las skills ni `verify`.
- Relanzamiento 1 (constructor): `tramo-1.md` no trae encabezado `### Tramo 1`; se ejecutaron sus pasos pendientes de «Correcciones de la revisión» (5 casillas, 0 al terminar). Recortes para ≤ 8000 bytes: se quitó el porqué del costo en el párrafo inicial, la frase «El plan es el traspaso…» del paso 4, y los comandos Docker concretos del paso 5 (queda «nunca `docker system prune`»). Se restituyó la exigencia de base al día en el paso 4.

Revisión del principal, tramo 1 (DEVUELTO, relanzamiento 1 de 2):
- Cumple: A1 (sin frases viejas, lista de permitidos), A2 (veredicto, presupuesto 6/15, 2 relanzamientos), A6 (7998 bytes) y las 12 cadenas de `verify`. El cambio «El diagnóstico es tuyo» queda aceptado.
- Defecto 1 (formato): en *Reglas duras*, «Nunca decides tú…» y «Ante «prepárame el despliegue»…» quedaron en una sola línea (falta el salto). Además se perdió «La detección de hijos con `.git` es un hecho; la decisión es suya.»
- Defecto 2 (regresión): se perdió la comprobación de base *al día* (`git fetch` y `git rev-list --count HEAD..origin/<base>` en 0; sin remoto se omite). `ejecutar-plan` no la trae, así que el paso 4 ya no la exige.
- Defecto 3 (contradicción): *Revisión por tramo* dice «se corrige o se pausa» y choca con «no corriges»; debe decir «se devuelve al constructor o se pausa».
- Notas sobre `preparar-proyecto` y `definir-proyecto` (crean `verify` y `cambios/.gitkeep`): decisión pendiente de Franco; no se cambia nada.

Veredicto del principal, tramo 1: APROBADO (2.º intento). Defectos 1–3 corregidos (comprobados con grep en `agentes/principal.md`, 7956 bytes). Mi corrida de `./verify`: exit 0, `VERIFY OK`, medidor 18/18. Log: `/tmp/psej-t1-principal.log`.

Resumen de cierre del tramo 1:
- `agentes/principal.md` reescrito: lista de lo permitido, revisión acotada, veredicto APROBADO/DEVUELTO/PAUSA, presupuesto 6/15, máximo 2 relanzamientos.
- 7956 bytes (hoy 9973); las 12 cadenas de `verify` siguen presentes.
- Pendiente de Franco: ampliar o no la lista de escritura por `preparar-proyecto` y `definir-proyecto`.
- Sigue tramo 2: `tipo: docs` y verificación liviana en `planificar-cambio` y `ejecutar-plan`.
- Antes de lanzarlo, `/compact` o sesión nueva con la ruta del plan.

Veredicto del principal, tramo 2: APROBADO. Diff revisado: `tipo:` en la plantilla y regla 12 (planificar-cambio, 10279 B), comprobación `tipo: docs` con `PAUSA motivo=alcance` (ejecutar-plan, 5941 B), `cambios/` y `.gitignore` del workspace en principal (7980 B). Mi `./verify`: exit 0, `VERIFY OK`, log `/tmp/psej-t2-principal.log`. Defecto menor que se me pasó en el tramo 1, enviado al tramo 3: en `agentes/principal.md` dos viñetas pegadas en el paso 4 («…solo ese tramo.   - En planes pesados…») y falta línea en blanco antes de `## Revisión por tramo`.

Tramo 3 (constructor). Las dos viñetas del paso 4 y la línea en blanco están corregidas. Medidor, fixtures, pruebas, paso 8k, costos y AGENTS.md hechos (ver `tramo-3.md`).

$ node pruebas/uso/probar.mjs
ok A4i: Medidor de invasión: ediciones fuera de cambios/ y corridas de ./verify por sesión principal, en las tres herramientas
pruebas del medidor: 19 de 19 ok
exit 0

$ ./verify
ok 8k: principal con «Solo creas o editas», «APROBADO», «no corriges» y «una sola espera»; copias sin la lista o con la frase vieja fallan
ok 12: pruebas del medidor pasaron sobre los fixtures
VERIFY OK
exit 0

$ wc -c agentes/principal.md AGENTS.md
7982 agentes/principal.md
5574 AGENTS.md

Tramo 3: `./verify` corrió dos veces con exit 0 (la primera como diagnóstico, la segunda con la salida guardada en el scratchpad). La salida completa está en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/130cd7b4-aa17-47e9-9b0f-adb9d37e7121/scratchpad/verify-tramo3.log`.

Notas del tramo 3 (constructor):
- El paso «8i» que pide `tramo-3.md` ya lo usa el bloque del constructor en `verify`; el medidor de invasión quedó en el paso «8k» (no se renumeró nada).
- `estado: en curso` se puso antes de tocar archivos (sección «Antes de empezar», paso 3).
- La tabla «Pasos» de este `plan.md` queda como estaba (la fila del tramo 3 sigue «pendiente»); la actualiza el principal al revisar.
- Una corrida de diagnóstico guardó su salida en `/tmp` en vez del scratchpad; no cambia el resultado.
- Duración de `./verify`: no medida.
- Recorte de A6: `agentes/principal.md` queda en 7982 bytes (≤ 8000); `AGENTS.md` en 5574 bytes (≤ 5600).

Revisión del tramo 3 (principal): APROBADO. Diff revisado (uso.mjs, probar.mjs, fixtures, verify 8k, costos.md, AGENTS.md 5574 B, principal.md 7982 B con viñetas separadas). Mi `./verify`: exit 0, VERIFY OK, medidor 19/19 (log en el scratchpad, verify-t3-principal.log). Paso 8i quedó como 8k porque 8i ya existía. Pendiente de Franco: instalar y medir sesiones nuevas.
