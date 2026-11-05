# task-02 — Análisis: fuentes que más pesan, repetidas y no pedidas
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Con la tabla de `medicion.md` (task-01) se identifican las fuentes de contexto que más pesan, las que se repiten entre lanzamientos o roles y las que el prompt del rol no pide. El resultado es una lista corta en `analisis.md` que elige los candidatos a caché de task-03. No cambia ninguna regla ni prompt.

## Contexto
- Leer: `features/F43-auditoria-contexto/medicion.md`, `definitions/F43-AUDITORIA.md@17-1`
- Tocar: `features/F43-auditoria-contexto/analisis.md`
- Para la columna «¿su prompt dice que la necesita?» no se leen los cuatro prompts (suman 17150 bytes): se consulta cada uno con `grep -n` sobre `agentes/<rol>.md` buscando la ruta o su carpeta (por ejemplo `grep -n 'STATUS.md' agentes/planificador.md`).
- Roles: `coordinador`, `arquitecto`, `planificador`, `constructor` (archivos `agentes/<rol>.md`, *confirmado*).
- De `depende_de:` leer solo las *Notas* de task-01.
- Fuente: definitions/F43-AUDITORIA.md «1. Qué se mide y cómo»
- Requiere: ninguno

## Decisiones ya tomadas
- `analisis.md` tiene tres secciones: `## Top 10` (copia las 10 filas de `medicion.md`), `## Repetidas` (misma ruta leída ≥2 veces en un rol, o por ≥2 roles) y `## No pedidas por el prompt` (fuentes leídas por un rol cuyo prompt no menciona la ruta ni su carpeta; sí/no a mano con el `grep` usado).
- Cierra con `## Candidatos`: exactamente 3 fuentes (las que más pesan y se repiten entre roles), cada una con KB totales y roles. Si hay menos de 3 que cumplan, lista las que haya y lo dice.
- Solo lectura de código: no se corre ningún lanzamiento ni se edita otro archivo.
- Los datos `n/d` de la tabla se citan como `n/d`; no se estiman.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: `analisis.md`.
Fuera de alcance: re-medir, cambiar `scripts/contexto-fuentes.mjs`, documentación de mecanismos (task-03), recortar prompts, agentes, skills, el commit.

## Pasos
1. Corre `git branch --show-current`.
2. Lee `medicion.md` y copia el Top 10 en `analisis.md` bajo `## Top 10`. Resultado: 10 filas (o las que existan).
3. Para cada fila del top, corre el `grep -n` sobre el prompt del rol y anota sí/no en `## No pedidas por el prompt`.
4. Lista en `## Repetidas` las rutas con `veces` ≥2 o presentes en ≥2 roles.
5. Escribe `## Candidatos` con las 3 fuentes elegidas y por qué.
6. Corre la verificación y copia la salida en *Evidencia*.

## Criterios de aceptación
1. Rama `chore/F43-auditoria-contexto` (comando 1).
2. `analisis.md` tiene las cuatro secciones (comando 2).
3. `## Candidatos` lista a lo sumo 3 fuentes (comando 3).
4. Ningún otro archivo cambió (comando 4).

## Verificación
```
git branch --show-current
grep -c '^## Top 10\|^## Repetidas\|^## No pedidas por el prompt\|^## Candidatos' features/F43-auditoria-contexto/analisis.md
awk '/^## Candidatos/{f=1;next} f&&/^- /{n++} END{print n}' features/F43-auditoria-contexto/analisis.md
git status --short
```
Esperado: rama `chore/F43-auditoria-contexto`; `4`; un número entre 1 y 3; en `git status` solo rutas bajo `features/F43-auditoria-contexto/` (y los cambios previos de task-01, `scripts/contexto-fuentes.mjs` y su prueba).

## Evidencia

```
$ git branch --show-current
chore/F43-auditoria-contexto
exit 0
```

```
$ grep -c '^## Top 10\|^## Repetidas\|^## No pedidas por el prompt\|^## Candidatos' features/F43-auditoria-contexto/analisis.md
4
exit 0
```

```
$ awk '/^## Candidatos/{f=1;next} f&&/^- /{n++} END{print n}' features/F43-auditoria-contexto/analisis.md
3
exit 0
```

```
$ git status --short
 M definitions/BACKLOG.md
 M definitions/STATUS.md
?? definitions/F43-AUDITORIA.md
?? features/F43-auditoria-contexto/
?? pruebas/comprobaciones/contexto-fuentes.test.mjs
?? scripts/contexto-fuentes.mjs
exit 0
```

## Notas

- Entorno: `node ~/.flucastr-ai/entorno.mjs` salió con `ok`. Rama: el encargo trae `Rama: chore/F43-auditoria-contexto`, existe y es la actual; no se ejecutó ningún `git switch`. Sin commit.
- Huecos menores: (a) el Top 10 se copió tal cual de `medicion.md`, con las rutas absolutas y relativas como vienen; (b) `Repetidas` y `Candidatos` se calculan solo con las 34 filas visibles de `medicion.md`; la tabla completa (`--json`) no se re-midió; (c) `agentes/coordinador.md` aparece con dos formas de ruta en la medición (absoluta: constructor, 212 KB; relativa: coordinador 69.9 KB y arquitecto 46.8 KB); se sumaron como el mismo archivo, lo que sube el total a 328.7 KB; el script `scripts/contexto-fuentes.mjs` no normaliza rutas (no se toca, está fuera de alcance); (d) para las filas 1, 2, 5 y 7 el `grep` no devuelve nada; la 1 es el propio prompt, que el harness carga; (e) las filas 4 y 6 solo mencionan la carpeta `definitions/`; se marcaron «sí (solo carpeta)» y la 6 aparece como prohibición en la línea 45; (f) el rol `desconocido` de la medición se contó como un rol más al decidir la repetición de `definitions/BACKLOG.md`.
- Candidatos: `definitions/BACKLOG.md` (524.3 KB, 3 roles), `definitions/WORKFLOW.md` (471.9 KB, 3 roles) y `agentes/coordinador.md` (328.7 KB, 3 roles). `agentes/constructor.md` pesa más (861.3 KB) pero lo lee un solo rol, por el criterio de repetición entre roles queda fuera.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=6; resultado=lista; causa=ninguna
