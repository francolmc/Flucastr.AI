# task-08 — Cierre de F42: README de pruebas y suite rápida en 0
repo: Flucastr.AI   depende_de: task-07   estado: aprobada

## Descripción
Registra la corrida del planificador en `pruebas/README.md` y comprueba que toda F42 deja la verificación rápida en verde, con los topes de bytes de skill y agentes respetados.

## Contexto
- Tocar: `pruebas/README.md`
- Leer: `pruebas/README.md@14-5`
- Línea de patrón (16): «- Repetido (F39): `bash pruebas/correr-repetido.sh {claude-code|pi}`; solo con pedido de Franco; informe en `pruebas/resultados/`.»
- De `depende_de:` lee solo las *Notas* de task-07.
- Fuente: ninguna
- Requiere: runtime:node@25, largo:120

## Decisiones ya tomadas
- Se añade debajo de la línea 16: «- Planificador (F42): `bash pruebas/correr-planificador.sh {claude-code|pi}`; solo con pedido de Franco; informe en `pruebas/resultados/`.»
- Si `rapida.sh` falla por algo ajeno a F42, no se arregla aquí: se anota en *Notas* y la tarea queda `lista para revisión` con la salida real.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: una línea en el README y la suite rápida.
Fuera de alcance: cambiar topes de bytes, tocar `definitions/`, el commit.

## Pasos
1. Corre `git branch --show-current`.
2. Añade la línea al README.
3. Corre `bash pruebas/rapida.sh` y copia la salida real en *Evidencia*.

## Criterios de aceptación
1. Rama `feature/F42-tareas-acotadas-topes`.
2. `bash pruebas/rapida.sh` termina en 0 con 0 fallos.
3. El README nombra `correr-planificador.sh` (grep).

## Verificación
```
git branch --show-current
grep -c "correr-planificador.sh" pruebas/README.md
bash pruebas/rapida.sh
```
Esperado: rama `feature/F42-tareas-acotadas-topes`; `1`; `fail 0` y salida 0.

## Evidencia

## Notas
