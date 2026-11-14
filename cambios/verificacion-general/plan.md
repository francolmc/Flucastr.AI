---
estado: borrador
rama: feature/verificacion-general
base: main
repos: [.]
ejecutor: constructor
tramo: 1
tipo: codigo
---
# Perfil de verificación rápida: convención y auditor para todos los proyectos

## Objetivo
Que el kit pueda **comprobar** si un proyecto cumple la verificación rápida (Nivel 1, Dockerfiles con caché, tiempos y diagnóstico en `verify`) y que `preparar-proyecto` lo pida desde el inicio. Evidencia: `cambios/auditoria-verificacion-general/hallazgo.md`.

## Supuestos
- El auditor es de solo lectura y offline: no corre Docker ni `verify`. Si Franco quiere que además mida tiempos reales, es otro plan.
- Revisa Dockerfiles por texto (orden de `COPY` y de instalación); no entiende todos los lenguajes. Reconoce `npm ci`, `pnpm install`, `yarn install`, `pip install`; cualquier otro lo ignora.
- La convención no obliga a un solo patrón de caché: pide la caché de paquetes y da el ejemplo de pnpm y npm.

## Alcance
Puede cambiar: `scripts/auditar-verificacion.mjs` (nuevo), `scripts/fixtures-auditor/` (proyectos de prueba mínimos), `skills/preparar-proyecto/SKILL.md`, `README.md` (una viñeta) y `verify` (bloque 8r).
Fuera: los proyectos DonFinancio, Byteria y DASH, `instalar.sh`, agentes, `modelos.json`.

## Decisiones ya tomadas
- Ejecutor: constructor, porque los cuatro sí de la prueba: reglas y salida definidas, fixtures propios, sin credenciales ni producción.
- Uso: `node scripts/auditar-verificacion.mjs <carpeta-del-proyecto>`; sale con 1 si hay algún ERROR, 0 si solo hay AVISO.
- Comprobaciones y su gravedad:
  - ERROR: `AGENTS.md` sin línea `Comprobación rápida:`.
  - ERROR: algún Dockerfile con `COPY . .` (o `COPY . /…`) **antes** de una instalación de dependencias.
  - AVISO: instalación sin `--mount=type=cache` en el mismo `RUN`.
  - AVISO: ningún `verify` imprime tiempos por fase (busca la cadena `Tiempos:`).
  - AVISO: `verify` limpia (`down`) sin antes volcar diagnóstico (busca `OOMKilled` o `docker compose … logs`).
  - AVISO: `verify` usa `--no-cache` por defecto, sin `VERIFY_RAPIDO`.
- Salida: una tabla de texto, una línea por comprobación, con la ruta y la línea del hallazgo.
- Fragmento de tiempos que la convención muestra: `Tiempos: build=<s> arranque=<s> recorrido=<s> total=<s>` al final de `verify`.

## Escenarios
- CUANDO el proyecto de fixtures «malo» se audita ENTONCES salen los 2 ERROR y los AVISO esperados y exit 1 (A1).
- CUANDO el fixture «bueno» se audita ENTONCES no hay ERROR ni AVISO y exit 0 (A2).
- CUANDO se quita una sola característica del fixture bueno ENTONCES se detecta justo esa (A3).
- CUANDO se lee `preparar-proyecto` ENTONCES pide Nivel 1, patrón de Dockerfile con caché, tiempos y diagnóstico al fallar, y remite al auditor (A4).
- CUANDO se corre el kit ENTONCES los bloques existentes pasan (A5).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Detecta lo malo | `node scripts/auditar-verificacion.mjs scripts/fixtures-auditor/malo` | exit 1; líneas ERROR de `Comprobación rápida` y `COPY . .` |
| A2 | Acepta lo bueno | mismo comando sobre `…/bueno` | exit 0 y ninguna línea ERROR ni AVISO |
| A3 | Es sensible | en el bloque 8r, copia del fixture bueno sin `--mount=type=cache`; luego sin `Tiempos:` | cada copia da su AVISO y solo ese |
| A4 | Convención escrita | `grep -cF` de `Comprobación rápida`, `--mount=type=cache`, `Tiempos:`, `auditar-verificacion` en `preparar-proyecto` | 1 o más cada una |
| A5 | Nada se rompe | `./verify` | exit 0 con `ok 8r` |

## Verificación
`./verify` — offline; debe terminar en exit 0.

## Pasos
### Tramo 1 — el auditor (≈ 20 min, sin Docker)
Resultado: el script audita carpetas y sus pruebas pasan.
Archivos: `scripts/auditar-verificacion.mjs`, `scripts/fixtures-auditor/{bueno,malo}/`, `verify` (bloque 8r).
- [ ] Crea los fixtures: `bueno/` y `malo/`, cada uno con `AGENTS.md`, un `Dockerfile`, un `verify` mínimo; el malo copia todo antes de instalar y no declara Nivel 1 (A1, A2)
- [ ] Crea `scripts/auditar-verificacion.mjs` con las seis comprobaciones de *Decisiones*, salida en tabla y exit 0/1 (A1, A2)
- [ ] En `verify`, bloque 8r: audita `malo` (exit 1) y `bueno` (exit 0); genera dos copias del bueno, sin caché y sin `Tiempos:`, y exige su AVISO exacto (A3)
Verificación del tramo: `./verify` exit 0 con `ok 8r` (cubre A1–A3, A5).

### Tramo 2 — la convención (≈ 10 min)
Resultado: `preparar-proyecto` pide el perfil rápido y remite al auditor.
Archivos: `skills/preparar-proyecto/SKILL.md`, `README.md`.
- [ ] En `preparar-proyecto`, sección 2 (`verify`), añade el «perfil de verificación rápida»: Nivel 1 obligatorio en `AGENTS.md`; Dockerfile con manifiestos antes del código y `--mount=type=cache` (ejemplos pnpm y npm); línea `Tiempos:`; diagnóstico al fallar antes de limpiar; y «audita con `node scripts/auditar-verificacion.mjs <proyecto>`» (A4)
- [ ] En `README.md`, una viñeta del auditor (A4)
- [ ] En `verify`, amplía 8r para exigir las cuatro cadenas de A4 en `preparar-proyecto` (A4)
- [ ] Corre `./verify` y pega la cola en *Evidencia* (A5)
Verificación del tramo: `./verify` exit 0 (cubre A4, A5).

## Evidencia
(la escribe el constructor)

## Notas
(la escribe el constructor)
