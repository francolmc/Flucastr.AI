# task-04 — README: cómo se prueba, flujo y modo yolo
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
Las secciones `## Pruebas` y `## Flujo` del README están en primera persona y no explican cómo comprobar el kit en un solo paso. Se renombran y reescriben: `## Cómo se prueba` (con la verificación rápida) y `## Flujo y modo yolo` (puertas, ramas, refinado y yolo con su advertencia).

## Contexto
- Leer: `README.md@198-12`
- Tocar: `README.md`
- El rango 198-209 va de `## Pruebas` hasta el final del párrafo de `## Flujo`.
- Confirmado por lectura: `bash pruebas/rapida.sh` corre los archivos de `pruebas/comprobaciones/`, `pruebas/*.test.mjs` y varios de `pruebas/capa1/` sin modelo ni red (tope 90 s por defecto, `FLUCASTR_TOPE_RAPIDA`); la suite completa es `node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs` (~45 s); `pruebas/README.md` describe el arnés.
- Confirmado por lectura: `node scripts/validar-tarea.mjs <ruta-tarea>` valida el formato de una tarea (sale 0 si es válida).
- Fuente: ninguna
- Requiere: runtime:node@25.8.1

## Decisiones ya tomadas
- Mismo estilo que task-02 (tuteo / tercera persona; sin «mi», «mis», «yo», «tengo»).
- `## Pruebas` pasa a llamarse `## Cómo se prueba` y abre con `bash pruebas/rapida.sh` («sin modelo ni red»), luego los dos comandos `node --test` actuales y el enlace a `pruebas/README.md`; una línea aclara que las corridas con modelo real están fuera de la rápida y gastan créditos.
- `## Flujo` pasa a llamarse `## Flujo y modo yolo`: conserva todo el contenido actual (cuatro puertas, rama `feature/`, `fix/` o `chore/`, refinado, yolo con alcance nombrado y detalle en `definitions/WORKFLOW.md` §9.3), en tercera persona y en dos párrafos; el modo yolo se presenta como advertencia: omite las puertas 2, 3 y 4, solo se activa pidiéndolo de forma explícita y los cambios quedan sin commit para revisión.
- Se agrega una línea: `node scripts/validar-tarea.mjs <ruta-tarea>` valida una tarea antes de aprobarla.
- Los enlaces internos `[Flujo](#flujo)` de otras secciones se actualizan a `#flujo-y-modo-yolo` en la task-08 (esta tarea no toca líneas anteriores a 198).

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: `## Pruebas` y `## Flujo`.
Fuera de alcance: líneas anteriores a `## Pruebas`, `pruebas/README.md` (desactualizado, se enlaza sin reescribir), scripts y pruebas.

## Pasos
1. Corre `git branch --show-current` y comprueba la rama.
2. Reemplaza `## Pruebas` por `## Cómo se prueba` con el contenido de *Decisiones ya tomadas*.
3. Reemplaza `## Flujo` por `## Flujo y modo yolo` con el contenido de *Decisiones ya tomadas*.
4. Ejecuta `bash pruebas/rapida.sh` y comprueba que sale 0.

## Criterios de aceptación
1. Rama `chore/F47-readme-para-cualquier-usuario` (comando 1).
2. Existen `## Cómo se prueba` y `## Flujo y modo yolo`, y no `## Pruebas` ni `## Flujo` (comando 2).
3. Esas secciones no tienen primera persona (comando 3).
4. `bash pruebas/rapida.sh` termina en 0 (comando 4).

## Verificación
```
git branch --show-current
grep -c '^## Cómo se prueba$\|^## Flujo y modo yolo$' README.md; grep -c '^## Pruebas$\|^## Flujo$' README.md
awk '/^## Cómo se prueba/,/^## Higiene de contexto/' README.md | grep -nEiw 'mi|mis|yo|tengo|mío|mía'; echo "grep:$?"
bash pruebas/rapida.sh | tail -3
```
Esperado: la rama `chore/F47-readme-para-cualquier-usuario`; `2` y luego `0`; solo `grep:1`; la última línea empieza por `rapida:` y no hay línea `FALLA`.

## Evidencia

```
$ git branch --show-current
chore/F47-readme-para-cualquier-usuario
exit 0
```

```
$ grep -c '^## Cómo se prueba$\|^## Flujo y modo yolo$' README.md; grep -c '^## Pruebas$\|^## Flujo$' README.md
2
0
exit 0
```

```
$ awk '/^## Cómo se prueba/,/^## Higiene de contexto/' README.md | grep -nEiw 'mi|mis|yo|tengo|mío|mía'; echo "grep:$?"
grep:1
exit 0
```

```
$ bash pruebas/rapida.sh | tail -3
ℹ todo 0
ℹ duration_ms 47128.689875
rapida: 64 archivos en 48 s (tope 90 s)
exit 0
```

Notas de verificación: la rapida pasa con exit 0 (pasada 2, con `set -o pipefail` para que el código sea el de `rapida.sh` y no el de `tail`). La pasada 1 corrió los mismos comandos sin capturar ese código. En el log completo de `rapida.sh` aparecen 19 líneas con el texto «FALLA», todas dentro de nombres de pruebas que pasan (controles negativos, p. ej. «control negativo: … da FALLA»); ninguna línea empieza por `✖` ni `FALLA`, así que se interpreta el criterio como «no hay fallo». `node scripts/validar-tarea.mjs` sobre esta tarea sale 0.

## Notas

- Huecos menores resueltos:
  1. Redacción en tercera persona: «el `coordinador` (el único agente que se abre directamente)» en lugar de «el único agente que abro», y «para que el dueño del repo cierre la rama» en lugar de «para que yo cierre la rama». Decisión: la tarea pide tercera persona y no fija la frase exacta.
  2. Frase del modo yolo: se presenta como «El modo yolo es una advertencia» en el segundo párrafo, con la advertencia y el sin commit en la misma frase. Decisión: sigue la plantilla de *Decisiones ya tomadas* sin copiar más texto.
- Decisión de Franco: ninguna requerida; la tarea tenía *Decisiones abiertas* en «Ninguna».
- Modo yolo activo en el encargo: la rama ya era la actual; no se ejecutó ningún `git switch`. No se hizo commit, push ni merge; `STATUS.md` no se tocó.
- Registro de la pasada 1 (sin captura de exit del `rapida.sh`) queda reemplazado por la pasada 2.

Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
