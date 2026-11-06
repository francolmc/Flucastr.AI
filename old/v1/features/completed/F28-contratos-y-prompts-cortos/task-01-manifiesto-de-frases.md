# task-01 — Manifiesto FRASES_POR_ARCHIVO en el contrato de roles
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Hoy `contrato-roles.mjs` busca las frases con reglas sueltas. Antes de mover texto a módulos hace falta un manifiesto único `{archivo: [frases]}` que diga dónde debe estar cada frase. Esta tarea no mueve texto: reúne las frases en su lugar actual, con una regla genérica y un control negativo por frase. Mover una frase después es editar una sola lista.

## Contexto
- Tocar: `pruebas/comprobaciones/frases-por-archivo.mjs`, `pruebas/comprobaciones/contrato-roles.mjs`, `pruebas/comprobaciones/contrato-roles.test.mjs`
- Fuente: definitions/CONTRATOS.md «4. Prompts: núcleo corto + módulos bajo demanda»
- `contrato-roles.mjs` (345 líneas): exporta `FRASES_COORDINADOR_F21`, `FRASES_LECTURA_F22`, `FRASES_UNA_PASADA` (líneas 11-79) y, dentro de `validarRoles`, comprueba frases literales en las reglas 6, 8, 9, 10, 11, 12, 13, 14, 15 (solo `lista cerrada`, `pedido explícito`, `no autoriza`, `git diff scripts/`), 16, 17, 18 y 19. Mensajes: «El agente «x» debe contener la frase «f».» y «La skill «x» ...».
- `coordinador-turnos.test.mjs` importa `FRASES_COORDINADOR_F21` de `contrato-roles.mjs`; debe seguir exportada ahí.
- `contrato-roles.test.mjs`: `muestra()` (líneas 32-120) arma la muestra válida con las frases escritas a mano; los bloques `variantesF05` a `variantesF10` y los bucles de las reglas 16, 17 y 19 (líneas 173-362) son los controles negativos por regla.

## Decisiones ya tomadas
- Archivo nuevo `frases-por-archivo.mjs`: contiene las tres listas actuales sin cambiar una letra y exporta `FRASES_POR_ARCHIVO`, con claves `agentes/<nombre>` o `skills/<nombre>`.
- `contrato-roles.mjs` reexporta las tres listas y `FRASES_POR_ARCHIVO` desde ahí, e importa lo que necesita.
- Una sola regla genérica recorre el manifiesto, con los mensajes actuales (agente o skill, según el prefijo). Reemplaza las reglas 9 a 14 y 16 a 19 y las frases de las reglas 6 y 8 (la prohibición de «No cambies BACKLOG.md», la regla 5 y la regla 7 se quedan). De la regla 15 solo pasan al manifiesto las cuatro frases; los patrones `Bash(...)` y `validar-tarea.mjs` en el cuerpo se quedan en código.
- Todas las frases van en su archivo actual: las del coordinador en `agentes/coordinador`; REFINAR en coordinador, planificador y `skills/descomponer-feature`; `Modo yolo: activo` en planificador y descomponer-feature; la frase de la regla 6 en planificador y constructor.
- `muestra()` se arma desde el manifiesto: a cada agente o skill se le añade una línea por frase. Si el manifiesto nombra una skill que la muestra no tiene, la crea con `FM` y la menciona entre comillas invertidas en el `coordinador` (regla 4). Se conservan solo las líneas a mano que otras reglas necesitan (front matter, `tools:`, tabla de estados, BLOQUEO y la línea de `validar-tarea.mjs <ruta-tarea>`).
- Control negativo único: por cada frase del manifiesto, un test llamado `rechaza manifiesto: el agente «x» pierde la frase «f»` (o `la skill «x»`); quita la frase de su archivo con `split(f).join('omitida')` y exige un error que la mencione. Se conservan las variantes de las reglas 1 a 8 y 15 (Bash) y se borran las de las reglas reemplazadas.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: el manifiesto, la regla genérica y sus pruebas.
Fuera de alcance: mover frases de archivo, los topes de bytes (task-02), `coordinador-turnos.test.mjs` y todo lo de `definitions/`.

## Pasos
1. Crea `frases-por-archivo.mjs` con las tres listas movidas tal cual y `FRASES_POR_ARCHIVO` con todas las frases de «Decisiones ya tomadas» en su lugar actual.
2. En `contrato-roles.mjs`, importa y reexporta; borra las reglas reemplazadas y añade la regla genérica.
3. En `contrato-roles.test.mjs`, arma `muestra()` desde el manifiesto y sustituye los controles negativos de las reglas reemplazadas por el bucle único.
4. Corre `contrato-roles.test.mjs` y `coordinador-turnos.test.mjs`; corrige hasta `ℹ fail 0`.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/contrato-roles.test.mjs` da `ℹ fail 0` con los archivos reales.
2. Hay al menos 60 tests `rechaza manifiesto`, uno por frase.
3. `coordinador-turnos.test.mjs` sigue en `ℹ fail 0` (la exportación se conservó).
4. `agentes/` y `skills/` no cambian (`git diff --stat agentes skills` sin líneas).
5. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7` (ajenos conocidos); sin fallos nuevos.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
n=$(node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -c 'rechaza manifiesto'); [ "$n" -ge 60 ] && echo "ok-negativos"; echo "exit $?"
node --test pruebas/comprobaciones/coordinador-turnos.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
git diff --stat agentes skills | grep -c . ; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ℹ fail 0` en el primer y tercer comando, `ok-negativos` en el segundo, `0` en el cuarto, `ℹ fail 7` en el quinto.

## Evidencia

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
```

```
$ n=$(node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -c 'rechaza manifiesto'); [ "$n" -ge 60 ] && echo "ok-negativos"; echo "exit $?"
ok-negativos
exit 0
```

```
$ node --test pruebas/comprobaciones/coordinador-turnos.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
```

```
$ git diff --stat agentes skills | grep -c . ; echo "exit $?"
0
exit 1
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

Autocomprobación: `node scripts/validar-tarea.mjs --evidencia features/F28-contratos-y-prompts-cortos/task-01-manifiesto-de-frases.md` (ver resultado en la última pasada de *Notas*).

## Notas
Resultado final: 66 tests «rechaza manifiesto» (uno por frase), 83 pass en contrato-roles; `agentes/` y `skills/` sin cambios. Huecos: (1) la variante de la regla 8 apunta a «solo puedes mover la marca» (sin «`→`») porque la línea ya no es a mano; (2) se quitó la variante de «git diff scripts/» de la regla 15 (no es Bash; la cubre el manifiesto). La salida de `git diff --stat agentes skills | grep -c .` es `0` con `exit 1` real de grep (sin líneas, grep no encuentra nada).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
