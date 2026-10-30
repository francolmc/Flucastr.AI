# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (puerta 4). task-02 `lista para revisión` (`features/F09-instalador-sin-clon/task-02-instalar-remoto.md`). task-01 `hecha`. F09 `en curso`; las 3 tareas `aprobadas` por Franco (2026-10-30). Puerta 1 de F09 aprobada.
Rama: feature/F09-instalador-sin-clon F08 `hecha` y con PR hecho. Decisiones de Franco para F09: instalador que descarga desde GitHub, repo público, actualización repitiendo el comando o con un modo `actualizar`.
Rama: feature/F08-limpieza-y-archivo

## Espera a Franco

- **Puerta 4:** revisa Evidencia y Notas de `features/F09-instalador-sin-clon/task-02-instalar-remoto.md`, el nuevo `instalar-remoto.sh` y `pruebas/capa1/remoto.test.mjs` (7 pruebas con control negativo, todas con HOME temporal y `FLUCASTR_ORIGEN` local; sin red). Haz el commit y pásala a `hecha`.
- **Aviso de tiempo:** `rapida.sh` dio 26 s, 28 s y 34 s en distintas corridas (tope 30 s): el margen es insuficiente. task-03 prevé mover las pruebas de F09 a un archivo propio; conviene decidir si lo hacemos ya.
- **Hallazgo para task-03:** `instalar.sh` (task-01) copia el `modelos.json` del paquete a `~/.flucastr-ai/modelos.json` antes de validar los agentes; si el paquete trae uno inválido, el personal queda roto. No se probó.
- **Raro, revísalo:** durante la ejecución `pruebas/capa1/remoto.test.mjs` cambió en disco (el constructor no halló diferencias relevantes). Si no lo tocaste tú, compáralo con el diff antes del commit.

- **Archivar (tuyo, después del PR, en su propio commit `chore/`):** primero el chequeo, `node scripts/archivar.mjs`; luego `node scripts/archivar.mjs --aplicar F01` … (o sin ID según el uso de `--aplicar` que implementó task-02; revisa `--aplicar` en el script). El chequeo marca F01–F07 como candidatas; F08 lo será tras su PR.
- **Contexto grande:** `BACKLOG.md` (10 023 caracteres, umbral 8 192) y `WORKFLOW.md` (37 488, umbral 30 720) superan el aviso; filas `hecha` largas: F03, F05, F06, F07. Compactar `BACKLOG.md` es del planificador por la puerta 2 (recomendado tras archivar); acortar `WORKFLOW.md`, del arquitecto.
- **Supuestos de F09 sin respuesta tuya (confírmalos o corrígelos):** PC de trabajo con macOS/POSIX y `bash`, `node`, `curl`, `tar`; `main`+sha como versión; actualizar a mano; modo dual; comando largo. Quedan como comprobación manual tuya: que la red de la empresa deje llegar a `raw.githubusercontent.com`, `api.github.com` y `codeload.github.com`, y la política sobre instalar agentes de IA. Sigue sin respuesta qué son los commits «intrusión» (el historial será público): revísalo antes de publicar.
- Las verificaciones de F09 estaban marcadas «no ejecutado, inferido»; el bash de macOS es 3.2 (sin arreglos asociativos) y las tareas lo advierten.
- **Antes de publicar el repo (tuyo):** correr gitleaks/trufflehog sobre todo el historial y ramas; revisar `pruebas/resultados/`, correos de autor y nombres de productos o clientes (Don Financio, Andes), `.gitignore`; activar 2FA y proteger `main`. Si aparece algo: rotar la credencial primero.
- **Fuera de F09:** el aviso `node scripts/archivar.mjs` de `STATUS.md` está pensado para este repo.
- **Antes de hacer público el repo (tuyo):** revisa que no haya credenciales ni datos personales en el repo ni en su historial. Los agentes no cambian la visibilidad.
- Como el coordinador es un agente instalado, tras el commit de F08 conviene `bash instalar.sh` para actualizar tu copia instalada.
- Rama, PR y despliegue de F05: lo haces tú.
- Decisión abierta: tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- `rapida.sh` dejó `pruebas/.temporales/capa1-*`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-30
