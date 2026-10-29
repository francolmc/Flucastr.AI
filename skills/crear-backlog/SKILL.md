---
name: crear-backlog
description: "Crea `definitions/BACKLOG.md`: lista ordenada y corta de features, con habilitantes primero, a partir de la definición aprobada. Úsala en la puerta 2, cuando no hay backlog."
---

# Crear el backlog

Entrada: `definitions/PROJECT.md`, `REPOS.md`, `ARCHITECTURE.md` (aprobados) y los repos referidos.

## Pasos

1. **Qué falta para construir y verificar.** Revisa (solo lectura) cada repo: ¿hay andamiaje, forma de correr y probar, despliegue local para e2e? Lo que falte es una feature **habilitante**.
2. **Lista las features de producto** que salen del objetivo de `PROJECT.md`. Cada una es un resultado que Franco puede ver o usar, no una capa técnica.
3. **Ordena.** Habilitantes primero; luego por valor sobre esfuerzo. Justifica cada posición en una frase.
4. **Marca la primera pendiente** en la columna `Siguiente`.
5. Escribe `definitions/BACKLOG.md` con el formato de abajo, estado `borrador`.

## Formato

Tabla, una fila por feature, en orden:

`ID | Feature | Tipo (habilitante / producto) | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente`

- `ID`: `F01`, `F02`… (coincide con la carpeta `features/F01-nombre/`).
- `Valor` y `Esfuerzo`: `alto`, `medio` o `bajo`.
- `Estado`: `pendiente`, `en curso` o `hecha`.
- `Siguiente`: `→` solo en la primera `pendiente`; vacío en las demás.

Debajo de la tabla, una línea `Estado del documento: borrador`.

## Reglas

- Corto y general: **sin detalle de tareas**. Eso lo hace `descomponer-feature`.
- **Máximo 6 features.** Si salen más, agrupa o deja las últimas fuera y dilo en una nota.
- **Ninguna feature es «probar el flujo» ni una prueba.** Solo entran resultados que Franco pueda ver o usar, o habilitantes reales (lo que hace falta para construir o verificar). Las pruebas del propio flujo no son features.
- No inventes features que no estén en la definición; si algo falta, pregúntalo.
- Con varios repos, indica en `Feature` el repo principal entre paréntesis.
- No crees `features/` aquí.
