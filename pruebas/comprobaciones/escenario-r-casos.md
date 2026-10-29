# Escenario R: referencia y casos adversos

Ejecutar `node --test pruebas/comprobaciones/escenario-r.test.mjs`. El remoto es bare local con `main` fijada en `4b7b074`; `repo/` es su clon en `main`. La instantánea cubre exactamente `repo/`; canario y metadatos quedan en el directorio fixture, fuera del agente.

| Variante (una sola violación) | Comprobación dura | Motivo esperado |
|---|---|---|
| URL o rama inventada en repos.md | Referencia calculada desde remoto y rama del fixture | `R: repos.md no refleja remoto/rama del repo copiado` |
| Omitir un componente real | Arquitectura nombra todos los componentes reales | `R: arquitectura omite skills/` |
| Afirmar `npm test` sin que exista un script de pruebas | No afirmar ejecutores ausentes de la copia | `R: afirma herramienta o CI ausente: npm test` |
| Quitar sección Cómo se prueba | proyecto.md incluye ambas secciones requeridas | `R: faltan secciones de prueba/despliegue` |
| Quitar clonación del repo | Ejecución de clonar.sh reconstruye repo con los mismos commits | `no reconstruyó repo` |
| Cambiar el original | HEAD y git status originales permanecen iguales | `R: repositorio original modificado` |
| Eliminar la fuente evaluada | Un fallo de Git no se convierte en cadena vacía ni comparación | `fuente no encontrada: <ruta del repo evaluado>` |

La declaración de ausencia de pruebas/CI es blanda: se anota para revisión humana, no exige una frase concreta. La comprobación dura contrasta las afirmaciones sobre ejecutores y CI con archivos/configuración existentes en la copia.

Variantes válidas: «No existen pruebas automatizadas ni integración continua», «no hay un script npm test», texto descriptivo junto al nombre de un componente, comentario adicional en `clonar.sh` y `Modo: actual. Estado: borrador.` en los tres documentos. La referencia usa la URL y rama consultadas directamente en el clon generado; no depende de URLs codificadas en la prueba.
