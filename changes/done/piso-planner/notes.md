# piso-planner — avance

Objetivo: piso tras compactar del planner <= 45k tok (hoy 71-103k). Sin perder reglas de seguridad ni de contrato.
Rama prevista: feature/piso-planner (base main, behind=0 al 2026-11-25). Aún no creada.
Los archivos sin seguimiento de la raíz (.bashrc, .mcp.json, ...) son máscaras del sandbox (dispositivo 1,3), no del repo.

## Hecho
- Estado inicial: main limpio y al día. `changes/reducir-contrato-builder` (draft) toca builder/execute-plan: cambio aparte.
- Medición P0 de /context: no está en el repo. Base disponible: `changes/done/compactacion-planner/diagnostico.md`
  (piso 71.097-102.971 tok; arranque 60.100 tok) y `models.json` compaction.floors.
- wc -c hoy: AGENTS.md 16310; planner.md 20205 (111 líneas); plan-change 18747 (136); execute-plan 10397; builder.md 5470;
  prepare-project 7522 + reference.md 5539.

## Pruebas que leen frases (inventario)
- planner.md: tools/verify/{agent-contracts 8i,8k,8l,8m,8p,8u; segment-contract 11; small-change 8t; workflow 8e,8f,8g,8h; operating-contract 8c?,8d;
  verification-contracts 8n,8o; workspace 8b}; tests/builder-contract.mjs (idioma, solo líneas 11-33 vistas); tests/continuity/protocol.mjs 23-32 (idioma).
- plan-change/SKILL.md: builder-contract.mjs (A2/A3 L42; A5 plantilla bajo `## Steps` + sección `## Before Requesting Approval` .. "\nIf the builder returns");
  agent-contracts 8i; segment-contract 11 (7 textos); operating 8d (`executor:`, `20 words`, sin `60 words`); workflow 8g,8h; small-change `risk`;
  verification 8m ('Verification levels','Comprobación rápida','Level 2'), 8o ('design-experience','pantallas.md'); workspace 8b (`^repos:`).
- AGENTS.md del kit: ninguna prueba vista lo exige (las de migración usan fixtures). Falta confirmar con barrido.
- Instalación: skills se enlazan/copian como carpeta entera (references/ viaja solo): tools/install/skills.sh. Agentes: glob `core/agents/*.md` (subcarpeta no se toma como agente).
- Raíz del kit en `~/.flucastr-ai/raiz` (ambos modos). Hooks Claude de proyecto: install.sh 361-366; progress-hook no está en install.sh.

## Medición del piso (logs de sesión del proyecto, planner, Claude Code 2.1.332, 66 compactaciones desde 11-25; script $TMPDIR/det.mjs)
- Primera llamada tras compactar: mediana 84.388 tok, máx 102.971. Prefijo fijo (sistema+herramientas) 31.478 tok.
- Prefijo: sistema 19.263 chars (incluye planner.md); definiciones de herramientas 79.874 chars: Artifact 38.369, SendMessage 6.229, SendFeedback 5.537,
  AskUserQuestion 5.225, ScheduleWakeup 4.660, Bash 4.550, Agent 3.658, ReportFindings 2.447.
- Dinámico, mediana chars: listado skills 29.398; resumen 20.071 (máx 57.056); plan-change 18.552; archivos restaurados 15.838 (máx 34.649);
  AGENTS.md 15.269; sandbox 7.004; listado agentes 5.581; diferidas 3.902; conservados 3.310 (máx 43.232); MCP 3.099; otros 1.658.
- Calibración: dinámico ≈2,4 chars/tok (regresión 2,0); prefijo ≈3,15. bytes/4 subestima 1,3-1,7x.
- Proyección (tok): solo tareas 1-7 -> 65-71k. + quitar Artifact/ScheduleWakeup/SendFeedback/ReportFindings al planner (-16k) -> 49-55k.
  + persona desactiva plugins/conectores sin uso (-7 a -9k) -> 40-48k. 45k no se alcanza solo con las tareas pedidas.

## Documentación (web-fetch, 2026-11-25; partes son resumen del modelo de la página)
- Claude Code: SessionStart matcher `compact`; entrada trae source y agent_type (con --agent); stdout plano entra al contexto; tope 10.000 chars.
  Tras compactar: relee hasta 5 archivos (más recientes); >5.000 tok solo ruta; skills 5k c/u, 25k total, conserva el inicio; relee CLAUDE.md raíz.
  Frontmatter `tools`/`disallowedTools` aplica con --agent (resumen); `--disallowedTools` con nombre simple quita del contexto.
- Codex: `compact_prompt` = "Inline override for the history compaction prompt" (reemplazo no confirmado). Hooks SessionStart source `compact`,
  stdout como contexto developer, `.codex/hooks.json` o `[hooks]`, requieren confianza; PreCompact/PostCompact ignoran stdout. Local: codex-cli 0.172.0, hooks stable.

## Decisiones confirmadas por la persona usuaria (2026-11-25)
- Quitar al planner en Claude Code: Artifact, ScheduleWakeup, SendFeedback, ReportFindings (disallowedTools).
- Codex: hook SessionStart source compact (no compact_prompt).
- Subagente: solo regla en planner.md; sin agente nuevo.

## Próxima acción
Revisar instaladores/desinstalador, escribir borradores en changes/piso-planner/drafts/, medir, plan.md y tramos, review-plan.

## Borradores validados (changes/piso-planner/borradores/)
- planner.md 8191 B; plan-change.md 4366 B; AGENTS.borrador.md 4250 B; references/ y references/planner/ (extracción literal de main).
- Copia temporal con borradores + 3 frases movidas (yield_time_ms: 300000, session_id, send_message -> codex-waits.md): ./verify OK.
- Duraciones: node tests/builder-contract.mjs 0,1 s; node --test tests/compaction/install.test.mjs 28 s; ./verify ~122 s (WSL2, node v24.22.1).
- Codex hooks.json: {"hooks":{"SessionStart":[{"matcher":"compact","hooks":[{"type":"command","command":"...","timeout":10}]}]}}; requiere confianza.
- Falso positivo: el hook de permisos bloqueó una edición por Bash de un borrador (texto con palabras protegidas); usar Edit/Write para esos textos.


## Next action
Revisión final APPROVED (A1–A12). Gate 2: la persona revisa la evidencia y aprueba; al aprobar: mover changes/piso-planner a changes/done/ (sin cambiar status), luego pedir el commit y el PR a main. No lanzar builder.
Aviso residual de review-plan: plan.md > 8192 B (≈17 KB) por la Evidence del builder. Al relanzar, pedir Evidence breve (comando, exit, última línea).
Pendiente para la persona (anotar en Gate 2): correr fuera del sandbox `node tests/continuity/protocol.mjs` (no está en ./verify; el builder reporta salida 1 por sandbox, también con git archive HEAD).
