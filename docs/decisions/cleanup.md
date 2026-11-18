# Decisión de limpieza y tamaño

## Inventario de copias duplicadas

Las copias de compatibilidad enumeradas abajo son duplicados intencionales: consumidores instalados y rutas públicas todavía usan ambas ubicaciones. No se elimina ninguna. El manifiesto `tools/core-compatibility.json` es el inventario autoritativo; cada par fue revisado y el comprobador compara rutas, contenido y permisos ejecutables.

| Ruta nueva (`core/`) | Ruta compatible conservada | Motivo y consumidor |
| --- |
| `core/contracts/verificacion.md` | `nucleo/contrato/verificacion.md` | Contrato referenciado por los proyectos e instrucciones del kit. |
| `core/agents/constructor.md` | `agentes/constructor.md` | Ruta heredada del agente constructor. |
| `core/agents/principal.md` | `agentes/principal.md` | Ruta heredada del agente principal. |
| `core/skills/define-project/SKILL.md` | `skills/definir-proyecto/SKILL.md` | Nombre y ruta de la skill publicada. |
| `core/skills/diagnose/SKILL.md` | `skills/diagnosticar/SKILL.md` | Nombre y ruta de la skill publicada. |
| `core/skills/diagnose/diagnosticar.mjs` | `skills/diagnosticar/diagnosticar.mjs` | Entrypoint llamado por instrucciones y pruebas. |
| `core/skills/diagnose/fingerprint.mjs` | `skills/diagnosticar/fingerprint.mjs` | Módulo local importado por el entrypoint. |
| `core/skills/diagnose/result.mjs` | `skills/diagnosticar/result.mjs` | Módulo local importado por el entrypoint. |
| `core/skills/design-experience/SKILL.md` | `skills/disenar-experiencia/SKILL.md` | Nombre y ruta de la skill publicada. |
| `core/skills/execute-plan/SKILL.md` | `skills/ejecutar-plan/SKILL.md` | Nombre y ruta de la skill publicada. |
| `core/skills/migrate-project/SKILL.md` | `skills/migrar-proyecto/SKILL.md` | Nombre y ruta de la skill publicada. |
| `core/skills/plan-change/SKILL.md` | `skills/planificar-cambio/SKILL.md` | Nombre y ruta de la skill publicada. |
| `core/skills/prepare-project/SKILL.md` | `skills/preparar-proyecto/SKILL.md` | Nombre y ruta de la skill publicada. |
| `core/skills/prepare-project/referencia.md` | `skills/preparar-proyecto/referencia.md` | Referencia local de la skill publicada. |
| `core/recipes/node-pnpm.md` | `nucleo/recetas/node-pnpm.md` | Receta consumida por el contrato del kit. |

El archivo fuente del inventario tiene 15 pares. La búsqueda de consumidores se hizo con `rg -n 'core-compatibility|core/|nucleo/|agentes/|skills/' tools/verify verify tools/core-compatibility.json docs/decisions/structure.md`; el consumidor ejecutable del chequeo es `tools/verify/models.sh`, cargado por `./verify`. `node tools/verify/core-compatibility.mjs` terminó con código 0. El mismo control se mantiene integrado en `./verify`; no se cambió su orden ni sus mensajes.

## Archivos de más de 300 líneas

El inventario se obtuvo con `find` y `wc -l`, excluyendo `.git/`, `old/v1/registro/` y `pruebas/.temporales/`. Se conservaron los archivos históricos y evidencias; no se encontraron motivos suficientes para borrar ni moverlos.

