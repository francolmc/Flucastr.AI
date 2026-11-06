---
estado: borrador
rama: feature/definir-proyecto
repos: [.]
---
# definir-proyecto

## Objetivo
Una skill `definir-proyecto` para proyectos nuevos (repo vacío o casi): el principal hace hasta 5 preguntas cerradas, escribe `AGENTS.md` y `docs/proyecto.md`, deja la raíz lista y se detiene a esperar a Franco. El primer plan que sigue es el esqueleto con `verify`.

## Supuestos
- La skill actúa en dos tiempos: (1) preguntas, sin escribir nada; (2) con las respuestas de Franco, escribe los documentos y se detiene. Si Franco quiere que escriba con las propuestas por defecto sin preguntar, se agrega una línea a la skill, no un paso.
- Un proyecto «nuevo» es uno sin `AGENTS.md` y sin código (carpeta vacía o solo `README`/`.git`). Si hay código, la skill dice que no es su caso y manda a `preparar-proyecto`.
- «Raíz lista» = `AGENTS.md`, `docs/proyecto.md` y `cambios/` en la raíz. No crea carpetas de repos hijos ni código: eso es el plan del esqueleto. Si Franco quiere que cree también las carpetas, cambia el alcance.
- `principal.md` no declara `skills:` en su frontmatter: el principal es el agente de nivel superior, no un subagente (igual que ya hace con `planificar-cambio` y `preparar-proyecto`). Si en Pi el principal corre como subagente, se agrega `skills: definir-proyecto` ahí.
- En `AGENTS.md` solo se listan las skills (una línea); el detalle vive en la skill.

## Alcance
Crear: `skills/definir-proyecto/SKILL.md`.
Editar: `agentes/principal.md` (cargar la skill; actualizar `docs/proyecto.md` al cerrar), `verify` (textos clave en el escalón 8), `AGENTS.md` (skill en la lista), `PENDIENTES.md` (una línea).
Fuera de alcance: `instalar.sh`, `desinstalar.sh`, `agentes/constructor.md`, `preparar-proyecto` (solo se referencia), `old/`. No tocar la sección «Despliegue» (es del pedido 6).

## Decisiones ya tomadas
- Preguntas: máximo 5, cerradas, 2 a 4 opciones, la propuesta por defecto primera y marcada «(Recomendada)». La primera pregunta es siempre «¿un repo o un workspace con varios repos?». Las otras salen de lo que el contexto no responda (stack, quién usa el sistema, alcance del MVP, datos/auth, dónde se despliega). No se pregunta lo que el contexto ya dice. Porque cada pregunta de más cuesta una vuelta de Franco.
- La skill nunca decide repo único o varios: lo pregunta, aunque el contexto lo insinúe (regla dura del principal).
- `docs/proyecto.md` de una página con estas secciones: Qué es, Para quién, MVP, Fuera de alcance, Decisiones (cada una con su porqué). En un workspace añade «Repos» (carpeta y rol). Sin sección «Despliegue» todavía.
- `AGENTS.md` con el formato y el límite de ~40 líneas de `preparar-proyecto`, con `Verificar todo desde cero: ./verify` marcado como pendiente hasta el plan del esqueleto.
- Si es workspace: la raíz sin `.git` → pregunta «¿hacemos la raíz repo propio?» según `preparar-proyecto` sección 4. Sin respuesta no hay `git init`. Si es un repo: `repos: [.]`.
- Termina con: lista de archivos escritos, «espero tu aprobación» y el siguiente paso (plan del esqueleto con `verify` vía `preparar-proyecto`, con `repos:`). No escribe ese plan antes de la aprobación.
- `principal.md`: paso 1 carga `definir-proyecto` si el proyecto es nuevo; paso 6 (cerrar) actualiza `docs/proyecto.md` si cambió algo duradero, además de `AGENTS.md`.

## Escenarios
- CUANDO el contexto es el de gastos del hogar (React + NestJS + PostgreSQL, link mágico por correo) en carpeta vacía ENTONCES responde con ≤5 preguntas cerradas, la primera sobre repo único o varios, con una recomendada cada una, y no crea ningún archivo.
- CUANDO Franco responde (p. ej. workspace con `api` y `web`) ENTONCES escribe `AGENTS.md` y `docs/proyecto.md`, crea `cambios/`, no ejecuta `git init` hasta que conteste, no crea `src/`, no hace commit y se detiene.
- CUANDO la carpeta ya tiene código ENTONCES lo dice y manda a `preparar-proyecto`.

## Verificación
`./verify` — el escalón 4 ya exige `SKILL.md` válido; en el escalón 8 se agregan textos clave (`definir-proyecto` en `agentes/principal.md`; «repo o un workspace», «docs/proyecto.md» y «Fuera de alcance» en la skill) con prueba negativa.

## Pasos
- [ ] Crear `skills/definir-proyecto/SKILL.md` (nombre = carpeta, descripción de una frase, ≤ unos 4 KB) con los dos tiempos, las reglas de preguntas y las secciones de los dos documentos.
- [ ] Editar `agentes/principal.md`: paso 1 y paso 6 según *Decisiones*.
- [ ] `verify` escalón 8: sumar los textos clave a `textos_clave`; la copia negativa omite la skill y debe fallar.
- [ ] `AGENTS.md`: añadir `definir-proyecto` a la lista de skills. `PENDIENTES.md`: una línea.
- [ ] Correr `./verify` y pegar la cola en *Evidencia*. No hace la prueba real: la corre el principal.

## Evidencia
(la escribe el constructor)

## Notas
(la escribe el constructor)
