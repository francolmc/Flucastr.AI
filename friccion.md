# Fricción del flujo

Cosas que costaron o que el flujo pidió sin necesidad. Una línea cada una.

- **Estados del plan sin vocabulario.** La plantilla trae `estado: borrador` y el flujo usa `aprobado`; el constructor puso `listo` y yo `hecho`. Nadie define la lista. Propuesta: fijar `borrador → aprobado → listo → hecho` en `planificar-cambio`.
- **Prueba negativa pedida antes de que exista lo probado.** En `verify-del-kit` el plan tuvo que ordenar la prueba negativa a un comando que aún no existía; su evidencia solo podía llegar después de la puerta 1. Funcionó, pero el plan queda «ciego» en esa parte.
- **Mi primer borrador del plan se desordenó.** Dejé un paso (prueba negativa B) con texto contradictorio y lo arreglé en una segunda pasada. El «relee como constructor» de la skill no lo detectó; lo vi al reabrir el archivo.
- **Límite de 5 KB sin medir.** La skill dice «unos 5 KB» y no hay herramienta que lo compruebe; salí con 5,9 KB y tuve que recortar a mano.
- **Docs oficiales truncadas.** El lector web cortó la página de subagentes a ~40 000 de 116 000 caracteres y devolvió el resto como resumen de modelo; lo literal sobre herencia de `deny` en subagentes no se pudo confirmar. Costó dos lecturas y deja una brecha marcada en el plan.
- **Paso de ida y vuelta al cerrar.** Tras `COMPLETADO` hay tres avisos (mensaje del subagente, notificación, nota de archivo cambiado) para un solo hecho; basta uno.
- **`AGENTS.md` dice que `legacy/` se retira «en el paso 3 del rediseño»** pero no hay lista de pasos en el repo. Tuve que fiarme de la frase.
