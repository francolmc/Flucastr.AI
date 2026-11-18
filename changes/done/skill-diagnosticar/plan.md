---
estado: listo
rama: feature/skill-diagnosticar
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Skill `diagnosticar` (script de solo lectura) y retiro de `docs/mejoras.md`

> Los nombres personales y de proyectos se anonimizaron; se conservan fechas y cifras.

## Objetivo
Que el principal, a pedido, corra `skills/diagnosticar/diagnosticar.mjs` en el proyecto donde está y responda en la conversación: qué capacidades faltan, cuánto cuesta hoy (con evidencia) y una sola mejora. Sin escribir archivos en el proyecto. Se retira lo que escribía `docs/mejoras.md`.

## Hallazgo sobre `verify` (para decidir antes de aprobar)
Ninguna frase de lo que se retira es exigida por `./verify`: `grep` de `mejoras`, `Diagnóstico de mejoras`, `Siguiente mejora`, `Anotadas`, `regla 15` y `Qué bloquea` en `verify` y en `pruebas/` no da nada. Lo que sí toca la skill nueva:
- Paso 4 de `verify`: toda carpeta `skills/*/` debe tener `SKILL.md` con `name` igual a la carpeta y `description`. Cumplirlo.
- `instalar.sh` enlaza/copia `skills/*/` entero: el `.mjs` viaja con la skill. Sin cambios.
- Fuera de lo que pediste, quedan menciones a la sección 7 en `README.md` (línea 27) y en `AGENTS.md` (línea 17, que sí pediste). Entra `README.md` en el alcance para no dejar una referencia rota.
- `docs/mejoras.md` del propio kit (15 líneas, ya commiteado) **no se toca**: no lo pediste. Queda como nota suelta; dime si lo borro.

## Supuestos
- El script no ejecuta los comandos declarados (segundos, sin Docker): informa `declarada`/`falta`. Si el comando corre, lo juzga el principal con contexto.
- «Costo hoy» no lo calcula el script: lo arma el principal con datos observables (duración medida de una corrida, `git log`, planes con `PAUSA`/`DEVUELTO`, archivos sin test) y `sin evidencia` si no hay dato.
- Receta: hoy solo `nucleo/recetas/node-pnpm.md`; aplica si hay `package.json`. Sus reglas comprobables: lock presente (`package-lock.json` → `npm ci`; `pnpm-lock.yaml` → `pnpm install --frozen-lockfile`) e imports directos declarados en `package.json`. Los imports no declarados se listan como «revisar» (alias de ruta pueden dar falsos positivos).
- No se conecta a `verify` ni se añade a `pruebas/aceptacion/`. No se toca ningún proyecto.
- El principal carga la skill con «diagnostica» (una línea nueva en `agentes/principal.md`, como «prepárame el despliegue»).

## Alcance
Puede crear: `skills/diagnosticar/SKILL.md`, `skills/diagnosticar/diagnosticar.mjs`.
Puede editar: `skills/preparar-proyecto/SKILL.md`, `skills/planificar-cambio/SKILL.md`, `agentes/principal.md`, `AGENTS.md`, `README.md`.
No toca: `verify`, `instalar.sh`, `nucleo/`, `pruebas/`, `docs/`, `scripts/`, los proyectos.

## Pasos
- [x] 1. `skills/diagnosticar/diagnosticar.mjs` (Node ESM, sin dependencias, solo lectura, `process.exitCode = 0` siempre; un error interno sale como campo `error` y exit 0).
  - Uso: `node diagnosticar.mjs [carpeta] [--json]`; sin carpeta, la actual.
  - Lee `AGENTS.md` de la carpeta. Por cada capacidad del contrato busca su línea (`Comprobación rápida:`, `Servicio:`, `Aceptación:`, `Evidencia:`, con o sin guion y negrita) y devuelve `declarada` + el comando, o `falta` (se cubre con `./verify`). También avisa si no hay `AGENTS.md` o `./verify`.
  - `resultado.json`: lo busca en la ruta que diga la línea `Evidencia:` (primer `*.json` entre comillas invertidas) o, si no, en la raíz. Si existe, valida la forma del contrato (`huella` 12 hex, `nivel` ∈ rapida|servicio|aceptacion, `fase` texto, `ok` booleano, `fallo` ∈ ninguno|entorno|dependencia|prueba|tiempo) y compara `huella` con la actual (`{ git status --porcelain; git diff HEAD; } | sha256sum | cut -c1-12`, calculada en Node con `git` de lectura): `vigente` u `obsoleta`. Sin git, `huella` = `no disponible`.
  - Aceptación en un archivo por flujo: cuenta archivos `*.test.*`/`*.spec.*` y los de carpetas `aceptacion|acceptance|e2e` (sin `node_modules`, `.git`, `dist`); informa cuántos y cuáles (máx. 20). Si la línea está declarada y hay 0, lo dice.
  - Receta Node (si hay `package.json`): reglas del párrafo de Supuestos.
  - Salida texto (tabla corta por capacidad + receta + avisos) y `--json` (mismo contenido, un objeto por línea de capacidad).
  - evidencia: creado `skills/diagnosticar/diagnosticar.mjs`. `node skills/diagnosticar/diagnosticar.mjs pruebas/diagnostico-sugiere/juguete` exit 0 (Rápida, Servicio, Aceptación y Evidencia `falta`; `resultado.json` no existe). Con `--json` exit 0 (8 líneas JSON). A3 (copia con AGENTS ampliado, `resultado.json` válido y dos `*.test.mjs`): `declarada` en Rápida, Aceptación y Evidencia, forma válida, 2 archivos de flujo, exit 0. A4 (`fallo: "otro"`): `inválido`, exit 0; sin AGENTS.md, exit 0. A5: `git status` del juguete idéntico antes y después, sin `docker` ni escrituras en el código. A6 (`package.json` sin lock e `import` de `express` no declarado): `lock: revisar` e `imports directos declarados: revisar`, exit 0.
