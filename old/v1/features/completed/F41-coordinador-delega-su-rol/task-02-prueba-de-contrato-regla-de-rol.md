# task-02 — Prueba de contrato de la regla de rol en el agente generado (Claude Code y Pi)
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Fija con pruebas la regla de rol de task-01: el manifiesto de frases exige el puntero en `agentes/coordinador.md` y la regla en la skill, y una prueba nueva comprueba el puntero en el agente generado para Claude Code y para Pi, que el prompt no creció y que la skill conserva la regla.

## Contexto
- Tocar: `pruebas/comprobaciones/frases-por-archivo.mjs`, `pruebas/comprobaciones/rol-coordinador.test.mjs`
- `frases-por-archivo.mjs`: `export const FRASES_POR_ARCHIVO` abre con `'agentes/arquitecto'`; las claves `'agentes/coordinador'` y `'skills/comandos-coordinador'` ya existen y terminan con la lista de frases propias. `contrato-roles.mjs` exige cada frase del manifiesto en su archivo.
- Patrón de la prueba nueva: `pruebas/comprobaciones/coordinador-turnos.test.mjs` (función `generar(orden)` con `spawnSync('node', ['scripts/resolver.mjs', orden, 'agentes/coordinador.md'], { cwd: RAIZ })`, órdenes `agente-claude` y `agente-pi`).
- Frases de task-01: puntero `antes de pedirle algo a Franco` (agente); en la skill `Franco hace solo lo suyo`, «incluida la marca `→` de `BACKLOG.md`», `No le pasas a Franco comandos manuales` y `no se lo pasas a Franco`.
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- La especificación es la viñeta «Alcance de F41 (Franco, 2026-11-04)» de esa sección.
- Requiere: ninguno

## Decisiones ya tomadas
- En `frases-por-archivo.mjs`, antes de `FRASES_POR_ARCHIVO`, se añade `export const FRASES_ROL_F41 = { coordinador: ['antes de pedirle algo a Franco'], 'comandos-coordinador': [las cuatro frases de la skill] };` y se agregan con `...FRASES_ROL_F41.coordinador` y `...FRASES_ROL_F41['comandos-coordinador']` al final de las listas de `'agentes/coordinador'` y `'skills/comandos-coordinador'`.
- `rol-coordinador.test.mjs` tiene 5 pruebas: (a) y (b) el coordinador generado para Claude Code y para Pi contiene el puntero y el nombre `comandos-coordinador`; (c) la skill contiene las cuatro frases; (d) `agentes/coordinador.md` mide 7155 bytes o menos; (e) negativa: la salida de Pi sin el puntero (`replace`) produce un error que lo menciona. Importa `FRASES_ROL_F41` de `./frases-por-archivo.mjs`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: una constante y dos spreads en el manifiesto, y el archivo de prueba nuevo.
Fuera de alcance: editar agentes o skills, otras reglas del manifiesto, `topes-bytes.test.mjs`.

## Pasos
1. Comprueba `git branch --show-current`.
2. Añade `FRASES_ROL_F41` y los dos spreads en `frases-por-archivo.mjs`.
3. Crea `rol-coordinador.test.mjs` con las 5 pruebas.
4. Corre la *Verificación*.

## Criterios de aceptación
1. La rama activa es `fix/F41-coordinador-delega-su-rol` (comando 1).
2. La prueba nueva tiene 5 pruebas y 0 fallos (comando 2).
3. El contrato de roles sigue en verde con las frases nuevas (comando 3).
4. Solo cambió el manifiesto y existe el archivo de prueba (comandos 4 y 5).

## Verificación
Comando 1:
```
git branch --show-current
```
Esperado: `fix/F41-coordinador-delega-su-rol`.

Comando 2:
```
node --test pruebas/comprobaciones/rol-coordinador.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
```
Esperado: `ℹ tests 5` y `ℹ fail 0`.

Comando 3:
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs 2>&1 | grep -E '^ℹ fail'
```
Esperado: `ℹ fail 0`.

Comando 4:
```
git diff --stat -- pruebas/comprobaciones/frases-por-archivo.mjs
```
Esperado: solo `frases-por-archivo.mjs`, con inserciones y sin borrados.

Comando 5:
```
ls pruebas/comprobaciones/rol-coordinador.test.mjs
```
Esperado: imprime la ruta.

## Evidencia
```
$ git branch --show-current
fix/F41-coordinador-delega-su-rol
exit 0

$ node --test pruebas/comprobaciones/rol-coordinador.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 5
ℹ fail 0
exit 0

$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs 2>&1 | grep -E '^ℹ fail'
ℹ fail 0
exit 0

$ git diff --stat -- pruebas/comprobaciones/frases-por-archivo.mjs
 pruebas/comprobaciones/frases-por-archivo.mjs | 13 +++++++++++++
 1 file changed, 13 insertions(+)
exit 0

$ ls pruebas/comprobaciones/rol-coordinador.test.mjs
pruebas/comprobaciones/rol-coordinador.test.mjs
exit 0
```

## Notas
- Sin huecos menores. Las frases de la skill se leen de `skills/comandos-coordinador/SKILL.md` directamente; la prueba (c) comprueba las cuatro, incluida la marca `→` de `BACKLOG.md` como texto literal.
- Los dos bloques de frases del manifiesto se agregaron con `...FRASES_ROL_F41.coordinador` y `...FRASES_ROL_F41['comandos-coordinador']` al final de sus listas, tal como dice *Decisiones ya tomadas*.
- Sin commit, push, PR, merge ni despliegue. Franco revisa la *Evidencia* y commitea.

Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
