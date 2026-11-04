# task-05 — `Rama:` junto a `Modo yolo:` en el encargo (coordinador y ramas-feature)
repo: Flucastr.AI   depende_de: task-04   estado: borrador

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
2. «salvo yolo» ya no está en `coordinador.md` y «`Rama:` y `Modo yolo:`» aparece (comandos 2 y 3).
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
grep -c 'salvo yolo' agentes/coordinador.md
```
Esperado: `0`.

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
(lo llena el constructor: la cola relevante de cada salida, hasta 1,5 KB)

## Notas
(lo llena el constructor)
