# task-04 — modo-yolo: la rama es la de la feature y se quita la advertencia de main
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
`skills/modo-yolo/SKILL.md` lee la rama actual de `.git/HEAD`, advierte si es `main`, no pasa `Rama:` al constructor y trata `CONFIRMAR:` como escalación. Con la nueva regla, la línea `Modo yolo:` de `STATUS.md` lleva la rama de la feature, el encargo al constructor lleva `Rama:` junto a `Modo yolo:`, `CONFIRMAR:` sigue el flujo de `ramas-feature` y desaparece la advertencia.

## Contexto
- Tocar: `skills/modo-yolo/SKILL.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`
- `skills/modo-yolo/SKILL.md` hoy 5006 bytes, tope 5120. Entradas numeradas 1-5 y, bajo «### Mientras está activo», nueve reglas.
  - Entrada 3 «**Registro:**»: la rama «la lees de `.git/HEAD` … `rama desconocida` y no hay advertencia». Sustituir esa última oración por: «La rama es la de la feature (`ramas-feature`), no la actual.» La parte literal `Modo yolo: activo — alcance <…>; pedido por Franco el <fecha>; rama <…>` no cambia.
  - Entrada 4 «**Advertencia:**»: se borra entera; la entrada 5 «**Vigencia:**» pasa a ser la 4.
  - Regla 1: sustituir «Al `constructor` no le pasas la línea `Rama:`.» por «Todo encargo al `constructor` lleva también `Rama:` (`ramas-feature`).».
  - Regla 4 «**`CONFIRMAR:`**»: sustituir «no debería ocurrir en yolo; es escalación (regla 5).» por «sigue el flujo de `ramas-feature` (registrar, preguntar a Franco, re-delegar).».
  - Regla 5: en la lista de escalaciones, borrar «`CONFIRMAR:`; ».
- `pruebas/comprobaciones/frases-por-archivo.mjs` línea 167, dentro de `'skills/modo-yolo': [`: la frase `'ADVERTENCIA: rama main',` se borra.
- Fuente: definitions/F40-RAMAS.md «C. Efectos fuera de las definiciones (no se editan aquí)»
- Requiere: ninguno

## Decisiones ya tomadas
- El texto de reemplazo es el indicado, palabra por palabra. El título «nueve reglas» y la cantidad de reglas no cambian.
- La pausa entre features (regla 7) es la task-06; aquí no se toca.
- El tope de 5120 bytes no se puede superar; este cambio reduce el archivo.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: entradas 3 y 4, reglas 1, 4 y 5 de `modo-yolo`, y una frase de `frases-por-archivo.mjs`.
Fuera de alcance: regla 7 y regla 8, `ramas-feature`, `coordinador.md`, otras skills.

## Pasos
1. Comprueba `git branch --show-current`.
2. En `skills/modo-yolo/SKILL.md` edita la entrada 3 y borra la entrada 4; renumera «5.» a «4.».
3. Edita las reglas 1, 4 y 5 como indica *Contexto*.
4. En `pruebas/comprobaciones/frases-por-archivo.mjs` borra `'ADVERTENCIA: rama main',`.
5. Corre la *Verificación*.

## Criterios de aceptación
1. La rama activa es `fix/F40-rama-de-trabajo` (comando 1).
2. No quedan «ADVERTENCIA», «.git/HEAD» ni «no le pasas» en los dos archivos (comando 2: salida vacía).
3. `skills/modo-yolo/SKILL.md` pesa 5120 bytes o menos (comando 3).
4. La prueba de contrato-roles (que usa `frases-por-archivo.mjs`) pasa (comando 4).

## Verificación
Comando 1:
```
git branch --show-current
```
Esperado: `fix/F40-rama-de-trabajo`.

Comando 2:
```
grep -n -E 'ADVERTENCIA|\.git/HEAD|no le pasas' skills/modo-yolo/SKILL.md pruebas/comprobaciones/frases-por-archivo.mjs
```
Esperado: salida vacía.

Comando 3:
```
wc -c skills/modo-yolo/SKILL.md
```
Esperado: un número menor o igual a 5120.

Comando 4:
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'
```
Esperado: `ℹ fail 0`.

## Evidencia
```
$ git branch --show-current
fix/F40-rama-de-trabajo
exit 0
```
```
$ grep -n -E 'ADVERTENCIA|\.git/HEAD|no le pasas' skills/modo-yolo/SKILL.md pruebas/comprobaciones/frases-por-archivo.mjs
(sin salida)
exit 1
```
```
$ wc -c skills/modo-yolo/SKILL.md
4767 skills/modo-yolo/SKILL.md
exit 0
```
```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'
ℹ pass 124
ℹ fail 0
exit 0
```

## Notas
- Estado previo: la ejecución cortada ya había dejado hechos los cambios de `skills/modo-yolo/SKILL.md` (entradas 3 y 4, reglas 1, 4 y 5) y borrada la frase `'ADVERTENCIA: rama main'`. Se comprobaron contra *Pasos* y se conservaron; no se rehizo nada.
- Bytes: `skills/modo-yolo/SKILL.md` 5006 antes, 4767 después (tope 5120). `pruebas/comprobaciones/frases-por-archivo.mjs` 7399 antes, 7369 después.
- Rama: el encargo no trae línea `Rama:`; no se ejecutó ningún comando git de rama ni `git switch`. Sin commit.
- Hueco menor: ninguno.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