- [x] 2. `skills/diagnosticar/SKILL.md`: frontmatter `name: diagnosticar` y `description` de una frase. Cuerpo breve: cuándo (a pedido, «diagnostica»), correr el script (con `--json` para evaluar) desde la raíz del proyecto, y responder **en la conversación** con tres cosas: (a) qué falta, (b) cuánto cuesta hoy con evidencia observable o `sin evidencia`, (c) **una** sola mejora recomendada con qué es, por qué y tamaño (o «sin faltas»). No escribe archivos, no corre `verify`, no bloquea nada; lo que bloquea está en `agentes/principal.md`.
  - evidencia: creado `skills/diagnosticar/SKILL.md` (1591 bytes, ≤ 2 KB). `./verify` exit 0, paso 4 con `ok diagnosticar` (ver *Evidencia*).
- [x] 3. Retira la sección 7 de `skills/preparar-proyecto/SKILL.md` y la frase de la línea 8 («Además, la sección 7 ... nunca bloquea nada»).
  - evidencia: `grep -n "mejoras" skills/preparar-proyecto/SKILL.md` sin salida (rc 1). Se quitaron la sección 7 completa y la frase de la línea 8.
- [x] 4. Retira la regla 15 de `skills/planificar-cambio/SKILL.md`.
  - evidencia: `grep -n "mejoras\|^15\." skills/planificar-cambio/SKILL.md` sin salida (rc 1).
- [x] 5. `agentes/principal.md`: quita la frase de `docs/mejoras.md` de *Reglas duras*, y en «Qué bloquea y qué no» quita «o lo que diga `docs/mejoras.md`» y la mención a la regla 15, dejando que una capacidad faltante no bloquea. Añade en *Reglas duras* una línea: ante «diagnostica», carga la skill `diagnosticar` y responde en la conversación.
  - evidencia: `grep -n "mejoras" agentes/principal.md` sin salida (rc 1). Se quitó también la frase de *Cómo trabajas*, paso 1, sobre `docs/mejoras.md` (sin ella el grep no sale vacío).
- [x] 6. `AGENTS.md`: reemplaza la viñeta «Diagnóstico de mejoras» por una de `diagnosticar` (script de solo lectura, responde en la conversación, no escribe archivos, no bloquea; escenario `pruebas/diagnostico-sugiere/juguete/`) y añade `diagnosticar` a la lista de Skills. `README.md`: mismo reemplazo en su línea 27 y una viñeta de la skill junto a las demás.
  - evidencia: `grep -rn "mejoras.md" AGENTS.md README.md` sin salida (rc 1). README: viñeta de `diagnosticar` en *Skills* y «las siete skills» en `skills/` (antes «seis»).

## Aceptación
- A1: `grep -rn "mejoras.md" agentes/ skills/` no devuelve nada (rc 1).
- A2: en `pruebas/diagnostico-sugiere/juguete/` el script informa `falta` para las cuatro capacidades y sin `resultado.json`; texto y `--json`; rc 0.
- A3: en una copia temporal del juguete con `AGENTS.md` ampliado (líneas `Comprobación rápida:` y `Aceptación:`), un `resultado.json` válido y dos `*.test.mjs`, detecta esas dos como `declarada`, valida el JSON y cuenta 2 archivos de flujo.
- A4: con `resultado.json` mal formado (`fallo: "otro"`), lo informa como inválido y sigue en rc 0. En una carpeta sin `AGENTS.md`, también rc 0.
- A5: el script no crea ni modifica archivos: `git status --porcelain` del juguete y de la copia antes y después es idéntico; tarda segundos y no llama a `docker`.
- A6: con `package.json` sin lock y un `import` de un paquete no declarado, informa ambas reglas de la receta.
- A7: `./verify` pasa (`VERIFY OK`) y `verify` no cambió (`git diff --stat verify` vacío); `git diff --check` limpio.

## Verificación
`./verify` (≈32 s) y las órdenes de A1–A6.

