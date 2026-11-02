# task-03 — Crear la skill modo-yolo (copia, sin quitar nada del coordinador)
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Primer módulo del núcleo corto del `coordinador`: la skill `modo-yolo` con las reglas del modo yolo. Esta tarea solo la crea como copia y la enlaza desde el `coordinador` con una mención que no hace crecer el archivo. Mover el texto es task-04; así cada paso se revierte solo con `git revert`.

## Contexto
- Tocar: `skills/modo-yolo/SKILL.md`, `README.md`, `agentes/coordinador.md`
- Fuente: definitions/CONTRATOS.md «4. Prompts: núcleo corto + módulos bajo demanda»
- `agentes/coordinador.md` (17897 B): `## Modo yolo` y `### Mientras está activo` ocupan las líneas 81-103. La fila 52 de la tabla dice `| Franco pide yolo de forma explícita en la conversación | Sección «Modo yolo»: valida los requisitos, regístralo y orquesta sin puertas 2, 3 ni 4 |`. Su `tools:` ya incluye `Skill`.
- `README.md` líneas 81-88: el árbol de `skills/`, que `readme-estructura.mjs` compara con `skills/` (falla si una skill no figura como `nombre/`, o al revés). `contrato-roles.mjs` regla 4 exige que cada skill aparezca entre comillas invertidas en algún agente.
- Cómo carga una skill cada herramienta (leído): `instalar.sh` (líneas 159-190 y 477/493) enlaza o copia `skills/*/` a `~/.claude/skills` y `~/.pi/agent/skills`; el `coordinador` de Claude Code tiene `Skill` en `tools:` y la prueba (4) de `resolver-agentes.test.mjs` exige que el de Pi también la conserve. Que Pi cargue la skill a pedido no se comprueba leyendo código (inferido: `constructor` y `planificador` ya cargan skills por nombre).

## Decisiones ya tomadas
- Front matter: `name: modo-yolo` y `description:` de 160 caracteres o menos (por ejemplo: «Reglas del modo yolo del coordinador: requisitos de entrada y las nueve reglas mientras está activo. Cárgala solo si Franco pide yolo en la conversación.»).
- Cuerpo: `# Modo yolo` y el texto de las líneas 83-103 tal cual (reglas de entrada 1-5 y las nueve reglas). Se pueden quitar palabras repetidas para que el archivo mida 5120 B o menos, pero no cambiar nada de las cuatro frases de la regla 12 (`Modo yolo: activo — alcance <…>; pedido por Franco el <fecha>; rama <…>`, `ADVERTENCIA: rama main`, `Modo yolo: detenido (feature Fxx requiere refinado)`, `Modo yolo: terminado`) ni la línea que empieza `2. **Revisión de «completa»`.
- En el `coordinador`, solo se reescribe la fila 52, que queda así (la sección sigue completa; el archivo no crece, 17897 B o menos):
```
| Franco pide yolo de forma explícita en la conversación | Carga `modo-yolo` (si no puedes, no actúes en yolo y escala) |
```
- README: línea `│   ├── modo-yolo/` justo antes de `│   └── ejecutar-tarea/`.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: skill nueva, línea de README y una fila reescrita.
Fuera de alcance: quitar la sección del `coordinador` y mover frases en el manifiesto (task-04), `instalar.sh` y todo lo de `definitions/`.

## Pasos
1. Crea `skills/modo-yolo/SKILL.md` según «Decisiones ya tomadas».
2. Reescribe la fila 52 de `agentes/coordinador.md`.
3. Añade la línea de `modo-yolo/` al árbol de `README.md`.
4. Corre las pruebas de contrato, README y tamaños.

## Criterios de aceptación
1. `contrato-roles.test.mjs` y `readme-estructura.test.mjs` dan `ℹ fail 0`.
2. `skills/modo-yolo/SKILL.md` mide 5120 B o menos y su `description` 160 caracteres o menos.
3. `agentes/coordinador.md` menciona `modo-yolo` y no pasa de 17897 B.
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/readme-estructura.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
test $(wc -c < skills/modo-yolo/SKILL.md) -le 5120 && echo "ok-modulo"; echo "exit $?"
node -e 'const t=require("fs").readFileSync("skills/modo-yolo/SKILL.md","utf8");const d=/^description: "(.*)"$/m.exec(t)[1];console.log(d.length<=160?"ok-descripcion":"larga")'; echo "exit $?"
grep -q '`modo-yolo`' agentes/coordinador.md && test $(wc -c < agentes/coordinador.md) -le 17897 && echo "ok-mencion"; echo "exit $?"
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
$ test $(wc -c < skills/modo-yolo/SKILL.md) -le 5120 && echo "ok-modulo"; echo "exit $?"
ok-modulo
exit 0
```

```
$ node -e 'const t=require("fs").readFileSync("skills/modo-yolo/SKILL.md","utf8");const d=/^description: "(.*)"$/m.exec(t)[1];console.log(d.length<=160?"ok-descripcion":"larga")'; echo "exit $?"
ok-descripcion
exit 0
```

```
$ grep -q '`modo-yolo`' agentes/coordinador.md && test $(wc -c < agentes/coordinador.md) -le 17897 && echo "ok-mencion"; echo "exit $?"
ok-mencion
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

## Notas
- Modo yolo: sin rama nueva ni `git switch`; trabajo en `main` (rama actual), sin commit.
- `skills/modo-yolo/SKILL.md` pesa 4997 B y su `description` tiene 153 caracteres. Cuerpo copiado de `agentes/coordinador.md` líneas 83-103 sin cambios; el `coordinador` no se tocó más que en la fila 52 (sigue en 17897 B).
- Huecos menores: ninguno.
- Autocomprobación `--evidencia`: `OK: 1 tarea(s) con evidencia completa` (salida 0).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
