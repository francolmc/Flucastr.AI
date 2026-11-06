# task-05 — Skill `ejecutar-tarea`: el constructor escribe `Bloqueo:` en todo bloqueo
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
F31 hizo que el constructor escriba `Bloqueo: tipo=entorno; falta=…` solo en la puerta de entorno. Para que la telemetría cubra todos los bloqueos, `ejecutar-tarea` debe pedir la línea `Bloqueo:` con el tipo de la lista cerrada en cualquier detención, dentro del tope de 7623 bytes (hoy 7613), recortando texto redundante.

## Contexto
- Tocar: `skills/ejecutar-tarea/SKILL.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`
- Requiere: ninguno
- `skills/ejecutar-tarea/SKILL.md` (confirmado): el bullet «Modo yolo» del paso 2 de «Antes de empezar» contiene «no emites `CONFIRMAR:`; trabajas en la rama actual. Sigue sin haber commit, ni local, y la tarea termina en `lista para revisión` (el coordinador decide `hecha`).» (o, si ya fue editado, termina en «sin commit ni local.»; la regla 14 de `contrato-constructor.test.mjs` exige en la skill «Modo yolo: activo», «salta este paso entero», «no emites `CONFIRMAR:`» y «ni local»); el párrafo «En cualquiera: anota el motivo en *Notas* y termina tu respuesta final con la **primera línea exacta**:» sigue a «Cuándo detenerte»; el significado de `intentos` en «Línea de registro» termina con « (cada pasada completa suma 1)».
- `pruebas/comprobaciones/frases-por-archivo.mjs`: `FRASES_TELEMETRIA` (creado en task-04) y la entrada `'skills/ejecutar-tarea'`. De task-04 lee solo las *Notas*.
- Medido en una copia: con los tres cambios de *Decisiones ya tomadas* la skill mide 7604 bytes; `contrato-roles`, `topes-bytes`, `agente-instalado` y `contrato-constructor` dan `ℹ fail 0`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «5. Pieza 3 — Telemetría que da pistas»

## Decisiones ya tomadas
- En el bullet «Modo yolo» reemplaza «; trabajas en la rama actual. Sigue sin haber commit, ni local, y la tarea termina en `lista para revisión` (el coordinador decide `hecha`).» por «, sin commit ni local.» (conserva «ni local»; lo demás lo cubren «Nunca `hecha`» y «Sin commit, push…»). El bullet queda en su propia línea: el salto de línea antes de «   - Si el encargo contiene la frase» se conserva.
- Borra exactamente « (cada pasada completa suma 1)».
- Reemplaza «En cualquiera: anota el motivo en *Notas* y termina tu respuesta final con la **primera línea exacta**:» por «En cualquiera: anota el motivo en *Notas*; antes de `Registro:` escribe `Bloqueo: tipo=<entorno|alcance|especificacion|decision_diseno|verificacion_x2|credenciales|otra>; falta=<items de Requiere o ->`. Termina con la **primera línea exacta**:».
- En `frases-por-archivo.mjs` agrega la clave `'ejecutar-tarea': ['Bloqueo: tipo=<entorno|alcance|especificacion|decision_diseno|verificacion_x2|credenciales|otra>; falta=']` a `FRASES_TELEMETRIA` y esparcirla en la entrada `'skills/ejecutar-tarea'`.
- No se cambia el bullet de entorno de F31 ni `agentes/constructor.md` (3008 de 3072 bytes).

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: los tres cambios de texto y la frase del manifiesto.
Fuera de alcance: `agentes/constructor.md`, el tope de 7623, `definitions/WORKFLOW.md` §6, cualquier otra frase del manifiesto.

## Pasos
1. Aplica el reemplazo del bullet, el borrado y el reemplazo de «En cualquiera» en `skills/ejecutar-tarea/SKILL.md`. Si el bullet «Modo yolo» ya está editado y quedó pegado a «- Si el encargo contiene la frase» en una sola línea, sepáralos con un salto de línea.
2. Agrega la clave a `FRASES_TELEMETRIA` y a la entrada de la skill.
3. Mide con `wc -c` y corre la verificación; la rápida debe quedar con los 7 fallos previos y ninguno nuevo.

