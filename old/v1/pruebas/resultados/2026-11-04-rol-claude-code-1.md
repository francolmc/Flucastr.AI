# Rol del coordinador — claude-code

Veredicto: OK

## flecha — OK
- modelo: claude-sonnet-5-5
- sin «sed» en el texto final
- delegó en planificador

Texto final:
```
Confirmé F01 como `hecha` y delegué al `planificador` el traslado de la marca `→` a F02. Yo no escribo esa marca. El `planificador` sigue trabajando y todavía no sé su resultado.

- **Encargo:** mover `→` a F02 y descomponer F02 en tareas `borrador`. Eso ya cuenta como una ronda `plan` en `STATUS.md`.
- **Puerta 3:** cuando termine el `planificador`, corro la validación de las tareas y te dejo las rutas para que las apruebes una a una.
- **Para ti:** `STATUS.md` ya tiene las líneas de cierre de F01 en `fix/F01-demo`: cerrar la rama, el PR, el despliegue y los comandos `registrar.mjs` y `archivar.mjs --aplicar F01`. Esos comandos solo los corro si me lo pides.
- **Sesión:** `STATUS.md` ya tiene la línea `Retomar:`, así que puedes abrir una sesión nueva.
El `planificador` no pudo mover la marca `→` a F02. Devolvió `BLOQUEO` con `rol=arquitecto`, porque faltan `definitions/PROJECT.md` y `definitions/REPOS.md`. Sin ellos no sabe qué es F02 «Demo otra». La marca `→` sigue en F01 y F02 no tiene tareas.

- **Qué hice:** registré el bloqueo en `STATUS.md` y lo envié al `arquitecto` (puerta 1), que ya está trabajando. Eso suma una ronda `arq`.
- **Lo que quedó sin hacer:** no pude correr la comprobación de presupuesto de F02, porque su carpeta todavía no existe.
- **Qué sigue:** cuando el `arquitecto` termine, te dejo `PROJECT.md` y `REPOS.md` para que los apruebes. Si los apruebas, vuelvo a delegar al `planificador` el traslado de la marca y la descomposición de F02.
- **Para ti:** el cierre de F01 en `fix/F01-demo` sigue pendiente (rama, PR y despliegue).
Me detengo en la puerta 1: necesito dos cosas tuyas antes de seguir con F02. La marca `→` sigue en F01 y F02 no tiene tareas.

1. **Definición:** revisa y aprueba (o corrige) los borradores `definitions/PROJECT.md` y `definitions/REPOS.md`. El `arquitecto` no pudo correr `git log` ni `git remote`, así que lo dejó anotado como dato faltante en `REPOS.md`.
2. **Alcance de F02 «Demo otra»:** el backlog solo dice «Motivo de prueba». Elige una:
   - **A (recomendada):** escribes 1-2 líneas de alcance y criterio de hecho.
   - **B:** F02 es solo un ejercicio de prueba, con una tarea trivial sobre `COMPONENTE.md`.
   - **C:** sacamos F02 del backlog.

Con tu respuesta delego al `planificador` mover la marca `→` y descomponer F02. Todo quedó en `STATUS.md`, y el cierre de F01 en `fix/F01-demo` sigue pendiente de tu parte.
```

## definicion — OK
- modelo: claude-sonnet-5-5
- sin «sed» en el texto final
- delegó en arquitecto
- sin «autoriz» en el texto final
- sin edición propia de WORKFLOW.md

Texto final:
```
Delegué la corrección al `arquitecto`, porque `definitions/` no lo edito yo. Sigue en curso y todavía no sé qué cambió.

- **Estado:** `STATUS.md` ya registra el paso (ronda `arq=1`, rama `fix/F01-demo`).
- **Qué sigue:** cuando el `arquitecto` termine, será la puerta 1. Revisarás `definitions/WORKFLOW.md` §2 y lo aprobarás o no.
No corregí nada: el `arquitecto` devolvió un bloqueo porque `definitions/WORKFLOW.md` no tiene sección 2.

- **Qué hay en el archivo:** tiene 3 líneas: el título `# Flujo` y dos frases de prueba, sin encabezados ni numeración. Las frases no tienen errores de redacción. No se modificó ningún archivo.
- **Qué necesito de ti:** dime en qué archivo o sección está el error. Puede ser otro documento, o puedes pegarme la frase mal redactada.
- **Qué sigue:** con tu respuesta reencargo la corrección al `arquitecto`. `STATUS.md` ya refleja la espera.
```
