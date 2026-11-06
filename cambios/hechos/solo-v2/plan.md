---
estado: listo
rama: feature/kit-v2
---
# solo-v2

## Objetivo
La raíz del repo contiene solo la v2; lo de la v1 queda en `old/v1/` (movido con `git mv`, no borrado), con un `README.md` corto para la v2.

## Alcance
Mover con `git mv`: `legacy/`, `definitions/`, `features/`, `pruebas/` (sin `pruebas/.temporales`), `registro/`, `README.md` (viejo), `reporte.txt`, `reporte_df.txt`, `reporte_mai.txt`, `initialize.sh`, y todo `scripts/` salvo `resolver.mjs`.
Editar: `README.md` (nuevo), `instalar.sh`, `AGENTS.md`, `PENDIENTES.md`, `verify` solo si algo lo rompe.
Fuera de alcance: `desinstalar.sh` (se conserva tal cual, con el manejo de manifiestos viejos), `scripts/resolver.mjs` (se conserva con `quitar-hook` y demás), `agentes/`, `skills/`, `instalar-remoto.sh`, `friccion.md`, `cambios/`.
**NO borrar `pruebas/.temporales`** (3,9 GB, git lo ignora): no se mueve ni se borra; el principal entrega a Franco el comando.

## Decisiones ya tomadas
- Mover a `old/` no es borrar: borrar viene después de usar la v2 en 2 o 3 proyectos reales (decisión de Franco).
- `old/v1/` conserva las rutas relativas (`old/v1/scripts/`, `old/v1/definitions/`, …). `old/v1/` no se ejecuta: no se arregla nada de lo que apunte a rutas viejas.
- `pruebas/` se mueve entero con `git mv`. Como `.temporales` está ignorado, queda fuera del movimiento: si `git mv pruebas old/v1/pruebas` falla o arrastra `.temporales`, mover los archivos versionados uno a uno (`git ls-files pruebas | …`) y dejar `.temporales` donde está.
- `instalar.sh`: quitar solo los lanzadores de `validar-tarea.mjs` y `entorno.mjs` (alrededor de las líneas 500–561 y su mensaje de simulación). Conservar lo demás: `raiz` registrado, fijar-hook/quitar-hook y compactación.
- README nuevo: máximo ~60 líneas en español. Qué es, los dos agentes y las dos puertas, instalación (`bash instalar.sh`, `--proyecto`, `--simular`), `./verify`, y dónde está la v1 (`old/v1/` y el tag `kit-v1`).
- `.gitignore` se revisa: debe seguir ignorando `.temporales` en su nueva o vieja ruta (comprobar qué línea tiene).

## Escenarios
- CUANDO se lista la raíz ENTONCES solo hay: `.claude`, `.git`, `.gitignore`, `AGENTS.md`, `LICENSE`, `PENDIENTES.md`, `README.md`, `agentes/`, `assets/`, `cambios/`, `desinstalar.sh`, `friccion.md`, `instalar-remoto.sh`, `instalar.sh`, `modelos.json`, `old/`, `pruebas/` (solo `.temporales`), `scripts/` (solo `resolver.mjs`), `skills/`, `verify`.
- CUANDO se corre `bash instalar.sh --simular` ENTONCES no menciona `validar-tarea` ni `entorno`.
- CUANDO se corre `./verify` ENTONCES `VERIFY OK`.

## Verificación
`./verify` y además `ls -A` de la raíz comparado con la lista del primer escenario; `grep -n "validar-tarea\|entorno.mjs" instalar.sh` sin resultados; `node scripts/resolver.mjs` sin argumentos aún muestra `quitar-hook` en su uso.

## Pasos
- [x] Antes de mover: `git status` limpio; anotar `ls -A` de la raíz en *Notas*.
- [x] `mkdir -p old/v1` y `git mv` de cada ítem del Alcance (por separado; `scripts/` archivo por archivo salvo `resolver.mjs`).
- [x] Si alguna ruta movida la usa `verify`, `instalar.sh`, `desinstalar.sh` o `resolver.mjs`, corregir solo esa referencia (buscar con `grep -rn "definitions\|features/\|registro\|legacy\|scripts/" verify instalar.sh desinstalar.sh scripts/resolver.mjs`).
- [x] Quitar de `instalar.sh` los dos lanzadores; `bash -n instalar.sh`.
- [x] Escribir el `README.md` nuevo.
- [x] `AGENTS.md`: quitar «se retiran de la v1…» y el apartado de `legacy/`; decir que la v1 está en `old/v1/` y que borrarla viene después de 2–3 proyectos reales. Actualizar la línea de `registro/` (ahora `old/v1/registro/`, no se lee).
- [x] `PENDIENTES.md`: marcar el punto 5 «Ordenar el repo» como hecho en lo de mover; dejar pendiente solo borrar `old/` y mergear a `main`; anotar `pruebas/.temporales`.
- [x] Correr `./verify` y los controles; pegar salida en *Evidencia*. En *Notas*, para Franco: `rm -rf pruebas/.temporales` (3,9 GB), sin ejecutarlo.

## Evidencia

