# MVP de Flucastr.AI

Estado: borrador. Pendiente de aprobación de Franco.

## Qué es esta versión

Esta primera versión es un **MVP**. Se construye para comprobar una sola cosa y después crecer y mejorar por etapas. Lo que no está en este documento queda fuera de esta versión, no descartado.

*Origen:* Franco lo pidió así («esta primera versión es un MVP y luego iremos creciendo y mejorando»). Confirmado.

## Responsabilidad y artefactos del arquitecto

El arquitecto **solo define el proyecto**. No planifica tareas, no construye, no hace commit. Entrega exactamente estos archivos (decisión de Franco, tras revisar los resultados de B, M y R):

| Archivo | Para qué |
|---|---|
| `AGENTS.md` (raíz del workspace) | Entrada breve para cualquier agente: qué es el proyecto, su estructura en una línea y enlaces a `definitions/`. No repite lo que ya está en `PROJECT.md` |
| `definitions/PROJECT.md` | Qué es y qué hace el proyecto |
| `definitions/REPOS.md` | Lista de repos |
| `definitions/ARCHITECTURE.md` | Estructura y diagrama |
| `initialize.sh` (raíz del workspace) | Reconstruye los repos en un entorno nuevo. Se escribe, nunca lo ejecuta el agente |

Reglas:
- Nombres de archivos y carpetas en inglés; el contenido sigue en español.
- Excepción a «solo escribe en la carpeta de definiciones»: el agente puede escribir `AGENTS.md` e `initialize.sh` en la raíz del workspace, y nada más fuera de `definitions/`.
- Proyecto con repos existentes: investiga lo que hay, arma la documentación con eso y la complementa con preguntas.
- Proyecto nuevo: explora y pregunta, y deja la definición.
- Todo documento queda como borrador hasta que Franco lo aprueba.

*Origen:* observaciones de Franco al terminar la revisión del arquitecto. Confirmado.

## Qué problema ataca

Las cuatro versiones anteriores no entregaron features terminadas: se iteró sin llegar a nada (dicho por Franco). El MVP existe para cambiar eso.

## Criterio de éxito

**Una feature real de Franco, terminada**, con un criterio de «hecha» que se verificó.

No es «pasaron las pruebas del arquitecto». Las pruebas sirven para confiar en la herramienta, no son el objetivo.

## Qué entra

| Pieza | Estado al escribir esto | Qué falta |
|---|---|---|
| Agente `arquitecto` para Claude Code y Pi | Funciona. Escenario B pasa 3/3 en ambas herramientas; M pasa 3/3 en Claude | Cerrar M en Pi y R (este repo como caso real); estaban en ejecución |
| Instalación para Claude Code y Pi | Hecha y probada (6/6, con controles negativos y un error real corregido) | Nada |
| Worker mínimo: skill `ejecutar-tarea` | No existe. Hay un diseño aparcado en `definicion/diseno-primera-herramienta.md` | Diseñarlo en una página, construirlo y usarlo |
| Formato de tarea: qué construir, criterio de «hecha», cómo se verifica | Esbozado en el diseño aparcado | Reducirlo a lo mínimo |

*Origen:* informes de `pruebas/resultados/` y conversación. Confirmado para lo que ya corrió; el worker es una propuesta.

## Qué queda fuera de esta versión

- Escenarios C (complejo) y N (proyecto nuevo con conversación) como pruebas formales de 3 corridas por herramienta. Los reemplaza el uso real: lo que falle en el producto de Franco se convierte en regla.
- Más corridas por escenario y nuevas comprobaciones blandas.
- Varios workers o varios niveles de modelo por tarea. Franco usa un solo modelo.
- Publicación en un remoto y pulido de la documentación.

Cada una puede entrar en una versión posterior.

## Orden de trabajo

1. Dejar terminar las pruebas en curso (Pi M y R). Si pasan, el arquitecto queda cerrado como parte del MVP.
2. Franco usa el arquitecto en un producto real desde ya. Cada fallo observado se anota.
3. Diseñar el worker mínimo en una página, con una tarea, un criterio de «hecha» y una verificación.
4. Construirlo y probarlo con una feature real de Franco.

## Decisiones

| Decisión | Por qué | Descartado y por qué | Qué la cambiaría |
|---|---|---|---|
| Recortar las pruebas formales a lo ya corrido más R | La mayor parte del esfuerzo fue en el arnés y casi nada en lo que ataca el dolor de Franco | Completar los 5 escenarios × 3 corridas × 2 herramientas (30 corridas): da más confianza, pero retrasa lo único que prueba el MVP | Un fallo grave del arquitecto en uso real |
| El éxito se mide con una feature terminada | Es el dolor declarado | Medirlo por pruebas pasadas: no demuestra que ayude a terminar | Que Franco redefina el objetivo |
| Reducir los entregables del arquitecto a 5 archivos con nombres en inglés | El arquitecto había acumulado responsabilidad; Franco quiere solo definición | Mantener los 4 archivos actuales en español: menos cambios, pero deja la salida sin `AGENTS.md` y sin un estándar de idioma | Que `AGENTS.md` duplique `PROJECT.md` en la práctica |
| Worker mínimo antes que una familia de workers | Lo más simple que sirve | Varios workers por tamaño de producto: complejidad sin evidencia | Que la primera feature muestre que un solo worker no basta |

## Qué sigue después del MVP

Crecer por etapas: pruebas de C y N, más productos (medio y robusto), más workers, publicación. Cada etapa se define cuando la anterior esté cerrada.

## Preguntas abiertas

1. ¿Cuál es la primera feature real que se quiere terminar, de un producto nuevo o de uno existente?
2. ¿Dónde se publicará el repositorio (URL y visibilidad)? Afecta a `clonar.sh`.
3. `agentes/arquitecto.md` dice «nivel alto» pero `modelos.json` lo fija en medio. Franco pidió no cambiar el modelo; queda por decidir cuál de los dos textos se corrige.
