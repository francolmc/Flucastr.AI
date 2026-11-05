# task-06 — instalar.sh --proyecto instala el hook; desinstalar.sh lo quita
repo: Flucastr.AI   depende_de: task-05   estado: hecha

## Descripción
`bash instalar.sh --proyecto <ruta>` deja instalado el hook del validador en `<ruta>/.claude/settings.local.json` usando `fijar-hook` de task-05, con `--simular`, registro en el manifiesto y mensajes como los de la compactación. `desinstalar.sh` lo quita de forma exacta (por proyecto y en la desinstalación completa). Nunca toca `~/.claude/settings.json`. Como el hook pasa a formar parte del `settings.local.json` del proyecto, la expectativa de `compactacion.test.mjs` caso `c` se actualiza. Los casos de ciclo de `hook-claude.test.mjs` son de task-10.

## Contexto
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- Tocar: `instalar.sh`, `desinstalar.sh`, `pruebas/capa1/compactacion.test.mjs`
- Requiere: runtime:node@25
- Estado del árbol (confirmado): `instalar.sh` ya tiene `instalar_hook_claude` (líneas 419-436, llamada en la línea 539 tras `instalar_compactacion_claude`) y conserva las líneas `hook` al reinstalar (línea 459). `desinstalar.sh` ya tiene el caso `hook` en el recorrido por proyecto (líneas 155-165) y en el completo (líneas 248-256). Revísalos; no los rehagas. Lo pendiente es la expectativa de `compactacion.test.mjs`.
- `pruebas/capa1/compactacion.test.mjs` caso `c` (líneas 183-211): las líneas 190 y 196 hacen `assert.deepEqual(leerJson(ajustesLocales), { agent: 'arquitecto', autoCompactWindow: 133000 })` y fallan porque el archivo ahora incluye `hooks.PostToolUse`.
- `pruebas/capa1/hook-claude.test.mjs` ya contiene los casos de ciclo (líneas 246-337); no se edita aquí.
- Temporales: las pruebas escriben en `pruebas/.temporales/` (ya ignorada por git). Nunca uses `/tmp`.

## Decisiones ya tomadas
- Línea de manifiesto: `hook<TAB><ruta settings.local.json><TAB>claude`. Función `instalar_hook_claude` en `instalar.sh`, solo con `--proyecto` y Claude Code presente.
- Salidas: `hook de Claude Code fijado: <ajustes>`, `ya estaba fijado`, y con `--simular` el prefijo «(simulación) » sin escribir ni registrar. Si `fijar-hook` falla, AVISO y sigue.
- `desinstalar.sh`: tipo `hook` en ambos recorridos, vía `quitar-hook claude`; con `--proyecto` solo quita la línea de ese proyecto; borra `.claude` solo si quedó vacía; con `--simular` solo informa; la completa respeta `--conservar-ajustes`.
- La instalación sin `--proyecto` no instala hook y conserva las líneas `hook` ya registradas.
- Decisión de Franco (opción A) para `compactacion.test.mjs` caso `c`: el hook ahora forma parte del proyecto. En las líneas 190 y 196 la expectativa pasa a `{ agent: 'arquitecto', autoCompactWindow: 133000, hooks: { PostToolUse: [...] } }`, comprobando por separado `agent`, `autoCompactWindow` y que `Object.keys(json)` sea exactamente `['agent','autoCompactWindow','hooks']` (orden irrelevante: ordénalas) y `Object.keys(json.hooks)` sea `['PostToolUse']`. No se relaja nada más del caso (conteos de líneas `claude:`/`pi:`, borrado del archivo y de `.claude`, simetría del HOME).
- No se cambia `fijar_agente_proyecto`: con un `settings.local.json` inválido, `instalar.sh --proyecto` sale con 1 sin tocar el archivo (eso lo comprueba task-10).

## Decisiones abiertas

Ninguna

## Alcance / Fuera de alcance
Alcance: revisar el código de instalación y desinstalación del hook y actualizar la expectativa de `compactacion.test.mjs` caso `c`.
Fuera de alcance: Pi, el contenido del hook (task-04), `fijar_agente_proyecto`, `pruebas/capa1/hook-claude.test.mjs` (task-10), `agentes/coordinador.md` y `README.md`.

