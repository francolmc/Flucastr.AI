# task-04 — Mover las reglas del modo yolo del coordinador a su skill
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
Con `modo-yolo` ya creada (task-03), el `coordinador` deja de llevar sus ~4,8 KB de reglas: queda una sección corta que ordena cargar la skill. Las cuatro frases de la regla 12 pasan en el manifiesto a `skills/modo-yolo`, y la prueba de la regla 2 de yolo lee ahora el módulo. Es el primer recorte real del núcleo.

## Contexto
- Tocar: `agentes/coordinador.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`, `pruebas/comprobaciones/puerta-previa.test.mjs`
- Fuente: definitions/CONTRATOS.md «4. Prompts: núcleo corto + módulos bajo demanda»
- `agentes/coordinador.md`: la sección `## Modo yolo` empieza en la línea 81 y la última regla de `### Mientras está activo` termina en la 103; la línea 18 dice `(sección «Modo yolo»)`.
- `frases-por-archivo.mjs` (task-01): las cuatro frases de yolo están hoy bajo `agentes/coordinador`; deben pasar a una clave nueva `skills/modo-yolo`. Las de `agentes/planificador` y `skills/descomponer-feature` no cambian.
- `puerta-previa.test.mjs`: `REGLA_2_YOLO` (línea 17) se busca en `COORDINADOR` (líneas 38-46 y la prueba de las líneas 68-76). Sus otros requisitos (`validar-tarea.mjs`, `salida 1`, `DECISION: ...`) siguen en la tabla de decisión, que no se toca.
- Lee solo las *Notas* de task-03.

## Decisiones ya tomadas
- En `coordinador.md`, desde la línea `## Modo yolo` hasta el final de la regla 9, deja solo esto: `## Modo yolo`, y debajo un párrafo de 3 líneas como máximo: si Franco lo pide de forma explícita en la conversación (por ejemplo «yolo F05»), carga `modo-yolo` y síguela; si no puedes cargarla, no actúas en yolo y escalas; con yolo activo, esa skill sustituye las puertas 2, 3 y 4. Ese párrafo no repite las cuatro frases de la regla 12.
- La línea 18 cambia solo el paréntesis «(sección «Modo yolo»)» por «(skill modo-yolo)», con `modo-yolo` entre comillas invertidas.
- En `puerta-previa.test.mjs`, `REGLA_2_YOLO` se busca en `skills/modo-yolo/SKILL.md` (constante nueva `MODULO_YOLO`, incluida en `reales()`); el control negativo de `RE_PENDIENTE` se aplica a ese texto. Los requisitos del coordinador y del constructor no cambian.
- Tope de esta tarea (solo de criterio, no se toca `topes-bytes.test.mjs`): `coordinador.md` de 14000 B o menos.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: recorte de una sección, un cambio en el manifiesto y una prueba que cambia de archivo.
Fuera de alcance: `ramas-feature` y `comandos-coordinador` (tasks 05-08), el recorte final del núcleo (task-09), `WORKFLOW.md` §9.3 y todo lo de `definitions/`.

## Pasos
1. Reemplaza la sección `## Modo yolo` completa de `agentes/coordinador.md` por el párrafo corto y ajusta la línea 18.
2. En `frases-por-archivo.mjs`, mueve las cuatro frases de yolo a la clave `skills/modo-yolo`.
3. En `puerta-previa.test.mjs`, busca la regla 2 de yolo en el módulo.
4. Corre las pruebas de contrato, puerta previa, turnos y la rápida; si alguna frase del manifiesto del coordinador falta, corrige el párrafo sin copiarla.

## Criterios de aceptación
1. `contrato-roles.test.mjs`, `puerta-previa.test.mjs` y `coordinador-turnos.test.mjs` dan `ℹ fail 0`.
2. `agentes/coordinador.md` ya no contiene `Mientras está activo` y mide 14000 B o menos.
3. Existen al menos 4 tests `rechaza manifiesto` sobre `«modo-yolo»` (uno por frase movida).
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/puerta-previa.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
grep -q 'Mientras está activo' agentes/coordinador.md || echo "ok-movido"; echo "exit $?"
test $(wc -c < agentes/coordinador.md) -le 14000 && echo "ok-tamano"; echo "exit $?"
n=$(node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -c 'rechaza manifiesto.*«modo-yolo»'); [ "$n" -ge 4 ] && echo "ok-negativos"; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ℹ fail 0`, `ok-movido`, `ok-tamano`, `ok-negativos` y `ℹ fail 7` en la última línea de resultado.

## Evidencia

Pasada única de esta ejecución (intentos=1); los cinco comandos pasaron en esa pasada.

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/puerta-previa.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
```

```
$ grep -q 'Mientras está activo' agentes/coordinador.md || echo "ok-movido"; echo "exit $?"
ok-movido
exit 0
```

```
$ test $(wc -c < agentes/coordinador.md) -le 14000 && echo "ok-tamano"; echo "exit $?"
ok-tamano
exit 0
```

```
$ n=$(node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -c 'rechaza manifiesto.*«modo-yolo»'); [ "$n" -ge 4 ] && echo "ok-negativos"; echo "exit $?"
ok-negativos
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

Resultado: `ℹ fail 7`, igual al esperado de la rápida. Los cinco comandos coinciden con su *Esperado*.

## Notas
- Huecos menores: ninguno.
- Hecho: se reemplazó la sección `## Modo yolo` de `agentes/coordinador.md` por el párrafo de 3 líneas; la línea 18 cita `modo-yolo`. La comparación de las reglas 1 a 9 con `skills/modo-yolo/SKILL.md` se hizo a ojo sobre el texto leído: coinciden, así que la skill no cambió.
- Hecho: en `frases-por-archivo.mjs` las cuatro frases de yolo (`Modo yolo: activo — alcance…`, `ADVERTENCIA: rama main`, `Modo yolo: detenido (feature Fxx requiere refinado)`, `Modo yolo: terminado`) pasaron a la clave `skills/modo-yolo`.
- Hecho: en `puerta-previa.test.mjs`, `REGLA_2_YOLO` se busca en `MODULO_YOLO` (`skills/modo-yolo/SKILL.md`), también en `reales()` y en el control de `RE_PENDIENTE`.
- Aviso: `agentes/coordinador.md` cambió en disco después de mi última edición; apareció una fila nueva en la tabla (línea 52) que menciona `modo-yolo`. No la toqué; el tamaño actual es 13314 B.
- La verificación previa dio `ℹ fail 8` por el control negativo de `topes-bytes.test.mjs`; ese defecto se corrigió en task-02 (control sintético), y en esta pasada `rapida.sh` da `ℹ fail 7`.
- Sin commit, sin `instalar.sh`, sin tocar `~/.claude` ni `~/.flucastr-ai`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=falla; huecos=0; resultado=bloqueada; causa=verificacion_x2
- Autocomprobación: `node scripts/validar-tarea.mjs --evidencia features/F28-contratos-y-prompts-cortos/task-04-mover-yolo-al-modulo.md` salió 0 con `OK: 1 tarea(s) con evidencia completa`.
Registro: n=2; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
