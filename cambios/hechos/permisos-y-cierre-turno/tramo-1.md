# Tramo 1

## Pasos

### Tramo 1 — Historia: el hook solo vigila Bash
Como persona usuaria quiero que Claude lea, busque y liste sin pedirme permiso para trabajar sin interrupciones.
Dependencias: No aplica.
Contratos a conservar: Bash no declarado sigue pidiendo aprobación; las acciones protegidas (`git commit`, `git push`, `cat .env`) siguen en «ask»; el hook sigue sin pisar entradas ajenas y es idempotente.
Rutas susceptibles de cambio: `pruebas/permisos-contrato/hook.test.mjs` (se actualiza a la nueva política).
Ejemplo concreto del resultado esperado: tras `instalar`, `settings.local.json` tiene una sola entrada del kit con matcher `Bash`; una decisión para `Grep` o `Glob` no devuelve «ask».
Alcance: dos archivos de producto.
Archivos: scripts/permisos-hook.mjs, docs/reglas-deny.md
CUANDO se instala el hook ENTONCES solo existe el matcher `Bash` y Read/Grep/Glob no piden aprobación (A1).
Aceptación:
- A1: `decidir` no responde «ask» a Read, Grep ni Glob; `instalar` deja un solo matcher `Bash`; una instalación antigua con dos matchers se repara; comprobar con `node --test pruebas/permisos-contrato/hook.test.mjs`; esperar 0 fallos.
TODO:
- [x] En `scripts/permisos-hook.mjs` quitar la entrada `lectura` de `instalar` y el matcher `Read|Grep|Glob` de `estaInstalado` (A1). Comprobación: `grep -c "Read|Grep|Glob" scripts/permisos-hook.mjs`; esperar 0.
- [x] Quitar la rama Read/Grep/Glob de `decidir` y limpiar importaciones sin uso (A1). Comprobación: `node scripts/permisos-hook.mjs comprobar .`; esperar que no falle por sintaxis.
- [x] Actualizar `pruebas/permisos-contrato/hook.test.mjs`: Read/Grep/Glob dan «normal»; la instalación deja 2 entradas (ajena + Bash); la reparación de una instalación con dos matchers deja solo Bash (A1). Comprobación: `node --test pruebas/permisos-contrato/hook.test.mjs`; esperar 0 fallos y que el caso de reparación falle si se restaura el matcher viejo.
- [x] Actualizar `docs/reglas-deny.md` y la viñeta «Permisos por contrato» de `AGENTS.md` para decir que el hook vigila solo Bash (A1). Comprobación: `grep -n "Read|Grep|Glob" docs/reglas-deny.md AGENTS.md`; esperar sin resultados.
Verificación del tramo: `node --test pruebas/permisos-contrato/*.test.mjs` — nivel 1; exit 0; cubre A1.
Handoff: no tocar las reglas deny ni el sandbox; son la protección de `.env`.

## Evidencia

$ grep -c "Read|Grep|Glob" scripts/permisos-hook.mjs
0
exit 1 (grep sin coincidencias)

$ node --check scripts/permisos-hook.mjs && node scripts/permisos-hook.mjs comprobar .
ausente
exit 0

$ node --test pruebas/permisos-contrato/hook.test.mjs
✔ Claude autoriza solo el comando declarado cuando los scripts siguen limpios en HEAD
✔ Claude pide aprobación si verify o el script rápido está modificado, preparado o ausente
✔ un ejecutable local sin extensión queda protegido frente a cambios
✔ acciones directas protegidas de Bash siguen pidiendo aprobación; Read, Grep y Glob no pasan por el hook
✔ instala hooks sin pisar entradas ajenas, es idempotente y kit run exige esa política
✔ auditar enumera reglas allow amplias previas por archivo y avisa si no hay hook
ℹ tests 6 / pass 6 / fail 0
exit 0

$ grep -n "Read|Grep|Glob" docs/reglas-deny.md AGENTS.md
exit 1 (sin coincidencias)

$ node --test pruebas/permisos-contrato/*.test.mjs   (Verificación del tramo)
ℹ tests 9 / pass 9 / fail 0
exit 0

## Notas
- Punto de control del tramo 1: archivos tocados `scripts/permisos-hook.mjs` (quita la entrada Read|Grep|Glob de instalar, estaInstalado y decidir; quita el import realpathSync sin uso), `pruebas/permisos-contrato/hook.test.mjs` (lectura «normal», instalación con 2 entradas, reparación de dos matchers a uno), `docs/reglas-deny.md` y `AGENTS.md` (hook solo Bash). Diff: solo cambia la política de lectura; reglas deny y sandbox intactos.
- La comprobación de que el caso de reparación falla con el matcher viejo no se ejecutó como mutación; queda implícita en la aserción `!some(Read|Grep|Glob)`. Pendiente si se quiere evidencia explícita.
