# task-01 — Logo sencillo en `assets/logo.svg`
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
El README necesita un logo. Esta tarea crea un único SVG chico y sin texto (sin depender de fuentes) en `assets/logo.svg`: un nodo central (el `coordinador`) unido a tres nodos (los otros tres roles). Es lo único que hace la tarea; el README lo referencia en `task-02`.

## Contexto
- No existe `assets/` (confirmado con `ls`); se crea. `assets/` no entra en `instalar-remoto.sh`: copia solo `agentes/`, `skills/`, `scripts/`, `instalar.sh`, `desinstalar.sh`, `instalar-remoto.sh` y `modelos.json` (`instalar-remoto.sh`, función `copiar_permitidas`, leído). No cambia nada del kit instalado.
- `xmllint` existe en este equipo (`/usr/bin/xmllint`, ejecutado `--version`). No hay `rsvg-convert` ni `mmdc`.
- El SVG de abajo se validó con `xmllint --noout` en la planificación (ver Verificación).

## Decisiones ya tomadas
- Archivo único: `assets/logo.svg`, contenido exacto (una sola línea, sin cambios de colores ni formas):
```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-labelledby="t"><title id="t">Flucastr.AI</title><rect width="64" height="64" rx="14" fill="#111827"/><path d="M32 32V14M32 32L16 44M32 32L48 44" stroke="#9CA3AF" stroke-width="2.5" stroke-linecap="round" fill="none"/><circle cx="32" cy="32" r="8" fill="#F59E0B"/><g fill="#E5E7EB"><circle cx="32" cy="14" r="5"/><circle cx="16" cy="44" r="5"/><circle cx="48" cy="44" r="5"/></g></svg>
```
- Sin `<text>`, sin imágenes incrustadas, sin scripts ni enlaces externos. Termina con un salto de línea.

## Alcance / Fuera de alcance
Alcance: crear la carpeta `assets/` y el archivo `assets/logo.svg`.
Fuera de alcance: editar `README.md` (es `task-02`), `definitions/ARCHITECTURE.md`, `instalar*.sh`, pruebas o cualquier otro archivo; versiones PNG o favicon; cambiar el diseño.

## Pasos
1. Crear `assets/logo.svg` con exactamente el contenido de *Decisiones ya tomadas* (línea del SVG, sin las vallas de código).
2. Ejecutar los comandos de *Verificación* y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. `xmllint --noout assets/logo.svg` termina con código 0 y sin salida.
2. `wc -c < assets/logo.svg` imprime un número menor que 1024.
3. `grep -c "<text\|<script\|href=" assets/logo.svg` imprime `0`.
4. `git status --short` lista `assets/` como único cambio nuevo propio de la tarea (más los cambios previos de `definitions/` y de `features/F15-actualizar-readme/`).

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
xmllint --noout assets/logo.svg; echo "rc=$?"
wc -c < assets/logo.svg
grep -c "<text\|<script\|href=" assets/logo.svg
git status --short
```
Salida esperada: `rc=0`; un número < 1024; `0`; y en `git status` aparece `?? assets/`. Planificación: el SVG se validó con `xmllint` en un archivo temporal fuera del repo; el archivo real en `assets/`: no ejecutado, inferido.

## Evidencia
Comando y salida reales (`cd /Users/franco/Codes/flucastr/Flucastr.AI`, rama `chore/F15-actualizar-readme`):

```
$ xmllint --noout assets/logo.svg; echo "rc=$?"
rc=0
$ wc -c < assets/logo.svg
     484
$ grep -c "<text\|<script\|href=" assets/logo.svg
0
$ git status --short
 M definitions/BACKLOG.md
 M definitions/STATUS.md
?? assets/
?? features/F15-actualizar-readme/
```

Criterios de aceptación:
1. `xmllint` termina con `rc=0` y sin salida: cumple.
2. `wc -c` da 484 (< 1024): cumple.
3. `grep -c` da `0`: cumple.
4. `git status --short` muestra `?? assets/` como único cambio nuevo de la tarea, más los cambios previos de `definitions/` y `features/F15-actualizar-readme/`: cumple.

## Notas
- Rama `chore/F15-actualizar-readme` creada con `git switch -c` desde `main` (no existía). No se hizo commit, push ni merge.
- El archivo se escribió con `printf '%s\n'`, así que termina con salto de línea, como pide la tarea. El contenido del SVG es el de *Decisiones ya tomadas* sin cambios.
- Los cambios previos de `definitions/BACKLOG.md`, `definitions/STATUS.md` y `features/F15-actualizar-readme/` no se tocaron. Solo se editaron *Evidencia*, *Notas* y `estado` de esta tarea.
- Huecos menores: 0.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
