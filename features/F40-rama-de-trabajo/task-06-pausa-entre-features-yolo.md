# task-06 — Yolo se detiene al terminar cada feature si quedan más en el alcance
repo: Flucastr.AI   depende_de: task-05   estado: borrador

## Descripción
Hoy `skills/modo-yolo/SKILL.md` regla 7 dice «continúas con la siguiente del alcance» y «en yolo no hay rama de feature». Con rama por feature y sin commits de agentes, la feature siguiente heredaría el trabajo sin commitear y no aislaría nada. Decisión de Franco (2026-11-04): al terminar una feature, si quedan features en el alcance, yolo se detiene con `Modo yolo: detenido (Fxx completa: commitea y cierra la rama)`; si era la última, `Modo yolo: terminado`.

## Contexto
- Tocar: `skills/modo-yolo/SKILL.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`
- `skills/modo-yolo/SKILL.md`, regla 7 «**Feature terminada:**». Texto vigente tras «(el pedido explícito de Franco cubre esa aprobación)»: «y continúas con la siguiente del alcance; delegas `descomponer-feature` para mover la marca `→`. No escribes el aviso de «cierra la rama»: en yolo no hay rama de feature.» Se sustituye por: « Si quedan features en el alcance, la línea pasa a `Modo yolo: detenido (Fxx completa: commitea y cierra la rama)` y te detienes; cuando Franco commitea y pide seguir, delegas `descomponer-feature` (mueve la marca `→`) y sigues. Si era la última, aplica la regla 8.»
- `pruebas/comprobaciones/frases-por-archivo.mjs`, en `'skills/modo-yolo': [` (junto a `'Modo yolo: terminado',`): añadir la frase `'Fxx completa: commitea y cierra la rama',`.
- Tope de `skills/modo-yolo/SKILL.md`: 5120 bytes (tras task-04 debe estar bajo ese tope).
- Fuente: definitions/F40-RAMAS.md «B. Texto de reemplazo exacto»
- Requiere: ninguno

## Decisiones ya tomadas
- Solo se reemplaza el texto indicado de la regla 7; la regla 8 (cierre) no cambia.
- No hay cambio en `comandos-coordinador` ni `control-consumo`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: regla 7 de `modo-yolo` y una frase nueva en `frases-por-archivo.mjs`.
Fuera de alcance: regla 8, `ramas-feature`, `WORKFLOW.md`, otras skills.

## Pasos
1. Comprueba `git branch --show-current`.
2. En `skills/modo-yolo/SKILL.md` reemplaza el final de la regla 7 como indica *Contexto*.
3. En `pruebas/comprobaciones/frases-por-archivo.mjs` añade la frase nueva a `'skills/modo-yolo'`.
4. Corre la *Verificación*.

## Criterios de aceptación
1. La rama activa es `fix/F40-rama-de-trabajo` (comando 1).
2. La skill contiene la frase de pausa y ya no contiene «no hay rama de feature» (comandos 2 y 3).
3. Pesa 5120 bytes o menos (comando 4).
4. La prueba de contrato-roles pasa (comando 5).

## Verificación
Comando 1:
```
git branch --show-current
```
Esperado: `fix/F40-rama-de-trabajo`.

Comando 2:
```
grep -c 'Fxx completa: commitea y cierra la rama' skills/modo-yolo/SKILL.md
```
Esperado: `1`.

Comando 3:
```
grep -c 'no hay rama de feature' skills/modo-yolo/SKILL.md
```
Esperado: `0`.

Comando 4:
```
wc -c skills/modo-yolo/SKILL.md
```
Esperado: un número menor o igual a 5120.

Comando 5:
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'
```
Esperado: `ℹ fail 0`.

## Evidencia
(lo llena el constructor: la cola relevante de cada salida, hasta 1,5 KB)

## Notas
(lo llena el constructor)
