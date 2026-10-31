# task-03 — Quitar la línea sobre `modelos.json` de los cuatro agentes
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Los cuatro `agentes/*.md` repiten «El nivel de modelo que usas no se declara aquí: lo define el usuario en `modelos.json`.». Es texto que se reenvía en cada turno sin aportar al comportamiento (higiene de contexto), y la línea de identidad de task-01 ya informa el modelo. Se elimina esa línea (y la línea en blanco sobrante) de cada agente.

## Contexto
- Leído (grep): la línea está en `agentes/arquitecto.md:10`, `agentes/planificador.md:10`, `agentes/constructor.md:10` y `agentes/coordinador.md:11`; es el único párrafo con esa frase, rodeado de líneas en blanco.
- Ningún comprobador exige esa frase: `pruebas/comprobaciones/modelos-agentes.mjs` solo mira líneas `model:` del encabezado; la frase solo aparece en el resultado histórico `pruebas/resultados/2026-10-28-capa1.md`, que no se toca.
- `agentes/` no tiene cambios sin commit hoy (`git status`), así que `git diff --stat agentes/` mide solo esta tarea.
- Es la misma edición en cuatro archivos Markdown: un objetivo; no se toca código.

## Decisiones ya tomadas
- Se borra la línea completa y una de las dos líneas en blanco contiguas: queda una sola línea en blanco entre párrafos.
- No se reemplaza por otra frase.

## Alcance / Fuera de alcance
Alcance: esa línea en los cuatro agentes.
Fuera de alcance: `definitions/WORKFLOW.md` (task-04), `modelos.json`, cualquier otro texto de los agentes (incluida la línea de lectura acotada, task-05), `pruebas/resultados/`.

## Pasos
1. Editar los cuatro archivos para quitar la línea. Resultado: `grep -rn "no se declara aquí" agentes/` sin salida.
2. Correr la verificación y pegarla en *Evidencia*.

## Criterios de aceptación
1. `grep -rn "no se declara aquí" agentes/` no devuelve nada.
2. `git diff --stat agentes/` muestra los cuatro archivos y `8 deletions(-)` sin inserciones.
3. `node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/modelos-agentes.test.mjs pruebas/comprobaciones/resolver-agentes.test.mjs` termina con `fail 0`.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -rn "no se declara aquí" agentes/
git diff --stat agentes/
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/modelos-agentes.test.mjs pruebas/comprobaciones/resolver-agentes.test.mjs
```
Esperado: sin salida del `grep`; cuatro archivos y 8 eliminaciones; `fail 0` (no ejecutado tras el cambio).

## Evidencia

Verificación de la tarea (`cd /Users/franco/Codes/flucastr/Flucastr.AI`):

```
$ grep -rn "no se declara aquí" agentes/
(sin salida; exit=1)

$ git diff --stat agentes/
 agentes/arquitecto.md   | 2 --
 agentes/constructor.md  | 2 --
 agentes/coordinador.md  | 2 --
 agentes/planificador.md | 2 --
 4 files changed, 8 deletions(-)

$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/modelos-agentes.test.mjs pruebas/comprobaciones/resolver-agentes.test.mjs
... (últimas líneas)
ℹ tests 42
ℹ suites 0
ℹ pass 42
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Verificación rápida pedida por el encargo (HOME real, `HOME=/Users/franco`; las pruebas de instalación usan HOME temporal en `pruebas/.temporales/`):

```
$ bash pruebas/rapida.sh
... (últimas líneas)
ℹ tests 227
ℹ pass 227
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
rapida: 22 archivos en 11 s (tope 30 s)
```

Sin línea `FALLA`. El código de salida no quedó capturado (la salida pasó por `tail`); la línea final sin `FALLA` y `fail 0` indican que la comprobación pasó.

Criterios de aceptación:
1. `grep` sin salida: cumple.
2. `git diff --stat agentes/`: cuatro archivos, 8 eliminaciones, 0 inserciones: cumple.
3. `node --test` de los tres archivos: `fail 0` (42 de 42 pasan): cumple.

Cada uno de los cuatro archivos pierde la línea «El nivel de modelo…» y la línea en blanco que la sigue; queda una sola línea en blanco entre párrafos.

## Notas
- Huecos menores: ninguno. Se borró la línea y su línea en blanco siguiente en los cuatro agentes, como indica la tarea.
- `rapida.sh` no estaba en los pasos de la tarea; se corrió porque lo pidió el encargo, con HOME real. Sus pruebas de instalación usan HOME temporal (verificado con grep antes de correrlo), así que no se reinstaló nada en `~/.claude` ni `~/.pi`.
- Rama: se confirmó `feature/F18-identidad-y-prompts-livianos` con `git branch --show-current`; no se hizo switch ni commit.
- Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
