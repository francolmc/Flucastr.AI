---
estado: parcial
rama: feature/endurecer-constructor
repos: [.]
---
# Quién ejecuta el plan, pasos atómicos y ejecución visible (Pedido 8, tramo 2 de 3)

## Objetivo
Cada plan declara quién lo ejecuta (`ejecutor: constructor` o `ejecutor: principal`); los pasos son atómicos (una línea, una acción, una comprobación); los planes grandes se parten en tramos; una `PAUSA` sin causa concreta no cuenta como bloqueo repetido; y Franco sabe ejecutar un plan en una ventana propia en vez de en segundo plano.

Cubre (c), (d) y (e) del Pedido 8 más dos ideas de comparar con el apply de OpenSpec: pasos atómicos y ejecución visible. Va después de `cambios/constructor-contrato` y antes de `cambios/plazos-y-tiempo`.

## Supuestos
- `ejecutor:` es una línea del frontmatter, junto a `rama:` y `repos:`. Sin la línea se trata como `ejecutor: constructor` (los planes hechos no cambian).
- Si el ejecutor es `principal`, este sigue `ejecutar-plan` él mismo (mismos pasos, evidencia y tope de 3 corridas) y no lanza al constructor. La puerta 2 sigue siendo de Franco.
- Reparto (el criterio de Franco): mecánico y acotado (configuración, renombrar, aplicar un patrón conocido) → constructor; con diagnóstico o piezas dependientes (builds, Compose, recorridos de punta a punta, pruebas negativas) → principal, o constructor con nivel `medio` en `modelos.json`.
- **Paso atómico:** una línea, una acción, una comprobación, unas 20 palabras como máximo. Puede haber 40 pasos. Un paso con más de un requisito se parte. Sustituye el límite de «60 palabras» y el de «3 requisitos».
- Las 20 palabras y los 8 KB son orientación; ninguna herramienta los mide. Los planes de este kit se ajustan a ellas.
- «Sugerir subir el nivel» es un aviso a Franco con la ruta `modelos.json` (`agentes.constructor.nivel`); el principal no edita `modelos.json`.
- Ventana propia: Claude Code `claude --agent constructor`, Pi `pi-constructor`. Primer mensaje: `Plan: <ruta>` y `Rama: <rama>`. Los nombres de comando son los que dio Franco; `pi-constructor` no se probó aquí.
- El principal ofrece la ventana propia en planes pesados (muchos pasos, builds, Compose) o en las primeras veces con un proyecto; en un plan pequeño lanza al constructor como hasta ahora.
- Este tramo habla de `PAUSA` (ya no hay `PARCIAL`, ver `constructor-contrato`). La rama parte de `main` con ese tramo fusionado o commiteado.

## Alcance
Cambiar: `skills/planificar-cambio/SKILL.md`, `agentes/principal.md`, `README.md` (una sección) y `verify` (bloque `8d` antes de `VERIFY OK`).
Fuera de alcance: `ejecutar-plan`, `constructor.md`, `preparar-proyecto`, `modelos.json`, `scripts/`, instalador, `old/`.

## Decisiones ya tomadas
- El principal decide el ejecutor al escribir el plan y lo explica en una frase solo si elige `principal`, para que Franco lo discuta en la puerta 1.
- Los pasos cortos existen porque un modelo pequeño cumple bien una línea y mal un párrafo con tres requisitos. Un plan largo de pasos pequeños es mejor que uno corto de pasos densos.
- Una `PAUSA` con causa vaga no cuenta como bloqueo repetido: el principal relanza una vez con un tramo más estrecho, o lo hace él, y sugiere subir el nivel.
- Al relanzar tras una `PAUSA`, el plan no recibe texto sobre condiciones de detención («límite real», «checkpoint»): solo cuál es el siguiente paso.
- La ventana propia no cambia el contrato: es el mismo plan, el mismo agente y el mismo retorno; solo se ve en vivo.

## Escenarios
- CUANDO el plan es un build con Compose y pruebas negativas ENTONCES lleva `ejecutor: principal` y una frase de por qué.
- CUANDO el plan edita configuración ENTONCES lleva `ejecutor: constructor`.
- CUANDO un paso junta dos requisitos ENTONCES se parte; CUANDO el plan pasa de unos 8 KB ENTONCES se parte en tramos con su verificación.
- CUANDO el constructor devuelve `PAUSA` con una causa vaga ENTONCES el principal relanza una vez con tramo más estrecho, o lo hace él, y sugiere subir el nivel.
- CUANDO el plan es pesado o es la primera vez ENTONCES el principal ofrece a Franco abrir `claude --agent constructor` con `Plan:` y `Rama:`.

