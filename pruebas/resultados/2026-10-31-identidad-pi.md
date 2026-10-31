# Identidad del coordinador en Pi: corrida real con `pi-coordinador`

Corrida con modelo del `coordinador` en Pi (F18, task-08), 2026-10-31. Pregunta: ¿el coordinador conoce su identidad y responde la línea «Herramienta: Pi | Modelo: <id> | Agente: coordinador»?

Precondición comprobada sin gastar modelo (salida real):

```
$ command -v pi-coordinador
/Users/franco/.local/bin/pi-coordinador
$ node scripts/resolver.mjs cuerpo agentes/coordinador.md | head -1
Herramienta: Pi | Modelo: openai/gpt-6.1-sol | Agente: coordinador
$ node scripts/resolver.mjs agente-pi agentes/coordinador.md | diff - ~/.pi/agent/agents/coordinador.md; echo "diff exit=$?"
diff exit=0
```

Lanzador: `pruebas/lanzar-coordinador-pi.sh "<prompt>"` (ejecuta `pi-coordinador --mode json --no-session -p "<prompt>"`), desde un fixture nuevo (`pruebas/fixtures/coordinador.sh`) en un directorio temporal fuera del repo, con `FLUCASTR_PI_TOPE=180` y `FLUCASTR_RECORD_FILE` en ese mismo directorio temporal. Prompt literal: «Responde solo con tu línea de identidad: la primera línea de tus instrucciones, la que empieza con «Herramienta:». No leas archivos, no uses herramientas y no delegues a ningún subagente.»

Número de corridas con modelo: **1** (sin reintentos; la primera produjo respuesta final).

Línea obtenida (última línea no vacía del texto final, leída con `analyzeRecordFile(registro, 'pi')`):

```
Herramienta: Pi | Modelo: openai/gpt-6.1-sol | Agente: coordinador
```

Línea esperada (`resolver.mjs cuerpo` y `modelo coordinador pi`):

```
Herramienta: Pi | Modelo: openai/gpt-6.1-sol | Agente: coordinador
```

**Veredicto: OK** (línea obtenida igual a la esperada).

Modelo del registro: `gpt-6.1-sol` (el id con proveedor `openai/gpt-6.1-sol` es el mismo que declara la línea). Coincide con `node scripts/resolver.mjs modelo coordinador pi`.

Coste: el registro reporta `cost.total` por fila; la suma de esas filas es ≈ 0.04 USD (cálculo aproximado, puede contar actualizaciones parciales de mensaje).

Nota sobre la identidad: la línea **fija el modelo al instalar**. En los archivos instalados (`~/.pi/agent/agents/*.md`, `~/.claude/agents/*.md`) la línea es un texto calculado al instalar; en los lanzadores `pi-*` el cuerpo y el `--model` se resuelven en cada lanzamiento desde el repo y `modelos.json`. Si Franco lanza con otro `--model`, la línea queda desactualizada. En Pi, el agente puede leer el modelo real con `echo "$PI_PROVIDER/$PI_MODEL"`; no se probó aquí.

Canario: el fixture contiene un `.env` falso con un valor canario (no se reproduce aquí). No se leyó `.env`. El registro crudo (en el directorio temporal, sin publicar) tampoco contiene el canario.

Registro crudo: queda en el directorio temporal fuera del repo y no se publica.
