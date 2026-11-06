# task-09 — El coordinador no enruta `BLOQUEO: rol=franco`
repo: Flucastr.AI   depende_de: task-08   estado: hecha

## Descripción
Un `BLOQUEO` de entorno lleva `rol=franco`: el aviso va solo a Franco, sin delegar a `planificador` ni `arquitecto`. Hoy la regla del coordinador solo exceptúa `motivo=lectura:`. Se amplía con un cambio mínimo de ≈ 17 B y se prueba que ningún tope sube.

## Contexto
- Tocar: `agentes/coordinador.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`
- Requiere: ninguno
- `agentes/coordinador.md` (confirmado, 7088 B, tope 7168): la línea 74 termina «…quítalo al resolverse. Con `motivo=lectura:` no delegues la lectura: pregunta a Franco.»
- `frases-por-archivo.mjs` (confirmado): `FRASES_LECTURA_EXTRA.coordinador` incluye `'motivo=lectura:'` (línea 79), así que esa frase debe seguir presente; `FRASES_ENTORNO` viene de task-07/08 (lee solo sus *Notas*).
- `agentes/coordinador.md` no se cita por otra regla de `rol=franco` (confirmado con `grep`): la única mención de `rol=franco` está en `skills/lectura-extra/SKILL.md`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «8. Decisiones para Franco»

## Decisiones ya tomadas
- La oración final de la línea 74 pasa a: «Con `rol=franco` (`motivo=lectura:` o `entorno:`) no delegues: pregunta a Franco.» (+17 B).
- Manifiesto: `FRASES_ENTORNO` agrega `coordinador: ['`rol=franco`', 'o `entorno:`']` y `'agentes/coordinador'` agrega `...FRASES_ENTORNO.coordinador`.
- Ningún tope sube: `agentes/coordinador.md` ≤ 7168 B.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: una oración y el manifiesto.
Fuera de alcance: `skills/modo-yolo/SKILL.md` (si `rol=franco` por entorno detiene el modo yolo queda para Franco: tocarlo exige otra tarea), `skills/comandos-coordinador`, la plantilla de encargo, `definitions/`.

## Pasos
1. En `agentes/coordinador.md`, reemplaza la oración final de la línea 74.
2. Mide con `wc -c agentes/coordinador.md`; debe ser ≤ 7168.
3. Agrega las frases al manifiesto.
4. Corre la verificación.

## Criterios de aceptación
1. La oración nueva está y la frase `motivo=lectura:` se conserva; se comprueba con `grep -c`.
2. `agentes/coordinador.md` ≤ 7168 B; se comprueba con `wc -c`.
3. Contratos y topes pasan; se comprueba con `node --test`.

## Verificación
```
wc -c agentes/coordinador.md
grep -c "Con \`rol=franco\` (\`motivo=lectura:\` o \`entorno:\`)" agentes/coordinador.md
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/lectura-extra.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Esperado: `agentes/coordinador.md` ≤ `7168` (hoy 7088, con la oración nueva ≈ 7105); `1`; `ℹ fail 0` (medido hoy: `ℹ tests 132`, `ℹ pass 132`; estos cuatro archivos no incluyen los 6 fallos preexistentes).

## Evidencia

Tamaño de `agentes/coordinador.md`: antes 7088 B; después 7105 B; tope 7168 (`7168`), sin cambio de tope.

```
$ wc -c agentes/coordinador.md
    7105 agentes/coordinador.md
exit 0

$ grep -c "Con \`rol=franco\` (\`motivo=lectura:\` o \`entorno:\`)" agentes/coordinador.md
1
exit 0

$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/lectura-extra.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 138
ℹ pass 138
ℹ fail 0
exit 0
```

Pasada 2 (misma verificación, con código de salida de `node` capturado en archivo): `ℹ tests 138`, `ℹ pass 138`, `ℹ fail 0`, salida 0.

Referencia del *Esperado* al planificar: `ℹ tests 132`, `ℹ pass 132`; la corrida actual da 138 y 138 (diferencia de conteo anotada en *Notas*, sin fallos).

## Notas
- Oración final de la línea 74 cambiada según *Decisiones ya tomadas*: ahora «Con `rol=franco` (`motivo=lectura:` o `entorno:`) no delegues: pregunta a Franco.» (7088 → 7105 B).
- Manifiesto: `FRASES_ENTORNO.coordinador = ['`rol=franco`', 'o `entorno:`']` y `'agentes/coordinador'` incluye `...FRASES_ENTORNO.coordinador`. `motivo=lectura:` se conserva en `FRASES_LECTURA_EXTRA.coordinador` (1 coincidencia en el archivo).
- Huecos menores: (1) el conteo de tests es 138/138 y no 132/132 como dice el *Esperado*; `fail 0` se cumple, así que no lo tomé como fallo; no investigué la causa del aumento. (2) `estado: en curso` se puso después de editar los archivos y no antes; el contenido final es el mismo.
- Modo yolo: sin rama, sin `git switch`, sin commit. Ningún comando contra el HOME real; no se ejecutó `instalar.sh` ni `desinstalar.sh`.
- Verificación: 2 pasadas, ambas `ℹ fail 0`. El `exit 0` del tercer bloque de la pasada 1 es el del pipeline (`grep`): zsh no expuso `PIPESTATUS`, así que el código de `node` se capturó en la pasada 2.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
