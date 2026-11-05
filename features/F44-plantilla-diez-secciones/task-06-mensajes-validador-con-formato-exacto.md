# task-06 — Los mensajes del validador muestran el formato exacto de Leer, Tocar y Fuente
repo: Flucastr.AI   depende_de: task-05   estado: hecha

## Descripción
Cuando un modelo escribe `- Leer:`, `- Tocar:` o `- Fuente:` con punto final, el validador solo dice «formato inválido» sin aclarar qué sobra. Esta tarea amplía el texto de los tres mensajes para que digan el formato exacto («sin punto final ni texto extra», con ejemplo) y el planificador pueda corregirse a la primera. Solo cambia texto de mensajes: las reglas de aceptación y los topes no cambian.

## Contexto
- Leer: `scripts/formato-topes.mjs@14-18`, `scripts/formato-tarea.mjs@211-216`, `scripts/formato-fuente.mjs@17-22`
- Tocar: `scripts/formato-topes.mjs`, `scripts/formato-tarea.mjs`, `scripts/formato-fuente.mjs`
- `pruebas/comprobaciones/planificador-resultado.mjs` (línea 52) reconoce el rechazo de Leer por el prefijo `La línea «Leer» tiene formato inválido`; ese prefijo no cambia. Ninguna prueba ni fixture compara los textos completos de estos tres mensajes (medido con `grep -rn` sobre `pruebas/`, salvo informes en `pruebas/resultados/`).
- Los scripts los copian los fixtures (`pruebas/fixtures/*.sh` copian `formato-tarea.mjs`, `formato-topes.mjs` y los demás módulos de `scripts/`); como no se crea ni renombra ningún módulo, no hay lista que ajustar.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- No cambia una regla de formato: las expresiones regulares y los topes quedan igual; el punto final se sigue rechazando. Por eso no se revalida ninguna tarea `hecha` (el validador ya las exime por estado) y no hace falta tocar `features/completed/`.
- Textos nuevos exactos (reemplazan al mensaje actual completo):
  - Leer (constante `FORMATO` de `formato-topes.mjs`): ``La línea «Leer» tiene formato inválido: debe ser «- Leer: `ruta`, `ruta@offset-limit`», en una sola línea, sin punto final ni texto extra.``
  - Tocar (`formato-tarea.mjs`, mensaje de la línea 214): ``«Tocar» debe listar las rutas entre comillas invertidas, separadas por «, », sin punto final ni texto extra (por ejemplo «- Tocar: `a.js`, `b.js`»).``
  - Fuente (`formato-fuente.mjs`, mensaje de la línea 20): ``La viñeta «- Fuente:» tiene formato inválido: debe ser «ninguna» o «<ruta> «<encabezado>»», una viñeta por documento y sin comillas invertidas en la ruta.``
- Se conservan los prefijos de los tres mensajes tal como están hoy.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: el texto de tres mensajes en tres archivos.
Fuera de alcance: expresiones regulares, topes, aceptar el punto final (opción c, descartada), la skill (task-05), pruebas nuevas (task-07), el commit.

## Pasos
1. Corre `git branch --show-current`.
2. En `scripts/formato-topes.mjs` reemplaza el valor de `FORMATO` por el texto de Leer.
3. En `scripts/formato-tarea.mjs` reemplaza el mensaje de «Tocar» (línea 214) por el texto de Tocar.
4. En `scripts/formato-fuente.mjs` reemplaza el mensaje de formato inválido (línea 20) por el texto de Fuente.
5. Corre `node --test pruebas/comprobaciones/formato-topes.test.mjs pruebas/comprobaciones/formato-tarea.test.mjs pruebas/comprobaciones/planificador-resultado.test.mjs pruebas/comprobaciones/regresion-validadores.test.mjs` y confirma `fail 0`.

## Criterios de aceptación
1. Rama `fix/F44-plantilla-diez-secciones` (comando 1).
2. Cada uno de los tres archivos contiene «sin punto final» o «sin comillas invertidas» en su mensaje nuevo (comando 2 imprime `3`).
3. Las cuatro pruebas existentes terminan con `fail 0` (comando 3).
4. `node scripts/validar-tarea.mjs features/F*/task-*.md` termina en 0 (comando 4).

## Verificación
```
git branch --show-current
grep -l "sin punto final\|sin comillas invertidas" scripts/formato-topes.mjs scripts/formato-tarea.mjs scripts/formato-fuente.mjs | wc -l
node --test pruebas/comprobaciones/formato-topes.test.mjs pruebas/comprobaciones/formato-tarea.test.mjs pruebas/comprobaciones/planificador-resultado.test.mjs pruebas/comprobaciones/regresion-validadores.test.mjs 2>&1 | grep -E "^ℹ fail"
node scripts/validar-tarea.mjs features/F*/task-*.md; echo "salida $?"
```
Esperado: rama `fix/F44-plantilla-diez-secciones`; el segundo comando imprime `3` (con espacios a la izquierda según `wc`); el tercero imprime `ℹ fail 0`; el último termina con la línea `salida 0`.

## Evidencia

```
$ git branch --show-current
fix/F44-plantilla-diez-secciones
exit 0

$ grep -l "sin punto final\|sin comillas invertidas" scripts/formato-topes.mjs scripts/formato-tarea.mjs scripts/formato-fuente.mjs | wc -l
       3
exit 0

$ node --test pruebas/comprobaciones/formato-topes.test.mjs pruebas/comprobaciones/formato-tarea.test.mjs pruebas/comprobaciones/planificador-resultado.test.mjs pruebas/comprobaciones/regresion-validadores.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0

$ node scripts/validar-tarea.mjs features/F*/task-*.md; echo "salida $?"
OK: 9 tarea(s) válida(s)
salida 0
exit 0
```

## Notas
Huecos menores: ninguno. Textos de los tres mensajes tomados literalmente de «Textos nuevos exactos» (sin cambiar prefijos ni reglas). Encargo con «Modo yolo: activo»; la rama ya era la actual, no se hizo `git switch`. Sin commit ni push.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
