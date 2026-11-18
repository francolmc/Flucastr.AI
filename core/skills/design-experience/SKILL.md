---
name: disenar-experiencia
description: "Design the experience of a UI before planning: create `docs/experiencia.md` (once per project) and `cambios/<name>/pantallas.md` (per change) with an ASCII sketch that the user approves in the terminal. Use for a project with a new UI or a change that adds or reorders screens."
---

# Design the Experience

The user works in the terminal: the only view of a screen they get is what you paste into your response. Therefore, design in text before planning and get approval at Gate 1.

## When to use

- A new project with a UI, or a project without `docs/experiencia.md` that will change screens.
- A change that adds, removes, or reorders screens, routes, or UI flows.
- Do not use for text, color, or styling changes that do not alter the flow.

## Before starting

1. Read what exists: `docs/experiencia.md`, `docs/proyecto.md`, `AGENTS.md`, and the screens affected by the change.
2. Ask only about missing information, using at most 3 closed questions (2 to 4 options, recommended first). Do not ask what context already answers: who uses it, their frequent task, or what tool they use today.
3. If real evidence exists (a finding in `cambios/<name>/hallazgo.md`, an audit, or a screenshot), use it before your intuition.

## Template: `docs/experiencia.md` (once per project)

```markdown
# Experiencia

## Who uses it
A specific person in one or two lines: role, context, and primary device.

## Frequent tasks
3 to 5 tasks, ordered by frequency (include how many times per day or week).

## Current mental model
What tool or paper process they use for each task today and what they expect to find.

## Vocabulary
- Allowed: the person's terms.
- Prohibited: technical or internal terms they do not understand (short list).

## Screen map
A screen tree with each route and the task it solves.

## Principles
3 to 5 product-specific rules, each with its reason in one line.
```

## Template: `pantallas.md` (for a change that touches UI)

One section per screen:

```markdown
## <Nombre de la pantalla> (ruta: /<ruta>)

Objective: what the person accomplishes here, in one sentence.

Sketch (ASCII, up to 40 columns, mobile first):
+--------------------------------------+
| Título                               |
|                                      |
| [ Acción principal            ]      |
|                                      |
| Acción secundaria                    |
+--------------------------------------+

States:
- empty: what they see when there is no data and what they can do.
- loading: what they see while waiting.
- error: what it says and how they can continue.
- success: what it confirms and where it takes them.

Textos exactos: cada etiqueta, título y mensaje, copiado tal cual.
Primary action: one. Secondary actions: a short list.
```

Also paste the sketch into your response when requesting Gate 1 approval. Linking to the file alone is not enough: the user approves it in the terminal.

## Craft rules

- One primary task per screen.
- Make frequent tasks available in one tap.
- Never show two forms at once.
- Use the person's language, not code terminology.
- Touch targets are 44 px.
- Errors explain how to continue, not only what failed.
- Keep contrast and focus visible in every state.
- Design first for 390 px; desktop is the adaptation.

## Checklist

Check every item against the sketches before requesting Gate 1:

- [ ] Each screen has one primary task and is named after it.
- [ ] The frequent task takes the number of steps stated in `pantallas.md`.
- [ ] Every screen includes empty, loading, error, and success states.
- [ ] No prohibited term from `docs/experiencia.md` appears.
- [ ] Every sketch fits within 40 columns.
- [ ] Errors say what to do next.

## Close

1. Paste sketches for changed screens into your response, with the checklist completed.
2. Give the path to `pantallas.md` (and `docs/experiencia.md` if you wrote it).
3. Ask in the user's current language whether they approve the experience. Wait for the answer. With approval, include `pantallas.md` in planning (`planificar-cambio`, rule 14); if changes are requested, edit it and paste it again.
