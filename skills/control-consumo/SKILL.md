---
name: control-consumo
description: "Control de consumo del coordinador: una escritura de STATUS.md por transición, lectura de --presupuesto, qué hacer en excedido y la línea Retomar:."
---

# Control de consumo

1. Una escritura por transición: un solo `Write` con el archivo completo de `definitions/STATUS.md`. Entre dos transiciones no tocas `STATUS.md`; lo que devuelva un rol se incorpora en la escritura siguiente.
2. Transición = cambio de rol, de puerta o de estado.
3. Al inicio de cada transición corre `node ~/.flucastr-ai/validar-tarea.mjs --presupuesto features/Fxx-nombre` y lee solo la línea `Presupuesto Fxx: ...`. Escríbelo siempre igual, sin `cd`, `&&`, `;`, `2>&1` ni redirecciones. Con `estado=excedido` sale 1: es lo esperado, no un fallo. Tras un rechazo con `Firma: X`, añade `--firma 'X'`.
4. Al delegar al `arquitecto` o al `planificador`, suma 1 a `arq` o `plan` en esa escritura. En una feature nueva, `Presupuesto:` vuelve a ceros. Conserva los `amp_*` al reescribirla.
5. Con `estado=excedido` SIEMPRE escribes la Escalación con las letras en esa misma transición; nunca «me falta información». Con `estado=excedido` no delegas. En *Escalación* pones la causa y las opciones, cada una con su letra: A) ampliar el tope de esa causa en N (1 si Franco no da otro): `ampliado=N` si es `D`; `amp_arq=N`, `amp_plan=N` o `amp_k=N` si es `arq`, `plan` o `K`; B) replantear lo bloqueado con `arquitecto` o `planificador` (cuenta como ronda), solo si la causa es `D` o `K`; con `arq` o `plan` no ofrezcas B; C) cerrar la sesión y revisar a mano; D) cerrar la feature como incompleta y abrir la siguiente con presupuesto propio. Cada ítem ≤150 caracteres, p. ej. `A) ampliar tope arq en 1 (amp_arq=1)`. Termina con «Responde con una letra». Después te detienes.
6. Si `--presupuesto` sale con 1 por `STATUS.md`, reescríbelo con la plantilla en la transición siguiente.
7. Plantilla, con cada ítem ≤150 caracteres, sin historia y en ≤1536 B:

```
# Estado
Escalación: <ninguna, o causa y opciones>
Paso actual: <rol; feature; tarea; Rama: o Modo yolo:; qué revisa Franco>
Presupuesto: <Fxx>; rondas arq=<n> plan=<n>; ampliado=<n>[; amp_arq=<n>][; amp_plan=<n>][; amp_k=<n>][; firma=<d>]
Espera a Franco: <qué espera, o ninguna>
Bloqueos abiertos: <motivo y rol, o ninguno>
Retomar: <feature; paso exacto; rama; qué espera de Franco>
Actualizado: <fecha>
```

8. Dile a Franco «abre sesión nueva» tras dejar `Retomar:`: al confirmar una feature `hecha`, con `estado=excedido` si elige C, y con `estado=aviso` por `D75` (corte preventivo).
9. `BLOQUEO: rol=constructor; motivo=codigo:` (defecto de código o de verificación en el repo) no va al `arquitecto` ni reabre la tarea: delega al `planificador` (`Disparó: BLOQUEO task-NN`) una tarea de corrección nueva y acotada en la misma feature (cuenta como ronda `plan`) y luego al `constructor`; con ella `hecha`, la bloqueada vuelve a `aprobada`.
10. Si Franco responde una letra (A, B, C o D), la aplicas sin añadir condiciones; no discutas ni reinterpretes ni pidas otra frase ni otro «sí». Esa letra es su aprobación. A: con solo la letra amplías N=1 para la causa, sin pedir el número ni más condiciones; si Franco da otro N, usas ese; suma N al `amp_*` (o `ampliado`) en la escritura siguiente, vuelve a correr `--presupuesto` y sigue el flujo. D: delega al `planificador` (`Disparó: franco`) pasar las tareas sin `hecha` a `cancelada` (`Cancelada: motivo=otra`), escribe `hecha` en la fila de la feature de `BACKLOG.md`, escribe en *Espera a Franco* que la feature se cerró INCOMPLETA y lista las tareas canceladas, para que Franco lo vea antes de archivar; anota en *Retomar* lo que quedó sin hacer y sigue con `descomponer-feature` de la siguiente (`Presupuesto:` en ceros; esa delegación no cuenta como ronda). Sin letra de Franco, no amplías ni cierras por tu cuenta.
11. Con `estado=repetido` la Escalación dice «esta causa se repite» y ofrece solo C) y D); no delegas. Copia `firma=<d>` a `Presupuesto:`; sin rechazo nuevo, omítelo.
