---
name: disenar-experiencia
description: "Diseña la experiencia de una interfaz antes de planificarla: deja `docs/experiencia.md` (una vez por proyecto) y `cambios/<nombre>/pantallas.md` (por cambio) con un boceto ASCII que Franco aprueba en la terminal. Úsala si el proyecto tiene interfaz nueva o el cambio agrega o reordena pantallas."
---

# Diseñar la experiencia

Franco trabaja en la terminal: lo único que ve de una pantalla es lo que pegas en tu respuesta. Por eso el diseño se hace en texto, antes de planificar, y se aprueba en la puerta 1.

## Cuándo usarla

- Proyecto nuevo con interfaz, o uno sin `docs/experiencia.md` que va a cambiar de pantallas.
- Cambio que agrega, quita o reordena pantallas, rutas o flujos de UI.
- No la uses para cambios de texto, color o estilo que no alteran el recorrido.

## Antes

1. Lee lo que ya hay: `docs/experiencia.md`, `docs/proyecto.md`, `AGENTS.md` y las pantallas que el cambio toca.
2. Pregunta solo lo que falte, con máximo 3 preguntas cerradas (2 a 4 opciones, la recomendada primera). No preguntes lo que el contexto ya responde: quién usa, cuál es la tarea frecuente, qué herramienta usa hoy.
3. Si hay evidencia real (un hallazgo en `cambios/<nombre>/hallazgo.md`, una auditoría o una captura), úsala antes que tu intuición.

## Plantilla: `docs/experiencia.md` (una vez por proyecto)

```markdown
# Experiencia

## Quién usa
Persona concreta, en una o dos líneas: rol, contexto y dispositivo principal.

## Tareas frecuentes
3 a 5 tareas, en el orden de frecuencia (con cuántas veces al día o a la semana).

## Modelo mental actual
Qué herramienta o papel usa hoy para cada tarea y qué espera encontrar.

## Vocabulario
- Permitido: términos de la persona.
- Prohibido: términos técnicos o internos que no entiende (lista corta).

## Mapa de pantallas
Árbol de pantallas con su ruta y la tarea que resuelve cada una.

## Principios
3 a 5 reglas propias del producto, cada una con su porqué en una línea.
```

## Plantilla: `pantallas.md` (por cambio que toca UI)

Una sección por pantalla:

```markdown
## <Nombre de la pantalla> (ruta: /<ruta>)

Objetivo: qué logra la persona aquí, en una frase.

Boceto (ASCII, hasta 40 columnas, móvil primero):
+--------------------------------------+
| Título                               |
|                                      |
| [ Acción principal            ]      |
|                                      |
| Acción secundaria                    |
+--------------------------------------+

Estados:
- vacío: qué ve cuando no hay datos y qué puede hacer.
- carga: qué ve mientras espera.
- error: qué dice y cómo sigue.
- éxito: qué confirma y a dónde lleva.

Textos exactos: cada etiqueta, título y mensaje, copiado tal cual.
Acción principal: una. Acciones secundarias: lista corta.
```

El boceto se pega también en tu respuesta cuando pides la puerta 1. No basta con enlazar el archivo: Franco lo aprueba en la terminal.

## Reglas de oficio

- Una tarea principal por pantalla.
- Lo frecuente, a un toque.
- Nunca dos formularios a la vez.
- Lenguaje de la persona, no el del código.
- Objetivos táctiles de 44 px.
- Los errores dicen cómo seguir, no solo qué falló.
- Contraste y foco visibles en todo estado.
- Diseña a 390 px primero; el escritorio es la adaptación.

## Lista de comprobación

Marca cada punto contra los bocetos antes de pedir la puerta 1:

- [ ] Cada pantalla tiene una tarea principal y se nombra con ella.
- [ ] La tarea frecuente se completa en el número de pasos que dice `pantallas.md`.
- [ ] Los estados vacío, carga, error y éxito están en cada pantalla.
- [ ] No aparece un término prohibido de `docs/experiencia.md`.
- [ ] Todo boceto cabe en 40 columnas.
- [ ] Los errores dicen qué hacer después.

## Cierre

1. Pega en tu respuesta los bocetos de las pantallas que cambian, con su lista de comprobación marcada.
2. Di la ruta de `pantallas.md` (y de `docs/experiencia.md` si lo escribiste).
3. Pregunta: «¿Apruebas esta experiencia?». Espera su respuesta. Con «sí», el `pantallas.md` pasa a la planificación (`planificar-cambio`, regla 14); con cambios, lo corriges y lo vuelves a pegar.
