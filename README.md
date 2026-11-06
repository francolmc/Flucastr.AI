# Flucastr.AI

Kit personal de agentes y skills para trabajar con IA en Claude Code y Pi. Versión 2.

## Qué es

Dos agentes y dos puertas humanas:

- **`principal`** (nivel medio): entiende lo que Franco quiere, investiga, diagnostica, escribe el plan y verifica el resultado.
- **`constructor`** (nivel bajo): aplica el plan aprobado, corre `verify` y deja la evidencia.
- **Puerta 1**: Franco aprueba `cambios/<nombre>/plan.md` antes de construir.
- **Puerta 2**: Franco revisa la evidencia antes de dar algo por hecho.

El único traspaso entre agentes es `cambios/<nombre>/plan.md`. Los niveles se traducen a modelos en `modelos.json`.

«Hecho» significa que `./verify` pasa desde cero.

## Skills

- `planificar-cambio`: escribe el plan de un cambio.
- `ejecutar-plan`: aplica un plan aprobado.
- `preparar-proyecto`: deja un proyecto listo (`AGENTS.md` y `verify`).

## Instalación

```bash
bash instalar.sh              # instala en Claude Code y Pi
bash instalar.sh --simular    # muestra lo que haría, sin escribir nada
bash instalar.sh --proyecto <ruta>   # además fija el agente y las reglas deny en un proyecto
```

Opciones útiles: `--copiar` (copia las skills en vez de enlazarlas), `--solo claude|pi`, `--skills-proyecto`.

Para desinstalar: `bash desinstalar.sh`.

## Verificación

```bash
./verify
```

Comprueba que `modelos.json` coincide con los agentes, que la sintaxis de instalar y desinstalar es válida, que los modelos se resuelven para Claude y Pi, que las skills están completas, que `instalar.sh --simular` no escribe nada y que las reglas deny del proyecto están bien.

## Estructura

- `agentes/`: definiciones de `principal` y `constructor`.
- `skills/`: las tres skills.
- `scripts/resolver.mjs`: resuelve modelos y ajustes para las herramientas.
- `cambios/`: un directorio por cambio, con su `plan.md`.
- `modelos.json`: nivel de cada agente y su modelo en Claude y Pi.

## La v1

La versión 1 está en `old/v1/` y también en el tag `kit-v1`. No se ejecuta ni se mantiene. Se borra cuando la v2 se haya usado en 2 o 3 proyectos reales.
