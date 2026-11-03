# task-07 — Crear la skill comandos-coordinador (copia, sin quitar nada del coordinador)
repo: Flucastr.AI   depende_de: task-06   estado: hecha

## Descripción
Tercer módulo: la skill `comandos-coordinador` con lo que el `coordinador` usa pocas veces: la lista cerrada de comandos de `scripts/`, el aviso de archivo y contexto, el cierre de feature y el respaldo sin subagentes. Como en las tasks 03 y 05, solo se crea como copia y se enlaza con una mención que no hace crecer el archivo. Mover el texto es task-08.

## Contexto
- Tocar: `skills/comandos-coordinador/SKILL.md`, `README.md`, `agentes/coordinador.md`
- Fuente: definitions/CONTRATOS.md «4. Prompts: núcleo corto + módulos bajo demanda»
- `agentes/coordinador.md` (busca por título): `## Comandos que puede correr`, `## Archivo y contexto`, `## Respaldo sin subagentes`, y la fila de la tabla que empieza «Todas las tareas de la feature» (cierre de feature: avisos `cierra la rama, haz el PR y despliega`, `node scripts/registrar.mjs` y `node scripts/archivar.mjs --aplicar Fxx`). En `## Límites`, la viñeta que empieza `Solo corres los comandos de «Comandos que puede correr»`.
- `README.md`: árbol de `skills/`, con `modo-yolo/` y `ramas-feature/` ya puestos.
- `contrato-roles.mjs` regla 15 exige en el coordinador las frases `lista cerrada`, `pedido explícito`, `no autoriza` y `git diff scripts/`.
- Lee solo las *Notas* de task-06.

## Decisiones ya tomadas
- Front matter: `name: comandos-coordinador` y `description:` de 160 caracteres o menos (por ejemplo: «Comandos de scripts/ del coordinador (lista cerrada), aviso de archivo, cierre de feature y respaldo sin subagentes. Cárgala cuando toque alguno.»).
- Cuerpo, con cuatro secciones copiadas tal cual: `## Comandos que puede correr`, `## Archivo y contexto`, `## Cierre de feature` (el texto de la celda de paso de la fila «Todas las tareas de la feature hecha», sin la parte que ya es de la tabla: pedir a Franco que confirme `hecha` y delegar `descomponer-feature`) y `## Respaldo sin subagentes`. Tope 5120 B.
- En el `coordinador` solo cambia la viñeta de `## Límites`, que pasa a: `Solo corres los comandos de la lista cerrada de ` + `comandos-coordinador` entre comillas invertidas + `, y solo a pedido explícito de Franco (salvo el cuarto).`. Las secciones y la fila siguen completas. El archivo no crece (tope de criterio 12800 B).
- README: línea `│   ├── comandos-coordinador/` justo antes de `│   └── ejecutar-tarea/`.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: skill nueva, línea de README y una viñeta reescrita.
Fuera de alcance: quitar secciones y mover frases (task-08), cambiar `tools:` o los patrones `Bash(...)`, y todo lo de `definitions/`.

## Pasos
1. Crea `skills/comandos-coordinador/SKILL.md` según «Decisiones ya tomadas».
2. Reescribe la viñeta de `## Límites` en `agentes/coordinador.md`.
3. Añade la línea de `comandos-coordinador/` al árbol de `README.md`.
4. Corre las pruebas de contrato, README y tamaños.

## Criterios de aceptación
1. `contrato-roles.test.mjs` y `readme-estructura.test.mjs` dan `ℹ fail 0`.
2. `skills/comandos-coordinador/SKILL.md` mide 5120 B o menos, con `description` de 160 caracteres o menos y las tres frases de avisos.
3. `agentes/coordinador.md` menciona `comandos-coordinador` y mide 12800 B o menos.
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/readme-estructura.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
test $(wc -c < skills/comandos-coordinador/SKILL.md) -le 5120 && echo "ok-modulo"; echo "exit $?"
node -e 'const t=require("fs").readFileSync("skills/comandos-coordinador/SKILL.md","utf8");const d=/^description: "(.*)"$/m.exec(t)[1];console.log(d.length<=160&&t.includes("node scripts/registrar.mjs")&&t.includes("node scripts/archivar.mjs --aplicar Fxx")&&t.includes("cierra la rama, haz el PR y despliega")?"ok-contenido":"falta")'; echo "exit $?"
grep -q '`comandos-coordinador`' agentes/coordinador.md && test $(wc -c < agentes/coordinador.md) -le 12800 && echo "ok-mencion"; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ℹ fail 0` en el primer comando, `ok-modulo`, `ok-contenido`, `ok-mencion` y `ℹ fail 7`.

## Evidencia

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/readme-estructura.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
exit 0
```

```
$ test $(wc -c < skills/comandos-coordinador/SKILL.md) -le 5120 && echo "ok-modulo"; echo "exit $?"
ok-modulo
exit 0
exit 0
```

```
$ node -e 'const t=require("fs").readFileSync("skills/comandos-coordinador/SKILL.md","utf8");const d=/^description: "(.*)"$/m.exec(t)[1];console.log(d.length<=160&&t.includes("node scripts/registrar.mjs")&&t.includes("node scripts/archivar.mjs --aplicar Fxx")&&t.includes("cierra la rama, haz el PR y despliega")?"ok-contenido":"falta")'; echo "exit $?"
ok-contenido
exit 0
exit 0
```

```
$ grep -q '`comandos-coordinador`' agentes/coordinador.md && test $(wc -c < agentes/coordinador.md) -le 12800 && echo "ok-mencion"; echo "exit $?"
ok-mencion
exit 0
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
exit 0
```

## Notas
- Huecos menores: (1) la viñeta de `## Límites` se escribió «Solo corres los de `comandos-coordinador` (lista cerrada), y solo a pedido explícito de Franco (salvo el cuarto).» en vez de la forma larga de la tarea: la forma larga subía `agentes/coordinador.md` a 12183 B y el encargo pide no subirlo (12174 B). Siguen «lista cerrada» y «pedido explícito» (regla 15 y manifiesto). (2) En «Cierre de feature» quité la parte de pedir `hecha` y delegar `descomponer-feature`, y añadí al inicio «Cuando todas las tareas de la feature están `hecha`,» para dar contexto.
- Pasadas de *Verificación*: 2. La primera antes de ajustar la viñeta (todo pasó salvo el tamaño que luego corregí); la segunda, completa, es la de *Evidencia*.
- Modo yolo: no creé rama ni hice `git switch`; sin commit, push ni merge. No toqué `STATUS.md`, `definitions/` ni `tools:` del coordinador. Las secciones del coordinador se conservan (copia, no movida).
- Autocomprobación final: `node scripts/validar-tarea.mjs --evidencia features/F28-contratos-y-prompts-cortos/task-07-modulo-comandos-coordinador.md` salió 0 con `OK: 1 tarea(s) con evidencia completa`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
