---
estado: aprobado
rama: feature/casillas-en-vivo
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Casillas en vivo

## Objetivo
Mostrar el avance del constructor al completar cada paso comprobado y conservar una nota breve para retomarlo. La evidencia sigue vigente al editar planes.

## Supuestos
- Los cambios de estado del frontmatter siguen siendo obligatorios; la restricción de edición del plan permite también esas transiciones existentes.
- La exclusión de `cambios/` se aplica desde la raíz de cada repo; si se requiere otra ubicación en workspaces, cambia el contrato.

## Alcance
`agentes/constructor.md`, `skills/ejecutar-plan/SKILL.md`, `skills/planificar-cambio/SKILL.md`, `scripts/revisar-plan.mjs`, `nucleo/contrato/verificacion.md`, `skills/diagnosticar/diagnosticar.mjs`, `pruebas/contrato-constructor.mjs`, `pruebas/revisar-plan/`, `pruebas/diagnostico-sugiere/` y `verify` si hace falta conectar pruebas. Se pueden añadir pruebas y fixtures dentro de esas carpetas. No modificar tests de aceptación existentes, otros planes, producto ajeno ni la configuración local preexistente.

## Decisiones ya tomadas
- Ejecutor: constructor, porque los requisitos, contexto y comprobaciones están definidos y no requieren credenciales ni producción.
- Mantener las transiciones de estado existentes y la frase `vuelve a correr el mismo comando` exigida por `verify`.
- El constructor cambia solo casillas, Evidencia y Notas, además del estado obligatorio; la evidencia de cada paso va en Evidencia, no como sublínea de Pasos. No modifica Alcance ni Aceptación.
- Sin comprobación explícita o con paso incompleto, conserva la casilla pendiente y deja una línea en Notas que identifique el paso y el punto de reanudación; no inventa una comprobación ni declara COMPLETADO.
- La huella de evidencia excluye `cambios/` de ambos comandos Git mediante pathspec de exclusión anclado a la raíz; mantiene el comportamiento previo del resto, incluido el caso sin HEAD. Las huellas históricas pueden quedar obsoletas una vez por el cambio de contrato. La huella de integridad del revisor de `kit run` tiene otro propósito y no se altera.
- `revisar-plan` ya avisa heurísticamente cuando falta comprobación; conservar su CLI y probar también que una verificación de tramo no sustituye la del paso.

## Escenarios
- CUANDO se completa y comprueba cada paso de un tramo de cuatro pasos ENTONCES su casilla cambia antes de comenzar el siguiente (A1).
- CUANDO falta la comprobación o se interrumpe un paso ENTONCES queda pendiente y una nota permite retomarlo (A2).
- CUANDO se revisa un paso sin comprobación ENTONCES el revisor lo advierte en su línea (A3).
- CUANDO cambia el plan ENTONCES la huella de evidencia permanece vigente; un cambio rastreado de producto sí la invalida (A4).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Avance individual sin editar alcance ni aceptación | `node pruebas/contrato-constructor.mjs` y revisión del escenario real descrito en Notas | Registro observado de estados 1000, 1100, 1110, 1111 tras comprobaciones exitosas y antes del paso siguiente; secciones protegidas idénticas. |
| A2 | Paso sin comprobación o interrumpido queda pendiente y anotado | `node pruebas/contrato-constructor.mjs` | Ambos casos conservan casilla y nota de una línea; mutación que marque anticipadamente falla. |
| A3 | Aviso por comprobación ausente | `node --test pruebas/revisar-plan/*.test.mjs` | Aviso con línea correcta; comprobación del tramo no lo oculta y un paso con comprobación pasa. |
| A4 | Vigencia de evidencia independiente del plan | `node --test pruebas/diagnostico-sugiere/*.test.mjs` | En repo temporal real, modificaciones y altas en `cambios/` conservan vigencia; cambio rastreado fuera la vuelve obsoleta; contrato y diagnóstico coinciden. |

## Verificación
`./verify` — verificación completa del kit (≈10 min; depende del entorno).

## Pasos
- [ ] Ajustar `agentes/constructor.md` y `skills/ejecutar-plan/SKILL.md` para el ciclo, límites y notas indicados (A1, A2). Comprobación: `node pruebas/contrato-constructor.mjs`; se cumplen A1 y A2.
- [ ] Alinear `skills/planificar-cambio/SKILL.md` con comprobación explícita por paso y evidencia en su sección (A1, A2). Comprobación: `node pruebas/contrato-constructor.mjs`; el contrato actualizado pasa.
- [ ] Cubrir `scripts/revisar-plan.mjs` con casos positivos y negativos en `pruebas/revisar-plan/`, corrigiendo solo si falla (A3). Comprobación: `node --test pruebas/revisar-plan/*.test.mjs`; exit 0.
- [ ] Corregir el contrato de huella en `nucleo/contrato/verificacion.md` y su consumidor `skills/diagnosticar/diagnosticar.mjs` (A4). Comprobación: `node --test pruebas/diagnostico-sugiere/*.test.mjs`; se cumplen los casos de A4.
- [ ] Conectar las pruebas nuevas a `verify` si aún no están incluidas (A1, A3, A4). Comprobación: `./verify` (≈10 min); exit 0 y suites pertinentes ejecutadas.

## Evidencia

## Notas
- Crear `pruebas/diagnostico-sugiere/huella.test.mjs` y conectarlo a `verify`: hoy esa carpeta solo contiene el proyecto juguete.
- Para A1 el principal deberá observar una ejecución real posterior con la skill modificada y un plan aprobado de cuatro pasos independientes, cada comprobación con señal y cada paso siguiente condicionado a observar la casilla anterior. Registrar las cuatro observaciones y comparar Alcance y Aceptación antes y después. No atribuir a una simulación prueba de comportamiento real; sin esa observación A1 queda pendiente en la revisión.
- El árbol ya tiene `.claude/settings.json` modificado; preservarlo. Antes de construir, Franco debe resolver la base sucia conforme al flujo del principal.
