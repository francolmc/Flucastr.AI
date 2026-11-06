---
estado: listo
rama: feature/kit-v2
---
# migrar-v1-v2

## Objetivo
`bash instalar.sh --migrar <proyecto> [--simular]` pasa un proyecto de la v1 a la v2 sin borrar nada, y la skill `migrar-proyecto` termina el trabajo que el script no puede hacer (AGENTS.md, verify, planes).

## Alcance
Editar: `instalar.sh` (modo `--migrar`), `scripts/resolver.mjs` solo si falta un comando para el hook, `verify` (escalón nuevo), `AGENTS.md`, `PENDIENTES.md`.
Crear: `skills/migrar-proyecto/SKILL.md`; `agentes/constructor.md` NO se toca.
Fuera de alcance: `desinstalar.sh`, `old/v1/`, y el original de Cleaner (`/Users/franco/Codes/flucastr/Flucastr.Cleaner`): jamás se escribe ahí.
Este plan va **después** de `cambios/solo-v2` (ya aplicado): `old/` existe en el repo.

## Decisiones ya tomadas
- `--migrar` solo trabaja sobre el proyecto, nunca en `~/.claude` ni `~/.pi`. Solo Claude Code. Se combina con `--simular` y no con `--proyecto`/`--skills-proyecto` (error claro).
- Mover (nunca borrar, nunca tocar `src/`): `definitions/`, `features/`, `registro/` → `<proyecto>/old/v1/<nombre>/`, con `mv` (o `git mv` si el proyecto es git y el archivo está versionado). Solo los que existan.
- Si `<proyecto>/old/v1` ya existe: se detiene sin cambiar nada y lo dice.
- Si no existe ninguna de las tres: imprime «nada que migrar» y sale 0, sin crear `cambios/` ni tocar settings.
- Agente por defecto: `.claude/settings.local.json` queda con `agent: principal`, aunque hubiera otro. Se reusa el resolver de `fijar-agente`; si ese comando no sobrescribe, añadir una opción explícita y cubrirla en `verify`.
- Hook de v1: quitarlo con `resolver.mjs quitar-hook claude <settings.local.json>`. Si no hay hook o no hay archivo, no es error.
- Reglas deny: reutilizar la función que ya instala las 12 en `<proyecto>/.claude/settings.json` (`fijar-deny`) y registrarlas igual que hoy en el manifiesto.
- Crear `<proyecto>/cambios/` (con `hechos/` vacío no hace falta; solo `cambios/`).
- Trabajo a medias, solo se lista (no se convierte aquí): en `old/v1/features/*/task-*.md`, las tareas con `estado: aprobada | en curso | bloqueada` (línea 2: `repo: … depende_de: … estado: X`), y la feature abierta de `old/v1/definitions/BACKLOG.md` (fila cuyo Estado no sea hecho/completada). Formato: una línea por ítem, con ruta. Con `--simular` se lista desde su ubicación original.
- Idempotente: una segunda corrida (ya movido) cae en «nada que migrar» o en «old/v1 ya existe», sin error ni cambios.
- Tolerante: proyecto sin `.claude/`, sin `settings.local.json`, sin git, con solo `definitions/`, etc.
- Skill `migrar-proyecto`: (1) correr/leer la lista de trabajo a medias; (2) leer `old/v1/definitions/` (PROJECT, ARCHITECTURE, BACKLOG, STATUS) y escribir un `AGENTS.md` corto (<40 líneas: qué es, stack, reglas, comando verify); (3) proponer el `verify` (cargar `preparar-proyecto`) pero no inventar uno: si no puede probarlo, lo deja como plan; (4) convertir cada trabajo abierto en un plan `cambios/<nombre>/plan.md` en `borrador`, con `planificar-cambio`; (5) detenerse para la puerta 1. En su frontmatter, el aviso de que si la usa un subagente en Pi debe declararse en `skills:` del agente (agregar el campo no hace falta en `agentes/`: ningún agente la usa hoy).

## Escenarios
- CUANDO el proyecto tiene `definitions/`, `features/`, `registro/`, hook y un agente distinto ENTONCES queda todo en `old/v1/`, el agente es `principal`, sin hook, con 12 reglas deny, con `cambios/` y la lista de trabajo a medias.
- CUANDO se repite ENTONCES «old/v1 ya existe» y nada cambia (comparar hashes del árbol).
- CUANDO solo hay `definitions/` ENTONCES se mueve esa y sigue sin error.
- CUANDO no hay v1 ENTONCES «nada que migrar».
- CUANDO se usa `--simular` ENTONCES imprime todo lo que haría y el árbol queda idéntico.

