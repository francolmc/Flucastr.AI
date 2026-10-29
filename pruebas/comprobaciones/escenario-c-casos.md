# Escenario C: referencia y casos adversos

Ejecutar `node --test pruebas/comprobaciones/escenario-c.test.mjs`. La referencia obtiene las URL y ramas desde los repos del fixture; `worker` no tiene remoto. `clonar.sh` conserva el esqueleto de `generar-clonar/SKILL.md`, con `# FALTA URL: worker` (se permite texto adicional en el comentario) y aviso, y el arnés reconstruye únicamente `api`, `front` e `infra`. La instantánea es la compartida de `instantanea.mjs`.

| Variante (una sola violación) | Comprobación dura | Motivo esperado |
|---|---|---|
| Añadir URL remota a worker en `repos.md` | No inventar remoto de worker | `C: URL inventada para worker` |
| Quitar `# FALTA URL: worker` | Comentario requerido por la skill | `C: falta # FALTA URL: worker` |
| Quitar auth de «Datos que faltan» | Declarar componente faltante | `C: auth ausente de «Datos que faltan»` |
| Dibujar auth sin marca de pendiente | No representarlo como confirmado | `C: auth dibujado como confirmado` |
| Omitir infra de `repos.md` | Listar todo repo en disco | `C: repo en disco ausente de repos.md: infra` |
| Añadir nodos hasta exceder el límite | Máximo 12 nodos por diagrama | `C: diagrama supera 12 nodos` |
| Quitar etiqueta a una flecha | Etiquetar todos los flujos | `C: flecha sin etiqueta` |

También se comprueban variantes válidas: identificadores Mermaid distintos de los nombres de repo pero con etiquetas descriptivas; texto adicional tras `# FALTA URL: worker`; auth en el diagrama con etiqueta «pendiente, no confirmado»; vista general más detalle en diagramas separados; y `Modo: actual. Estado: borrador.` en los tres documentos. Cada control negativo compara exactamente el motivo esperado. El parser de Mermaid utilizado es el compartido por los escenarios; no se analiza toda la gramática Mermaid, sino las formas cubiertas por el analizador (nodos rectangulares y flechas etiquetadas/descritas en las pruebas comunes).
