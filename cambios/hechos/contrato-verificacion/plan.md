---
estado: listo
rama: docs/contrato-verificacion
base: main
repos: [.]
ejecutor: constructor
tipo: docs
---
# Contrato de verificación por capacidades

## Objetivo
Que el kit pida la verificación por **capacidades** y no por herramientas: cada proyecto declara en su `AGENTS.md` el comando de cada una y el kit no nombra pnpm, jest ni playwright. Lo específico de Node/pnpm queda en una receta aparte. Evidencia del estado actual: `cambios/contrato-verificacion/hallazgo.md`.

## Supuestos
- **Línea de la capacidad rápida:** sigue siendo `Comprobación rápida:` (no se renombra), para no romper a `planificar-cambio` regla 13, `ejecutar-plan` ni `cambios/verificacion-general`. Las otras tres se declaran con `Servicio:`, `Aceptación:` y `Evidencia:`; las que falten se cubren con `./verify`, como hoy.
- **Huella** = la del plan `proceso-rapido`: `{ git status --porcelain; git diff HEAD; } | sha256sum | cut -c1-12`, por carpeta de `repos:`. Una sola definición en el kit.
- **`resultado.json`:** `{ "huella": "<12 hex>", "nivel": "rapida|servicio|aceptacion", "fase": "<etapa donde terminó>", "ok": true|false, "fallo": "ninguno|entorno|dependencia|prueba|tiempo" }`. `fase` es texto libre del proyecto; `fallo` es un vocabulario cerrado de cinco valores.
- **Docker/Compose/Mailpit** (en `referencia.md` y `preparar-proyecto` §2) **se quedan**: tus proyectos los usan y no son parte del grep pedido. Solo salen las recetas de Node/pnpm y Playwright. Si quieres Docker también como receta, es otro plan.
- `planificar-cambio`, `ejecutar-plan`, `instalar.sh` y `verify` (del kit) no se tocan. Los «Nivel 1/2/3» siguen; el contrato dice cuál capacidad corresponde a cuál.
- El enlace `nucleo/contrato/verificacion.md` se resuelve dentro del repo del kit; en un proyecto instalado la skill debe seguir siendo útil sin el archivo (ver paso 3). Que `instalar.sh` lo distribuya es un cambio aparte.

## Alcance
Puede cambiar: `nucleo/contrato/verificacion.md` (nuevo), `nucleo/recetas/node-pnpm.md` (nuevo), `skills/preparar-proyecto/SKILL.md`, `agentes/principal.md` (solo la línea «Mejora sugerida» del paso 5), `README.md` (una viñeta, solo si ya describe la verificación).
Fuera: `instalar.sh`, los proyectos de Franco, `planificar-cambio`, `ejecutar-plan`, `modelos.json`, `verify` del kit, `skills/preparar-proyecto/referencia.md`, recetas de otros stacks.

## Aceptación
| # | Criterio | Cómo se comprueba | Esperado |
|---|---|---|---|
| A1 | Contrato existe y es corto | `wc -c nucleo/contrato/verificacion.md` | ≤ 3072 |
| A2 | Cuatro capacidades nombradas | `grep -ciE 'rápida|servicio|aceptación|evidencia' nucleo/contrato/verificacion.md` | ≥ 4 |
| A3 | El contrato no nombra herramientas | `grep -ciE 'pnpm|npm|jest|vitest|playwright|docker|node' nucleo/contrato/verificacion.md` | 0 |
| A4 | El kit no trae recetas en agentes ni skills | `grep -rniE 'pnpm|jest|playwright' agentes skills` | sin salida |
| A5 | La receta Node existe con lo movido | `grep -c 'frozen-lockfile' nucleo/recetas/node-pnpm.md` | ≥ 1 |
| A6 | `preparar-proyecto` apunta al contrato y carga la receta solo si existe | `grep -c 'nucleo/contrato/verificacion.md' skills/preparar-proyecto/SKILL.md` y `grep -c 'nucleo/recetas/' skills/preparar-proyecto/SKILL.md` | ≥ 1 cada una |
| A7 | Solo existe la receta de Node | `ls nucleo/recetas` | `node-pnpm.md` |
| A8 | El kit sigue verde | `./verify` | `VERIFY OK` |

## Pasos
- [x] 1. `nucleo/contrato/verificacion.md` (≤ 3 KB, sin nombrar herramientas): las cuatro capacidades.
  - evidencia: `nucleo/contrato/verificacion.md` creado (1229 bytes; A1, A2 = 5, A3 = 0).
  - **rápida:** segundos, en el host, sin servicios; línea `Comprobación rápida:`.
  - **servicio:** la lógica contra dependencias reales (base de datos, cola, correo), sin interfaz; línea `Servicio:`.
  - **aceptación:** un archivo por flujo, filtrable por nombre, no corta al primer fallo (resume todos al final); línea `Aceptación:`.
  - **evidencia:** `resultado.json` con huella, nivel, fase, ok y tipo de fallo (formato de *Supuestos*); línea `Evidencia:` con dónde se escribe.
  - Cómo declarar: en `AGENTS.md`, sección Comandos, una línea por capacidad; la que falta se cubre con `./verify`. Correspondencia: rápida = Nivel 1; servicio y aceptación = Nivel 2/3.
