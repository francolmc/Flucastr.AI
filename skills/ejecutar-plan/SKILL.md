---
name: ejecutar-plan
description: "Aplica un plan aprobado de `cambios/<nombre>/plan.md`: recorre los pasos, corrige dentro del alcance, corre `verify` y deja evidencia real. Úsala al construir."
---

# Ejecutar un plan

Entrada: la ruta del plan.

## Antes de empezar

1. Lee el plan completo por tramos. Si `estado` no es `aprobado`, detente; no cambies nada.
2. Si el encargo trae `Rama:`: para cada carpeta de `repos:` del frontmatter, y solo esas:
   - Si no tiene `.git`, anótalo en *Notas* y sigue.
   - Si `git -C <carpeta> branch --show-current` ya es la rama, sigue.
   - Si existe (`git -C <carpeta> rev-parse --verify --quiet refs/heads/<rama>`), `PAUSA` con `motivo=acceso`.
   - Comprueba la rama base (`base:`; si falta, `git symbolic-ref --short refs/remotes/origin/HEAD`; sin remoto, `main` o `master`) y que no haya cambios fuera de `cambios/<nombre>/` con `git status`/`git diff`. Si no cumple, `PAUSA` con `motivo=acceso`.
   - Si cumple, crea únicamente la rama autorizada: `git -C <carpeta> switch -c <rama>` (en `.`, `git switch -c <rama>`).
   - Si falta `repos:`, `PAUSA` con `motivo=ambiguo`.
3. Cambia `estado: en curso`.

Git de lectura permitido, solo dentro de esas carpetas: `status`, `diff`, `branch --show-current`, `rev-parse --verify --quiet` y `symbolic-ref`, con o sin `-C`. La única escritura Git permitida es crear la rama autorizada con `switch -c`. No hagas commit, push, PR, merge ni despliegue.

## Tramo

Si el plan trae `tramo: <n>` en el frontmatter, ejecuta solo los pasos de `### Tramo <n>`; los demás tramos no los tocas, aunque estén en el plan. Su verificación es la línea `Verificación del tramo:`. Si el tramo es el último, además corre la *Verificación* del plan completa. Al terminar, devuelve el retorno de tramo (ver *Al terminar*). Si el plan no trae `tramo:`, es un plan de un solo tramo.

## Bucle de ejecución

Para cada paso `- [ ]`, en orden:

- Haz el cambio mínimo y enfocado dentro de *Alcance*; nunca recortes, pospongas ni simplifiques lo pedido.
- Verifica cada unidad coherente al terminarla, antes de marcar el paso.
- Marca `- [x]` solo si el comportamiento especificado está **completo** y comprobado.
- Debajo del paso agrega su línea: `  - evidencia: <archivos creados, o comando y exit N>`.
- Comprueba progreso mediante el bloque canónico de contador `bash pendientes-plan` definido abajo, pasando la ruta del plan como `$1`. Registra la cuenta y no interpretes un error de lectura como cero. Con pendientes, continúa al siguiente paso salvo bloqueo permitido.
- Corrige fallos relacionados dentro del alcance y anótalos en *Notas*.

### Ritmo de cada paso

Cada paso sigue este ritmo, en orden:

1. Lee el archivo que vas a cambiar.
2. Reproduce el defecto o el estado de partida con un comando y anota su salida.
3. Cambia lo mínimo necesario.
4. Ahora, vuelve a correr el mismo comando y compara con la salida anotada.
5. Marca el paso solo si el resultado de su A# se cumple.

### Contador canónico

```bash pendientes-plan
#!/usr/bin/env bash
set -e
awk '
  /^- \[ \]/ { n++ }
  END { print n+0 }
' "$1"
```

Cuenta solo casillas pendientes raíz, imprime `0` si no hay coincidencias y propaga errores de lectura.

## Verificación final

