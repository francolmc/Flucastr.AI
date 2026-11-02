# task-02 — Núcleo del validador en scripts/
repo: Flucastr.AI   depende_de: task-01   estado: aprobada

## Descripción
El `coordinador` correrá el validador desde proyectos instalados, que no tienen `pruebas/`; solo reciben `scripts/` con el kit. Esta tarea mueve el núcleo de `pruebas/comprobaciones/formato-tarea.mjs` a `scripts/formato-tarea.mjs` y deja el archivo antiguo como re-export, para que las pruebas y `constructor-resultado.mjs` sigan importando igual.

## Contexto
- Leer: `definitions/ARCHITECTURE.md`, subsección «Raíz del kit y puerta previa de tarea (F24…)», viñeta «Núcleo». De task-01 (`depende_de`), solo sus *Notas*.
- Tocar: `scripts/formato-tarea.mjs`, `pruebas/comprobaciones/formato-tarea.mjs`
- Importadores que no cambian: `pruebas/comprobaciones/formato-tarea.test.mjs` (línea 6), `pruebas/comprobaciones/fixture-constructor.test.mjs` (línea 10), `pruebas/comprobaciones/constructor-resultado.mjs` (línea 7); todos importan `./formato-tarea.mjs`.
- Scripts existentes en `scripts/`: `archivar.mjs`, `consumo.mjs`, `informe.mjs`, `registrar.mjs`, `resolver.mjs` (módulos ES de Node sin dependencias).
- Exports a conservar: `validarTarea`, `SECCIONES`, `MAX_CARACTERES`.

## Decisiones ya tomadas
- El contenido de `scripts/formato-tarea.mjs` es el de `pruebas/comprobaciones/formato-tarea.mjs` tras task-01, sin cambios de lógica; solo se ajusta el comentario de cabecera para que diga que el archivo vive en `scripts/` y lo usa `scripts/validar-tarea.mjs`.
- `pruebas/comprobaciones/formato-tarea.mjs` queda con dos líneas: un comentario y `export * from '../../scripts/formato-tarea.mjs';`.
- Se copia con `cp` y se edita; sin `git mv` (los agentes no escriben en git).

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: crear el archivo en `scripts/` y reducir el antiguo a un re-export.
Fuera de alcance: cambiar reglas del validador, crear `validar-tarea.mjs`, tocar tests, instaladores o agentes.

## Pasos
1. `cp pruebas/comprobaciones/formato-tarea.mjs scripts/formato-tarea.mjs`.
2. En `scripts/formato-tarea.mjs`: reemplazar la primera línea de comentario por «Núcleo del validador de la plantilla de tarea (definitions/WORKFLOW.md §6); lo usa scripts/validar-tarea.mjs y lo re-exporta pruebas/comprobaciones/formato-tarea.mjs.».
3. Reescribir `pruebas/comprobaciones/formato-tarea.mjs` con el comentario «Re-export: el núcleo vive en scripts/formato-tarea.mjs (se instala con scripts/).» y `export * from '../../scripts/formato-tarea.mjs';`.
4. Ejecutar la verificación.

## Criterios de aceptación
1. `scripts/formato-tarea.mjs` exporta `validarTarea`, `SECCIONES` y `MAX_CARACTERES`: la salida del primer comando de *Verificación*.
2. El archivo antiguo solo re-exporta: `wc -l` da 2.
3. Las pruebas que lo importan siguen en verde: segundo comando de *Verificación*.

## Verificación
```
node -e "import('./scripts/formato-tarea.mjs').then(m=>console.log(Object.keys(m).sort().join(',')))"
wc -l < pruebas/comprobaciones/formato-tarea.mjs | tr -d " "
node --test pruebas/comprobaciones/formato-tarea.test.mjs pruebas/comprobaciones/fixture-constructor.test.mjs pruebas/comprobaciones/constructor-resultado.test.mjs
```
Esperado: `MAX_CARACTERES,SECCIONES,validarTarea`; luego `2`; luego `ℹ fail 0`.

## Evidencia

## Notas
