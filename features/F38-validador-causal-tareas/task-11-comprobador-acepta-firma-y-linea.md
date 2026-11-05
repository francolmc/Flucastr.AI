# task-11 — El comprobador del hook acepta la firma `bloque-abierto` y una línea
repo: Flucastr.AI   depende_de: task-07   estado: hecha

## Descripción
En la corrida real de task-08 el hook sí disparó en `danada` (el modelo citó la firma `bloque-abierto|…` y la línea 32), pero el comprobador exigía la frase literal «bloque de código abierto en línea» y el modelo la parafrasea, así que `danada` dio FALLA. Se cambia `hook-resultado.mjs` para que la señal de que el hook disparó sea: la frase literal, o bien la firma `bloque-abierto` más un número de línea en el registro. Los controles negativos siguen vivos. Después se repite task-08.

## Contexto
- Fuente: definitions/AUDITORIA.md «2.7 Documento de tarea dañado: quién repara»
- Tocar: `pruebas/comprobaciones/hook-resultado.mjs`, `pruebas/correr-hook.test.mjs`
- Requiere: runtime:node@25
- En `pruebas/comprobaciones/hook-resultado.mjs`: la constante `MENSAJE_BLOQUE = 'bloque de código abierto en línea'` (línea 7) y en `evaluarEscenario` la línea `const bloqueo = registro.includes(MENSAJE_BLOQUE);`. `bloqueo` lo usan los escenarios `danada` (`ok = bloqueo`), `valida` (`!bloqueo && existe`), `sin-hook` (`!bloqueo`) y `subagente` (`bloqueo && llamo`).
- Los hallazgos hoy dicen «el registro menciona el bloque de código abierto» / «sin mención del bloque de código abierto»; se conservan tal cual.
- En `pruebas/correr-hook.test.mjs`: el `claude` simulado (`CLAUDE_SIMULADO`, líneas 24-45) usa `SIM_MODO` (`correcto`, `sin-bloqueo`, `con-bloqueo`) y la línea 41 emite el `tool_result` con el mensaje literal «Hay un bloque de código abierto en línea 27…» cuando `mostrar=1`; las pruebas (2) a (6) están en las líneas 86-117 y `correrTodos(modo)` corre los cuatro escenarios.
- Forma real de la firma (informe `pruebas/resultados/2026-11-05-hook-claude-code-2.md`): `bloque-abierto|…/danada/features/F99-demo/task-01-x.md|7e8eb467ab13`; el modelo la cita junto con «línea 32».
- Verificación sin modelo real, sin red y sin `/tmp`; el simulado vive en `pruebas/.temporales/`.

## Decisiones ya tomadas
- Señal de disparo = `registro.includes('bloque de código abierto en línea')` O (`/bloque-abierto/.test(registro)` Y `/(l[ií]nea|line)\s*\d+/i.test(registro)`). Ambas condiciones de la segunda rama se evalúan sobre el registro completo.
- Solo se cambia la forma de calcular `bloqueo`; los veredictos por escenario, los hallazgos y el formato del informe no cambian.
- Controles negativos obligatorios: sin hook, sin firma y sin frase = FALLA en `danada` y `subagente`; la firma sin número de línea ni frase = FALLA; `valida` y `sin-hook` siguen dando FALLA si hay señal y OK si no la hay.
- En el simulado, el modo nuevo `parafrasis` emite en `danada`/`subagente` un texto del asistente del tipo «El hook bloqueó: firma bloque-abierto|x|abc123 en la línea 32» (sin la frase literal) y ningún `tool_result` con el mensaje; el modo `firma-sin-linea` emite solo «firma bloque-abierto|x|abc123» sin número de línea ni frase.
- No se modifica `pruebas/correr-hook.sh`, el hook, ni task-08.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: el cálculo de `bloqueo` en `hook-resultado.mjs` y dos modos nuevos del simulado con sus pruebas.
Fuera de alcance: `pruebas/correr-hook.sh`, el hook y el validador, la corrida real (task-08), `definitions/` y cualquier cambio a `agentes/coordinador.md`.

## Pasos
1. En `pruebas/comprobaciones/hook-resultado.mjs`, reemplaza `const bloqueo = registro.includes(MENSAJE_BLOQUE);` por una función `disparoHook(registro)` que aplique la señal de *Decisiones ya tomadas* (agrega las dos expresiones regulares como constantes junto a `MENSAJE_BLOQUE`) y úsala para `bloqueo`.
2. En `pruebas/correr-hook.test.mjs`, agrega al simulado los modos `parafrasis` y `firma-sin-linea` según *Decisiones ya tomadas* (en ambos, `danada` y `subagente` no emiten el mensaje literal).
3. Agrega la prueba (7): con `parafrasis`, `informe` imprime «Veredicto: OK».
4. Agrega la prueba (8): con `firma-sin-linea`, el informe dice «Veredicto: FALLA» y `danada` aparece como FALLA.
5. Comprueba que las pruebas (1) a (6) existentes siguen pasando sin cambios.

## Criterios de aceptación
1. Con el simulado `parafrasis`, `informe` imprime «Veredicto: OK». Se comprueba en la prueba (7).
2. Con `firma-sin-linea`, `danada` da FALLA. Se comprueba en la prueba (8).
3. Los controles negativos existentes (2), (3), (4) siguen dando FALLA. Se comprueba con `node --test`.
4. `grep -c "bloque-abierto" pruebas/comprobaciones/hook-resultado.mjs` imprime un número mayor que 0.

## Verificación
```
git branch --show-current
node --test pruebas/correr-hook.test.mjs
grep -c "bloque-abierto" pruebas/comprobaciones/hook-resultado.mjs
```
Esperado: primera salida `fix/F38-validador-causal-tareas`; la prueba con `fail 0` (ocho pruebas); el `grep` imprime un número mayor que 0.

## Evidencia

```
$ git branch --show-current
fix/F38-validador-causal-tareas
exit 0
```

```
$ node --test pruebas/correr-hook.test.mjs
✔ (1) con el simulado correcto, informe imprime Veredicto: OK y crea el informe
✔ (2) control negativo: un simulado que no menciona el bloqueo hace FALLA en danada
✔ (3) control negativo: un simulado que menciona el bloqueo en valida hace FALLA en valida
✔ (4) control negativo: sin .jsonl el escenario es FALLA
✔ (5) un escenario desconocido sale con 2
✔ (6) una herramienta desconocida sale con 2
✔ (7) con el simulado parafrasis (firma y línea, sin la frase literal), informe imprime Veredicto: OK
✔ (8) control negativo: con firma-sin-linea (sin línea ni frase), danada da FALLA
ℹ tests 8
ℹ pass 8
ℹ fail 0
exit 0
```

```
$ grep -c "bloque-abierto" pruebas/comprobaciones/hook-resultado.mjs
2
exit 0
```

## Notas
- Huecos menores: ninguno. La señal de disparo es la de *Decisiones ya tomadas* (frase literal, o `bloque-abierto` más `línea|line N` sobre el registro completo), implementada en `disparoHook()`.
- La primera corrida de `node --test` salió por una tubería con `tail` solo para revisar; la pasada oficial de *Verificación* es la de *Evidencia*.
- Criterio 4: el `grep` da 2 (la constante `FIRMA_BLOQUE` y la línea de comentario de `disparoHook`).
Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
