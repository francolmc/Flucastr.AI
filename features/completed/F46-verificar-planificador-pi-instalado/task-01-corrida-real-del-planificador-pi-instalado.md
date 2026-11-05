# task-01 — Corrida real del planificador con el Pi instalado
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Verifica con el Pi instalado, sin override de modelo ni de lanzador, que el `planificador` genera tareas que pasan `validar-tarea` tras F44 y F45. Las corridas previas usaron `openai/gpt-6-luna`; aquí el modelo lo resuelve `modelos.json` (`planificador`, nivel `medio`, perfil `pi-openai`, hoy `openai/gpt-6.1-sol`). Se ejecuta `bash pruebas/correr-planificador.sh pi` una sola vez y se documenta el veredicto y el modelo usado. Gasta créditos: solo con la frase «Franco autoriza la prueba real de F46».

## Contexto
- Leer: `pruebas/correr-planificador.sh`
- Tocar: `features/F46-verificar-planificador-pi-instalado/task-01-corrida-real-del-planificador-pi-instalado.md`
- `pruebas/correr-planificador.sh pi` hace la precondición de modelos, crea el fixture, lanza `pi-planificador` (instalado por `instalar.sh`, que ejecuta `pi --model` con el modelo de `scripts/resolver.mjs modelo planificador pi`) y escribe `pruebas/resultados/<fecha>-planificador-pi-<k>.md` con `Veredicto: OK` o `Veredicto: FALLA`; los rechazos de formato salen bajo `Formato ajeno a los topes`.
- Variables que NO deben estar definidas: `FLUCASTR_PI_BIN`, `FLUCASTR_PI_TOPE`, `FLUCASTR_SIN_PRECONDICION`. No se pasa `--model`.
- Solo se escribe el informe que genera el script y *Evidencia* y *Notas* de esta tarea.
- Exige red y sesión iniciada de `pi`; gasta tokens. Comando de corrida: no ejecutado, inferido.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: red, largo:900

## Decisiones ya tomadas
- Sin la frase «Franco autoriza la prueba real de F46» en el encargo: `BLOQUEO: rol=franco; motivo=entorno: falta la autorización de la prueba real de F46`, sin lanzar ninguna corrida.
- Si alguna de `FLUCASTR_PI_BIN`, `FLUCASTR_PI_TOPE` o `FLUCASTR_SIN_PRECONDICION` está definida, se corre con `env -u` para cada una; no se crea ningún envoltorio ni se pasa `--model`.
- No se ajustan prompts, skills, validador, topes ni agentes para obtener `OK`. Con `Veredicto: FALLA` o líneas bajo `Formato ajeno a los topes`, no se edita nada: la tarea queda `lista para revisión` con el informe en *Evidencia* y la causa en *Notas*; Franco decide si abre una feature aparte.
- Si la precondición de modelos falla (salida 2): `BLOQUEO: rol=franco; motivo=entorno: reinstalar los agentes`.
- Se corre una sola vez; solo Pi, no Claude Code.
- El modelo usado se confirma en el informe (o, si no consta, con `node scripts/resolver.mjs modelo planificador pi`) y se anota en *Notas*.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: una corrida de Pi y su informe, con el modelo identificado y el veredicto por tarea.
Fuera de alcance: Claude Code; editar agentes, skills, pruebas, scripts, `modelos.json` o definiciones; repetir hasta obtener `OK`; el commit.

## Pasos
1. Corre `git branch --show-current` y comprueba que el encargo trae la frase de autorización; si no, detente como indica *Decisiones ya tomadas*.
2. Corre `env -u FLUCASTR_PI_BIN -u FLUCASTR_PI_TOPE -u FLUCASTR_SIN_PRECONDICION bash pruebas/correr-planificador.sh pi` y anota la ruta del informe.
3. Corre `node scripts/resolver.mjs modelo planificador pi` y anota el modelo.
4. En *Evidencia* pega las salidas; en *Notas*, el modelo, la línea `Veredicto:`, el veredicto de `validar-tarea` por tarea y, si las hay, las líneas bajo `Formato ajeno a los topes` copiadas tal cual.