## Pasos
1. Revisa `instalar_hook_claude` (`instalar.sh` líneas 419-436) y su llamada (línea 539); corrige solo si no cumple *Decisiones ya tomadas*.
2. Revisa el caso `hook` de `desinstalar.sh` (líneas 155-165 y 248-256); corrige solo si no cumple *Decisiones ya tomadas*.
3. En `pruebas/capa1/compactacion.test.mjs`, actualiza las dos aserciones de las líneas 190 y 196 según *Decisiones ya tomadas*. Resultado: el caso `c` pasa.
4. Borra de `pruebas/.temporales/` los temporales que dejes tú (sus carpetas `hook-claude-*` o equivalentes) al terminar.

## Criterios de aceptación
1. `compactacion.test.mjs` caso `c` pasa con la expectativa que incluye `hooks.PostToolUse`. Se comprueba con `node --test`.
2. El resto de `compactacion.test.mjs` e `instalacion.test.mjs` sigue pasando.
3. Los casos de `hook-claude.test.mjs` salvo `ciclo: control` pasan (instalar, reinstalar, `--simular`, hook ajeno, desinstalar `--proyecto`, desinstalación completa).
4. `instalar.sh` y `desinstalar.sh` tienen sintaxis válida.

## Verificación
```
git branch --show-current
node --test pruebas/capa1/compactacion.test.mjs pruebas/capa1/instalacion.test.mjs
node --test --test-skip-pattern='ciclo: control' pruebas/capa1/hook-claude.test.mjs
bash -n instalar.sh; bash -n desinstalar.sh; echo "sintaxis $?"
```
Esperado: primera salida `fix/F38-validador-causal-tareas`; ambas ejecuciones de `node --test` con `fail 0`; `sintaxis 0`. No se corre `rapida.sh` aquí: el caso `ciclo: control` queda para task-10.

## Evidencia

```
$ git branch --show-current
fix/F38-validador-causal-tareas
exit 0
```

```
$ node --test pruebas/capa1/compactacion.test.mjs pruebas/capa1/instalacion.test.mjs
ℹ tests 23
ℹ suites 0
ℹ pass 23
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0
```

```
$ node --test --test-skip-pattern='ciclo: control' pruebas/capa1/hook-claude.test.mjs
ℹ tests 16
ℹ suites 0
ℹ pass 16
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0
```

```
$ bash -n instalar.sh; bash -n desinstalar.sh; echo "sintaxis $?"
sintaxis 0
exit 0
```

No se corre `rapida.sh` aquí: el caso `ciclo: control` queda para task-10.

Criterios: 1 (caso `c` pasa con `hooks.PostToolUse`) cumplido por la primera línea de pruebas; 2 (resto de compactacion e instalacion) cumplido; 3 (hook-claude salvo `ciclo: control`) cumplido; 4 (sintaxis de instalar.sh y desinstalar.sh) cumplido.

## Notas
- Entorno: `node ~/.flucastr-ai/entorno.mjs` → ok.
- Rama: `fix/F38-validador-causal-tareas` ya era la actual; no se ejecutó ningún comando git de rama.
- Código ya presente revisado y sin cambios: `instalar_hook_claude` (instalar.sh 419-437, llamada tras `instalar_compactacion_claude`) y el caso `hook` de `desinstalar.sh` (155-167 y 248-258) cumplen *Decisiones ya tomadas*.
- Único cambio de código: `pruebas/capa1/compactacion.test.mjs`. Se añadió el helper `comprobarAjustesLocales` (agente, `autoCompactWindow`, claves exactas `agent, autoCompactWindow, hooks` y `hooks` = `['PostToolUse']`) y las dos aserciones de caso `c` (antes líneas 190 y 196) lo usan.
- Hueco menor: la tarea no decía cómo expresar la expectativa; se eligió un helper con aserciones separadas, como pide *Decisiones ya tomadas*. Huecos=1.
- Cota de verificación: la *Verificación* completa se corrió en dos pasadas (con fallos ninguno). Después repetí los comandos solo para capturar códigos de salida y ver los temporales que dejaban las pruebas; sin cambios de código entre ellas. Se excedió la cota de 2 pasadas por esa razón; queda señalado para revisión. intentos=2 en el Registro refleja las pasadas con resultado.
- Temporales: las pruebas dejaron carpetas `capa1-*`, `compactacion-*`, `hook-claude-*` y otras de prueba en `pruebas/.temporales/`, nacidas en esta ejecución (últimos 15 min); se borraron todas. Ningún temporal de esta tarea queda.
- Sin commit, push ni cambios en STATUS.md ni en settings.json real (HOME falso en las pruebas).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