| Líneas | Archivo | Clasificación y razón de conservación |
| ---: | --- |
| 1001 | `scripts/resolver.mjs` | Entrypoint con consumidores en instalador, comandos y adaptadores; las extracciones previas mantienen esa ruta pública. |
| 420 | `install.sh` | Instalador público invocado y documentado por el kit. |
| 322 | `install-remote.sh` | Excepción por contrato: bootstrap distribuido y ejecutado antes de descargar `tools/`; extraer dependencias rompería ese flujo (ver tramo 100). |
| 318 | `scripts/usage.mjs` | CLI pública; conserva análisis de argumentos y coordinación mientras las operaciones viven en `tools/usage/` (ver `structure.md`). |
| 428 | `pruebas/kit-run/probar.mjs` | Runner de pruebas invocado por la verificación de `kit run`; contiene escenarios y aserciones activas. |
| 319 | `pruebas/uso/probar.mjs` | Runner de pruebas de `scripts/usage.mjs`, invocado por la verificación de uso. |
| 360 | `pruebas/revisor-luna/medir.mjs` | Harness de evaluación reproducible; documentado bajo `evals/` y mantenido como herramienta de medición. |
| 313 | `cambios/estructura-repo/comprobar-a3.py` | Harness de auditoría y evidencia del cambio actual; no es módulo del producto. |
| 747 | `cambios/estructura-repo/plan.md` | Índice y evidencia acumulada del cambio; conservar para revisión. |
| 1947 | `cambios/estructura-repo/ocurrencias-ruta.txt` | Captura de búsqueda previa que sustenta la auditoría. |
| 1602 | `cambios/estructura-repo/matriz-instalador.txt` | Evidencia de caracterización del instalador. |
| 1216 | `cambios/estructura-repo/tramo-97-antes.txt`, `tramo-97-despues.txt`, `tramo-98-antes.txt`, `tramo-98-despues.txt`, `tramo-96-captura.txt` | Capturas comparativas guardadas para trazabilidad. |
| 917 | `cambios/estructura-repo/matriz-instalador-inicial.txt` | Evidencia de caracterización del instalador. |
| 560 | `cambios/estructura-repo/matriz-instalador-parcial.txt` | Evidencia parcial preservada del mismo análisis. |
| 337 | `cambios/estructura-repo/constructores-ruta.txt` | Captura de consumidores y constructores de rutas. |
| 2155 | `old/v1/reporte_finanzas.txt` | Archivo histórico protegido; no editar ni trasladar. |
| 1762 | `old/v1/reporte_memoria.txt` | Archivo histórico protegido; no editar ni trasladar. |
| 1125 | `old/v1/reporte.txt` | Archivo histórico protegido; no editar ni trasladar. |
| 1139 | `old/v1/pruebas/comprobaciones/consumo.test.mjs` | Prueba histórica protegida. |
| 951 | `old/v1/scripts/consumo.mjs` | Script histórico protegido. |
| 651 | `old/v1/scripts/registrar.mjs` | Script histórico protegido. |
| 554 | `old/v1/definitions/ARCHITECTURE.md` | Documento histórico protegido. |
| 508 | `old/v1/pruebas/capa1/registrar.test.mjs` | Prueba histórica protegida. |
| 468 | `old/v1/pruebas/comprobaciones/validar-tarea.test.mjs` | Prueba histórica protegida. |
| 443 | `old/v1/definitions/INVESTIGACION.md` | Documento histórico protegido. |
| 428 | `old/v1/pruebas/capa1/remoto.test.mjs` | Prueba histórica protegida. |
| 418 | `old/v1/scripts/informe.mjs` | Script histórico protegido. |
| 380 | `old/v1/pruebas/comprobaciones/formato-evidencia.test.mjs` | Prueba histórica protegida. |
| 366 | `old/v1/pruebas/fixtures/regresion-f24-f29.json` | Fixture histórico protegido. |
| 359 | `old/v1/pruebas/comprobaciones/formato-presupuesto.test.mjs` | Prueba histórica protegida. |
| 351 | `old/v1/scripts/archivar.mjs` | Script histórico protegido. |
| 337 | `old/v1/pruebas/capa1/hook-claude.test.mjs` | Prueba histórica protegida. |
| 324 | `old/v1/pruebas/comprobaciones/archivar.test.mjs` | Prueba histórica protegida. |
| 310 | `old/v1/pruebas/capa1/compactacion.test.mjs` | Prueba histórica protegida. |
| 308 | `old/v1/README.md` | Documento histórico protegido. |
| 301 | `old/v1/definitions/WORKFLOW.md` | Documento histórico protegido. |

Comandos reproducibles usados para localizar consumidores y tamaños:

```sh
rg -n 'core-compatibility|core/|nucleo/|agentes/|skills/' tools/verify verify tools/core-compatibility.json docs/decisions/structure.md
find . -path './.git' -prune -o -path './old/v1/registro' -prune -o -path './pruebas/.temporales' -prune -o -type f -print | awk 'BEGIN{FS="/"} $NF !~ /^\.env/ && $NF !~ /(secret|credential|key)/ {print}' | while IFS= read -r f; do n=$(wc -l < "$f" 2>/dev/null) || continue; if [ "$n" -gt 300 ]; then printf '%6s %s\n' "$n" "$f"; fi; done | sort -nr | head -100
node tools/verify/core-compatibility.mjs
```

El inventario de tamaño no abre ni inspecciona `pruebas/.temporales/`; la ruta se excluye antes de descender en `find`. No se eliminó, movió ni modificó contenido histórico. Para las copias de compatibilidad, se verificaron los 15 pares con el comprobador; no se accedió a temporales ni se alteraron pruebas.
