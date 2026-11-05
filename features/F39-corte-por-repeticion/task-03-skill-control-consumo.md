# task-03 — `control-consumo`: usar `--firma` y no ofrecer «A» ante una repetición
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
Pone en `skills/control-consumo/SKILL.md` el contrato del corte por repetición: tras un rechazo del validador con `Firma:`, el coordinador pasa esa firma a `--presupuesto`; con `estado=repetido` escala con solo C y D y guarda la firma en `STATUS.md`. El skill está en 3832 de 4096 bytes; el cambio es mínimo para caber.

## Contexto
- Tocar: `skills/control-consumo/SKILL.md`, `pruebas/comprobaciones/control-consumo-letras.test.mjs`
- `SKILL.md`: ítem 3 (lectura de `--presupuesto`), ítem 5 (Escalación con letras A-D), ítem 7 (plantilla, línea `Presupuesto:`), ítem 10 (respuesta por letra). Contrato actual: `control-consumo-letras.test.mjs` (`paso(texto, n)`, `validarLetras`).
- Tope de bytes: `pruebas/comprobaciones/topes-bytes.test.mjs` línea 20 (4096). `agentes/coordinador.md` está en 7168 de 7168: no se toca.
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- Especificación: viñeta «Alcance de F37–F39 (Franco, 2026-11-04)», parte F39.
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Alcance mínimo para caber en 4096 B (hoy 3832 B; margen 264 B). Un borrador con exactamente estos tres textos midió 4069 B (confirmado en copia, no en el repo).
- Ítem 3: añade al final, tras «no un fallo.», la frase: ` Tras un rechazo con `Firma: X`, añade `--firma 'X'`.`
- Plantilla (ítem 7), línea `Presupuesto:`: termina en `[; amp_k=<n>][; firma=<d>]`.
- Ítem nuevo 11, al final del archivo: `11. Con `estado=repetido` la Escalación dice «esta causa se repite» y ofrece solo C) y D); no delegas. Copia `firma=<d>` a `Presupuesto:`; sin rechazo nuevo, omítelo.`
- Queda fuera (no lo agregues; no cabe): decir que «A» y «B» no valen ante una repetición, que «A» queda para el tope de volumen, la aclaración de comillas del `--firma` y cualquier recorte de los ítems 6 a 8. Basta con ofrecer solo C y D.
- No toques los ítems 1, 2, 4, 5, 6, 8, 9 ni 10, ni las frases que exige `control-consumo-letras.test.mjs`.
- La prueba nueva exige en el ítem 11: `repetido`, `esta causa se repite`, `C)`, `D)` y `solo`; en el ítem 3: `--firma`; y los 4096 B.
- Si tras aplicar los tres textos supera 4096 B: `BLOQUEO: rol=arquitecto; motivo=control-consumo no cabe en 4096 B`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: texto del skill y 3 pruebas de contrato.
Fuera de alcance: `agentes/coordinador.md`, scripts, `definitions/WORKFLOW.md` (lo edita Franco), cambiar letras A-D existentes, recortar otros ítems.

## Pasos
1. Corre `git branch --show-current`.
2. Edita los ítems 3 y 7 y agrega el ítem 11 con los textos exactos de las decisiones; verifica ≤4096 bytes (`wc -c`).
3. En `control-consumo-letras.test.mjs` agrega las pruebas: ítem 3 con `--firma`; ítem 11 con las frases; tamaño ≤4096.
4. Corre las pruebas y `topes-bytes`.

## Criterios de aceptación
1. El ítem 11 ofrece solo C y D ante `repetido` (prueba de contrato).
2. El ítem 3 menciona `--firma` (prueba).
3. `SKILL.md` ≤4096 bytes (`wc -c` y `topes-bytes`).
4. Las pruebas previas del contrato de letras siguen verdes.

## Verificación
```
git branch --show-current
wc -c skills/control-consumo/SKILL.md
node --test pruebas/comprobaciones/control-consumo-letras.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs
```
Esperado: rama `feature/F39-corte-por-repeticion`; `wc -c` con un número menor o igual a 4096; pruebas con 0 fallos.

## Evidencia

```
$ git branch --show-current
feature/F39-corte-por-repeticion
exit 0
```

```
$ wc -c skills/control-consumo/SKILL.md
    4070 skills/control-consumo/SKILL.md
exit 0
```

```
$ node --test pruebas/comprobaciones/control-consumo-letras.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs
ℹ tests 35
ℹ suites 0
ℹ pass 35
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0
```

## Notas
Replanteo (planificador, 2026-11-05): el intento previo con el alcance amplio llegó a 4254 B y se bloqueó; Franco eligió la opción B (reducir alcance, sin subir el tope). Task-04 a task-06 no dependen de lo que queda fuera: solo exigen que la Escalación diga «se repite» y ofrezca únicamente C y D.

Ejecución (constructor, 2026-11-05): aplicados los tres textos exactos. Ítem 3: frase de `--firma` tras «no un fallo.». Ítem 7: `[; firma=<d>]` al final de la línea `Presupuesto:`. Ítem 11 nuevo al final. `SKILL.md` queda en 4070 B (tope 4096), sin recortar otros ítems. Pruebas añadidas en `control-consumo-letras.test.mjs`: `--firma` en el ítem 3, ítem 11 con `repetido`/`esta causa se repite`/`C)`/`D)`/`solo`, y tope de 4096 B. Huecos menores: 0.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