## Criterios de aceptación
1. La skill contiene la plantilla `Bloqueo: tipo=<entorno|…|otra>; falta=`; se comprueba con `contrato-roles.test.mjs`.
2. La skill mide 7623 bytes o menos; se comprueba con el segundo comando.
3. Los contratos y los demás topes no cambian; se comprueba con `topes-bytes`, `agente-instalado` y `contrato-constructor` (regla 14), y la rápida no suma títulos nuevos.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/agente-instalado.test.mjs 2>&1 | grep -E "^ℹ fail"
node --test pruebas/comprobaciones/contrato-constructor.test.mjs 2>&1 | grep -E "^ℹ fail"
test $(wc -c < skills/ejecutar-tarea/SKILL.md) -le 7623 && echo "ejecutar-tarea dentro del tope"
grep -c "^   - Si el encargo contiene la frase" skills/ejecutar-tarea/SKILL.md
bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ fail"
```
Esperado: `ℹ fail 0` (dos veces, medido en una copia), `ejecutar-tarea dentro del tope`, `1` y `ℹ fail 7` (los 7 títulos previos, ninguno nuevo; en una copia sin `.git` sale uno más por `R: ejecutar.sh`, ajeno a esta tarea).

## Evidencia

```text
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/agente-instalado.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0

$ node --test pruebas/comprobaciones/contrato-constructor.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0

$ test $(wc -c < skills/ejecutar-tarea/SKILL.md) -le 7623 && echo "ejecutar-tarea dentro del tope"
ejecutar-tarea dentro del tope
exit 0

$ grep -c "^   - Si el encargo contiene la frase" skills/ejecutar-tarea/SKILL.md
1
exit 0

$ bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ fail"
ℹ fail 7
exit 0

Anotación (pasada 2, `pruebas/rapida.sh` sin filtro): `ℹ tests 623`, `ℹ pass 616`, `ℹ fail 7`; `rapida.sh` sale 1 por esos 7 títulos, que son los previos: «definitions/BACKLOG.md real cumple el formato», «los archivos reales cumplen la regla», «falla si un agente conserva la línea de modelos.json», «falla si falta la lectura acotada en constructor», «falla si falta la lectura acotada en ejecutar-tarea», «falla si WORKFLOW.md pasa de 30720 caracteres», «falla si WORKFLOW.md conserva la frase sobre modelos.json». Ninguno nuevo.
Anotación (tamaño de `skills/ejecutar-tarea/SKILL.md`, `wc -c`): 7604 B, dentro del tope 7623 B (antes 7613 B; la corrida anterior medía 7610 B).
Anotación (pasada 1): comandos 1 a 4 con los mismos resultados; `rapida.sh` dio `ℹ fail 10`, con `e2: settings.json de Pi que no es JSON válido`, `I4: comprobación real` y `(b) modo repo: entorno.mjs sin scripts/ en el cwd sale 0 con ninguno y 1 con falta=` como fallos extra que tardaron ~300 s y no se repitieron en la pasada 2. No se tocó `pruebas/capa1/` ni `entorno.mjs`; la pasada 2 es la que cuenta.
Anotación (repo, no copia): la corrida es en el repo con `.git` (`ls -d .git` lo confirma), así que el fallo extra de copia sin `.git` no aplica; en la pasada 2 no hay ningún `✖ R: ejecutar.sh`, y el test `✔ R: ejecutar.sh genera fixture e instantánea y resume correctamente` pasó.
```

## Notas
Corrida anterior: la regla 14 de `contrato-constructor` exigía «ni local» y la rápida dio `ℹ fail 8`; la corrección de esta corrida la cubre (ver abajo).
Decisión de esta corrida (no es hueco): el bullet «Modo yolo» queda «…no emites `CONFIRMAR:`, sin commit ni local.» en su propia línea; se quitó «; trabajas en la rama actual» porque la misma regla ya dice que no se crea rama ni se hace `git switch`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
Registro: n=2; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
