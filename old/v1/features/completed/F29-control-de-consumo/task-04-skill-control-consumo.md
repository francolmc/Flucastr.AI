# task-04 — Crear la skill control-consumo y activarla desde el coordinador
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
Crea el módulo `skills/control-consumo/SKILL.md` (≤ 4096 B) con las reglas de consumo del `coordinador`: `STATUS.md` en una sola escritura por transición, lectura de `--presupuesto`, qué hacer en `excedido` y `Retomar:`. Como las pruebas de estructura exigen la skill en el árbol del `README.md` y mencionada en un agente, añade también la línea del README y una frase de activación (37 B) en `agentes/coordinador.md`, compensada con un recorte. Reescribir el bloque «Formato de STATUS.md» es task-06.

## Contexto
- Tocar: `skills/control-consumo/SKILL.md`, `README.md`, `agentes/coordinador.md`
- Fuente: definitions/CONSUMO.md «(d) Dónde vive el texto»
- Modelo de módulo: `skills/ramas-feature/SKILL.md` (front matter con `name` y `description` entre comillas dobles).
- `README.md`: en el árbol de `## Estructura`, dentro de `skills/`, tras `│   ├── comandos-coordinador/` y antes de `│   └── ejecutar-tarea/` (líneas 90-91).
- `agentes/coordinador.md` (7132 B, tope 7168 en `topes-bytes.test.mjs`): el paso 2 de `## Cómo avanzas` termina en `(`Edit` de «Paso actual»)`; la línea `Carga `comandos-coordinador` antes de delegar `descomponer-feature`, al cerrar una feature o sin subagentes.` está bajo `## Ramas por feature`.
- Las reglas están resumidas abajo; no hace falta leer `definitions/CONSUMO.md`.

## Decisiones ya tomadas
- Front matter: `name: control-consumo`; `description` ≤ 160 caracteres.
- El cuerpo contiene, con estas frases literales: «Una escritura por transición: un solo `Write` con el archivo completo»; la plantilla (`# Estado` y las siete líneas `Escalación:`, `Paso actual:`, `Presupuesto:`, `Espera a Franco:`, `Bloqueos abiertos:`, `Retomar:`, `Actualizado:`, con `Presupuesto: <Fxx>; rondas arq=<n> plan=<n>; ampliado=<n>`); «cada ítem ≤150 caracteres», tope 1536 B, sin historia.
- Transición = cambio de rol, de puerta o de estado. Entre dos transiciones no se toca `STATUS.md`; lo devuelto por un rol se incorpora en la escritura siguiente. Al delegar al `arquitecto` o al `planificador`, suma 1 a `arq` o `plan` en esa escritura; en una feature nueva, `Presupuesto:` vuelve a ceros.
- Presupuesto: al inicio de cada transición corre `node ~/.flucastr-ai/validar-tarea.mjs --presupuesto features/Fxx-nombre` y lee solo la línea `Presupuesto Fxx: ...`. Con `estado=excedido` no delegas: en *Escalación* pones la causa y tres opciones cerradas (A ampliar el tope en N delegaciones y anotar `ampliado=N`; B replantear lo bloqueado con `arquitecto` o `planificador`, cuenta como ronda; C cerrar la sesión y revisar a mano) y te detienes. Si sale con 1 por `STATUS.md`, reescríbelo con la plantilla en la transición siguiente.
- «abre sesión nueva»: díselo a Franco, tras dejar `Retomar:` (feature, paso exacto, rama, qué espera de Franco), al confirmar una feature `hecha`, con `estado=excedido` si Franco elige C, y con `estado=aviso` por `D75` (corte preventivo).
- Coordinador: añade ` Al delegar, carga `control-consumo`.` al final de la línea `Carga `comandos-coordinador`...` y borra ` (`Edit` de «Paso actual»)` del paso 2. Debe quedar en ≤ 7168 B (con ambos cambios, 7141 B).

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: una skill nueva, una línea de README y dos retoques mínimos del `coordinador`.
Fuera de alcance: el bloque «Formato de STATUS.md» (task-06), manifiesto y topes (task-05), `comandos-coordinador` y `definitions/`.

## Pasos
1. Crea `skills/control-consumo/SKILL.md` según «Decisiones ya tomadas»; mídelo con `wc -c`.
2. Añade `│   ├── control-consumo/` al árbol de `README.md`.
3. Haz los dos retoques en `agentes/coordinador.md` y mide.
4. Corre las pruebas y la rápida.

## Criterios de aceptación
1. `SKILL.md` mide ≤ 4096 B, con `description` ≤ 160 caracteres y las frases literales de arriba.
2. `contrato-roles.test.mjs`, `readme-estructura.test.mjs` y `topes-bytes.test.mjs` dan `ℹ fail 0`.
3. `agentes/coordinador.md` menciona `control-consumo`, mide ≤ 7168 B y ya no contiene `Edit` de «Paso actual».
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
test $(wc -c < skills/control-consumo/SKILL.md) -le 4096 && echo "ok-skill"; echo "exit $?"
grep -c "Una escritura por transición: un solo" skills/control-consumo/SKILL.md; echo "exit $?"
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/readme-estructura.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
grep -q 'carga `control-consumo`' agentes/coordinador.md && test $(wc -c < agentes/coordinador.md) -le 7168 && echo "ok-nucleo"; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ok-skill`; `ok-nucleo`; `ℹ fail 0` en el tercero y `ℹ fail 7` en el último.

## Evidencia

```
$ test $(wc -c < skills/control-consumo/SKILL.md) -le 4096 && echo "ok-skill"; echo "exit $?"
ok-skill
exit 0
exit 0
```

```
$ grep -c "Una escritura por transición: un solo" skills/control-consumo/SKILL.md; echo "exit $?"
1
exit 0
exit 0
```

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/readme-estructura.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
exit 0
```

```
$ grep -q 'carga `control-consumo`' agentes/coordinador.md && test $(wc -c < agentes/coordinador.md) -le 7168 && echo "ok-nucleo"; echo "exit $?"
ok-nucleo
exit 0
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
exit 0
```

## Notas
Huecos menores: 0. Leí la sección (d) de `definitions/CONSUMO.md` citada por `Fuente:`; no cambió el alcance.
Tamaños: `skills/control-consumo/SKILL.md` 1818 B (tope 4096); `agentes/coordinador.md` 7141 B (tope 7168), sin `Edit` de «Paso actual».
Autocomprobación `--evidencia`: OK: 1 tarea(s) con evidencia completa, exit 0.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
