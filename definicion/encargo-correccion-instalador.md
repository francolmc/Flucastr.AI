# Encargo — corregir `instalar.sh` (validar antes de actuar)

> Estado: **aprobado por Franco** (2026-10-28).
> Para: la sesión de implementación (no el arquitecto). Escrito por el arquitecto, que no construye nada.
> Origen: fallo I5 de la Capa 1, `pruebas/resultados/2026-10-28-capa1.md`. Complementa `definicion/encargo-pruebas.md` y manda sobre él en lo que se contradiga.

## Problema (confirmado en la corrida; el punto 3 es inferido del código)

1. Con `modelos.json` roto, o con un nivel inexistente, `instalar.sh` da un error claro pero deja 4 enlaces de skills y un manifiesto parcial (**confirmado**, I5).
2. Causa: enlaza las skills antes de resolver el modelo, y el `trap` de salida guarda el manifiesto también al fallar (**confirmado** en el resumen y en `instalar.sh`).
3. **Inferido, no probado:** si ya hay una instalación funcionando, `instalar.sh` la desinstala primero y recién después falla al resolver el modelo, dejando al usuario sin agente.

## Comportamiento requerido

Antes de **desinstalar la instalación anterior** y antes de **escribir o enlazar nada**, el instalador valida todo lo que va a necesitar. Si algo falla, termina con error y **no cambia nada**.

La validación cubre, para cada agente de `agentes/*.md` y cada herramienta que se va a instalar:
- que el modelo se resuelve (`modelos.json` válido, nivel existente, perfil existente);
- que el agente es válido (`name` igual al archivo y sin `model:` propio), lo que ya comprueba el resolver al generarlo.

Requisitos:

1. **Orden:** primero decidir qué herramientas se instalan, después validar, después desinstalar lo anterior, después instalar.
2. **`--simular` también valida** y avisa del error. Sigue sin escribir en los destinos.
3. **Si la validación falla:** salida distinta de 0, mensaje claro (el actual sirve), y el sistema queda **exactamente** como estaba, incluida una instalación previa y su manifiesto.
4. **Si la validación pasa:** el comportamiento es el mismo de hoy.

## Alcance

- **Modificas solo `instalar.sh`.** Es el único archivo de producto autorizado.
- No modificas `desinstalar.sh`, `resolver.mjs`, `modelos.json`, `agentes/`, `skills/` ni `definicion/`.
- Si crees que otra cosa debe cambiar, lo dices y esperas a Franco.
- Cambio mínimo: sin reescribir el script ni agregar opciones nuevas.

## Pruebas (en `pruebas/`)

1. Ajustar la Capa 1 a la redacción nueva del plan:
   - **I3:** tolera directorios vacíos creados por la instalación; sigue fallando ante archivos o enlaces residuales y ante cualquier cambio en lo que ya existía.
   - **I4:** el archivo temporal del sistema (`mktemp`) se tolera; sigue fallando ante cualquier escritura en `HOME` o en los destinos.
2. **I5:** ahora debe pasar, con las dos variantes (JSON roto y nivel inexistente) sobre un `HOME` limpio.
3. **I5, variante nueva:** instalar bien, romper `modelos.json`, reinstalar. Comprobar que falla con mensaje claro y que el estado (enlaces, agentes generados, lanzador y manifiesto) queda **idéntico** al de la instalación previa.
4. **Control negativo** para cada comprobación cambiada o nueva: verla fallar contra una salida falsa. En particular, ejecutar la variante nueva contra la **versión anterior** de `instalar.sh` (la del commit actual) y confirmar que **falla ahí**; así se confirma de paso el punto 3 del problema.
5. Volver a correr la Capa 1 completa. **Resultado esperado: 6 de 6.**

## Reglas de trabajo

- Escribes en `instalar.sh` y en `pruebas/`. En nada más.
- Sin commit, push, PR, merge ni despliegue. Franco hace los commits.
- No tocas la configuración real (`~/.claude`, `~/.pi`, `~/.flucastr-ai`); todo con carpetas temporales.
- Sin red, sin modelos.
- Si el resultado de algo te sorprende o contradice este encargo, lo reportas y esperas.
- Al terminar, **te detienes**: no pasas a la etapa 2.

## Entrega

Dices:
- qué cambió en `instalar.sh` (diff resumido);
- el resultado de la Capa 1 (se espera 6 de 6) y el de la variante nueva contra la versión anterior (se espera que falle);
- un nuevo resumen en `pruebas/resultados/` (el anterior se conserva).

## Definición de terminado

- Capa 1: 6 de 6, con control negativo.
- La variante de reinstalación falla contra el `instalar.sh` anterior y pasa con el nuevo.
- Franco revisó el diff y hizo el commit.

## Estado

Aprobado por Franco el 2026-10-28.
