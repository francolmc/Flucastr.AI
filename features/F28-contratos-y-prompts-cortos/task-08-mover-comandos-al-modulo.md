# task-08 — Mover comandos, archivo, cierre y respaldo del coordinador a su skill
repo: Flucastr.AI   depende_de: task-07   estado: hecha

## Descripción
Con `comandos-coordinador` creada (task-07), el `coordinador` deja de llevar sus comandos de `scripts/`, el aviso de archivo, el texto largo del cierre de feature y el respaldo sin subagentes (~3,5 KB). Queda una sección de activación y una fila de tabla más corta. Las frases de los avisos pasan en el manifiesto al módulo. La seguridad no depende del texto movido: el límite real sigue en `tools:` (`Bash(...)` en Claude Code).

## Contexto
- Tocar: `agentes/coordinador.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`
- Fuente: definitions/CONTRATOS.md «4. Prompts: núcleo corto + módulos bajo demanda»
- `agentes/coordinador.md` (busca por título): `## Comandos que puede correr`, `## Archivo y contexto` y `## Respaldo sin subagentes` se borran; la fila «Todas las tareas de la feature» de la tabla se acorta. Se quedan en el núcleo: la viñeta de `## Límites` (task-07), la fila de la puerta 3 con `validar-tarea.mjs` y `salida 1`, la fila de la puerta 4 con `git diff scripts/` y la línea de `features/completed/` y `registro/`.
- `frases-por-archivo.mjs`: hoy bajo `agentes/coordinador` están `cierra la rama, haz el PR y despliega`, `node scripts/archivar.mjs --aplicar Fxx`, `node scripts/registrar.mjs` y `no autoriza`. `lista cerrada`, `pedido explícito` y `git diff scripts/` se quedan en el coordinador. (`node scripts/registrar.mjs` también aparece dentro de `tools:`, lo cual es esperado.)
- Lee solo las *Notas* de task-07.

## Decisiones ya tomadas
- Las tres secciones borradas se reemplazan por una sola: `## Comandos, archivo y cierre`, con un párrafo de 4 líneas como máximo: carga `comandos-coordinador` cuando Franco pida un comando de `scripts/`, antes de delegar `descomponer-feature` (aviso de archivo), al cerrar una feature y cuando la herramienta no permita lanzar subagentes. No repite las frases del manifiesto movidas.
- La fila «Todas las tareas de la feature» queda con una sola frase de paso: carga `comandos-coordinador` para el cierre de la feature; pide a Franco confirmar `hecha`; con su aprobación escribe `hecha` en `BACKLOG.md` y delega `descomponer-feature` para mover la marca `→`. Debe conservar `hecha` entre comillas invertidas (la regla 7 exige los seis estados en la tabla).
- Manifiesto: las cuatro frases listadas pasan a la clave `skills/comandos-coordinador`.
- Tope de criterio (sin tocar `topes-bytes.test.mjs`): `coordinador.md` de 9800 B o menos.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: recorte de tres secciones y una fila, y cuatro frases en el manifiesto.
Fuera de alcance: el recorte final a 7168 B (task-09), `tools:`, `modo-yolo`, `ramas-feature` y todo lo de `definitions/`.

## Pasos
1. En `agentes/coordinador.md`, reemplaza las tres secciones por la de activación y acorta la fila de cierre.
2. En `frases-por-archivo.mjs`, mueve las cuatro frases a `skills/comandos-coordinador`.
3. Corre las pruebas de contrato, puerta previa y turnos, y la rápida.

## Criterios de aceptación
1. `contrato-roles.test.mjs`, `puerta-previa.test.mjs` y `coordinador-turnos.test.mjs` dan `ℹ fail 0`.
2. `agentes/coordinador.md` ya no contiene `## Comandos que puede correr` ni `## Respaldo sin subagentes` y mide 9800 B o menos.
3. Existen al menos 4 tests `rechaza manifiesto` sobre `«comandos-coordinador»`.
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/puerta-previa.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
grep -q -e '## Comandos que puede correr' -e '## Respaldo sin subagentes' agentes/coordinador.md || echo "ok-movido"; echo "exit $?"
test $(wc -c < agentes/coordinador.md) -le 9800 && echo "ok-tamano"; echo "exit $?"
n=$(node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -c 'rechaza manifiesto.*«comandos-coordinador»'); [ "$n" -ge 4 ] && echo "ok-negativos"; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ℹ fail 0`, `ok-movido`, `ok-tamano`, `ok-negativos` y `ℹ fail 7`.

## Evidencia

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/puerta-previa.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
```

```
$ grep -q -e '## Comandos que puede correr' -e '## Respaldo sin subagentes' agentes/coordinador.md || echo "ok-movido"; echo "exit $?"
ok-movido
exit 0
```

```
$ test $(wc -c < agentes/coordinador.md) -le 9800 && echo "ok-tamano"; echo "exit $?"
ok-tamano
exit 0
```

```
$ n=$(node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -c 'rechaza manifiesto.*«comandos-coordinador»'); [ "$n" -ge 4 ] && echo "ok-negativos"; echo "exit $?"
ok-negativos
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

Tamaño final de `agentes/coordinador.md`: 9799 B (antes 12174 B).

## Notas
- Huecos menores: (1) para bajar `agentes/coordinador.md` de 9839 a 9799 B (tope 9800) quité de la activación el paréntesis «(aviso de archivo)» y de la fila de cierre «No es escalación.» y «explícita».
- La skill `comandos-coordinador` ya tenía todas las salvaguardas (lista cerrada de cuatro, pedido explícito con excepción del cuarto, `--aplicar` con `Fxx` y chequeo previo, prohibiciones, informar la salida sin interpretarla); no hizo falta agregar nada (2795 B, ≤ 5120).
- Manifiesto: `cierra la rama, haz el PR y despliega`, `node scripts/archivar.mjs --aplicar Fxx`, `node scripts/registrar.mjs` y `no autoriza` pasan a `skills/comandos-coordinador`. `lista cerrada`, `pedido explícito` y `git diff scripts/` se quedan en el coordinador.
- Una pasada completa de *Verificación*, sin reintentos. `tools:` del coordinador, `STATUS.md` y `definitions/` no se tocaron.
- Modo yolo: sin rama ni `git switch`; sin commit, push ni merge.
- Autocomprobación `--evidencia` (salida final): `OK: 1 tarea(s) con evidencia completa`, exit 0.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
