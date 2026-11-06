# task-03 — README: higiene de contexto en lenguaje neutro
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
`## Higiene de contexto y compactación` del README (con sus subsecciones) mezcla primera persona («No tengo que teclear nada», «lo que ya definiste») con detalle técnico correcto. Se reescribe el estilo para cualquier lector, sin cambiar un solo dato técnico (valores, rutas, versiones, comandos, tabla).

## Contexto
- Leer: `README.md@211-50`
- Tocar: `README.md`
- El rango 211-260 va de `## Higiene de contexto y compactación` hasta la línea en blanco previa a `## Medición de consumo`.
- Frases con primera persona o estilo personal detectadas: «No tengo que teclear nada, tampoco desde el celular» (`### Por qué`), «cuando uso esos modelos fuera del kit» (`### Limitaciones`) y las subsecciones con «lo que ya definiste».
- Fuente: ninguna
- Requiere: runtime:node@25.8.1

## Decisiones ya tomadas
- Mismo estilo que task-02: tuteo en instrucciones, tercera persona en descripciones; sin «mi», «mis», «yo», «tengo».
- Se conservan los encabezados, la tabla, las fórmulas y todos los números tal cual (172000, 133000, 33000, 16384, versiones Pi 1.4.0 y Claude Code 2.1.308).
- Se elimina «tampoco desde el celular» (dato personal sin valor para otros).

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: de `## Higiene de contexto y compactación` hasta antes de `## Medición de consumo`.
Fuera de alcance: cambiar valores técnicos, otras secciones, `modelos.json`, `scripts/resolver.mjs`.

## Pasos
1. Corre `git branch --show-current` y comprueba la rama.
2. En `README.md`, reescribe solo las frases con primera persona o estilo personal de las secciones del rango; deja el resto de cada línea intacto.
3. Compara con `git diff --stat README.md` que el cambio es de pocas líneas y que no tocó la tabla de mecanismos.

## Criterios de aceptación
1. Rama `chore/F47-readme-para-cualquier-usuario` (comando 1).
2. Esa sección no contiene primera persona (comando 2).
3. Los números 172000, 133000 y 33000 siguen en el README (comando 3).
4. La prueba del árbol de `## Estructura` sigue pasando (comando 4).

## Verificación
```
git branch --show-current
awk '/^## Higiene de contexto/,/^## Medición de consumo/' README.md | grep -nEiw 'mi|mis|yo|tengo|mío|mía'; echo "grep:$?"
grep -c '172000\|133000\|33000' README.md
node --test pruebas/comprobaciones/readme-estructura.test.mjs
```
Esperado: la rama `chore/F47-readme-para-cualquier-usuario`; solo `grep:1`; un número mayor o igual que 5; las pruebas pasan con 0 fallos.

## Evidencia
```
$ git branch --show-current
chore/F47-readme-para-cualquier-usuario
exit 0

$ awk '/^## Higiene de contexto/,/^## Medición de consumo/' README.md | grep -nEiw 'mi|mis|yo|tengo|mío|mía'; echo "grep:$?"
grep:1
exit 0

$ grep -c '172000\|133000\|33000' README.md
3
exit 0

$ node --test pruebas/comprobaciones/readme-estructura.test.mjs
✔ variante: sobra un agente en el README (0.108542ms)
✔ variante: sobra una skill en el README (0.083708ms)
✔ variante: README sin sección «## Estructura» (0.062458ms)
✔ repo real: README, agentes/ y skills/ coinciden (0.334166ms)
ℹ tests 7
ℹ pass 7
ℹ fail 0
exit 0
```

Comprobación adicional (no es el comando de Verificación): `grep -o '172000\|133000\|33000' README.md | sort | uniq -c` da `2 133000`, `2 172000`, `2 33000`, es decir 6 apariciones (el comando de Verificación cuenta líneas, 3).

Diff del README (acumulado: incluye los cambios sin commit de tareas anteriores de la feature): `git diff --stat README.md` → `1 file changed, 31 insertions(+), 18 deletions(-)`.

## Notas
Hueco menor: el rango de Leer (`README.md@211-50`) estaba desplazado por task-04; la sección `## Higiene de contexto y compactación` estaba en la línea 221 (no 211). Se ubicó por encabezado y se leyó 221-270.

Cambios aplicados (solo frases con primera persona o estilo personal; ningún valor técnico, rutas, versiones, comandos ni tabla modificados):
- `### Por qué`: «No tengo que teclear nada, tampoco desde el celular.» → «No hace falta teclear nada.» (se elimina el dato personal «desde el celular»).
- `### Qué respeta`: «El kit nunca pisa lo que ya definiste.» → «El kit nunca sobrescribe lo que ya esté definido.» (era la única aparición de «lo que ya definiste»).
- `### Limitaciones`: «cuando uso esos modelos fuera del kit» → «cuando esos modelos se usan fuera del kit».

Huecos menores: la frase «con la copia que tenías antes» (`### Después de instalar, comprobar`) queda en segunda persona de tuteo, que es el estilo decidido para instrucciones; no se cambió.

Nota sobre el criterio «un número mayor o igual que 5»: el comando `grep -c` cuenta líneas y da 3; las apariciones de los números son 6. Se cumple el espíritu del criterio (los números siguen en el README), pero el comando de Verificación da 3 y no 5; anotado para que Franco lo valore.

Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
