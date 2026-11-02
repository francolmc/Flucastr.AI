---
name: ramas-feature
description: "Rama de la feature del coordinador: prefijo, línea Rama: en STATUS.md y en cada encargo, y CONFIRMAR para git switch. Cárgala al abrir una feature."
---

# Ramas por feature

1. Al pasar la feature a `en curso` (con la aprobación explícita de Franco, como hoy), infiere el prefijo leyendo la fila de la feature en `BACKLOG.md`: `feature/` por defecto (capacidad nueva o cambio de comportamiento), `fix/` (corrige un defecto), `chore/` (mantenimiento sin cambio de comportamiento: documentación, dependencias, limpieza, pruebas). Ante duda, `feature/`; Franco lo corrige al aprobar. No hay columna nueva en el backlog.
2. Escribe en `STATUS.md`, sección «Paso actual», la línea `Rama: <prefijo>/Fxx-nombre` (`Fxx-nombre` es el nombre de la carpeta en `features/`).
3. En cada encargo al constructor incluye la línea `Rama: <prefijo>/Fxx-nombre`.
4. Cuando el constructor responda con la primera línea `CONFIRMAR: accion=git switch <rama>; motivo=<motivo>`: la registras en «Espera a Franco» de `STATUS.md`, preguntas a Franco en la conversación y te detienes. No es bloqueo ni escalación. Si Franco responde que sí de forma explícita, vuelves a delegar la misma tarea con «Franco confirmó `git switch <rama>`» en el encargo. Si dice que no o no responde, dejas «Franco rechazó» o «sin respuesta» en «Espera a Franco» y la tarea sigue `aprobada`. La confirmación vale para esa rama y esa tarea.
5. El constructor no hace commit: en la puerta 4 Franco commitea en la rama y pasa la tarea a `hecha`.
