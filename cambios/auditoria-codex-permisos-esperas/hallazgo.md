# Auditoría: permisos y esperas en Codex, Byteria y DonFinancio (2026-11-11)

Base: 9 sesiones Codex del 10 y 11-11 en ambos proyectos (`~/.codex/sessions/2026/11`), `~/.codex/config.toml`, `~/.codex/rules/default.rules`, `agentes/principal.md`, `skills/ejecutar-plan`.

## Hechos (comprobados)
- Todas las sesiones corren con `approval_policy=on-request`, sandbox `workspace-write` y `network_access=false`. `config.toml` no declara ninguna de las tres: es el valor por defecto de Codex. Sol, Terra y Luna ya resuelven bien (los agentes generados traen los modelos nuevos).
- Escalaciones pedidas (`require_escalated`): `docker` 30, `VERIFY_RAPIDO=1 ./verify` 10, `./verify` 4, `git` 5, además de `curl`, `pnpm`, `pkill`. Casi todo es Docker (el socket queda fuera del sandbox) o red (`pnpm install`, metadatos de GitHub).
- `default.rules` tiene 43 reglas, casi todas **comandos exactos de un solo uso** (`bash -lc "VERIFY_RAPIDO=1 ./verify > /tmp/f04-t4-principal-reintento.log 2>&1"`, un `docker run` de 600 caracteres). Cada «Always allow» aprobó solo esa línea; la siguiente corrida cambia el nombre del log y vuelve a pedir permiso. Ninguno de los dos proyectos tiene `.codex/rules/`.
- Espera: el agente que pide permiso de verificación es el **principal**. Sus `wait` suman 92 con `yield_time_ms: 20000`, 13 con 10000 y 17 con 1000 (sondeos con `tail`/`write_stdin` vacío). El constructor sí usa 300000 (38 casos), como manda `ejecutar-plan`.
- Las detenciones de DonFinancio (10:59, 11:45, 12:06, 13:38, 13:47, 13:56 del 11-11) terminan en «**PAUSA:** la verificación sigue ejecutándose». El verify de DonFinancio tarda más de 20 min (export de imágenes Docker) y el principal se rinde con el verify aún vivo.

## Causas
1. **Permisos.** Falta una política que cubra el recorrido normal (Docker, red de instalación, `./verify`). Las reglas guardadas son literales, no prefijos, así que no se reutilizan.
2. **Detención sin esperar.** `agentes/principal.md` (paso 5) solo dice «una sola espera» y fija un presupuesto de 15 llamadas con «si llegas sin veredicto, escribe PAUSA». No trae la receta de espera de Codex que sí tiene el constructor (`wait` con `cell_id` y 300000). Con 20 s por `wait`, 15 llamadas son ~5 min, y un verify de 20+ min siempre agota el presupuesto: la PAUSA es la regla funcionando, no un fallo del modelo.
3. **Mala práctica de lanzamiento.** Redirigir con `bash -lc "… > /tmp/x.log"` rompe cualquier regla de prefijo y hace que el agente sondee el log con `tail`.

## Recomendación (en orden de efecto)
1. **Regla de espera del principal** (kit, `agentes/principal.md`): en Codex, ejecutar `verify` en `exec_command` directo y esperar con **una** llamada `wait` (`cell_id`, `yield_time_ms: 300000`), repetida solo mientras devuelva «Script running»; esas esperas no cuentan en el presupuesto. Prohibido `tail` y `write_stdin` vacío como sondeo. El presupuesto de 15 pasa a contar solo llamadas de revisión, no esperas.
2. **Reglas de prefijo estables** (`instalar_deny_codex` ya genera `<proyecto>/.codex/rules/flucastr.rules`): añadir `allow` para `["./verify"]`, `["VERIFY_RAPIDO=1","./verify"]`, `["docker","compose"]`, `["docker","ps"]`, `["docker","info"]`, `["pnpm","install"|"lint"|"test"|"build"]`, `["git","fetch"]`. Mantener `forbidden` para `docker system prune`, `docker volume rm` y `docker rm -f` fuera de los recursos del proyecto. Y lanzar `./verify` sin redirección ni `bash -lc`; que `verify` escriba su propio log.
3. **Docker bajo sandbox.** Probar `-c 'sandbox_workspace_write.network_access=true'` en el lanzador `codex-<agente>` o dar el socket de Docker al perfil de permisos. Es decisión de seguridad: la red abierta solo con `trust_level` de proyecto.
4. **Verify de DonFinancio más corto.** Con 20+ min por corrida, ningún agente espera cómodo. Ya está `VERIFY_RAPIDO`; falta el nivel «sin Docker» (tsc + lint + tests) recomendado en `cambios/auditoria-donfinancio/hallazgo.md`.

## Deriva menor del kit
- `modelos.json`: perfil `pi-openai.ventanas` aún lista `gpt-6-astra` y no `sol`/`terra`: Pi no tendrá ventana para los modelos nuevos.
- `AGENTS.md` del kit dice principal con esfuerzo `low`; `modelos.json` ya está en `medium` (cambio sin commit).

## No verificado
- Si el sandbox de Codex permite `network_access=true` sin tocar el socket de Docker (hay que probarlo).
- Ni Claude ni Pi: solo se auditó Codex.
- Calidad del código producido por ambos proyectos.
