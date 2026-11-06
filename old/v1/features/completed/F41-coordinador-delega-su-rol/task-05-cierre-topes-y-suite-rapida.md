# task-05 — Cierre de F41 antes del modelo real: topes y suite rápida en verde
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
Comprueba que ningún archivo con tope lo supera, que la regla de rol sigue en su lugar y que `bash pruebas/rapida.sh` termina en 0 (tope 90 s). Es solo verificación; un fallo se corrige en la tarea que lo causó. Es la última tarea sin costo: la siguiente gasta créditos.

## Contexto
- Tocar: `features/F41-coordinador-delega-su-rol/task-05-cierre-topes-y-suite-rapida.md`
- Solo se escribe *Evidencia* y *Notas* de esta tarea; ningún archivo de producto.
- Topes en bytes: `agentes/coordinador.md` 7155 (F41 no lo hace crecer), `skills/comandos-coordinador/SKILL.md` 5120, `skills/control-consumo/SKILL.md` 4096, `skills/modo-yolo/SKILL.md` 5120.
- `bash pruebas/rapida.sh` imprime al final `rapida: N archivos en S s (tope 90 s)`.
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- La especificación es la viñeta «Alcance de F41 (Franco, 2026-11-04)» de esa sección.
- Requiere: largo:90

## Decisiones ya tomadas
- No se editan archivos de producto; un fallo se informa con `BLOQUEO:` y la tarea causante.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: correr las comprobaciones y dejar la evidencia.
Fuera de alcance: editar agentes, skills, pruebas o definiciones; la corrida con modelo real (task-06); el commit.

## Pasos
1. Corre `git branch --show-current`.
2. Corre los `wc -c` y compáralos con los topes.
3. Corre el `grep` de la regla.
4. Corre `bash pruebas/rapida.sh` y copia sus últimas líneas.

## Criterios de aceptación
1. La rama activa es `fix/F41-coordinador-delega-su-rol` (comando 1).
2. Los cuatro archivos están dentro de su tope (comandos 2 a 5).
3. La regla de rol sigue en la skill y el puntero en el prompt (comando 6).
4. La suite rápida termina en 0 (comando 7).

## Verificación
Comando 1:
```
git branch --show-current
```
Esperado: `fix/F41-coordinador-delega-su-rol`.

Comando 2:
```
wc -c agentes/coordinador.md
```
Esperado: un número menor o igual a 7155.

Comando 3:
```
wc -c skills/comandos-coordinador/SKILL.md
```
Esperado: un número menor o igual a 5120.

Comando 4:
```
wc -c skills/control-consumo/SKILL.md
```
Esperado: un número menor o igual a 4096.

Comando 5:
```
wc -c skills/modo-yolo/SKILL.md
```
Esperado: un número menor o igual a 5120.

Comando 6:
```
grep -c -E 'Franco hace solo lo suyo|antes de pedirle algo a Franco' agentes/coordinador.md skills/comandos-coordinador/SKILL.md
```
Esperado: `agentes/coordinador.md:1` y `skills/comandos-coordinador/SKILL.md:1`.

Comando 7:
```
bash pruebas/rapida.sh; echo "salida=$?"
```
Esperado: la última línea es `salida=0` y la anterior `rapida: N archivos en S s (tope 90 s)` con S menor o igual a 90.

## Evidencia
Verificación completa corrida una vez (intentos=1), desde cero. Los comandos 1 a 7 cumplen: los cuatro archivos están dentro de su tope, la regla de rol está en la skill y el puntero en el prompt, y la suite rápida termina en 0 con 760 tests en verde. Línea final del script, con la plantilla literal `rapida: N archivos en S s (tope 90 s)`: `rapida: 53 archivos en 36 s (tope 90 s)`, con S = 36 menor o igual a 90.

Comando 1:
```
$ git branch --show-current
fix/F41-coordinador-delega-su-rol
exit 0
```

Comando 2:
```
$ wc -c agentes/coordinador.md
    7155 agentes/coordinador.md
exit 0
```

Comando 3:
```
$ wc -c skills/comandos-coordinador/SKILL.md
    3508 skills/comandos-coordinador/SKILL.md
exit 0
```

Comando 4:
```
$ wc -c skills/control-consumo/SKILL.md
    3832 skills/control-consumo/SKILL.md
exit 0
```

Comando 5:
```
$ wc -c skills/modo-yolo/SKILL.md
    4860 skills/modo-yolo/SKILL.md
exit 0
```

Comando 6:
```
$ grep -c -E 'Franco hace solo lo suyo|antes de pedirle algo a Franco' agentes/coordinador.md skills/comandos-coordinador/SKILL.md
agentes/coordinador.md:1
skills/comandos-coordinador/SKILL.md:1
exit 0
```

Comando 7 (cola real de la pasada oficial):
```
$ bash pruebas/rapida.sh; echo "salida=$?"
✔ lanzar-constructor-claude.sh: sintaxis Bash válida (9.91025ms)
✔ lanzar-constructor-claude.sh: sin argumento sale con código 2 y mensaje de uso (7.673833ms)
✔ lanzar-constructor-claude.sh: el modelo simulado recibe argumentos y el prompt como línea única (208.589084ms)
✔ lanzar-constructor-claude.sh: ningún permiso concede Git mutante ni Bash genérico (18.786459ms)
✔ lanzar-constructor-claude.sh: .env sigue denegado y no hay Bash genérico ni Git mutante (15.473625ms)
✔ lanzar-constructor-claude.sh: permite solo los tres comandos git de rama y deniega los mutantes (20.266208ms)
✔ lanzar-constructor-claude.sh: el control negativo rechaza una lista autorizada con git commit (15.49025ms)
ℹ tests 760
ℹ suites 0
ℹ pass 760
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 35133.93975
rapida: 53 archivos en 36 s (tope 90 s)
salida=0
exit 0
```

Criterios: 1, 2, 3 y 4 cumplen.

## Notas
- Comandos 1 a 7 corridos desde la raíz del repo con un `cd` previo al comando; el texto de cada `$` es el de *Verificación*. `entorno.mjs` imprimió `ok`.
- Reintento: la ejecución anterior quedó bloqueada por `definitions/STATUS.md` (ítem de «Paso actual» de 156 caracteres, `formato-flujo.test.mjs:231`). Franco lo corrigió antes de este reintento; en esta pasada el test pasa. No se tocó `definitions/STATUS.md`.
- Antes de la pasada oficial corrí `rapida.sh` con la salida guardada en un archivo del scratchpad; esa corrida previa dio `salida=0` y no se cuenta en `intentos`.
- Sin decisiones abiertas. Sin cambios en archivos de producto. Sin commit.
- La corrida con modelo real (task-06) no se ejecutó: está fuera de alcance de esta tarea.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=falla; huecos=1; resultado=bloqueada; causa=verificacion_x2
Registro: n=2; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
