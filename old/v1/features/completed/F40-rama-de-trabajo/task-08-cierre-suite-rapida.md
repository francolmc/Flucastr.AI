# task-08 — Cierre de F40: topes de bytes y suite rápida en verde
repo: Flucastr.AI   depende_de: task-07   estado: hecha

## Descripción
Última tarea de la feature: comprueba que ningún archivo con tope lo supera, que no quedan frases del comportamiento viejo de yolo y que `bash pruebas/rapida.sh` termina en 0 (tope de la suite 90 s). Es solo verificación; si algo falla, se corrige en el archivo de la tarea que lo causó.

## Contexto
- Tocar: `features/F40-rama-de-trabajo/task-08-cierre-suite-rapida.md`
- Solo se escribe *Evidencia* y *Notas* de esta tarea; ningún archivo de producto.
- Topes en bytes (`wc -c`): `agentes/coordinador.md` 7168, `agentes/constructor.md` 3072, `skills/modo-yolo/SKILL.md` 5120, `skills/ramas-feature/SKILL.md` 5120, `skills/ejecutar-tarea/SKILL.md` 7623, `skills/descomponer-feature/SKILL.md` 6400.
- `bash pruebas/rapida.sh` imprime al final `rapida: N archivos en S s (tope 90 s)`; suele tardar 25-55 s.
- Revisión de lectura (sin edición obligatoria): `skills/comandos-coordinador/SKILL.md` línea 32 («Cierre de feature», aviso «cierra la rama») y `skills/control-consumo/SKILL.md` línea 19 no deben contradecir la línea `Modo yolo: detenido (Fxx completa: commitea y cierra la rama)`; si chocan, se anota en *Notas* sin editar.
- Fuente: definitions/F40-RAMAS.md «C. Efectos fuera de las definiciones (no se editan aquí)»
- Requiere: largo:90

## Decisiones ya tomadas
- No se editan archivos de producto en esta tarea; un fallo se informa con `BLOQUEO:` y la tarea causante.
- La aceptación «corrida con modelo real de yolo en Claude Code» de `definitions/BACKLOG.md` (Alcance de F40) la hace Franco después de esta tarea.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: correr las comprobaciones y dejar la evidencia.
Fuera de alcance: editar agentes, skills, pruebas o definiciones; la corrida con modelo real; el commit.

## Pasos
1. Corre `git branch --show-current`.
2. Corre los `wc -c` de la *Verificación* y compáralos con los topes.
3. Corre el `grep` de frases viejas.
4. Lee las dos líneas de revisión de *Contexto* y anota en *Notas* si chocan.
5. Corre `bash pruebas/rapida.sh` y copia sus últimas líneas.

## Criterios de aceptación
1. La rama activa es `fix/F40-rama-de-trabajo` (comando 1).
2. Los seis archivos están dentro de su tope (comandos 2 a 7).
3. No quedan frases del comportamiento viejo (comando 8: salida vacía).
4. La suite rápida termina en 0 (comando 9).

## Verificación
Comando 1:
```
git branch --show-current
```
Esperado: `fix/F40-rama-de-trabajo`.

Comando 2:
```
wc -c agentes/coordinador.md
```
Esperado: un número menor o igual a 7168.

Comando 3:
```
wc -c agentes/constructor.md
```
Esperado: un número menor o igual a 3072.

Comando 4:
```
wc -c skills/modo-yolo/SKILL.md
```
Esperado: un número menor o igual a 5120.

Comando 5:
```
wc -c skills/ramas-feature/SKILL.md
```
Esperado: un número menor o igual a 5120.

Comando 6:
```
wc -c skills/ejecutar-tarea/SKILL.md
```
Esperado: un número menor o igual a 7623.

Comando 7:
```
wc -c skills/descomponer-feature/SKILL.md
```
Esperado: un número menor o igual a 6400.

Comando 8:
```
grep -rn -E 'no creas rama|salta este paso entero|ADVERTENCIA: rama main|al `constructor` \(salvo yolo\)' agentes skills pruebas/comprobaciones
```
Esperado: salida vacía (la línea 18 de `coordinador.md`, «salvo yolo, `modo-yolo`», no coincide con el patrón).

Comando 9:
```
bash pruebas/rapida.sh; echo "salida=$?"
```
Esperado: la última línea es `salida=0` y la anterior `rapida: N archivos en S s (tope 90 s)` con S menor o igual a 90.

## Evidencia
```
$ git branch --show-current
fix/F40-rama-de-trabajo
exit 0
$ wc -c agentes/coordinador.md
7155 agentes/coordinador.md
exit 0
$ wc -c agentes/constructor.md
2836 agentes/constructor.md
exit 0
$ wc -c skills/modo-yolo/SKILL.md
4860 skills/modo-yolo/SKILL.md
exit 0
$ wc -c skills/ramas-feature/SKILL.md
1690 skills/ramas-feature/SKILL.md
exit 0
$ wc -c skills/ejecutar-tarea/SKILL.md
7366 skills/ejecutar-tarea/SKILL.md
exit 0
$ wc -c skills/descomponer-feature/SKILL.md
6363 skills/descomponer-feature/SKILL.md
exit 0
```
```
$ grep -rn -E 'no creas rama|salta este paso entero|ADVERTENCIA: rama main|al `constructor` \(salvo yolo\)' agentes skills pruebas/comprobaciones
(salida vacía)
exit 1
```
```
$ bash pruebas/rapida.sh; echo "salida=$?"
ℹ tests 740
ℹ suites 0
ℹ pass 740
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
rapida: 50 archivos en 31 s (tope 90 s)
salida=0
exit 0
```
Línea de formato esperada por la verificación: `rapida: N archivos en S s (tope 90 s)`; la obtenida arriba cumple ese formato (N=50, S=31).

## Notas
- Topes: los seis archivos están dentro de su tope (7155/7168, 2836/3072, 4860/5120, 1690/5120, 7366/7623, 6363/6400). El grep de frases viejas no devuelve nada.
- Revisión de lectura (paso 4): `skills/comandos-coordinador/SKILL.md` línea 32 y `skills/control-consumo/SKILL.md` línea 19 no chocan con `Modo yolo: detenido (Fxx completa: commitea y cierra la rama)`. Esa línea está en `skills/modo-yolo/SKILL.md` (regla 7) y en `definitions/WORKFLOW.md` §9.3; la línea 32 solo prohíbe escribir los avisos «cierra la rama» en yolo. Sin edición.
- Suite: `bash pruebas/rapida.sh` se corrió tres veces con la tarea `en curso`; la última, con el comando exacto de *Verificación*, dio `salida=0` (50 archivos en 31 s). En las dos anteriores, `ℹ fail 0`.
- Rama: el encargo no trae línea `Rama:` y el modo yolo está activo; no se hizo `git switch`, ni commit, ni push.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
