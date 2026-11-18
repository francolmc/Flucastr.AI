# Tramo 14 — Auditoría y verificación final

## Pasos

### Tramo 14 — Historia: integración completa

Como persona que reutiliza el kit quiero comprobar que las instrucciones, interfaces y documentación funcionan juntas y que las referencias personales se eliminaron para que el kit sea reutilizable.

Dependencias: tramos 1 a 13 completados y revisados.

Contratos a conservar: los definidos en el índice y los tramos anteriores. No leer credenciales, temporales ni el historial Git.

Rutas sensibles: el inventario anonimizado y las rutas versionadas afectadas; conservar `LICENSE` y las URLs funcionales acordadas.

Ejemplo: ejecutar una entrada inglesa y su alias español con los mismos argumentos produce resultados equivalentes y mensajes en español.

Alcance: auditoría de las modificaciones y registro de evidencia; no se modifica producto en este tramo.

Archivos: cambios/idioma-adaptable/plan.md

CUANDO se ejecuta la verificación integral ENTONCES pasan las pruebas y la auditoría de referencias y enlaces sin excepciones adicionales (A14).

Aceptación:
- A14: `./verify` y `git diff --check` terminan con código cero; el inventario y las rutas afectadas no contienen referencias personales o a proyectos fuera de las excepciones acordadas, incluidos contratos ejecutables y citas históricas exactas; la evidencia registra resultados sin reproducir datos personales.

TODO:
- [x] Revisar `cambios/idioma-adaptable/exploracion.md` y los resultados de la búsqueda final del tramo 13, incluyendo rutas y enlaces modificados (A14). Comprobación: cotejar las excepciones con el índice; esperar cero referencias no exceptuadas y enlaces existentes.
- [x] Ejecutar `git diff --check` y `./verify` desde la raíz (A14). Comprobación: ambos terminan con código cero y `./verify` informa `VERIFY OK`.
- [x] Registrar los resultados y limitaciones en `cambios/idioma-adaptable/plan.md` (A14). Comprobación: la evidencia identifica comandos y resultados sin incluir datos personales.

Verificación del tramo: `./verify` — nivel 3, exit 0 y `VERIFY OK`; cubre A14.

Handoff: informar cualquier excepción no autorizada, fallo o enlace roto; no cerrar ni hacer commit.

## Evidencia

Registrada en `cambios/idioma-adaptable/plan.md`, sección «Evidencia», entradas «Tramo 14, paso 1» y «Tramo 14, paso 2» (A14).

## Notas

- Punto de control tramo 14: archivos tocados `cambios/idioma-adaptable/plan.md` y `cambios/idioma-adaptable/tramo-14.md`; sin cambios de producto. Búsqueda final: 60 coincidencias en 36 archivos, todas cotejadas con `excepciones.md` (58 por ruta y motivo; 2 citas de `tramo-13.md` que referencian excepciones). Enlaces relativos fuera de `old/v1/`: 192, 0 rotos. `git diff --check` y `git diff --cached --check`: exit 0. `./verify`: VERIFY OK, exit 0, 165 `ok`, `ℹ fail 0` en todas las suites.
- Para el principal: `plan.md:82` del registro es ahora la línea 84 (mismo contenido). Dentro de `old/v1/` (fuera de A13 por decisión de la persona usuaria) hay 25 enlaces relativos y 6 rotos; no se han reparado. Si la revisión considera que A14 incluye `old/v1/`, sería una decisión nueva.
- Limitación conocida: `./verify` omite `pruebas/comparar-openspec/` por ausencia de la carpeta (AVISO 10), como en tramos anteriores.
- Nota de cierre: no hay commit ni cambios de producto; `anonimizacion.md:25` no se tocó.
