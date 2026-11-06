---
name: definir-proyecto
description: "Define un proyecto nuevo (repo vacío o casi): hace hasta 5 preguntas cerradas, escribe `AGENTS.md` y `docs/proyecto.md`, deja la raíz lista y se detiene a esperar a Franco. Úsala si la carpeta no tiene `AGENTS.md` ni código."
---

# Definir un proyecto nuevo

Un proyecto «nuevo» no tiene `AGENTS.md` y no tiene código: solo carpeta vacía, `README` o `.git`. Si ya hay código, dilo y usa `preparar-proyecto`.

Trabajas en dos tiempos. No los mezcles.

## Primer tiempo: preguntar (no escribas nada)

1. Lee lo que Franco dijo y lo que la carpeta ya tiene. No preguntes lo que el contexto ya responde.
2. Haz hasta 5 preguntas cerradas, con 2 a 4 opciones cada una. La propuesta por defecto va primera y dice «(Recomendada)».
3. La primera pregunta es siempre: «¿Es un repo o un workspace con varios repos?». Nunca decidas tú, aunque el contexto lo insinúe.
4. Las demás salen solo de lo que falte: stack, quién usa el sistema, alcance del MVP, datos y acceso (p. ej. login o link por correo), dónde se despliega.
5. Termina el turno esperando respuesta. Hasta entonces no creas archivos, ni `git init`, ni carpetas.

## Segundo tiempo: escribir (con las respuestas)

Escribe solo esto, en la raíz:

- **`AGENTS.md`**: formato y límite (unas 40 líneas) de `preparar-proyecto`, sección 1. El comando `./verify` aparece marcado como pendiente: «(pendiente: lo crea el plan del esqueleto)». Las skills del kit se nombran en una sola línea, sin describirlas.
- **`docs/proyecto.md`**: una página con estas secciones: Qué es, Para quién, MVP, Fuera de alcance, Decisiones (cada una con su porqué). En un workspace, añade «Repos» (carpeta y rol). Añade también «Despliegue» con sus cinco líneas (ver `preparar-proyecto`, sección 5); lo que no se sabe va como «pendiente», sin inventar valores.
- **`cambios/`**: carpeta con un `.gitkeep`.

No creas carpetas de repos hijos ni código: eso es el plan del esqueleto.

**Si es un repo:** los planes llevarán `repos: [.]`.

**Si es un workspace** (raíz sin `.git` y hijos con `.git`; compruébalo con `find . -maxdepth 2 -name .git -not -path './.git'`): pregunta «¿Hacemos la raíz repo propio?» (la recomendada es «Sí»). Sin respuesta no hay `git init`; lo dices como pendiente. Con «Sí»: `git init` en la raíz y un `.gitignore` con `/<carpeta>/` por cada hijo con `.git`, más `.claude/settings.local.json`. Nunca haces commit.

## Cierre

Responde con:

1. La lista de archivos escritos, con ruta exacta.
2. «Espero tu aprobación».
3. El siguiente paso: el plan del esqueleto (`./verify` con `preparar-proyecto`, con `repos:`). No lo escribes antes de la aprobación.

Luego te detienes.
