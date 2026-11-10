# `kit run`: ejecutar un plan

`kit run` automatiza el ciclo de ejecución de un plan aprobado con Codex: encarga el trabajo al constructor, ejecuta la verificación definida por el plan y pide una revisión final de solo lectura.

## Uso

```bash
node scripts/kit-run.mjs cambios/mi-cambio/plan.md --herramienta codex
```

La herramienta predeterminada es `codex`. La opción `--raiz <dir>` permite señalar la raíz del kit.

## Ciclo

1. Ejecuta el plan con el constructor.
2. Corre el comando de la sección `Verificación` del plan (o `./verify` si no se indicó uno).
3. Si la verificación falla, vuelve a ejecutar el constructor hasta dos veces.
4. Con la verificación aprobada, un proceso nuevo revisa el diff en modo de solo lectura. Si devuelve defectos, el constructor puede relanzarse con los intentos que queden del mismo contador (máximo dos relanzamientos totales entre fallos de verificación y devoluciones de revisión); después se vuelve a revisar.

El constructor dispone de hasta 45 minutos por corrida, la verificación 30 minutos y la revisión 15 minutos. `KIT_RUN_TOPE_MS` reemplaza esos topes por un valor común en milisegundos.

## Resultado

La primera línea informa `COMPLETADO` si la revisión aprueba y la verificación pasa; el plan queda en estado `listo`.

Si el ciclo no puede terminar, informa `PAUSA`; el plan queda en estado `parcial`. El proceso devuelve código 0 para `listo`, 1 para `parcial` y 2 si el uso es incorrecto o el plan no está aprobado.