## Verificación
`./verify` — termina en `VERIFY OK`, con el bloque `8d` en verde y su prueba negativa fallando donde corresponde.

## Pasos
- [x] `planificar-cambio`, plantilla: agregar `ejecutor: constructor | principal` al frontmatter. Comprobar: `grep -n '^ejecutor:' skills/planificar-cambio/SKILL.md`.
  - evidencia: `skills/planificar-cambio/SKILL.md` línea 24: `ejecutor: constructor | principal` (grep devolvió esa línea).
- [x] `planificar-cambio`, «Reglas del buen plan»: agregar la regla de quién ejecuta con el criterio de reparto.
  - evidencia: `skills/planificar-cambio/SKILL.md`, regla 7 «Quién ejecuta (`ejecutor:`)» con el criterio de reparto.
- [x] `planificar-cambio`, misma regla: con `ejecutor: principal`, el plan lleva una frase de justificación.
  - evidencia: `skills/planificar-cambio/SKILL.md`, regla 7: la frase va en `## Decisiones ya tomadas`.
- [x] `planificar-cambio`, regla 3: reemplazar «60 palabras» por «paso atómico: una línea, una acción, una comprobación, unas 20 palabras». Comprobar: `grep -c '60 palabras' skills/planificar-cambio/SKILL.md` es 0.
  - evidencia: `$ grep -c '60 palabras' skills/planificar-cambio/SKILL.md` → salida `0`, exit 0.
- [x] `planificar-cambio`, regla 3: un paso con más de un requisito se parte; no hay tope de pasos (40 es válido).
  - evidencia: `skills/planificar-cambio/SKILL.md`, regla 3 (paso atómico) con «Un paso con más de un requisito se parte» y «40 es válido».
- [x] `planificar-cambio`, regla 4: un plan de más de unos 8 KB se parte en tramos, cada uno con su verificación.
  - evidencia: `skills/planificar-cambio/SKILL.md`, regla 4: «se parte en tramos, cada uno con su verificación».
- [x] `planificar-cambio`, cierre: al relanzar tras una `PAUSA` no se agrega texto de condiciones de detención, solo el siguiente paso.
  - evidencia: `skills/planificar-cambio/SKILL.md`, sección «Antes de pedir la aprobación», último párrafo.
- [x] `agentes/principal.md`, punto 4: si `ejecutor: principal`, ejecuta él con `ejecutar-plan` y no lanza al constructor.
  - evidencia: `agentes/principal.md`, punto 4: «Si dice `ejecutor: principal`, ejecutas tú con `ejecutar-plan`».
- [x] `agentes/principal.md`, punto 5: una `PAUSA` de causa vaga no cuenta como repetida; relanza una vez con tramo más estrecho o lo hace él.
  - evidencia: `agentes/principal.md`, punto 5: «Una `PAUSA` de causa vaga no cuenta como bloqueo repetido».
- [x] `agentes/principal.md`, mismo punto: sugiere subir el nivel en `modelos.json` (`agentes.constructor.nivel`) sin editarlo.
  - evidencia: `agentes/principal.md`, punto 5: «sugiere a Franco subir `agentes.constructor.nivel` en `modelos.json`, sin editarlo tú».
- [x] `agentes/principal.md`, punto 4: ofrecer a Franco la ventana propia en planes pesados o en las primeras veces, con los dos comandos y el mensaje.
  - evidencia: `agentes/principal.md`, punto 4: `claude --agent constructor` (Pi: `pi-constructor`), `Plan: <ruta>` y `Rama: <rama>`.
- [x] `README.md`: sección «Ejecutar un plan en ventana propia» con `claude --agent constructor`, `pi-constructor` y el mensaje `Plan:` / `Rama:`.
  - evidencia: `README.md`, sección «## Ejecutar un plan en ventana propia» (antes de «## Estructura»).
- [x] Probar en un proyecto temporal con un plan mínimo que `claude --agent constructor` lo ejecuta; anotar comando y resultado en *Notas*.
  - evidencia: corrida real del principal, ver *Notas* → `COMPLETADO`, `estado: listo`, `hola.txt` creado