## Criterios de aceptación
1. Rama `chore/F46-verificar-planificador-pi-instalado` (comando 1).
2. La corrida terminó con código 0 e imprimió `informe:` (comando 2).
3. El comando 3 imprime `openai/gpt-6.1-sol` y el informe nuevo lo es de Pi (comando 4).
4. El informe tiene una línea `Veredicto:` con OK o FALLA y, si FALLA, la causa queda en *Notas* (comando 4).

## Verificación
```
git branch --show-current
env -u FLUCASTR_PI_BIN -u FLUCASTR_PI_TOPE -u FLUCASTR_SIN_PRECONDICION bash pruebas/correr-planificador.sh pi
node scripts/resolver.mjs modelo planificador pi
ls -t pruebas/resultados/*-planificador-pi-*.md | head -1 | xargs grep -h "^Veredicto:"
```
Esperado: rama `chore/F46-verificar-planificador-pi-instalado`; la corrida termina en 0 e imprime `informe: ` y `Veredicto:`; el tercer comando imprime `openai/gpt-6.1-sol`; el cuarto imprime una línea `Veredicto:`.

## Evidencia

```
$ git branch --show-current
chore/F46-verificar-planificador-pi-instalado
exit 0
```

```
$ env -u FLUCASTR_PI_BIN -u FLUCASTR_PI_TOPE -u FLUCASTR_SIN_PRECONDICION bash pruebas/correr-planificador.sh pi
modelos de agentes instalados vigentes
Warning: Invalid settings file /Users/franco/.pi/agent/settings.json: Expected double-quoted property name in JSON at position 453 (line 20 column 9)
informe: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/resultados/2026-11-05-planificador-pi-7.md
Veredicto: OK
exit 0
```

```
$ node scripts/resolver.mjs modelo planificador pi
openai/gpt-6.1-sol
exit 0
```

```
$ ls -t pruebas/resultados/*-planificador-pi-*.md | head -1 | xargs grep -h "^Veredicto:"
Veredicto: OK
exit 0
```

Contenido de `pruebas/resultados/2026-11-05-planificador-pi-7.md`:

```
# Planificador — pi

Veredicto: OK
Tareas: 1

Por tarea:
- task-01-cli-tiempos.md: pasos 4; archivos a leer 3; bytes de contexto 1679; archivos a tocar 2

Motivos:
- ninguno

Formato ajeno a los topes (aparte; no cambia el veredicto):
- ninguno
```

## Notas
- Decisión de Franco: letra B (segunda corrida real con captura de código de salida), autorizada con la frase literal «Franco autoriza la prueba real de F46». Cerrada en el encargo; se anota aquí.
- Corridas: la primera (`pruebas/resultados/2026-11-05-planificador-pi-6.md`, `Veredicto: OK`) no capturó el código de salida. La segunda (`pruebas/resultados/2026-11-05-planificador-pi-7.md`) es la única evidencia de esta tarea: el comando 2 se ejecutó sin tuberías con `; echo "exit $?"` y salió con `exit 0`. No se relanzó después de esta.
- Modelo usado (confirmado con `node scripts/resolver.mjs modelo planificador pi`): `openai/gpt-6.1-sol`. Corrida con Pi sin `--model`, sin `FLUCASTR_PI_BIN`, sin `FLUCASTR_PI_TOPE` ni `FLUCASTR_SIN_PRECONDICION`.
- Veredicto del informe pi-7: `Veredicto: OK`, `Tareas: 1`, `Motivos: ninguno`.
- Validador `validar-tarea` por tarea: `task-01-cli-tiempos.md` → OK (pasos 4; archivos a leer 3; bytes de contexto 1679; archivos a tocar 2). Rechazos: ninguno. `Formato ajeno a los topes`: `ninguno`.
- Diferencia entre corridas: en pi-6 "archivos a leer" era 2 y en pi-7 es 3, y los bytes de contexto cambiaron (1613 → 1679). Es variación del planificador entre corridas; el veredicto no cambió.
- Aviso sin efecto sobre el veredicto: `Warning: Invalid settings file /Users/franco/.pi/agent/settings.json` (JSON inválido, línea 20). No se leyó ni se tocó ese archivo.
- Nota de formato: el `$` de cada bloque de *Evidencia* lleva el comando exacto de *Verificación*. En la corrida del comando 2 se añadió `; echo "exit $?"`, y su salida es la última línea del bloque (`exit 0`).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=parcial; huecos=1; resultado=bloqueada; causa=parcial
Registro: n=2; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
