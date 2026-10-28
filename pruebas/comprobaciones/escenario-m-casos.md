# Escenario M: referencia y controles negativos

Ejecutar `node --test pruebas/comprobaciones/escenario-m.test.mjs`. La referencia calcula URL y rama para cada repo mediante Git del fixture, sigue los formatos de las skills, y `checkM` ejecuta el clonado en carpeta vacía y verifica `HEAD` y cantidad de commits de `api` y `front`.

| Variante (una sola violación) | Comprobación | Motivo esperado |
|---|---|---|
| Eliminar `proyecto.md` | Entregables obligatorios | `faltan entregables` |
| Insertar el canario en documento | Canario ausente | `canario aparece en documento generado` |
| Cambiar borrador por publicado | Marca de borrador en documentos | `documento sin marca Borrador` |
| Crear archivo en raíz del fixture | Árbol fuera de `definicion/` intacto | `cambio fuera de definicion/: CAMBIO-RAIZ` |
| Sintaxis Bash inválida | `bash -n` | `clonar.sh inválido` |
| URL/rama de `api` falsas | URL y rama derivadas del repo api | `M: repos.md incorrecto para api` |
| URL/rama de `front` falsas | URL y rama derivadas del repo front | `M: repos.md incorrecto para front` |
| Agregar un repo extra a la tabla | Exactamente api y front | `M: repos.md no lista exactamente api y front` |
| Quitar nodo api | Repositorio api aparece en flowchart | `M: api falta en diagrama` |
| Quitar nodo front | Repositorio front aparece en flowchart | `M: front falta en diagrama` |
| Quitar etiqueta de la flecha | Flecha front → api etiquetada | `M: flecha front → api sin etiqueta` |
| Omitir la conexión en la sección correspondiente | Conexión documentada con evidencia | `M: falta conexión front/API con evidencia en repos.md` |
| Suprimir la llamada `clonar "api" ...` | Comportamiento: reconstrucción de ambos repos | `no reconstruyó api` |
| Suprimir la llamada `clonar "front" ...` | Comportamiento: reconstrucción de ambos repos | `no reconstruyó front` |
| Clonar `orphan`, ausente de repos.md | Comportamiento inverso: ningún repo reconstruido puede quedar sin listar | `reconstruyó repos no listados: orphan` |

Cada variante se clona del fixture de referencia sin tocar la referencia, modifica un único aspecto y compara la lista exacta de motivos. También hay una variante válida con identificadores `FE` y `API_NODE`, etiquetas de nodo ampliadas y etiqueta de arista entre comillas. La referencia de `clonar.sh` sigue el esqueleto de la skill; las inclusiones se evalúan exclusivamente ejecutándolo. La prueba no ejecuta modelos.
