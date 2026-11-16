# Matrices de caracterización

Estas matrices se ejecutan únicamente dentro del aislamiento de [aislamiento.md](aislamiento.md), después de aprobar el plan. Son casos mínimos, no resultados anticipados. Cada caso parte de una copia limpia del fixture; guardar por separado argumentos, código, stdout, stderr y manifiesto recursivo (ruta, tipo, permisos, destino de enlace y hash de archivos regulares). Comparar con la captura previa del mismo caso y mismo entorno. Sustituir solo la raíz temporal exacta por `<TEMP>`; no normalizar tiempos ni mensajes para ocultar diferencias. Mantener fuera del repositorio los archivos temporales y no incluir credenciales en la evidencia.

## Resolver (tramo 27)

Usar `node scripts/resolver.mjs`, `modelos.json` del checkout y archivos sintéticos bajo `<TEMP>`; para configuraciones alternativas usar `FLUCASTR_MODELOS=<TEMP>/modelos.json`. Registrar una ejecución exitosa y una fallida por cada rama siguiente, además de aridad incorrecta:

| Despacho | Casos mínimos |
| --- | --- |
| `modelo`, `modelo-esfuerzo`, `revisor` | `principal` y `constructor`, herramientas `claude-code`, `pi`, `codex`; agente y herramienta inexistentes; archivo de modelos ausente y JSON inválido. |
| `esfuerzo`, `compactar-codex` | ambos agentes; `esfuerzo constructor codex`; esfuerzo `max`, ausente e inválido; umbral ausente. |
| `agente-claude`, `agente-pi`, `agente-codex`, `instrucciones-codex`, `cuerpo` | agente real copiado a fixture; archivo ausente, nombre distinto, encabezado inválido y campos reservados. |
| `fijar-agente`, `quitar-agente` | ajustes ausentes, mismo agente, agente ajeno, `--sobrescribir`, JSON inválido; quitar el propio y el ajeno. |
| `comparar-modelos` | archivos iguales; versión, agente, perfil y campos nuevos; JSON inválido. |
| `fijar-compactacion`, `quitar-compactacion` para Pi y Claude | ajustes vacíos, valores propios y ajenos; simulación, aplicación, repetición y eliminación selectiva; parámetros inválidos. |
| `fijar-hook`, `quitar-hook`, `fijar-deny`, `quitar-deny`, `fijar-sandbox`, `quitar-sandbox` para Claude | archivo ausente y ajustes ajenos; simulación donde se admite, aplicación, repetición y eliminación selectiva; JSON inválido. |
| `fijar-deny`, `quitar-deny` para Codex | archivo ausente, marcado por el kit y archivo ajeno; con y sin AGENTS sintético, simulación y repetición. |
| orden desconocida | sin argumentos y orden inexistente; error y ausencia de escrituras. |

En cada familia mutadora comparar el árbol antes y después de simulación y errores; registrar cualquier efecto original y exigir la misma conducta tras cada extracción. Una simulación no debe modificar archivos. Para el resto comparar exactamente contra la captura original, sin suponer un código genérico de error. Complementar con `./verify`, cuyas pruebas existentes cubren los contratos instalados.

## Kit run (tramo 48)

Ejecutar `node --test pruebas/aceptacion/kit-run.test.mjs` y `node pruebas/kit-run/probar.mjs`. La suite construye repos y ejecutables falsos sin modelos ni red; conservar sus aserciones de invocaciones y estado. Registrar su resultado antes de extraer y repetirlo al conectar módulos. En un arnés adicional temporal, capturar código, flujos, argumentos, directorio, stdin y árbol final para: aprobación; constructor que falla; verify que falla; revisor que rechaza y posterior reintento; timeout; revisor que intenta escribir; plan y opción inválidos. Cada proceso falso debe dejar un registro JSONL fuera del árbol observado. Si una rama no puede reproducirse con el arnés existente, crear el fixture en el propio tramo 48 antes de tomar la referencia, sin alterar aceptación.

## Instalador (tramo 56)

Para cada caso crear HOME y proyecto nuevos dentro del aislamiento, con ejecutables falsos de Claude, Pi y Codex en PATH y sin acceso a sus configuraciones reales. Capturar antes y después el árbol de HOME y proyecto. Ejecutar `bash instalar.sh --simular`, y luego `bash instalar.sh` en fixture nuevo para cada una de estas variantes: sin filtro; `--solo claude`, `--solo pi`, `--solo codex`; cada variante con `--copiar`; y herramienta ausente. Repetir instalación sobre el mismo fixture y ejecutar `bash desinstalar.sh`; comparar conservación de archivos y ajustes ajenos. Repetir con `--proyecto <TEMP>/project`, y con `--solo pi --proyecto <TEMP>/project --skills-proyecto`; incorporar configuraciones ajenas anteriores. Probar `--migrar <TEMP>/project --simular` y `--migrar <TEMP>/project` en proyectos v1 sintéticos, con y sin Git. Probar argumentos inválidos, `--solo` inválido y combinaciones prohibidas (`--migrar` con `--proyecto`, `--copiar`, `--solo`, `--agente` o `--skills-proyecto`; `--skills-proyecto` con `--solo claude` o `codex`). En simulaciones y rechazos exigir árbol idéntico. Complementar con las pruebas de instalación, migración y desinstalación que `verify` ejecuta; no sustituirlas por esta matriz.

## Bootstrap remoto (tramo 99)

Crear `<TEMP>/origin/sha` con 40 caracteres hexadecimales y `<TEMP>/origin/kit.tar.gz` como paquete sintético con la misma estructura que espera el instalador. Usar `HOME=<TEMP>/home FLUCASTR_ORIGEN=<TEMP>/origin bash instalar-remoto.sh`, sin red, partiendo de HOME nuevo por caso. Capturar `--mostrar-urls`, `--estado`, instalación inicial, repetición al día y actualización con otro SHA y paquete. Probar `--actualizar` sin instalación, referencia inválida, SHA ausente o inválido, tar ausente o ilegible y paquetes con ruta absoluta, `..`, enlace simbólico y enlace duro. Para cada rechazo conservar el árbol y versión previos; si el comportamiento original cambia algún archivo temporal, registrar exactamente ese efecto como referencia y exigir que no cambie la instalación válida. Usar paquetes creados exclusivamente con contenido sintético. Las URLs son salida del programa, no se consultan.

## Comparación continua

El tramo que introduzca una excepción aprobada al texto registra el cambio exacto y su razón; las posteriores comparaciones aplican esa lista explícita, no una regla de borrado general. Cada extracción vuelve a correr los casos de la familia afectada y los casos negativos, además de la verificación y simulación completas. Si el resultado depende de fechas, rutas o duración no controladas, fijar la entrada o detenerse y documentar la variación: no aceptar una comparación indeterminada.
