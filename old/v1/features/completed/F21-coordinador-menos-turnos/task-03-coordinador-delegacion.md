# task-03 — `coordinador`: `subagents_enable` una vez, plantilla de encargo y sin `contact_supervisor`
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
En Pi, el `coordinador` activó `subagents_enable` 18 veces en una sesión, y sus encargos incompletos obligaron a reintentos (`definitions/CONTEXTO.md` §1 y §2.5). Esta tarea ajusta «Autorización de delegar» y el paso de delegar de `agentes/coordinador.md`: activar la herramienta una vez por sesión, una plantilla fija de encargo y la prohibición de `contact_supervisor`.

## Contexto
- Leer `agentes/coordinador.md`: «Autorización de delegar» (línea 11-13, contiene «(si está detrás de `subagents_enable`, actívala)») y «Cómo avanzas» paso 3 «Delega. Dile al subagente qué skill usar…». Los pasos 2 y 3 mantienen su orden (`coordinador-status.test.mjs`).
- Diseño aprobado: `definitions/CONTEXTO.md` §2.5, viñeta «Encargos completos a subagentes». `contact_supervisor` no aparece hoy en ningún agente, skill, script ni prueba (`grep -rn contact_supervisor agentes skills scripts instalar.sh README.md` → vacío, confirmado; solo aparece en un informe de `pruebas/resultados/`, como herramienta de `pi-subagents`).
- Los encargos ya incluyen, según el caso, `Rama: <prefijo>/Fxx-nombre` o `Modo yolo: activo`; la plantilla no los reemplaza, los suma.
- Tocar: `agentes/coordinador.md`.

## Decisiones ya tomadas
- Se edita con `Edit` por tramos.
- Frases literales (las comprobará task-04): `actívala una vez por sesión; si \`subagent\` ya funcionó, no la repitas`; `Plantilla de encargo`; `no uses \`contact_supervisor\` para preguntar: ante falta de información responde \`BLOQUEO:\` o \`REFINAR:\``.
- La plantilla es una lista de cuatro elementos, en este orden: skill a usar; `Lee:` rutas exactas (y la sección, si la tarea cita una); `No leas:` lo que el rol no necesita (`definitions/` salvo lo citado, tareas `hecha`, `features/completed/`, `registro/`); `Devuelve:` formato esperado (resumen de cinco líneas o la primera línea `BLOQUEO:`/`REFINAR:`/`CONFIRMAR:`). Más `Rama:`/`Modo yolo:` cuando aplique y «no escribas en `STATUS.md`».
- La frase del paso 3 «Dile al subagente qué skill usar, qué leer y que no escriba en `STATUS.md`» se sustituye por la remisión a la plantilla (sin duplicar).
- La frase de `contact_supervisor` va dentro de la plantilla (cada encargo la lleva).
- Presupuesto: `agentes/coordinador.md` ≤ 17 920 bytes al terminar (máximo para toda F21).

## Alcance / Fuera de alcance
Alcance: `agentes/coordinador.md`, «Autorización de delegar» y paso 3 de «Cómo avanzas».
Fuera de alcance: reglas de lectura (task-01); `STATUS.md` (task-02); pruebas (task-04); mover «Modo yolo» a una skill (F26); editar `planificador.md`, `constructor.md`, `arquitecto.md`; `instalar.sh` y `scripts/resolver.mjs`.

## Pasos
1. «Autorización de delegar»: reemplazar el paréntesis por la regla de `subagents_enable` de Decisiones (solo Pi).
2. «Cómo avanzas», paso 3: reemplazar por la plantilla de encargo con la frase de `contact_supervisor`.
3. Correr las verificaciones.

## Criterios de aceptación
1. Las tres frases literales existen (comando 1).
2. `contrato-roles.test.mjs`, `coordinador-status.test.mjs` y `higiene-contexto.test.mjs` pasan.
3. `wc -c agentes/coordinador.md` ≤ 17920.
4. `git diff --stat` muestra solo `agentes/coordinador.md`.

## Verificación
- `grep -cF -e 'actívala una vez por sesión; si `subagent` ya funcionó, no la repitas' -e 'Plantilla de encargo' -e 'no uses `contact_supervisor` para preguntar: ante falta de información responde `BLOQUEO:` o `REFINAR:`' agentes/coordinador.md` → `3` o más.
- `node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs pruebas/comprobaciones/higiene-contexto.test.mjs` → `fail 0`.
- `wc -c agentes/coordinador.md` → ≤ 17920.

## Evidencia
Verificación (pasada final, comando y salida real):

```
$ grep -cF -e 'actívala una vez por sesión; si `subagent` ya funcionó, no la repitas' -e 'Plantilla de encargo' -e 'no uses `contact_supervisor` para preguntar: ante falta de información responde `BLOQUEO:` o `REFINAR:`' agentes/coordinador.md
3
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs pruebas/comprobaciones/higiene-contexto.test.mjs 2>&1 | grep -E '^ℹ (tests|pass|fail)'
ℹ tests 40
ℹ pass 40
ℹ fail 0
$ wc -c agentes/coordinador.md
17687 agentes/coordinador.md
```

Criterio 4: `git diff --stat -- agentes/coordinador.md` → `agentes/coordinador.md | 10 ++++++++--` (1 file changed, 8 insertions, 2 deletions). Un `git diff --stat` sin ruta muestra además `definitions/STATUS.md` y `task-02-…md`, cambios previos que no son de esta tarea y no se tocaron.

## Notas
- Hueco menor: la prueba `coordinador-status.test.mjs` exige que el paso 3 contenga la frase literal «Delega.»; la primera pasada falló (1 fail) y se corrigió la línea del paso 3 («3. Delega. Usa la **Plantilla de encargo** …»). Lo demás quedó literal, sin reordenar pasos.
- La plantilla de encargo va como sub-viñetas del paso 3 (skill, `Lee:`, `No leas:`, `Devuelve:`, `Rama:`/`Modo yolo:`, `contact_supervisor`).
- Tamaño: 17152 → 17687 bytes (tope 17920).
Registro: n=1; herramienta=claude-code; modo=normal; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