## Verificación
`./verify` con un escalón nuevo («migración a v2») que arma en un temporal un proyecto v1 sintético (con las tres carpetas, un `task-` `aprobada` y otro `hecha`, hook de v1 y agente distinto en `settings.local.json`; `src/x.txt` con hash anotado) y comprueba los cinco escenarios; también falla si `--migrar --simular` modifica el árbol. Usar un HOME temporal como en el escalón 6.

Prueba manual obligatoria además (va a *Evidencia*): `cp -R /Users/franco/Codes/flucastr/Flucastr.Cleaner "$(mktemp -d)/Cleaner"` y sobre esa copia `--migrar --simular` y luego `--migrar`; mostrar la lista de trabajo a medias. Cleaner tiene `definitions/`, `features/` y `src/`, pero no `registro/`, `.claude/` ni hook (por eso el sintético los cubre). Confirmar al final con `git -C` / `diff -rq` que el original no cambió (comparar `git status --short` antes y después).

## Pasos
- [x] Leer `instalar.sh`: parseo de argumentos, función de agente por defecto, hook y deny; anotar en *Notas* qué reutiliza.
- [x] Añadir `--migrar <proyecto>` al parseo y al uso del encabezado, con las validaciones de combinación.
- [x] Implementar la función `migrar` con las decisiones de arriba, en el orden: validar → mover → agente → hook → deny → `cambios/` → lista.
- [x] Implementar «nada que migrar» y «old/v1 ya existe» antes de cualquier cambio.
- [x] Crear `skills/migrar-proyecto/SKILL.md` (nombre = carpeta, descripción en una frase).
- [x] Agregar el escalón de migración a `verify`; probar que falla a propósito (p. ej. sin mover `registro/`) y revertir el fallo.
- [x] `AGENTS.md`: skill `migrar-proyecto` y el comando `--migrar`. `PENDIENTES.md`: «migrar Cleaner real» como paso de Franco.
- [x] Correr `./verify` y la prueba manual con la copia de Cleaner; pegar salidas en *Evidencia*.

## Evidencia

$ ./verify
(salida completa en 2 049 bytes; esta es la cola, los pasos 1 a 6 terminaron igual)
ok escenario 4: desinstalar devuelve el archivo original (con su Bash(git push *)) o no deja archivo
ok escenario 5: JSON inválido -> no se toca, se avisa, no aborta
ok escenario 6: actualización de 7 a 12 reglas; se agregan y registran solo las 5 nuevas
ok escenario 7: las 7 del usuario sin manifiesto -> se agregan 5; desinstalar deja las 7
== 7. migración a v2 (--migrar, --simular, repetición, sin v1) ==
ok escenario 1: old/v1 con las tres carpetas, agente principal, sin hook, 12 deny, cambios/, lista de trabajo a medias
ok escenario 2: repetir dice «old/v1 ya existe» y no cambia el árbol
ok escenario 3: solo definitions/ -> se mueve y no hay error
ok escenario 4: sin v1 -> «nada que migrar», sin cambios
ok escenario 5: --simular imprime el plan y no cambia el árbol
ok escenario 6: --migrar con --proyecto da error y no cambia nada
VERIFY OK
exit 0

$ (prueba a propósito) copia del kit con `for d in definitions features registro` cambiado a `for d in definitions features`, y ./verify
ok escenario 7: las 7 del usuario sin manifiesto -> se agregan 5; desinstalar deja las 7
== 7. migración a v2 (--migrar, --simular, repetición, sin v1) ==
FALLO: escenario 1: falta old/v1/registro
exit 1

$ (prueba a propósito) copia del kit con --simular que hace mkdir de cambios/, y ./verify
FALLO: escenario 5: --simular cambió el proyecto
exit 1

$ (prueba manual) cp -R /Users/franco/Codes/flucastr/Flucastr.Cleaner "$(mktemp -d)/Cleaner"; luego, con HOME temporal, bash instalar.sh --migrar <copia> --simular y bash instalar.sh --migrar <copia>
SIMULACIÓN: no se escribe nada. Esto es lo que haría:
Mover a old/v1/ (nada se borra; src/ no se toca):
  movería: definitions -> old/v1/definitions
  movería: features -> old/v1/features
  (agente, hook, 12 reglas deny y cambios/ como en la corrida real; la lista completa está en la salida)
Trabajo a medias (solo se lista; no se convierte aquí):
  feature abierta: F04 Limpieza consentida Windows/WSL, con papelera, puntos de restauración, DISM ResetBase e hibernación como opciones sensibles (estado: pendiente) [definitions/BACKLOG.md]
  feature abierta: F05 Diagnóstico, plan y limpieza consentida Docker Desktop local, incluidos volúmenes como opción sensible (estado: pendiente) [definitions/BACKLOG.md]
  feature abierta: F06 Compactación VHDX manual desde Windows, con consentimiento de cierre WSL/Docker e informe de recuperación física (estado: pendiente) [definitions/BACKLOG.md]
