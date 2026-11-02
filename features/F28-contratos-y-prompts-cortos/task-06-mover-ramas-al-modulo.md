# task-06 — Mover «Ramas por feature» del coordinador a su skill
repo: Flucastr.AI   depende_de: task-05   estado: hecha

## Descripción
Con `ramas-feature` creada (task-05), el `coordinador` deja de llevar sus ~1,4 KB de reglas de rama: queda una frase de activación. Las tres frases de la regla 9 pasan en el manifiesto a `skills/ramas-feature`. Es sensible porque `CONFIRMAR:` frena los `git switch` del `constructor`: la frase de activación debe cubrir los dos momentos de uso.

## Contexto
- Tocar: `agentes/coordinador.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`
- Fuente: definitions/CONTRATOS.md «4. Prompts: núcleo corto + módulos bajo demanda»
- `agentes/coordinador.md`: la sección `## Ramas por feature (skill ...)` (título retocado en task-05) va hasta antes de `## Modo yolo`. La fila de la tabla «Tarea `aprobada`» exige `Rama:` en el encargo; la plantilla de encargo también la nombra: ambas se quedan.
- `frases-por-archivo.mjs`: las tres frases de la regla 9 están bajo `agentes/coordinador`.
- Lee solo las *Notas* de task-05.

## Decisiones ya tomadas
- La sección se reemplaza por `## Ramas por feature` y un párrafo de 3 líneas como máximo: al pasar una feature a `en curso`, o si el `constructor` responde con la primera línea `CONFIRMAR:`, carga `ramas-feature` y síguela; la línea `Rama:` va en cada encargo al `constructor` (salvo en yolo). El párrafo no repite las tres frases de la regla 9.
- En el manifiesto, `Rama: <prefijo>/Fxx-nombre`, `CONFIRMAR: accion=git switch <rama>; motivo=<motivo>` y ``Franco confirmó `git switch <rama>` `` pasan a la clave `skills/ramas-feature`.
- Tope de criterio (sin tocar `topes-bytes.test.mjs`): `coordinador.md` de 12800 B o menos.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: un recorte y un movimiento de tres frases en el manifiesto.
Fuera de alcance: `comandos-coordinador` (tasks 07-08), el recorte final (task-09), el texto de `ejecutar-tarea` y todo lo de `definitions/`.

## Pasos
1. Reemplaza la sección por el párrafo de activación en `agentes/coordinador.md`.
2. Mueve las tres frases en `frases-por-archivo.mjs` a `skills/ramas-feature`.
3. Corre las pruebas de contrato y de turnos, y la rápida.

## Criterios de aceptación
1. `contrato-roles.test.mjs` y `coordinador-turnos.test.mjs` dan `ℹ fail 0`.
2. `agentes/coordinador.md` ya no contiene `Franco confirmó` y mide 12800 B o menos.
3. Existen al menos 3 tests `rechaza manifiesto` sobre `«ramas-feature»`.
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
grep -q 'Franco confirmó' agentes/coordinador.md || echo "ok-movido"; echo "exit $?"
test $(wc -c < agentes/coordinador.md) -le 12800 && echo "ok-tamano"; echo "exit $?"
n=$(node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -c 'rechaza manifiesto.*«ramas-feature»'); [ "$n" -ge 3 ] && echo "ok-negativos"; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ℹ fail 0`, `ok-movido`, `ok-tamano`, `ok-negativos` y `ℹ fail 7`.

## Evidencia

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
```

```
$ grep -q 'Franco confirmó' agentes/coordinador.md || echo "ok-movido"; echo "exit $?"
ok-movido
exit 0
```

```
$ test $(wc -c < agentes/coordinador.md) -le 12800 && echo "ok-tamano"; echo "exit $?"
ok-tamano
exit 0
```

```
$ n=$(node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -c 'rechaza manifiesto.*«ramas-feature»'); [ "$n" -ge 3 ] && echo "ok-negativos"; echo "exit $?"
ok-negativos
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

## Notas
- Huecos menores: ninguno. `skills/ramas-feature/SKILL.md` (1562 B) ya contenía los cinco puntos (prefijo, línea `Rama:`, `CONFIRMAR:` y `git switch`, sin commit del constructor); no se agregó nada.
- Tamaño final: `agentes/coordinador.md` 13302 B al empezar y 12174 B al terminar (≤ 12800).
- Manifiesto: las tres frases de la regla 9 pasaron de `agentes/coordinador` a una entrada `skills/ramas-feature`. `topes-bytes.test.mjs` no se tocó.
- Modo yolo: sin rama ni `git switch`; sin commit, push ni merge.
- Ejecución: en yolo no se creó rama ni se hizo `git switch`.
- Autocomprobación final: `node scripts/validar-tarea.mjs --evidencia features/F28-contratos-y-prompts-cortos/task-06-mover-ramas-al-modulo.md` salió 0 con `OK: 1 tarea(s) con evidencia completa`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
