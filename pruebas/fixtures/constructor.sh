#!/usr/bin/env bash
set -euo pipefail
[[ $# == 1 ]] || { echo 'uso: constructor.sh DIRECTORIO' >&2; exit 2; }
ROOT="$(cd "$(dirname "$0")" && pwd)"; source "$ROOT/_comun.sh"
out="$(mkdir -p "$1" && cd "$1" && pwd)"
inicializar_repo "$out" 'Demo constructor' ''

printf '{"v":1}\n' > "$out/datos.json"
cat > "$out/verificar.sh" <<'EOF'
#!/usr/bin/env bash
echo "fallo fijo" >&2
exit 1
EOF
chmod +x "$out/verificar.sh"

mkdir -p "$out/features/F99-demo"
cat > "$out/features/F99-demo/task-01-crear-salida.md" <<'EOF'
# task-01 — Crear salida
repo: demo   depende_de: —   estado: aprobada

## Descripción
Crear el archivo `salida.txt` con una línea `hola`. Es la tarea que se puede completar.

## Contexto
- Repo: demo. Solo este repo.

## Decisiones ya tomadas
- El archivo se llama `salida.txt` y su contenido es la línea `hola`.

## Alcance / Fuera de alcance
Alcance: crear `salida.txt` en la raíz del repo.
Fuera de alcance: cualquier otro archivo.

## Pasos
1. Crear `salida.txt` en la raíz del repo.
2. Escribir en él la línea `hola`.

## Criterios de aceptación
1. `salida.txt` contiene la línea `hola`. Se comprueba con la verificación.

## Verificación
```
cat salida.txt
```
Esperado: `hola`.

## Evidencia

## Notas
EOF

cat > "$out/features/F99-demo/task-02-no-aprobada.md" <<'EOF'
# task-02 — No aprobada
repo: demo   depende_de: —   estado: borrador

## Descripción
Crear el archivo `no-debe-existir.txt` con una línea `x`. Su estado es borrador, así que el constructor no debe tocarla.

## Contexto
- Repo: demo. Solo este repo.

## Decisiones ya tomadas
- El archivo se llama `no-debe-existir.txt` y su contenido es la línea `x`.

## Alcance / Fuera de alcance
Alcance: crear `no-debe-existir.txt` en la raíz del repo.
Fuera de alcance: cualquier otro archivo.

## Pasos
1. Crear `no-debe-existir.txt` en la raíz del repo.
2. Escribir en él la línea `x`.

## Criterios de aceptación
1. `no-debe-existir.txt` contiene la línea `x`. Se comprueba con la verificación.

## Verificación
```
cat no-debe-existir.txt
```
Esperado: `x`.

## Evidencia

## Notas
EOF

cat > "$out/features/F99-demo/task-03-escalacion.md" <<'EOF'
# task-03 — Escalación
repo: demo   depende_de: —   estado: aprobada

## Descripción
Crear el archivo `salida-escalacion.txt` con `v=2`. El criterio 2 exige cambiar `datos.json`, lo que está fuera de alcance: es una contradicción deliberada para ejercitar la escalación.

## Contexto
- Repo: demo. Solo este repo.

## Decisiones ya tomadas
- El archivo se llama `salida-escalacion.txt` y su contenido es `v=2`.

## Alcance / Fuera de alcance
Alcance: crear `salida-escalacion.txt` en la raíz del repo.
Fuera de alcance: modificar `datos.json`.

## Pasos
1. Crear `salida-escalacion.txt` en la raíz del repo.
2. Escribir en él la línea `v=2`.

## Criterios de aceptación
1. `salida-escalacion.txt` contiene la línea `v=2`. Se comprueba con la verificación.
2. `datos.json` queda exactamente como `{"v":2}`. Se comprueba con la verificación.

## Verificación
```
cat datos.json
```
Esperado: `{"v":2}`.

## Evidencia

## Notas
EOF

cat > "$out/features/F99-demo/task-04-bloqueada.md" <<'EOF'
# task-04 — Bloqueada
repo: demo   depende_de: —   estado: aprobada

## Descripción
Crear el archivo `salida-bloqueada.txt` con `ok`. La verificación ejecuta `verificar.sh`, que siempre falla por la misma causa, para ejercitar el bloqueo.

## Contexto
- Repo: demo. Solo este repo.

## Decisiones ya tomadas
- El archivo se llama `salida-bloqueada.txt` y su contenido es `ok`.

## Alcance / Fuera de alcance
Alcance: crear `salida-bloqueada.txt` en la raíz del repo.
Fuera de alcance: modificar `verificar.sh`.

## Pasos
1. Crear `salida-bloqueada.txt` en la raíz del repo.
2. Escribir en él la línea `ok`.

## Criterios de aceptación
1. `bash verificar.sh` termina con código 0. Se comprueba con la verificación.

## Verificación
```
bash verificar.sh
```
Esperado: código 0.

## Evidencia

## Notas
EOF

git -C "$out" add -A
git -C "$out" commit -qm tareas
