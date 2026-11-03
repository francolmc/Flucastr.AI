# task-05 — Crear la skill ramas-feature (copia, sin quitar nada del coordinador)
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
Segundo módulo del núcleo corto: la skill `ramas-feature` con la sección «Ramas por feature» del `coordinador`. Como en task-03, solo se crea como copia y se enlaza con una mención que no hace crecer el archivo. Mover el texto es task-06.

## Contexto
- Tocar: `skills/ramas-feature/SKILL.md`, `README.md`, `agentes/coordinador.md`
- Fuente: definitions/CONTRATOS.md «4. Prompts: núcleo corto + módulos bajo demanda»
- `agentes/coordinador.md`: la sección `## Ramas por feature` ocupa las líneas 73-79 de la versión de antes de task-04; búscala por su título. Su punto 1 termina con la frase `No hay columna nueva en el backlog.`
- `README.md`: árbol de `skills/` (líneas 81-89 tras task-03); ahí figura ya `modo-yolo/`. `readme-estructura.mjs` exige una línea `nombre/` por skill, y `contrato-roles.mjs` regla 4 exige la mención entre comillas invertidas en un agente.
- Lee solo las *Notas* de task-04.

## Decisiones ya tomadas
- Front matter: `name: ramas-feature` y `description:` de 160 caracteres o menos (por ejemplo: «Rama de la feature del coordinador: prefijo, línea Rama: en STATUS.md y en cada encargo, y CONFIRMAR para git switch. Cárgala al abrir una feature.»).
- Cuerpo: `# Ramas por feature` y los cinco puntos de la sección tal cual, en especial las tres frases `Rama: <prefijo>/Fxx-nombre`, `CONFIRMAR: accion=git switch <rama>; motivo=<motivo>` y la frase «Franco confirmó `git switch <rama>`». Tope 5120 B.
- En el `coordinador` solo cambian dos cosas dentro de esa sección: el título pasa a `## Ramas por feature (skill ` + `ramas-feature` entre comillas invertidas + `)`, y se borra la frase `No hay columna nueva en el backlog.`. El archivo no crece respecto de antes de la tarea (mídelo al empezar con `wc -c` y anótalo en *Notas*); tope de criterio: 14000 B.
- README: línea `│   ├── ramas-feature/` justo antes de `│   └── ejecutar-tarea/`.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: skill nueva, línea de README y dos retoques de la sección.
Fuera de alcance: quitar la sección y mover frases del manifiesto (task-06), `modo-yolo`, `instalar.sh` y todo lo de `definitions/`.

## Pasos
1. Crea `skills/ramas-feature/SKILL.md` según «Decisiones ya tomadas».
2. Retoca el título y el punto 1 de la sección en `agentes/coordinador.md`.
3. Añade la línea de `ramas-feature/` al árbol de `README.md`.
4. Corre las pruebas de contrato, README y tamaños.

## Criterios de aceptación
1. `contrato-roles.test.mjs` y `readme-estructura.test.mjs` dan `ℹ fail 0`.
2. `skills/ramas-feature/SKILL.md` mide 5120 B o menos y su `description` 160 caracteres o menos.
3. `agentes/coordinador.md` menciona `ramas-feature`, no creció y mide 14000 B o menos.
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/readme-estructura.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
test $(wc -c < skills/ramas-feature/SKILL.md) -le 5120 && echo "ok-modulo"; echo "exit $?"
node -e 'const t=require("fs").readFileSync("skills/ramas-feature/SKILL.md","utf8");const d=/^description: "(.*)"$/m.exec(t)[1];console.log(d.length<=160?"ok-descripcion":"larga")'; echo "exit $?"
grep -q '`ramas-feature`' agentes/coordinador.md && test $(wc -c < agentes/coordinador.md) -le 14000 && echo "ok-mencion"; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ℹ fail 0` en el primer comando, `ok-modulo`, `ok-descripcion`, `ok-mencion` y `ℹ fail 7` en el último.

## Evidencia

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/readme-estructura.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
```

```
$ test $(wc -c < skills/ramas-feature/SKILL.md) -le 5120 && echo "ok-modulo"; echo "exit $?"
ok-modulo
exit 0
```

```
$ node -e 'const t=require("fs").readFileSync("skills/ramas-feature/SKILL.md","utf8");const d=/^description: "(.*)"$/m.exec(t)[1];console.log(d.length<=160?"ok-descripcion":"larga")'; echo "exit $?"
ok-descripcion
exit 0
```

```
$ grep -q '`ramas-feature`' agentes/coordinador.md && test $(wc -c < agentes/coordinador.md) -le 14000 && echo "ok-mencion"; echo "exit $?"
ok-mencion
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

## Notas
- Huecos menores: ninguno. La skill conserva los cinco puntos tal cual, incluida la frase «No hay columna nueva en el backlog.», que sale solo del coordinador.
- Tamaños: `agentes/coordinador.md` medía 13314 B al empezar y 13302 B al terminar (no creció). `skills/ramas-feature/SKILL.md` mide 1562 B; su `description` 147 caracteres.
- Modo yolo: sin rama ni `git switch`; sin commit, push ni merge.
- Autocomprobación final: `node scripts/validar-tarea.mjs --evidencia features/F28-contratos-y-prompts-cortos/task-05-modulo-ramas-feature.md` salió 0 con `OK: 1 tarea(s) con evidencia completa`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
