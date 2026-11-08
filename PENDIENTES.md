# Pendientes de la v2

> Lista de Franco. Los agentes no la leen salvo pedido explícito. Es de la v2 (ya en `main`); la lista de la v1 está en `old/v1/definitions/PENDIENTES.md`.
> Estado al 2026-11-05: la v2 es una **versión candidata**. Funciona en este repo; falta probarla en un proyecto real y ordenar el repo.

## Qué está probado

- El ciclo `principal` → plan → `constructor` → `verify` se completó cuatro veces en este repo (`cambios/hechos/`).
- El `constructor` corre en Haiku y recibe solo la ruta del plan y la rama.
- `./verify` falla donde debe: probado con fallos a propósito en los seis escalones.
- Las 12 reglas `permissions.deny` bloquean commit, push, merge, `gh pr`, `git -C`, `git -c`, `bash -c` y la lectura de `.env` con Claude Code real.

## Para dar la v2 por buena (en este orden)

1. **Probarla en un proyecto real con web, API y base de datos** (Don Financio). Es lo que motivó el rediseño y lo único que este repo no ejercita.
   - Primer cambio: crear el `verify` del proyecto con `preparar-proyecto` (build limpio, arranque y primer recorrido real).
   - Se considera superado si el proyecto llega a `verify` verde con solo las dos puertas de Franco, sin ampliaciones administrativas y sin abrir un plan por archivo.
   - Revisar en el PC de trabajo la hipótesis de `express`: si `src/access-http.ts` lo importa sin que esté en el `package.json` del API (llega solo como dependencia de `@nestjs/platform-express`). No se pudo comprobar desde este equipo.
   - Migrar Cleaner real (`/Users/franco/Codes/flucastr/Flucastr.Cleaner`) con `bash instalar.sh --migrar <ruta> --simular` y luego sin `--simular`; después la skill `migrar-proyecto`. Lo hace Franco: los agentes no escriben en ese repo. La prueba sobre una copia ya está hecha (ver `cambios/hechos/migrar-v1-v2/plan.md`). La migración también cubre workspaces (repos hijos) y el `.gitignore` (ver `cambios/hechos/migrar-workspaces/plan.md`).
2. **Pi: probado en lo básico.** Una corrida real en Pi con un plan mínimo, con `skills: ejecutar-plan` e `inheritProjectContext: true`. `verify` comprueba que el constructor generado para Pi y para Claude Code trae `skills: ejecutar-plan`. Quedan pendientes:
   - Un plan de varios archivos en Pi.
   - El caso `PARCIAL` en Pi.
   - En Pi no hay reglas deny: rige solo el prompt.
   - No se sabe si `inheritProjectContext` hace algo.
3. **Probar la instalación remota de la v2** en el PC de trabajo: el comando normal de `instalar-remoto.sh` desde `main` (no se ha corrido).
4. **Usarla en 2 o 3 proyectos reales** antes de retirar nada de la v1.
5. **Ordenar el repo** (solo tras el punto 4):
   - Hecho: lo de la v1 se movió a `old/v1/` con `git mv` (no se borró): `legacy/`, `definitions/`, `features/`, `pruebas/`, `registro/`, los scripts de v1 (todo `scripts/` salvo `resolver.mjs`) y los reportes sueltos. El `README.md` es el nuevo de la v2. Los lanzadores de `validar-tarea.mjs` y `entorno.mjs` salieron de `instalar.sh`.
   - Pendiente: borrar `old/` (solo tras el punto 4; decisión de Franco).
   - Pendiente: `rm -rf pruebas/.temporales` (3,9 GB, ignorado por git; lo ejecuta Franco).
   - Hecho: `feature/kit-v2` ya está mergeada en `main`.

## Detalles menores

- Pegar en `cambios/hechos/deny-endurecido/plan.md` la evidencia manual que quedó pendiente (la prueba con `claude -p` y las 12 reglas; el resultado ya se obtuvo en la revisión del 2026-11-05).
- `AGENTS.md` apunta a `cambios/deny-endurecido/plan.md`; el plan está ahora en `cambios/hechos/deny-endurecido/`.
- Los planes anteriores a `vocabulario-y-guias` quedaron con `estado: hecho`, un valor que la lista actual descarta. Son historia: no se tocan.
- Algunos planes dicen «Probado por Franco» sobre pruebas que corrió el coordinador de la sesión de diseño.
- Modo remoto de `verify` (`VERIFY_TARGET`, cambio `validar-despliegue`): probado con un servidor local (lectura, 500, escritura permitida, URL inválida). Falta la comprobación contra un despliegue real (la hace Franco) y cómo el recorrido de cada proyecto lee el correo en remoto (no hay Mailpit). Sin probar: «prepárame el despliegue» y la sección «Despliegue» en un proyecto real.
- Skill `definir-proyecto`: probada en una carpeta vacía (4 preguntas, no escribe antes de contestar; con respuestas escribe `AGENTS.md`, `docs/proyecto.md` y `cambios/` y se detiene). Falta usarla en un proyecto nuevo real.

## Límites conocidos de las reglas deny

- No cubren un script que abre `.env` (Python, Node, etc.). Eso pide sandbox y queda fuera del kit.
- `sudo` y `env <cmd>` no están probados.
- Que los subagentes hereden las reglas viene de un resumen de la documentación, no de una lectura literal. Los `permissionMode` de subagentes podrían saltarlas: sin garantía.
- El `bash -c` queda prohibido para los agentes (intencional); puede estorbar en algún flujo.
- El archivo `.claude/settings.json` del proyecto es compartido y va a git.
- Estas reglas bloquean también los commits que Franco haga a través de Claude en ese proyecto.

## Ideas, sin urgencia (solo si aparece el dolor)

- **Medir de verdad** el costo y la calidad del constructor en Haiku contra un modelo de nivel medio. Hoy solo hay casos sueltos; subirlo de nivel es una línea en `modelos.json`.
- **Tamaño de los planes:** hoy es una orientación (unos 5 KB; hasta unos 8 KB si el cambio investiga y toca varias piezas). Revisarla con más datos. No hay herramienta que lo mida.
- **Revisión con un subagente nuevo** que no vea la conversación y compare el resultado contra el plan, como paso opcional antes de la puerta 2.
- **Prueba automática de las reglas deny** con `claude -p` dentro de `verify`: hoy es manual porque cuesta tokens y requiere red.
- **Un lugar para la «evidencia del principal»** en la plantilla del plan (hoy se agrega a mano antes de *Evidencia*).
- **Declarar en el plan que dos cambios editan el mismo archivo** y deben correr en orden (hoy es una frase suelta).
- **Escalón 5 de `verify`:** compara lo que `instalar.sh --simular` instala; no detecta cambios fuera de esas rutas, a propósito.
- **Soporte de otra herramienta (Codex):** sigue la decisión pendiente de `definitions/PENDIENTES.md`.
- **Fricciones sin resolver** de `friccion.md`: avisos duplicados al cerrar un subagente y documentación oficial que el lector web trunca.
