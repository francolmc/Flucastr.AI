---
name: ejecutar-tarea
description: "Ejecuta una tarea `aprobada` de `features/**`: todos los pasos y la verificación, evidencia real y estado «lista para revisión». Úsala al construir; se detiene solo por las causas listadas."
---

# Ejecutar una tarea

Entrada: la ruta del archivo de la tarea.

## Antes de empezar

1. Lee la tarea completa. Si `estado` no es `aprobada`, **detente** y dilo; no cambies nada.
2. **Rama de la feature.** Solo si el encargo trae la línea `Rama: <prefijo>/Fxx-nombre`. Si no la trae, no ejecutes ningún comando git de rama y sigue con el paso 3.
   - **Modo yolo:** si el encargo trae la línea `Modo yolo: activo`, salta este paso entero: no corres ningún comando git de rama, no creas rama, no haces `git switch` y no emites `CONFIRMAR:`; trabajas en la rama actual. Sigue sin haber commit, ni local, y la tarea termina en `lista para revisión` (el coordinador decide `hecha`).
   - Si el encargo contiene la frase ``Franco confirmó `git switch <rama>` ``: corre `git switch <rama>` (sin `-c`, solo esa rama), verifica con `git branch --show-current` y sigue la tarea. Sin esa frase, no ejecutas `git switch <rama>`. La confirmación vale solo para esa rama y esa tarea. Si el switch falla (por ejemplo, cambios sin commit que chocan), `BLOQUEO: rol=arquitecto; motivo=<salida del comando>` y no reintentes.
   - Si no hay confirmación: (a) corre `git branch --show-current`; si ya es la rama del encargo, no hagas nada más. (b) Si no, corre `git switch -c <rama>`. (c) Si falla porque la rama ya existe, no hagas nada más y tu respuesta final empieza con la línea exacta `CONFIRMAR: accion=git switch <rama>; motivo=la rama ya existe y la actual es <actual>`. (d) Si falla por otra causa, `BLOQUEO: rol=arquitecto; motivo=<salida del comando>`.
3. Cambia `estado` a `en curso`.
4. Lee las rutas de *Contexto*. Trabaja solo en el repo del campo `repo:`.

## Ejecución

1. Haz **todos** los *Pasos*, en orden, respetando *Decisiones ya tomadas* y sin salir de *Alcance* (lo de *Fuera de alcance* no se toca).
2. **Ante un hueco menor** (algo no cubierto por la tarea): elige la opción más conservadora y coherente con la tarea, anótala en *Notas* y sigue. No preguntes.
3. Corre la *Verificación* tal cual está escrita. Pega en *Evidencia* la salida **real** (comando y salida), nunca una versión resumida o inventada.
4. Comprueba cada criterio de aceptación contra esa evidencia.

## Cuándo detenerte (solo estos casos)

- **Falta de credenciales o acceso.**
- **Una decisión que cambia el alcance:** es una escalación; infórmala, no la resuelvas.
- **La misma verificación falla dos veces por la misma causa:** pon `estado: bloqueada`.
- **La rama de la feature ya existe y no es la actual:** pide confirmación (`CONFIRMAR: accion=git switch <rama>; motivo=<motivo>`), no es un bloqueo ni una escalación; su primera línea es `CONFIRMAR:`, no `BLOQUEO:`. Al emitirla no tocas código, ni la tarea, ni la rama. En modo yolo esta causa no aplica.

En cualquiera: anota el motivo en *Notas* y termina tu respuesta final con la **primera línea exacta**:

`BLOQUEO: rol=<rol requerido>; motivo=<motivo>`

(para una escalación de alcance, `rol=planificador` o `rol=arquitecto` según toque), y debajo qué dejaste hecho. No sigas.

## Al terminar bien

- `estado: lista para revisión`. **Nunca `hecha`.**
- *Notas*: los huecos menores resueltos y su decisión. Si fueron **muchos**, agrega la frase «Señal: la tarea estaba incompleta» y cuáles faltaban, para mejorar la plantilla.
- En la tarea solo tocaste *Evidencia*, *Notas* y `estado`. Sin commit, push, PR, merge ni despliegue.

## Línea de registro

Al terminar una ejecución que toca la tarea (la dejas `lista para revisión`, `bloqueada` o `escalada`), escribes **una línea por ejecución** como **última línea de *Notas***, con esta plantilla:

```
Registro: n=<n>; herramienta=<herramienta>; modo=<modo>; intentos=<n>; verificacion=<resultado>; huecos=<n>; resultado=<resultado>; causa=<causa>
```

Significados, en este orden y separados por `; `:

- `n`: las líneas `Registro:` que ya hay en *Notas*, más 1.
- `herramienta`: `claude-code` o `pi`, la herramienta en la que corres.
- `modo`: `yolo` solo si el encargo trae `Modo yolo: activo`; si no, `normal`.
- `intentos`: veces que corriste la *Verificación* completa (cada pasada completa suma 1).
- `verificacion`: `pasa` si todos los comandos pasaron en la última pasada; `parcial` si algunos pasaron y otros no se pudieron correr; `falla` si falló, o si no se corrió ninguno (con `intentos=0`).
- `huecos`: huecos menores anotados en *Notas* en esta ejecución.
- `resultado`: `lista` si dejas `lista para revisión`; `bloqueada` si la tarea queda bloqueada; `escalada` si terminas con `BLOQUEO:` por cambio de alcance.
- `causa`: `ninguna` con `lista`; `alcance` con `escalada`; con `bloqueada`, la que corresponda: `credenciales`, `verificacion_x2`, `rama` (falló un `git switch`) u `otra`.

No escribes la línea si rechazas una tarea que no está `aprobada` ni si terminas con `CONFIRMAR:`: en esos casos no tocas la tarea.
