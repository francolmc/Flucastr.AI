# task-03 — Quitar la línea sobre `modelos.json` de los cuatro agentes
repo: Flucastr.AI   depende_de: task-02   estado: borrador

## Descripción
Los cuatro `agentes/*.md` repiten «El nivel de modelo que usas no se declara aquí: lo define el usuario en `modelos.json`.». Es texto que se reenvía en cada turno sin aportar al comportamiento (higiene de contexto). Se elimina esa línea (y la línea en blanco sobrante) de cada agente.

## Contexto
- Leído (grep): la línea está en `agentes/arquitecto.md:10`, `agentes/planificador.md:10`, `agentes/constructor.md:10` y `agentes/coordinador.md:11`. Es el único párrafo con esa frase.
- Ningún comprobador exige esa frase (`grep -rn "no se declara" pruebas scripts instalar.sh` solo aparece en un resultado histórico `pruebas/resultados/2026-10-28-capa1.md`, que no se toca). `pruebas/comprobaciones/modelos-agentes.mjs` solo mira líneas `model:` del front matter.
- Depende de task-02 porque ambas tocan `agentes/coordinador.md`.
- Es la misma edición en cuatro archivos Markdown (un objetivo); no se toca código.

## Decisiones ya tomadas
- Se borra la línea completa y una de las dos líneas en blanco contiguas, de modo que quede una sola línea en blanco entre párrafos.
- No se reemplaza por otra frase.

## Alcance / Fuera de alcance
Alcance: esa línea en los cuatro agentes.
Fuera de alcance: `definitions/WORKFLOW.md` (task-04), `modelos.json`, cualquier otro texto de los agentes, `pruebas/resultados/`.

## Pasos
1. Editar los cuatro archivos para quitar la línea. Resultado: `grep -rn "no se declara aquí" agentes/` sin salida.
2. Correr la verificación y pegarla en *Evidencia*.

## Criterios de aceptación
1. `grep -rn "no se declara aquí" agentes/` no devuelve nada.
2. `git diff --stat agentes/` muestra solo los cuatro archivos y solo eliminaciones (2 líneas por archivo como máximo, sin inserciones salvo las de task-02 en `coordinador.md`).
3. `node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/modelos-agentes.test.mjs` termina con `fail 0`.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -rn "no se declara aquí" agentes/
git diff --stat agentes/
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/modelos-agentes.test.mjs
```
Esperado: sin salida del `grep`; cuatro archivos en el `diff --stat`; `fail 0`.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
