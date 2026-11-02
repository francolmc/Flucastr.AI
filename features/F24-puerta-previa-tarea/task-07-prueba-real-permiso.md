# task-07 — Prueba real del permiso con el arnés
repo: Flucastr.AI   depende_de: task-05   estado: aprobada

## Descripción
La regla de permisos de Claude Code compara el texto del comando; la decisión de Franco (2026-11-01) exige comprobarlo de verdad y no a mano: con el arnés `pruebas/lanzar-coordinador-claude.sh`, el comando del lanzador fijo debe ser aceptado y uno distinto, rechazado. Esta tarea añade el cuarto patrón a `--allowedTools` del arnés, corre las dos pruebas y deja el informe.

## Contexto
- Leer: `definitions/ARCHITECTURE.md`, subsección «Raíz del kit y puerta previa de tarea (F24…)», viñeta «Verificación obligatoria». De task-05 (`depende_de`), solo sus *Notas*.
- Tocar: `pruebas/lanzar-coordinador-claude.sh`, `pruebas/permisos-ejecucion.md`, `pruebas/resultados/2026-11-01-validar-tarea-claude.md`
- `lanzar-coordinador-claude.sh`: el comentario de las líneas 2-4 habla de «los tres patrones» y la lista `--allowedTools` (líneas 17-22) termina en `'Bash(node scripts/archivar.mjs --aplicar F*)'`; recibe un único argumento (el prompt) y exige `FLUCASTR_RECORD_FILE`.
- `pruebas/permisos-ejecucion.md`, sección «Coordinador: ejecución de scripts»: dice «lista cerrada de tres».
- Modelo del informe: `pruebas/resultados/2026-10-30-coordinador-claude.md`. Fixture: `pruebas/fixtures/coordinador.sh DIRECTORIO` (repo con `features/F02-otra/task-01-otra.md`). Comprobador de comandos: `comandosBash(registro, 'claude-code')` de `pruebas/comprobaciones/coordinador-ejecucion.mjs`.

## Decisiones ya tomadas
- Se añade `'Bash(node ~/.flucastr-ai/validar-tarea.mjs *)'` a `--allowedTools` y se actualiza el comentario del arnés («cuatro patrones»).
- Dos corridas, una por caso, cada una con fixture nuevo en `pruebas/.temporales/` y su `FLUCASTR_RECORD_FILE`: (A) prompt «Corre exactamente este comando y muéstrame la salida: node ~/.flucastr-ai/validar-tarea.mjs features/F02-otra/task-01-otra.md»; (B, control negativo) mismo prompt con `node ~/.flucastr-ai/otro.mjs features/F02-otra/task-01-otra.md`.
- Criterio: en A, el `tool_use` de Bash con ese comando existe y su `tool_result` no es una negativa de permiso (da igual si el lanzador ejecuta o falla porque el kit no está instalado: lo que se prueba es el permiso). En B, el `tool_result` es una negativa de permiso (`is_error: true`, texto sobre permisos) o el comando no se ejecuta. Se copia la negativa literal al informe.
- Las corridas usan modelo y las exige la decisión de Franco; es la única prueba con modelo de F24. Si `claude` no está disponible o `CLAUDE_CODE_SUBAGENT_MODEL` está definida, la tarea queda `bloqueada` y se avisa.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: el arnés, `permisos-ejecucion.md` (tres a cuatro comandos y enlace al informe) y el informe.
Fuera de alcance: `agentes/`, `contrato-roles`, scripts del kit, instalar el kit en el HOME real, `coordinador-ejecucion.mjs`.

## Pasos
1. Editar el arnés y `permisos-ejecucion.md`.
2. Crear los fixtures y correr A y B con el arnés (desde el directorio del fixture).
3. Extraer con `comandosBash` el comando y revisar el `tool_result` de cada registro.
4. Escribir el informe con la tabla caso, comando, resultado y la negativa literal de B.
5. Ejecutar la verificación.

## Criterios de aceptación
1. El arnés conserva sintaxis y el patrón nuevo: primer y segundo comando de *Verificación*.
2. A aceptado y B rechazado, con salida real en el informe.

## Verificación
```
bash -n pruebas/lanzar-coordinador-claude.sh
grep -c 'validar-tarea.mjs \*' pruebas/lanzar-coordinador-claude.sh
node --test pruebas/lanzadores.test.mjs
```
Más las corridas A y B del paso 2. Esperado: sin salida de error; `1`; `ℹ fail 0`; y el informe con A «aceptado» (sin negativa de permiso) y B «rechazado» (negativa de permiso o sin ejecución).

## Evidencia

## Notas
Tarea nueva 2026-11-01: salió de task-05 al pasar de 3 a 4 archivos con el cambio del arnés.
Corregida la línea Tocar (regla 11): el informe `pruebas/resultados/2026-11-01-validar-tarea-claude.md` es un archivo nuevo.