SIMULACIÓN: no se escribió nada.
exit 0

$ bash instalar.sh --migrar <copia>   (corrida real sobre la copia)
movido (git mv): definitions -> old/v1/definitions
movido (git mv): features -> old/v1/features
agente predeterminado fijado: principal (…/Cleaner/.claude/settings.local.json)
sin hook de v1 que quitar: (…/Cleaner/.claude/settings.local.json)
regla deny de Claude Code agregada: Read(./.env) … (12 líneas, una por regla)
creado: …/Cleaner/cambios/
Trabajo a medias (solo se lista; no se convierte aquí):
  feature abierta: F04 Limpieza consentida Windows/WSL, con papelera, puntos de restauración, DISM ResetBase e hibernación como opciones sensibles (estado: pendiente) [old/v1/definitions/BACKLOG.md]
  feature abierta: F05 Diagnóstico, plan y limpieza consentida Docker Desktop local, incluidos volúmenes como opción sensible (estado: pendiente) [old/v1/definitions/BACKLOG.md]
  feature abierta: F06 Compactación VHDX manual desde Windows, con consentimiento de cierre WSL/Docker e informe de recuperación física (estado: pendiente) [old/v1/definitions/BACKLOG.md]
Migración lista. Lo de v1 está en …/Cleaner/old/v1/ (sin borrar). Siguiente: skill migrar-proyecto (AGENTS.md, verify, planes).
exit 0

$ comprobación del original de Cleaner: git --no-optional-locks status --short y huella de árbol (nombres + sha) antes y después
ORIGINAL SIN CAMBIOS (status: 4 líneas, igual antes y después; árbol de 1 395 líneas, igual)
Tasks de Cleaner: 23 con estado «hecha», ninguna abierta (por eso la lista no trae tareas). 

## Notas

- Reutiliza de `instalar.sh`: `fijar_agente_proyecto`/`fijar-agente` (no pisa otro agente; por eso se añadió `--sobrescribir`), `instalar_deny_claude`/`fijar-deny` (mismas 12 reglas y mismo registro `deny`), y la validación de argumentos y el encabezado. `quitar-hook` ya existía en `resolver.mjs`: no hizo falta tocar el resolver para el hook.
- `scripts/resolver.mjs`: se añadió la opción `fijar-agente <json> <agente> --sobrescribir` (el plan la previó porque `fijar-agente` solo fijaba si el agente estaba vacío). Responde `reemplazado:<anterior>` o `fijado`. Sin la opción no cambia. Cubierta por el escalón 7 (escenario 1).
- `--migrar` termina antes que el resto de la instalación y no toca `~/.claude` ni `~/.pi`. El `trap` de manifiesto de `instalar.sh` se instala después, así que `--migrar` escribe su propio manifiesto temporal y lo copia a `~/.flucastr-ai/manifiesto.txt` solo si cambió; si no existía, crea la línea `modo repo` con las líneas `ajuste` y `deny` que agregó.
- En simulación, el agente y el hook se calculan sobre una copia en el temporal: el proyecto no cambia y la salida es la de la corrida real.
- Decisión propia, no estaba en el plan: `--migrar` no se combina con `--agente`, `--solo` ni `--copiar` (además de `--proyecto` y `--skills-proyecto`), con error claro.
- Decisión propia: el movimiento usa `git mv` solo si el proyecto es git y la carpeta tiene archivos en el índice; si no, `mv`. Con `git mv` el proyecto queda con renombres en el índice (sin commit).
- Límite conocido: si el proyecto tenía otro agente predeterminado (`otro`), la migración lo reemplaza y el manifiesto guarda `principal`; un `desinstalar.sh` posterior quita `agent` pero no restaura `otro`.
- `skills/migrar-proyecto/SKILL.md` nueva; `AGENTS.md` y `PENDIENTES.md` actualizados. `PENDIENTES.md` añade «migrar Cleaner real» como paso de Franco.
- La prueba manual de Cleaner se hizo con un HOME temporal para no escribir el manifiesto real. La migración real de Cleaner (la de Franco) sí escribirá `~/.flucastr-ai/manifiesto.txt`.
- `verify` en el repo pasa (`exit 0`). Ningún commit, push ni PR.
- Bash del sistema es 3.2 (macOS): el código nuevo se revisó contra esa versión (`${extra[@]+...}`, sin arreglos vacíos bajo `set -u`).
