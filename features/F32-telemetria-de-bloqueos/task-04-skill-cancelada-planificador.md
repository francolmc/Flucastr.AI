# task-04 — Skill `descomponer-feature`: estado `cancelada` con `Cancelada: motivo=`
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
`cancelada` ya es un estado válido para el validador (task-03), pero ninguna skill lo describe. Esta tarea lo agrega a la lista de estados de `descomponer-feature` con su regla (solo a pedido de Franco y con motivo de lista cerrada) y registra la frase en el manifiesto de contratos, sin superar el tope de bytes.

## Contexto
- Tocar: `skills/descomponer-feature/SKILL.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`
- Requiere: ninguno
- `skills/descomponer-feature/SKILL.md` (confirmado): la línea «Estados válidos: …» (línea 41) es la que cambia; hoy mide 6057 bytes y el tope es 6400 (`pruebas/comprobaciones/topes-bytes.test.mjs`).
- `pruebas/comprobaciones/frases-por-archivo.mjs` (confirmado): exporta `FRASES_ENTORNO` y `FRASES_POR_ARCHIVO`; la entrada `'skills/descomponer-feature'` hoy termina con `...FRASES_ENTORNO['descomponer-feature']`.
- Medido en una copia: con el texto de *Decisiones ya tomadas* la skill mide 6199 bytes y `contrato-roles` y `topes-bytes` dan `ℹ fail 0`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «5. Pieza 3 — Telemetría que da pistas»

## Decisiones ya tomadas
- En la línea 41 reemplaza «`bloqueada`. Tú solo escribes `borrador`.» por exactamente: «`bloqueada`, `cancelada`. Tú solo escribes `borrador`; `cancelada` solo si Franco lo pide, con `Cancelada: motivo=<replanificada|obsoleta|duplicada|fuera_de_alcance|otra>` en *Notas*.»
- En `frases-por-archivo.mjs` agrega `export const FRASES_TELEMETRIA = { 'descomponer-feature': ['Cancelada: motivo=<replanificada|obsoleta|duplicada|fuera_de_alcance|otra>'] };` después de `FRASES_ENTORNO` y esparce `...FRASES_TELEMETRIA['descomponer-feature']` al final de la entrada `'skills/descomponer-feature'`. Las tareas 05 y 09 agregan sus claves al mismo objeto.
- Ninguna otra frase del skill cambia; el tope no se toca.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: la línea de estados y la frase del manifiesto.
Fuera de alcance: `WORKFLOW.md` §6 y §10.2 (la regla de candidata a archivar exige todas las tareas `hecha`; queda para la puerta 1), `agentes/planificador.md`, subir cualquier tope.

## Pasos
1. En `skills/descomponer-feature/SKILL.md` aplica el reemplazo exacto de la línea 41.
2. En `pruebas/comprobaciones/frases-por-archivo.mjs` agrega `FRASES_TELEMETRIA` y esparcirla en la entrada de la skill.
3. Corre la verificación.

## Criterios de aceptación
1. La skill contiene la frase con `Cancelada: motivo=<replanificada|obsoleta|duplicada|fuera_de_alcance|otra>`; se comprueba con `contrato-roles.test.mjs`.
2. La skill mide 6400 bytes o menos; se comprueba con el segundo comando.
3. Los demás contratos no cambian; se comprueba con `topes-bytes.test.mjs`.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E "^ℹ fail"
test $(wc -c < skills/descomponer-feature/SKILL.md) -le 6400 && echo "descomponer-feature dentro del tope"
```
Esperado: `ℹ fail 0` y `descomponer-feature dentro del tope`.

## Evidencia

Medición antes: `wc -c` de `skills/descomponer-feature/SKILL.md` = 6057 B (tope 6400), `agentes/planificador.md` = 3576 B.

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0

$ test $(wc -c < skills/descomponer-feature/SKILL.md) -le 6400 && echo "descomponer-feature dentro del tope"
descomponer-feature dentro del tope
exit 0
```

Comando adicional (medición después del cambio):

$ wc -c skills/descomponer-feature/SKILL.md agentes/planificador.md
    6199 skills/descomponer-feature/SKILL.md
    3576 agentes/planificador.md
    9775 total
exit 0

Comando adicional (tope y frase):

$ grep -n "6400" pruebas/comprobaciones/topes-bytes.test.mjs | head -3
23:  { ruta: 'skills/descomponer-feature/SKILL.md', tope: 6400, opcional: false },
exit 0

$ grep -c "Cancelada: motivo=<replanificada|obsoleta|duplicada|fuera_de_alcance|otra>" skills/descomponer-feature/SKILL.md
1
exit 0

Comando adicional (segunda pasada de la verificación, con conteo completo; salida redirigida a un archivo temporal y luego filtrada):

$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs > /tmp/x 2>&1; grep -E "^ℹ (tests|pass|fail)" /tmp/x
ℹ tests 130
ℹ pass 130
ℹ fail 0
exit 0

Comando adicional (suite rápida de pruebas/, para comparar con la base):

$ node --test $(find pruebas -name "*.test.mjs")
ℹ tests 651
ℹ pass 644
ℹ fail 7
exit 1

Anotación del constructor: los 7 fallos son los de la base (F26 de BACKLOG, 2 de lectura acotada, 1 de modelos.json en agente, 2 de WORKFLOW.md y «los archivos reales cumplen la regla»); no los causa esta tarea. El total de 651 difiere de la base de 621 porque la cuenta se hizo sobre todos los `*.test.mjs` de `pruebas/`; los fallos coinciden por nombre.

## Notas
Huecos menores: ninguno. Decisión de alcance: el reemplazo de la línea 41 se aplicó tal cual está en *Decisiones ya tomadas*; el tope de 6400 no se tocó y `agentes/planificador.md` sigue en 3576 B.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
