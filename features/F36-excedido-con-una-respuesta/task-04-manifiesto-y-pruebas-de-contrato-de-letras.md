# task-04 — Manifiesto de frases y pruebas de contrato de las opciones por letra
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
Protege con pruebas deterministas lo que task-03 escribió en `control-consumo`: las cuatro opciones con su letra, la restricción de B, la instrucción «Responde con una letra», la regla «la letra se aplica sin condiciones», que «A» con solo la letra amplía `N=1` y que «D» deja la feature marcada `INCOMPLETA`. Así una edición futura de la skill (o de su tope de bytes) no quita la salida de «excedido» sin que falle una prueba.

## Contexto
- Tocar: `pruebas/comprobaciones/frases-por-archivo.mjs`, `pruebas/comprobaciones/control-consumo-letras.test.mjs`
- De `depende_de:` lee solo las *Notas* de task-03.
- En `frases-por-archivo.mjs`, bloque `'skills/control-consumo': [` (línea 143): hoy 9 frases, la última `'rol=constructor; motivo=codigo:'`. Cada frase nueva suma una prueba en `contrato-roles.test.mjs` (F35: 109 → 112 con tres frases; hoy `ℹ tests 114`; con las seis nuevas, 120, medido).
- Patrón de prueba con controles negativos: `pruebas/comprobaciones/coordinador-status.test.mjs` (función `validarX(texto)` que devuelve errores en español y un test por frase rota esperando exactamente un error); lee archivos reales con `fs.readFileSync` desde `RAIZ = fileURLToPath(new URL('../../', import.meta.url))`.
- Texto vigente tras task-03: `skills/control-consumo/SKILL.md`, pasos 5 y 10.
- Fuente: ninguna
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Frases nuevas del manifiesto (añadir al final del bloque, en este orden): `'D) cerrar la feature como incompleta'`, `'Responde con una letra'`, `'sin añadir condiciones'`, `'no discutas ni reinterpretes'`, `'N=1'`, `'INCOMPLETA'`.
- `control-consumo-letras.test.mjs` define `validarLetras(texto)` (devuelve arreglo de errores en español, no lanza) con cuatro comprobaciones sobre el texto de la skill: (1) existen en el paso 5 las opciones `A) `, `B) `, `C) ` y `D) cerrar la feature como incompleta`; (2) el paso 5 contiene `con \`arq\` o \`plan\` no ofrezcas B` y `solo si la causa es \`D\` o \`K\``; (3) el paso 5 contiene `Responde con una letra`; (4) el paso 10 contiene `sin añadir condiciones`, `no discutas ni reinterpretes`, `N=1` e `INCOMPLETA`. El «paso N» es la línea que empieza con `N. `.
- Pruebas (7): la skill real da `[]`; y seis controles negativos que reemplazan una sola cosa (`D) cerrar la feature como incompleta` por `D) otra cosa`; `no ofrezcas B` por `ofrece B`; `Responde con una letra` por `Responde`; `sin añadir condiciones` por `con condiciones`; `N=1` por `N=2`; `INCOMPLETA` por `completa`) y esperan exactamente un error cada uno, que nombre lo roto.
- No toques `contrato-roles.mjs` ni los topes.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: seis frases de manifiesto y un archivo de pruebas.
Fuera de alcance: cambiar el texto de la skill (si una frase no coincide, es BLOQUEO hacia task-03, no se corrige aquí), `agentes/`, `scripts/`, `definitions/`, la corrida con modelo.

## Pasos
1. Lee las *Notas* de task-03.
2. Añade las seis frases al bloque `'skills/control-consumo'` de `frases-por-archivo.mjs`.
3. Crea `control-consumo-letras.test.mjs` con `validarLetras` y las 7 pruebas.
4. Corre la *Verificación*.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/control-consumo-letras.test.mjs` da `ℹ tests 7` y `ℹ fail 0`.
2. `node --test pruebas/comprobaciones/contrato-roles.test.mjs` da `ℹ tests 120` y `ℹ fail 0`.
3. `grep -c "no discutas ni reinterpretes" pruebas/comprobaciones/frases-por-archivo.mjs` imprime `1`.
4. `bash pruebas/rapida.sh` da `ℹ tests 728` (715 más 6 frases más 7) y `ℹ fail 6` (ajenos).

## Verificación
```
node --test pruebas/comprobaciones/control-consumo-letras.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
grep -c "no discutas ni reinterpretes" pruebas/comprobaciones/frases-por-archivo.mjs
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'
```
Esperado: `ℹ tests 7` y `ℹ fail 0`; `ℹ tests 120` y `ℹ fail 0`; `1`; `ℹ tests 728` y `ℹ fail 6` (la rápida sale 1 mientras haya fallos conocidos: no se exige salida 0).
La *Evidencia* se pega concisa: solo la salida literal de cada comando, sin repetir los resultados en prosa.

## Evidencia

```
$ node --test pruebas/comprobaciones/control-consumo-letras.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 7
ℹ fail 0
exit 0
```

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 120
ℹ fail 0
exit 0
```

```
$ grep -c "no discutas ni reinterpretes" pruebas/comprobaciones/frases-por-archivo.mjs
1
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 728
ℹ fail 6
exit 1
```

## Notas
- Huecos menores: ninguno. El paso 10 de la skill contiene «INCOMPLETA» (en «se cerró INCOMPLETA»), así que las seis frases coinciden con el texto de task-03 sin tocar la skill.
- `bash pruebas/rapida.sh` sale con código 1 (real) mientras haya fallos conocidos. Los 6 fallos son los mismos de task-03, ajenos a esta tarea: «los archivos reales cumplen la regla», «falla si un agente conserva la línea de modelos.json», «falla si falta la lectura acotada en constructor», «falla si falta la lectura acotada en ejecutar-tarea», «falla si WORKFLOW.md pasa de 30720 caracteres», «falla si WORKFLOW.md conserva la frase sobre modelos.json».
- Controles negativos: cada prueba reemplaza una sola frase de la skill en memoria (no escribe el archivo) y espera exactamente un error.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
