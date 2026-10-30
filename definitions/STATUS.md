# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (esperando a Franco). F09 `hecha` (confirmada por Franco, 2026-10-30): las 3 tareas `hecha`. Queda F10 (informe de resultados), que choca con la definición y Franco puede diferir.
Rama: feature/F09-instalador-sin-clon

## Espera a Franco

- Feature F09 completa en feature/F09-instalador-sin-clon: cierra la rama, haz el PR y despliega.
- **Antes de publicar el repo (tuyo):** correr gitleaks/trufflehog sobre todo el historial y ramas; revisar `pruebas/resultados/`, correos de autor y nombres de productos o clientes (Don Financio, Andes), `.gitignore`; activar 2FA y proteger `main`; aclarar qué son los commits «intrusión». Si aparece algo: rotar la credencial primero. Luego haz público el repo.
- **Comprobación manual de F09 (tuya, con repo público):** correr el comando de una línea en el PC de trabajo, `claude --agent arquitecto` / `pi-arquitecto`, `--estado` y `--actualizar` con un cambio mínimo publicado, que tu `modelos.json` quede igual, y que la red de la empresa deje pasar `raw.githubusercontent.com`, `api.github.com` y `codeload.github.com`. Guía en el `README.md` («Sin clonar el repo (PC de trabajo)»).
- **Cobertura:** `pruebas/capa1/remoto.test.mjs` (12 pruebas) salió de `rapida.sh` porque con ella la suite tarda 36 s (tope 30 s). Córrela aparte: `node --test pruebas/capa1/remoto.test.mjs`. Alternativa: acelerarla en una tarea aparte (sin tu respuesta, queda así).
- **Pendiente (tarea aparte, sin decidir):** `instalar.sh --copiar` directo con un `modelos.json` inválido deja roto el personal; `instalar-remoto.sh` ya lo bloquea (R10).
- **Decisión:** F10 (informe de resultados generado por script desde `BACKLOG.md` y las Evidencias/Notas de las tareas, incluidas las archivadas; sin log que escriban los agentes) choca con la definición y requiere al `arquitecto` antes de descomponer. ¿La hacemos ahora o la difieres?
- **Archivar (tuyo, después del PR, en su propio commit `chore/`):** `node scripts/archivar.mjs` (chequeo) y luego `--aplicar` con los IDs que correspondan (revisa el uso en el script). Candidatas: F01–F08, y F09 tras su PR.
- **Contexto grande:** `BACKLOG.md` y `WORKFLOW.md` superan el umbral de aviso; compactar `BACKLOG.md` es del planificador por la puerta 2 (tras archivar); acortar `WORKFLOW.md`, del arquitecto.
- Como el coordinador es un agente instalado, tras los commits conviene `bash instalar.sh` para actualizar tu copia instalada.
- Rama, PR y despliegue de F05: lo haces tú.
- Decisión abierta: tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- `rapida.sh` dejó `pruebas/.temporales/capa1-*`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-30
