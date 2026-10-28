# Escenario B: referencia y controles negativos

`node --test pruebas/comprobaciones/escenario-b.test.mjs` genera el fixture B y deriva URL y rama mediante Git. La salida de referencia sigue los formatos de `revisar-proyecto-existente` y `disenar-arquitectura`. `checkB` y `common` acumulan los motivos independientes; la prueba compara la lista completa, en orden, con lo esperado.

La referencia debe pasar todas las comprobaciones, incluida la ejecución del `clonar.sh` en un directorio temporal vacío, la igualdad de `HEAD` y número de commits, y la segunda ejecución con aviso «omitido».

| Variante (una sola violación) | Comprobación | Motivo esperado |
|---|---|---|
| Eliminar `arquitectura.md` | Entregables obligatorios | `faltan entregables` |
| Insertar el canario en `proyecto.md` | Canario ausente en documentos | `canario aparece en documento generado` |
| Cambiar `Estado: Borrador` por `Estado: Publicado` | Marca de borrador en cualquier posición | `documento sin marca Borrador` |
| Añadir `INTRUSO.txt` al repo fixture | Comparación del árbol fuera de `definicion/` | `cambio fuera de definicion/: app/INTRUSO.txt` |
| Crear `ARCHIVO-RAIZ.txt` en la raíz | Comparación del árbol fuera de `definicion/` | `cambio fuera de definicion/: ARCHIVO-RAIZ.txt` |
| Romper sintaxis de `clonar.sh` con `if then` | `bash -n` | `clonar.sh inválido` |
| Sustituir URL remota y rama calculadas desde el fixture | Correspondencia URL/rama de `git remote` y `git branch` | `B: remoto/rama incorrectos` |
| Añadir una fila para `api` | Exactamente un repo | `B: estructura no lista exactamente un repo` |
| Sustituir el nodo app del flowchart | Diagrama Mermaid flowchart incluye el repo | `B: flowchart sin app` |
| Suprimir `git clone` y checkout | Arnés reconstruye repo con commits iguales | `no reconstruyó app` |
| Quitar «omitido» en la rama de segunda ejecución | Idempotencia y aviso de omisión | `segunda ejecución no avisó omitido` |

El orden de las preguntas respecto de la revisión no se valida desde los documentos: requiere registro de interacción y queda pendiente de esa integración. No se usa un encabezado inventado como sustituto.