- [x] 2. `nucleo/recetas/node-pnpm.md`: mueve desde `preparar-proyecto` §2 la instalación desde el lock, la declaración en `package.json` de lo que se importa directo (ejemplo `express`/NestJS) y la regla de lint `import/no-extraneous-dependencies`. Cabecera: «receta de Node/pnpm; ejemplo, no obligación». Nada de otros stacks.
  - evidencia: `nucleo/recetas/node-pnpm.md` creado; `grep -c 'frozen-lockfile'` = 1.
- [x] 3. `skills/preparar-proyecto/SKILL.md`: (a) plantilla de `AGENTS.md`: sustituye las líneas «Pruebas» y «Comprobación rápida» por las cuatro capacidades (rápida con su nombre actual; las otras tres opcionales); (b) §2 punto 1 y la regla de `package.json`: quita el texto de Node y pon una frase neutra («instalación desde el lock del gestor del proyecto») más: «Contrato: `nucleo/contrato/verificacion.md`. Si existe `nucleo/recetas/<stack>.md` que coincide con el proyecto, léela; si no, sigue sin ella». Deja las cuatro capacidades enumeradas en la skill (una línea cada una) para que funcione sin el archivo.
  - evidencia: `skills/preparar-proyecto/SKILL.md` editado (plantilla, cuatro capacidades, §2 y regla de dependencias); `grep -c nucleo/contrato/verificacion.md` = 2 y `grep -c nucleo/recetas/` = 1.
- [x] 4. `agentes/principal.md`, paso 5: cambia «Docker, Compose o Playwright» por «Docker, Compose o pruebas de aceptación en navegador». No tocar nada más del archivo.
  - evidencia: `agentes/principal.md` línea 48: «Docker, Compose o pruebas de aceptación en navegador».
- [x] 5. Si el README ya tiene una viñeta de «Verificación», añade una línea apuntando al contrato; si no, no la crees.
  - evidencia: `README.md` (sección Verificación): viñeta nueva tras la de «Niveles de verificación» que apunta a `nucleo/contrato/verificacion.md`.
- [x] 6. Corre A1–A7; deja el resultado en *Evidencia*.
  - evidencia: A1–A7 pasan (salida en *Evidencia*); `./verify` exit 0.

## Verificación
`./verify` (A8) más los comandos A1–A7. Es `tipo: docs` pero toca `agentes/` y `skills/`, por eso corre el `verify` del kit completo.

## Evidencia
$ wc -c nucleo/contrato/verificacion.md
1229 nucleo/contrato/verificacion.md
exit 0

$ grep -ciE rápida|servicio|aceptación|evidencia nucleo/contrato/verificacion.md
5
exit 0

$ grep -ciE pnpm|npm|jest|vitest|playwright|docker|node nucleo/contrato/verificacion.md
0
exit 1

$ grep -rniE pnpm|jest|playwright agentes skills
exit 1

$ grep -c frozen-lockfile nucleo/recetas/node-pnpm.md
1
exit 0

$ grep -c nucleo/contrato/verificacion.md skills/preparar-proyecto/SKILL.md
2
exit 0

$ grep -c nucleo/recetas/ skills/preparar-proyecto/SKILL.md
1
exit 0

$ ls nucleo/recetas
node-pnpm.md
exit 0

$ ./verify
ok 8r A4: start, status, segundo start sin duplicar y stop; archivos creados y el PID ya no existe
== 8t. cambio pequeño: definición, riesgo y prácticas por tecnología ==
ok 8t: principal con la definición de cambio pequeño, riesgo alto y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «cambio pequeño» falla
VERIFY OK
exit 0

(La salida completa de `./verify` quedó en /tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/a842dec1-7b9d-422e-bc07-f171156179c8/scratchpad/verify-1.log.)

## Notas
- Riesgo de conflicto con `cambios/verificacion-general` y `cambios/proceso-rapido` (ambos borrador, tocan `preparar-proyecto`): aprobar este primero o rebasar el otro después.
- Decisión menor: las cuatro capacidades quedaron en `skills/preparar-proyecto/SKILL.md` después de la plantilla de `AGENTS.md`, y la línea «Contrato: …» con la regla de receta, encima de «Reglas de diseño» en §2.
- Decisión menor: la regla de dependencias quedó neutra (sin `package.json` ni ESLint); el ejemplo `express`/NestJS y la regla `import/no-extraneous-dependencies` pasaron a la receta.
- Decisión menor: `Huella` en el contrato usa `git` y `sha256sum` (el comando de *Supuestos*); A3 no los cuenta.
- Riesgo sin cerrar: `instalar.sh` no distribuye `nucleo/`; en un proyecto instalado, la ruta del contrato no existe y la skill funciona por sus cuatro líneas enumeradas. Ya estaba en *Alcance* como cambio aparte.
- Sin conflicto con la rama: `docs/contrato-verificacion` era la rama actual; no se creó otra.
