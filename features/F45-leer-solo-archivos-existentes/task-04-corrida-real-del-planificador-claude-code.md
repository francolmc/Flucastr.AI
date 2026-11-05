# task-04 — Corrida real del planificador con claude-code
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
Comprueba con el modelo real que, con la skill y el mensaje nuevos, el planificador de claude-code ya no pone en `Leer` archivos inexistentes. Gasta créditos: solo se ejecuta si el encargo trae la frase literal «Franco autoriza la prueba real de F45»; sin ella, el constructor se detiene antes de lanzar nada.

## Contexto
- Tocar: `features/F45-leer-solo-archivos-existentes/task-04-corrida-real-del-planificador-claude-code.md`
- `bash pruebas/correr-planificador.sh claude-code` hace la precondición de modelos, crea el fixture, lanza al planificador y escribe `pruebas/resultados/<fecha>-planificador-claude-code-<k>.md` con `Veredicto: OK` o `Veredicto: FALLA`; imprime `informe: <ruta>`.
- Referencia: `pruebas/resultados/2026-11-05-planificador-claude-code-6.md` falló por `El archivo de Leer no se puede leer: src/cli.js`.
- Solo se escriben el informe que genera el script y *Evidencia* y *Notas* de esta tarea.
- Exige red y sesión iniciada de `claude`; gasta tokens.
- Fuente: ninguna
- Requiere: red, largo:900

## Decisiones ya tomadas
- Sin la frase «Franco autoriza la prueba real de F45» en el encargo: `BLOQUEO: rol=franco; motivo=entorno: falta la autorización de la prueba real de F45`, sin lanzar ninguna corrida.
- Si la precondición de modelos falla (salida 2): `BLOQUEO: rol=franco; motivo=entorno: reinstalar los agentes`.
- No se ajustan prompts, skills, validador ni topes para obtener `OK`. Con `Veredicto: FALLA`, no se edita nada: la tarea queda `lista para revisión` con el informe en *Evidencia* y la causa en *Notas*; Franco decide.
- Se corre una sola vez.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: una corrida y su informe.
Fuera de alcance: editar agentes, skills, pruebas, scripts o definiciones; repetir hasta obtener `OK`; correr `pi`; el commit.

## Pasos
1. Corre `git branch --show-current` y comprueba que el encargo trae la frase de autorización; si no, detente como indica *Decisiones ya tomadas*.
2. Corre `bash pruebas/correr-planificador.sh claude-code` y anota la ruta del informe.
3. En *Evidencia* pega la salida; en *Notas*, la línea `Veredicto:` y, si hay motivos, cópialos tal cual.

## Criterios de aceptación
1. Rama `fix/F45-leer-solo-archivos-existentes` (comando 1).
2. La corrida terminó con código 0 e imprimió `informe:` (comando 2).
3. El informe nuevo no contiene «Leer no se puede leer» (comando 3 imprime `0`).

## Verificación
```
git branch --show-current
bash pruebas/correr-planificador.sh claude-code
ls -t pruebas/resultados/*-planificador-claude-code-*.md | head -1 | xargs grep -c "Leer no se puede leer"
```
Esperado: rama `fix/F45-leer-solo-archivos-existentes`; la corrida termina en 0 e imprime `informe: ` y `Veredicto:`; el último comando imprime `0`.

## Evidencia

```
$ git branch --show-current
fix/F45-leer-solo-archivos-existentes
exit 0

$ bash pruebas/correr-planificador.sh claude-code
modelos de agentes instalados vigentes
informe: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/resultados/2026-11-05-planificador-claude-code-7.md
Veredicto: OK
exit 0

$ ls -t pruebas/resultados/*-planificador-claude-code-*.md | head -1 | xargs grep -c "Leer no se puede leer"
0
exit 1
```

Contenido del informe `pruebas/resultados/2026-11-05-planificador-claude-code-7.md` (352 bytes):

# Planificador — claude-code

Veredicto: OK
Tareas: 2

Por tarea:
- task-01-cli-tiempos.md: pasos 5; archivos a leer 1; bytes de contexto 1062; archivos a tocar 1
- task-02-pruebas-cli.md: pasos 5; archivos a leer 1; bytes de contexto 551; archivos a tocar 1

Motivos:
- ninguno

Formato ajeno a los topes (aparte; no cambia el veredicto):
- ninguno

## Notas

Veredicto: OK. Motivos: ninguno.

Nota: el último comando sale con código 1 porque `grep -c` sale 1 cuando el conteo es 0; imprime `0`, que es lo que pide el criterio 3.

Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