## Evidencia
$ ./verify
(extracto real de la salida; el log completo está en /tmp/claude-1000/-home-persona-Codes-flucastr-Flucastr-AI/a842dec1-7b9d-422e-bc07-f171156179c8/scratchpad/verify1.log)
== 4. skills con SKILL.md, name y description ==
ok definir-proyecto
ok diagnosticar
ok disenar-experiencia
ok ejecutar-plan
ok migrar-proyecto
...
kit-run: 17 casos pasaron
ok 13: pruebas de kit run pasaron con los CLIs simulados
== 8r. observador de Docker: informe sobre el fixture, ciclo con docker falso y copia sin oom ==
ok 8r A1-A3: el informe del fixture coincide con LEEME.txt (medianas, máximos, caché, OOM, solape y pico)
ok 8r negativa: la copia sin oom no muestra OOM
ok 8r A4: start, status, segundo start sin duplicar y stop; archivos creados y el PID ya no existe
== 8t. cambio pequeño: definición, riesgo y prácticas por tecnología ==
ok 8t: principal con la definición de cambio pequeño, riesgo alto y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «cambio pequeño» falla
VERIFY OK
exit 0

$ git diff --stat verify
(vacío)
exit 0

$ git diff --check
(vacío)
exit 0

$ grep -rn "mejoras.md" agentes/ skills/
(vacío)
exit 1

$ node skills/diagnosticar/diagnosticar.mjs pruebas/diagnostico-sugiere/juguete
Diagnóstico de <ruta-absoluta-del-kit>/pruebas/diagnostico-sugiere/juguete
Capacidades del contrato:
  Rápida     falta      se cubre con ./verify
  Servicio   falta      se cubre con ./verify
  Aceptación falta      se cubre con ./verify
  Evidencia  falta      se cubre con ./verify
resultado.json:
  no existe (ruta buscada: resultado.json)
Aceptación: 0 archivo(s) de flujo
Receta Node/pnpm:
  no aplica (sin package.json)
Avisos:
  - no hay ./verify: el contrato lo cubre todo; falta el comando de verificación
exit 0

$ node skills/diagnosticar/diagnosticar.mjs pruebas/diagnostico-sugiere/juguete --json
{"tipo":"capacidad","capacidad":"Rápida","estado":"falta","comando":null}
{"tipo":"capacidad","capacidad":"Servicio","estado":"falta","comando":null}
{"tipo":"capacidad","capacidad":"Aceptación","estado":"falta","comando":null}
{"tipo":"capacidad","capacidad":"Evidencia","estado":"falta","comando":null,"ruta":"resultado.json"}
{"tipo":"resultado","ruta":"resultado.json","estado":"no existe"}
{"tipo":"aceptacion","archivos":0,"lista":[],"mas":0}
{"tipo":"receta","receta":"node-pnpm","aplica":false}
{"tipo":"aviso","texto":"no hay ./verify: el contrato lo cubre todo; falta el comando de verificación"}
exit 0

## Notas
- Recorrido: además de `node_modules`, `.git`, `dist` (del contrato), salta `build`, `coverage` y las carpetas que empiezan por punto. Sin esto, `pruebas/.temporales` (3,9 GB, ignorado por git) entraba en el conteo. En la raíz del kit tarda ≈0,2 s.
- `--json`: un objeto por línea, con `tipo` (`capacidad`, `resultado`, `aceptacion`, `receta`, `aviso`, `error`). Así cabe también lo que no es una capacidad.
- Huella: si la carpeta no es la raíz de su repo (el juguete está dentro del kit), queda `no disponible`; no se usa el `git status` del repo padre. Git se lee con `GIT_OPTIONAL_LOCKS=0`.
- Verificado con copias temporales: huella `vigente` igual a `{ git status --porcelain; git diff HEAD; } | sha256sum | cut -c1-12` de la shell; `obsoleta` al cambiar el estado del repo; `no disponible` sin git.
- Observación para la persona usuaria (no cambié el contrato): `resultado.json` entra en `git status` mientras sea untracked y no esté en `.gitignore`. Si aparece después de calcular la huella, la vuelve `obsoleta`. Conviene que el proyecto lo ignore o que se escriba antes de calcular la huella.
- `README.md` línea 98: «las seis skills» pasó a «las siete skills» (consecuencia de la skill nueva; `README.md` estaba en *Alcance*).
- Se quitó en `agentes/principal.md`, *Cómo trabajas*, paso 1, la frase sobre `docs/mejoras.md`. No estaba en la lista del paso 5, pero el grep del paso 5 y A1 la exigen fuera.
- `skills/diagnosticar/SKILL.md` no menciona `docs/mejoras.md` (A1 lo prohíbe en `skills/`).
- `docs/mejoras.md` del propio kit no se tocó (sigue ahí, sin cambios). Dime si lo borro.
- Sin commit, push ni PR. La rama `feature/skill-diagnosticar` no se cambió.