Con los demás pasos hechos, ejecuta el comando de *Verificación* **tal cual** antes de marcar su paso específico. Los checks locales por unidad no consumen las tres corridas finales; no repitas una suite idéntica sin cambio o diagnóstico nuevo.

- Si pasa, registra salida real y marca el paso.
- Si falla, busca la causa raíz en todo el alcance, corrige dentro de él y vuelve a correr.
- **Tope:** 3 corridas finales. Si la misma causa persiste tras dos correcciones o la tercera corrida no pasa, devuelve `PAUSA` con `motivo=verify` y diagnóstico completo.
- Concluye solo con requisitos de Aceptación satisfechos, verificación final verde y cero pasos pendientes. Las casillas son progreso declarado, no evidencia independiente.

## Cuenta, contexto y pausa

- Con pendientes continúas salvo bloqueo permitido; no existe prohibición absoluta de pausar con pendientes.
- Si el harness avisa un corte inminente, persiste avance y siguiente acción en *Notas*; no declares COMPLETADO. Una interrupción deja `en curso`, no es PAUSA de producto. El principal reconstruye el estado y vuelve a aprobar antes de reanudar.
- Pausa solo en estos casos:
  - Un paso es ambiguo y varias lecturas cambian el resultado → `motivo=ambiguo`.
  - La solución del plan no funciona (problema de diseño) → `motivo=diseño`.
  - Hace falta trabajo fuera de *Alcance* o que cambia un comportamiento especificado → `motivo=alcance`.
  - Falta una credencial, un acceso o una herramienta → `motivo=acceso`.
  - `verify` no pasa en 3 corridas → `motivo=verify`.
- Antes de una `PAUSA` con `motivo=ambiguo` o `motivo=acceso`, busca `Resuelto:` en *Decisiones ya tomadas* del plan. Lo que ya figura como `Resuelto:` no se vuelve a pedir: lo aplicas tal cual.
- La `PAUSA` tiene esta primera línea: `PAUSA: plan=<ruta>; tramo=<n>; motivo=<...>; hecho=<n>/<total>; siguiente=<paso exacto>; no_intentado=<por qué>` (en un plan sin `tramo:`, omite `tramo=<n>`). Debajo, el problema y 2 o 3 opciones cerradas, una marcada «(recomendada)».

No adivines: pausa. Deja lo hecho como está.

## Evidencia

En *Evidencia* pega cada comando de verificación como `$ <comando>`, idéntico al del plan, con su salida **real** (la cola relevante, hasta unos 1,5 KB; nunca inventada) y una última línea `exit N` con el código real.

Ejemplo de línea de evidencia debajo de un paso: `  - evidencia: \`skills/ejecutar-plan/SKILL.md\` línea 46`, o `  - evidencia: \`./verify\`, exit 0`.

## Al terminar

- En *Notas*: decisiones menores que tomaste y fallos relacionados que corregiste.
Estados que usas (el principal define el resto):

- Al empezar: `en curso`.
- `estado: listo` si `verify` pasó; `estado: parcial` solo si devuelves `PAUSA`.
- **Nunca** otro estado. Cerrar y mover la carpeta a `cambios/hechos/` es del principal, no tuyo.
- Primera línea de tu respuesta: `COMPLETADO` o `PAUSA`, con el formato de tu agente.
- Retorno de tramo: `COMPLETADO: plan=<ruta>; tramo=<n>; verify=pasa`. La `PAUSA` conserva su formato y añade `tramo=<n>`. En un plan sin `tramo:`, `COMPLETADO` no lleva `tramo=`.
- Ejemplo de `COMPLETADO`: `COMPLETADO: plan=cambios/ejemplo/plan.md; tramo=2; verify=pasa`.
- Ejemplo de `PAUSA`: `PAUSA: plan=cambios/ejemplo/plan.md; tramo=2; motivo=acceso; hecho=4/9; siguiente=paso 5 del Tramo 2; no_intentado=falta la rama feature/ejemplo y no hay permiso para crearla`.