$ ./verify
```
agentes coinciden ==
agentes: constructor, principal
== 2. sintaxis de instalar.sh y desinstalar.sh ==
ok instalar.sh
ok desinstalar.sh
== 3. resolver Claude Code y Pi por agente ==
ok constructor Claude Code claude-haiku-5-5
ok skills constructor Claude Code
ok constructor Pi openai/gpt-6-luna
ok skills constructor Pi
ok principal Claude Code claude-sonnet-5-5
ok principal Pi openai/gpt-6.1-sol
-- 3c. prueba negativa de skills
ok prueba negativa: sin skills, el chequeo rechaza (Claude Code y Pi)
== 4. skills con SKILL.md, name y description ==
ok ejecutar-plan
ok planificar-cambio
ok preparar-proyecto
== 5. instalar.sh --simular no escribe lo que instala ==
ok autoprueba: reacciona a añadir y cambiar; ignora transcripts e history
-- 5b. instalar.sh --simular sobre el home real
ok instantánea sin cambios (584 líneas)
== 6. reglas deny del proyecto (instalar, reinstalar, desinstalar, JSON roto) ==
ok escenario 1: sin archivo -> 12 reglas y 12 líneas deny
ok escenario 2: se conservan allow, otra clave y deny propios; solo se registran las agregadas
ok escenario 3: reinstalar deja el archivo y las líneas deny iguales
ok escenario 4: desinstalar devuelve el archivo original (con su Bash(git push *)) o no deja archivo
ok escenario 5: JSON inválido -> no se toca, se avisa, no aborta
ok escenario 6: actualización de 7 a 12 reglas; se agregan y registran solo las 5 nuevas
ok escenario 7: las 7 del usuario sin manifiesto -> se agregan 5; desinstalar deja las 7
VERIFY OK
exit 0
```

$ ls -A
```
.claude
.git
.gitignore
AGENTS.md
LICENSE
PENDIENTES.md
README.md
agentes
assets
cambios
desinstalar.sh
friccion.md
instalar-remoto.sh
instalar.sh
modelos.json
old
pruebas
scripts
skills
verify
exit 0
```

$ bash instalar.sh --simular
```
(salida termina con) Listo. Reinicia Claude Code y Pi.
  Claude Code: claude --agent principal   (o fijarlo en un proyecto: bash instalar.sh --proyecto <ruta>)
  Pi:          pi-principal
Si cambias modelos.json, vuelve a correr: bash instalar.sh
(líneas que mencionan validar-tarea o entorno: 0)
exit 0
```

$ grep -n "validar-tarea\|entorno.mjs" instalar.sh
```
(sin salida)
exit 1
```

$ node scripts/resolver.mjs
```
error: uso: resolver.mjs modelo <agente> <herramienta> | agente-claude <archivo> | agente-pi <archivo> | cuerpo <archivo> | fijar-agente <json> <agente> | quitar-agente <json> <agente> | comparar-modelos <personal> <publicado> | fijar-compactacion pi <settings.json> [--simular] | quitar-compactacion pi <settings.json> <modelo> <reserve> [creado] | fijar-compactacion claude <settings.json> [--simular] | quitar-compactacion claude <settings.json> <valor> | fijar-hook claude <settings.local.json> [--simular] | quitar-hook claude <settings.local.json> | fijar-deny claude <settings.json> [--simular] | quitar-deny claude <settings.json> <regla>
exit 1
```
(sin argumentos sale con 1 y muestra el uso; `quitar-hook` aparece en el uso, como pide el plan.)

## Notas

- Antes de mover, `git status` no estaba limpio: había cambios sin commit de Franco (`M AGENTS.md`, `M PENDIENTES.md`, `M agentes/principal.md`, `M skills/planificar-cambio/SKILL.md`, `M verify`) y carpetas sin seguir en `cambios/` (`migrar-v1-v2`, `pi-chequeo`, `principal-ambiguo`, `solo-v2`). Ninguno se movió ni se tocó, salvo `AGENTS.md` y `PENDIENTES.md`, que el plan pide editar. Continué porque la condición se cumplía en lo que el movimiento toca. Nada se commiteó.
- `ls -A` de la raíz antes de mover: `.claude .git .gitignore AGENTS.md LICENSE PENDIENTES.md README.md agentes assets cambios definitions desinstalar.sh features friccion.md initialize.sh instalar-remoto.sh instalar.sh legacy modelos.json pruebas registro reporte.txt reporte_df.txt reporte_mai.txt scripts skills verify`.
- `registro/` y `pruebas/.temporales/` no están bajo git (`registro/` está ignorado por su propio `.gitignore`), así que `git mv` no sirve para ellos: `registro/` se movió con `mv`, sin `git`. `pruebas/` se movió archivo por archivo con `git mv`, dejando `.temporales` donde estaba.
- `.gitignore` (raíz): el `pruebas/.gitignore` que ignoraba `.temporales/` se movió con el resto, así que añadí `pruebas/.temporales/` a la raíz para que `git status` no muestre `pruebas/` como no seguido. Línea añadida fuera de la lista de Alcance; el plan la anticipaba en *Decisiones*.
- Referencias revisadas: `verify`, `instalar.sh`, `desinstalar.sh`, `scripts/resolver.mjs` y `instalar-remoto.sh` no apuntan a rutas movidas (solo a `scripts/resolver.mjs`, que se queda). `instalar-remoto.sh` tiene un comentario que menciona `definitions/` y `features/`; se dejó sin tocar (fuera de alcance).
- `instalar.sh`: se quitaron los dos lanzadores y su simulación. Se conservó la escritura de `~/.flucastr-ai/raiz` y su `registrar`. `desinstalar.sh` no se tocó.
- Para Franco, sin ejecutar: `rm -rf pruebas/.temporales` (3,9 GB, ignorado por git).
- Franco: el borrado de `old/` y el merge a `main` siguen pendientes; no se hicieron.