- [x] `verify`, bloque `8d`: frases clave `ejecutor:` y `20 palabras` (sin `60 palabras`) en `planificar-cambio`; `ejecutor: principal` y `claude --agent constructor` en `principal.md`; `pi-constructor` en `README.md`.
  - evidencia: `verify`, bloque `# 8d.` antes de `echo "VERIFY OK"`; su salida: `ok 8d: ejecutor:, 20 palabras (sin 60 palabras), ventana propia y pi-constructor presentes; copia sin ejecutor: falla`.
- [x] `verify`, `8d`: copia negativa de `planificar-cambio` sin `ejecutor:` debe fallar. Comprobar: `./verify` termina en `VERIFY OK`.

## Evidencia
Corrida de `./verify` después de los pasos 1 a 12 y del bloque 8d (diagnóstico; el cierre espera al paso de prueba pendiente):

$ ./verify
== 8. workspaces (detección con find, textos clave de los archivos del cambio) ==
ok 8a: workspace con dos hijos con .git -> find devuelve 2
ok 8b: textos clave presentes (incluido el modo remoto y Despliegue); copias sin repos:, sin «Descartado», sin definir-proyecto o sin VERIFY_TARGET fallan la comprobación
ok 8c: contrato del constructor presente (grep -c, siguiente=, no_intentado=, 3 corridas, git diff --stat, sin PARCIAL:); copias sin esas frases fallan
ok 8d: ejecutor:, 20 palabras (sin 60 palabras), ventana propia y pi-constructor presentes; copia sin ejecutor: falla
VERIFY OK
exit 0

## Notas
- Prueba real (principal, Claude Code 2.1.309): proyecto temporal con `git init`, rama `chore/mini`, `constructor.md` generado con `node scripts/resolver.mjs agente-claude` y `ejecutar-plan` en `.claude/`. Comando: `claude --agent constructor -p "Plan: cambios/mini/plan.md\nRama: chore/mini" --permission-mode acceptEdits --allowedTools "Bash(./verify)" "Bash(cat *)" "Bash(grep *)" "Bash(git status*)" "Bash(git diff*)" "Bash(git branch*)" "Bash(git rev-parse*)" "Bash(git switch*)" "Bash(git log*)"`. Resultado: `COMPLETADO: plan=cambios/mini/plan.md; verify=pasa`, paso marcado con evidencia, `grep -c` en 0, plan en `listo`.
- Hallazgo: en `-p` sin `--allowedTools` el constructor pide aprobación y devuelve `PAUSA motivo=acceso` (formato correcto, con opciones). Tres corridas previas se cortaron por mi fixture (verify sin `chmod +x`) y por permisos; no fallos del constructor. Para ventana propia interactiva no aplica. Anotar en README si se quiere.
- `planificar-cambio` sigue diciendo «parcial» como *estado* del plan: es correcto (tras una `PAUSA` el estado sigue siendo `parcial`, ver `constructor-contrato`). No es un resto de `PARCIAL`.
- Prueba de `claude --agent constructor` (intento del principal al ajustar este plan): no se pudo correr. Sin sesión interactiva, Claude Code pidió aprobación para ejecutar `claude` y la bloqueó, así que no hay resultado. Quedaron solo tres archivos en `/tmp/ctor-prueba` (`cambios/mini/plan.md`, `verify`, `AGENTS.md`); faltan `git init` y copiar `constructor.md` y `ejecutar-plan` a `.claude/`. El paso de prueba sigue pendiente y debe correrse con permiso explícito.
- Constructor, paso «Probar en un proyecto temporal»: pausado por `motivo=acceso`. Esta corrida no pidió permiso para ejecutar `claude --agent constructor` ni se preparó el proyecto temporal (faltan `git init` y copiar `constructor.md` y `ejecutar-plan` a `.claude/`). No se inventó resultado.
- Decisión menor: en la regla 7 de `planificar-cambio` la frase de justificación de `ejecutor: principal` va en `## Decisiones ya tomadas`.
- Decisión menor: en `agentes/principal.md` el punto 4 dice literalmente `ejecutor: principal` (lo pide el bloque 8d).
- Fuera de la lista de pasos y sin tocar: `skills/planificar-cambio/SKILL.md` aún dice «`parcial`» en *Estados* y en la regla de relanzar; el plan pide `PAUSA` (ver `constructor-contrato`). Queda para decidir en el cierre.
