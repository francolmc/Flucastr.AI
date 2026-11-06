---
estado: hecho
rama: feature/kit-v2
---
# verify-escalon-5

## Objetivo
El escalón 5 de `./verify` deja de contar todos los archivos de `~/.claude` y `~/.pi` (cambian solos con sesiones abiertas: 46126 → 46127) y compara solo lo que `instalar.sh` escribe, antes y después de `--simular`.

## Alcance
Solo `verify` (escalón 5) y este plan. Fuera de alcance: `instalar.sh`, `desinstalar.sh`, resolver, otros escalones. No dejar nada en el home real.

## Decisiones ya tomadas
- Rutas vigiladas (las que usa `instalar.sh`): `$HOME/.claude/agents`, `$HOME/.claude/skills`, `${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/agents`, `.../skills` y `$HOME/.local/bin/pi-*`. Las que no existan cuentan como vacías.
- La instantánea es una función `instantanea` que imprime, ordenada: cada ruta (`find`, sin seguir enlaces), el destino de cada enlace simbólico (`readlink`) y el hash del contenido de cada archivo (`find -L … -type f` + `shasum`). Comparar texto completo, no conteo.
- Las rutas salen de `$HOME` y `PI_CODING_AGENT_DIR` al llamarla, para poder probarla con un `HOME` temporal.
- Escalón 5a (autoprueba, siempre corre): en `mktemp -d` crear `.claude/agents`, `.claude/skills`, `.pi/agent/agents`, `.pi/agent/skills`, `.local/bin`; con `HOME=<tmp>` y `PI_CODING_AGENT_DIR` sin definir: (i) añadir un archivo en cada ruta vigilada, de a uno, → la instantánea DEBE cambiar; (ii) cambiar el contenido de uno existente → DEBE cambiar; (iii) añadir `.claude/projects/x/transcript.jsonl` y modificar `.claude/history.jsonl` → NO debe cambiar. Si no se cumple: `FALLO`. Borrar el temporal con `trap … EXIT` (solo si la variable no está vacía).
- Escalón 5b: instantánea real antes y después de `bash instalar.sh --simular >/dev/null`; si difieren, `FALLO` mostrando el `diff`.
- Nada de esto escribe en el home real.

## Escenarios
- CUANDO nada de lo vigilado cambia (aunque sí cambien transcripts u otros archivos de `~/.claude`) ENTONCES el escalón 5 pasa.
- CUANDO aparece, cambia o desaparece un archivo en una ruta vigilada ENTONCES el escalón 5 falla.
- CUANDO `instalar.sh --simular` sale con error ENTONCES falla.

## Verificación
`./verify` — termina en `VERIFY OK`, código 0, y se puede correr dos veces seguidas con sesiones de Claude abiertas sin fallar.

## Pasos
- [x] Reemplazar `conteo` por `instantanea` y reescribir el escalón 5 en dos partes (5a autoprueba en temporal, 5b real). Encabezado: `== 5. instalar.sh --simular no escribe lo que instala ==`.
- [x] Correr `./verify` dos veces; pegar la salida de ambas.
- [x] Prueba negativa de mutación: quitar `.claude/agents` de la lista de rutas de `instantanea`, correr `./verify`, confirmar `FALLO` en 5a con código ≠ 0, restaurar. Pegar salida.
- [x] Antes y después de las pruebas, anotar `ls -A ~/.claude/agents ~/.local/bin | shasum` y confirmar que es idéntico; `git status --short` sin archivos nuevos salvo los del cambio.
- [x] Confirmar que no queda `/tmp/tmp.*` ni `$TMPDIR` de la autoprueba tras correr `./verify`.

## Evidencia
$ ./verify   (corrida 1)
```
== 5. instalar.sh --simular no escribe lo que instala ==
ok autoprueba: reacciona a añadir y cambiar; ignora transcripts e history
-- 5b. instalar.sh --simular sobre el home real
ok instantánea sin cambios (585 líneas)
VERIFY OK
exit 0
```
$ ./verify   (corrida 2)
```
== 5. instalar.sh --simular no escribe lo que instala ==
ok autoprueba: reacciona a añadir y cambiar; ignora transcripts e history
-- 5b. instalar.sh --simular sobre el home real
ok instantánea sin cambios (585 líneas)
VERIFY OK
exit 0
```
$ mutación: quitar "$HOME/.claude/agents" de la lista de instantanea (sed sobre copia; verify restaurado desde respaldo, cmp idéntico) && ./verify
```
== 5. instalar.sh --simular no escribe lo que instala ==
FALLO: autoprueba: añadir .claude/agents/prueba.md no cambió la instantánea
exit 1
```
Antes/después: `ls -A ~/.claude/agents ~/.local/bin | shasum` = `813540cfac449b9082781e41eab6aba4bb71f39e` antes y después (idéntico). `git status --short`: lo único nuevo respecto a antes es ` M verify` (los `??` de `cambios/` y `friccion.md` ya existían). Temporales: `ls $TMPDIR/tmp.*` = 67 antes y después de `./verify`; ningún `/tmp/tmp.*`.

## Notas
- La instantánea usa `find` sin `-L` para rutas y enlaces, y `find -L -type f` + `shasum` para hashes; líneas ordenadas. Sin arreglos bash (compatible con bash 3.2 de macOS).
- La autoprueba corre en subshell con `HOME` temporal y `PI_CODING_AGENT_DIR` sin definir; el `trap EXIT` vive dentro de la subshell, así el temporal se borra también en FALLO.
- Primera mutación con `sed` tocó también la línea `mkdir -p` de la autoprueba, así que el FALLO salió por un error colateral (`No such file`). Se repitió con un `sed` que solo toca la lista de `instantanea`; ese es el resultado citado arriba.
- `estado` cambiado a `listo` porque `./verify` pasó desde cero dos veces.
