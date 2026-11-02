# task-05 — Tope de bytes y frases protegidas de control-consumo
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
La skill `control-consumo` (task-04) debe quedar protegida como las otras: un tope de 4096 B en `topes-bytes.test.mjs` y sus frases clave en el manifiesto `FRASES_POR_ARCHIVO`, para que nadie las borre o las infle sin que una prueba falle.

## Contexto
- Tocar: `pruebas/comprobaciones/topes-bytes.test.mjs`, `pruebas/comprobaciones/frases-por-archivo.mjs`
- Fuente: definitions/CONSUMO.md «(d) Dónde vive el texto»
- `topes-bytes.test.mjs`: arreglo `TOPES` (líneas 12-20) con objetos `{ ruta, tope, opcional: false }`; la última entrada es `skills/comandos-coordinador/SKILL.md`. Las pruebas de control negativo sintético se generan solas por cada entrada.
- `frases-por-archivo.mjs`: `FRASES_POR_ARCHIVO` (línea 76) tiene la clave `'skills/ramas-feature'`; `contrato-roles.mjs` exige cada frase de cada clave en su archivo.
- La skill creada en task-04 contiene las frases de abajo (verifícalo con `grep` antes de registrarlas).
- Lee solo las *Notas* de task-04.

## Decisiones ya tomadas
- Entrada nueva en `TOPES`: `{ ruta: 'skills/control-consumo/SKILL.md', tope: 4096, opcional: false }`.
- Clave nueva `'skills/control-consumo'` en `FRASES_POR_ARCHIVO`, con exactamente estas frases: `Una escritura por transición: un solo `Write` con el archivo completo`, `cada ítem ≤150 caracteres`, `Presupuesto: <Fxx>; rondas arq=<n> plan=<n>; ampliado=<n>`, `estado=excedido`, `ampliado=N`, `abre sesión nueva`.
- No se tocan las claves del `coordinador` (eso es task-06).

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: una entrada de tope y una clave de manifiesto.
Fuera de alcance: cambiar el texto de la skill o del `coordinador`, subir cualquier tope existente y todo lo de `definitions/`.

## Pasos
1. Añade la entrada a `TOPES` en `topes-bytes.test.mjs`.
2. Añade la clave a `FRASES_POR_ARCHIVO`, tras `'skills/ramas-feature'`.
3. Corre `topes-bytes.test.mjs`, `contrato-roles.test.mjs` y la rápida.
4. Control negativo: quita temporalmente `abre sesión nueva` de una copia de la skill (en el directorio temporal, no en el repo) y comprueba con `grep` que ya no está; no dejes cambios en el repo.

## Criterios de aceptación
1. `topes-bytes.test.mjs` da `ℹ fail 0` y lista `skills/control-consumo/SKILL.md`.
2. `contrato-roles.test.mjs` da `ℹ fail 0`; las seis frases están en la skill.
3. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
node -e 'import("./pruebas/comprobaciones/frases-por-archivo.mjs").then(m=>{const f=m.FRASES_POR_ARCHIVO["skills/control-consumo"];const t=require("fs").readFileSync("skills/control-consumo/SKILL.md","utf8");console.log(f.length, f.every(x=>t.includes(x))?"ok-frases":"falta")})'; echo "exit $?"
grep -c "skills/control-consumo/SKILL.md" pruebas/comprobaciones/topes-bytes.test.mjs; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ℹ fail 0` en el primero; `6 ok-frases` en el segundo; `1` en el tercero; `ℹ fail 7` en el último.

## Evidencia

```
$ node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
```

```
$ node -e 'import("./pruebas/comprobaciones/frases-por-archivo.mjs").then(m=>{const f=m.FRASES_POR_ARCHIVO["skills/control-consumo"];const t=require("fs").readFileSync("skills/control-consumo/SKILL.md","utf8");console.log(f.length, f.every(x=>t.includes(x))?"ok-frases":"falta")})'; echo "exit $?"
6 ok-frases
exit 0
```

```
$ grep -c "skills/control-consumo/SKILL.md" pruebas/comprobaciones/topes-bytes.test.mjs; echo "exit $?"
1
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

## Notas
Huecos menores: 0. Leí la sección (d) de `definitions/CONSUMO.md` citada en `Fuente:` y solo las Notas de task-04. Modo yolo: sin rama ni `git switch`; sin commit.
Verificación en dos pasadas: la primera corrió los cuatro comandos por separado y dio los mismos resultados; la segunda, la de la Evidencia, con el comando exacto de cada línea. Intentos=2.
Control negativo (fuera del repo): copia de `skills/control-consumo/SKILL.md` en el scratchpad con «abre sesión nueva» sustituida; `grep -c "abre sesión nueva"` da 0 (grep sale 1 sin coincidencias), así que la frase protegida fallaría. El repo no cambió por esa prueba.
Tope de `control-consumo` 4096 B; la skill mide 1818 B. Tope de `coordinador` (7168) no tocado.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
