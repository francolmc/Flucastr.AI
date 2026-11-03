---
name: control-consumo
description: "Control de consumo del coordinador: una escritura de STATUS.md por transición, lectura de --presupuesto, qué hacer en excedido y la línea Retomar:."
---

# Control de consumo

1. Una escritura por transición: un solo `Write` con el archivo completo de `definitions/STATUS.md`. Entre dos transiciones no tocas `STATUS.md`; lo que devuelva un rol se incorpora en la escritura siguiente.
2. Transición = cambio de rol, de puerta o de estado.
3. Al inicio de cada transición corre `node ~/.flucastr-ai/validar-tarea.mjs --presupuesto features/Fxx-nombre` y lee solo la línea `Presupuesto Fxx: ...`.
4. Al delegar al `arquitecto` o al `planificador`, suma 1 a `arq` o `plan` en esa escritura. En una feature nueva, `Presupuesto:` vuelve a ceros. Conserva los `amp_*` al reescribirla.
5. Con `estado=excedido` no delegas. En *Escalación* pones la causa y las opciones cerradas: A) ampliar el tope de esa causa en N: `ampliado=N` si es `D`; `amp_arq=N`, `amp_plan=N` o `amp_k=N` si es `arq`, `plan` o `K`; solo tras el «sí» de Franco en la conversación, nunca por tu cuenta; B) replantear lo bloqueado con `arquitecto` o `planificador` (cuenta como ronda), solo si la causa es `D` o `K`; con `arq` o `plan` no ofrezcas B; C) cerrar la sesión y revisar a mano. Después te detienes.
6. Si `--presupuesto` sale con 1 por `STATUS.md`, reescríbelo con la plantilla en la transición siguiente.
7. Plantilla, con cada ítem ≤150 caracteres, sin historia y en ≤1536 B:

```
# Estado
Escalación: <ninguna, o causa y opciones>
Paso actual: <rol; feature; tarea; Rama: o Modo yolo:; qué revisa Franco>
Presupuesto: <Fxx>; rondas arq=<n> plan=<n>; ampliado=<n>[; amp_arq=<n>][; amp_plan=<n>][; amp_k=<n>]
Espera a Franco: <qué espera, o ninguna>
Bloqueos abiertos: <motivo y rol, o ninguno>
Retomar: <feature; paso exacto; rama; qué espera de Franco>
Actualizado: <fecha>
```

8. Dile a Franco «abre sesión nueva» tras dejar `Retomar:`: al confirmar una feature `hecha`, con `estado=excedido` si elige C, y con `estado=aviso` por `D75` (corte preventivo).
9. `BLOQUEO: rol=constructor; motivo=codigo:` (defecto de código o de verificación en el repo) no va al `arquitecto` ni reabre la tarea: delega al `planificador` (`Disparó: BLOQUEO task-NN`) una tarea de corrección nueva y acotada en la misma feature (cuenta como ronda `plan`) y luego al `constructor`; con ella `hecha`, la bloqueada vuelve a `aprobada`.
