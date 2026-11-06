# task-05 — `Rama:` junto a `Modo yolo:` en el encargo (coordinador y ramas-feature)
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
`agentes/coordinador.md` dice que `Rama:` va en cada encargo al constructor «(salvo yolo)» y escribe «`Rama:` o `Modo yolo:`». En yolo ahora van las dos líneas. Se corrige el coordinador sin aumentar bytes (está en 7168 de 7168) y se añade a `skills/ramas-feature/SKILL.md` la frase que dice que en yolo se carga igual.

## Contexto
- Tocar: `agentes/coordinador.md`, `skills/ramas-feature/SKILL.md`
- `agentes/coordinador.md`: línea 59 (`… rol, feature, tarea, \`Rama:\` o \`Modo yolo:\` y qué revisa Franco.`) y línea 60 (`… \`Rama:\` o \`Modo yolo:\` si aplica, y «no escribas en \`STATUS.md\`»…`): en ambas, «`Rama:` o `Modo yolo:`» pasa a «`Rama:` y `Modo yolo:`» (misma longitud). Línea 68: en «`Rama:` va en cada encargo al `constructor` (salvo yolo).» se borra « (salvo yolo)».
- `skills/ramas-feature/SKILL.md` (1562 bytes, tope 5120): al final del punto 3 («En cada encargo al constructor incluye la línea `Rama: <prefijo>/Fxx-nombre`.») añade: « En yolo se carga igual al abrir cada feature (el pedido de Franco cubre la aprobación) y `Rama:` va también con `Modo yolo:`.»
- Topes: `agentes/coordinador.md` 7168 bytes (hoy 7168; no puede crecer); `skills/ramas-feature/SKILL.md` 5120.
- Fuente: definitions/F40-RAMAS.md «C. Efectos fuera de las definiciones (no se editan aquí)»
- Requiere: ninguno

## Decisiones ya tomadas
- El coordinador no pasa la rama esperada al planificador: la deriva él (decisión de Franco, 2026-11-04); aquí no se agrega nada sobre eso.
- Los reemplazos son los indicados, sin otras ediciones en `coordinador.md`.
- La línea 18 («… (salvo yolo, `modo-yolo`).», regla de cambio de `estado`) se mantiene tal cual (decisión de Franco, 2026-11-04).

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: tres cambios mínimos en `coordinador.md` y una frase en `ramas-feature`.
Fuera de alcance: `modo-yolo`, `comandos-coordinador`, `control-consumo`, reordenar secciones del coordinador.

## Pasos
1. Comprueba `git branch --show-current`.
2. En `agentes/coordinador.md` cambia «o» por «y» en las dos menciones de `Rama:`/`Modo yolo:` (líneas 59 y 60).
3. En la línea 68 borra « (salvo yolo)».
4. En `skills/ramas-feature/SKILL.md` añade la frase al punto 3.
5. Corre la *Verificación*.

## Criterios de aceptación
1. La rama activa es `fix/F40-rama-de-trabajo` (comando 1).
2. La frase «(salvo yolo)» de la línea 68 ya no está en `coordinador.md` (la de la línea 18, regla de `estado`, se mantiene) y «`Rama:` y `Modo yolo:`» aparece (comandos 2 y 3).
3. `agentes/coordinador.md` pesa 7168 bytes o menos y `ramas-feature` 5120 o menos (comandos 4 y 5).
4. La prueba de contrato-roles pasa (comando 6).

## Verificación
Comando 1:
```
git branch --show-current
```
Esperado: `fix/F40-rama-de-trabajo`.

Comando 2:
```
grep -c -F 'al `constructor` (salvo yolo)' agentes/coordinador.md
```
Esperado: `0` (la línea 18, «salvo yolo, `modo-yolo`», no cuenta y no se toca).

Comando 3:
```
grep -c 'Rama:` y `Modo yolo:' agentes/coordinador.md
```
Esperado: `2` (líneas 59 y 60).

Comando 4:
```
wc -c agentes/coordinador.md
```
Esperado: un número menor o igual a 7168.

Comando 5:
```
wc -c skills/ramas-feature/SKILL.md
```
Esperado: un número menor o igual a 5120.

Comando 6:
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'
```
Esperado: `ℹ fail 0`.

## Evidencia
```
$ git branch --show-current
fix/F40-rama-de-trabajo
exit 0
$ grep -c -F 'al `constructor` (salvo yolo)' agentes/coordinador.md
0
exit 1
$ grep -c 'Rama:` y `Modo yolo:' agentes/coordinador.md
2
exit 0
$ grep -n 'salvo yolo' agentes/coordinador.md
18:- Cambias un `estado` **solo** con aprobación explícita de Franco en la conversación (salvo yolo, `modo-yolo`).
exit 0
$ wc -c agentes/coordinador.md
    7155 agentes/coordinador.md
exit 0
$ wc -c skills/ramas-feature/SKILL.md
    1690 skills/ramas-feature/SKILL.md
exit 0
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'
ℹ pass 128
ℹ fail 0
exit 0
```

## Notas
- Hecho: `agentes/coordinador.md` 7168 -> 7155 bytes (línea 59 y 60 «o» -> «y»; línea 68 sin « (salvo yolo)»). `skills/ramas-feature/SKILL.md` 1562 -> 1690 bytes (frase añadida al punto 3).
- Resuelto: Franco decidió mantener la línea 18 de `coordinador.md` («salvo yolo, `modo-yolo`»). El planificador acotó el comando 2 y el criterio 2 a la frase de la línea 68; así se verificó en este reintento.
- Rama: modo yolo, sin `git switch` ni rama nueva; sin commit.
- Huecos menores en esta ejecución: 0.
Bloqueo: tipo=alcance; falta=-
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=falla; huecos=0; resultado=escalada; causa=alcance
Registro: n=2; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
