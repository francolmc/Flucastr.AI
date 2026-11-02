---
name: control-consumo
description: "Control de consumo del coordinador: una escritura de STATUS.md por transición, lectura de --presupuesto, qué hacer en excedido y la línea Retomar:."
---

# Control de consumo

1. Una escritura por transición: un solo `Write` con el archivo completo de `definitions/STATUS.md`. Entre dos transiciones no tocas `STATUS.md`; lo que devuelva un rol se incorpora en la escritura siguiente.
2. Transición = cambio de rol, de puerta o de estado.
3. Al inicio de cada transición corre `node ~/.flucastr-ai/validar-tarea.mjs --presupuesto features/Fxx-nombre` y lee solo la línea `Presupuesto Fxx: ...`.
4. Al delegar al `arquitecto` o al `planificador`, suma 1 a `arq` o `plan` en esa escritura. En una feature nueva, `Presupuesto:` vuelve a ceros.
5. Con `estado=excedido` no delegas. En *Escalación* pones la causa y tres opciones cerradas: A) ampliar el tope en N delegaciones y anotar `ampliado=N`; B) replantear lo bloqueado con `arquitecto` o `planificador` (cuenta como ronda); C) cerrar la sesión y revisar a mano. Después te detienes.
6. Si `--presupuesto` sale con 1 por `STATUS.md`, reescríbelo con la plantilla en la transición siguiente.
7. Plantilla, con cada ítem ≤150 caracteres, sin historia y en ≤1536 B:

```
# Estado
Escalación: <ninguna, o causa y opciones>
Paso actual: <rol; feature; tarea; Rama: o Modo yolo:; qué revisa Franco>
Presupuesto: <Fxx>; rondas arq=<n> plan=<n>; ampliado=<n>
Espera a Franco: <qué espera, o ninguna>
Bloqueos abiertos: <motivo y rol, o ninguno>
Retomar: <feature; paso exacto; rama; qué espera de Franco>
Actualizado: <fecha>
```

8. Dile a Franco «abre sesión nueva» tras dejar `Retomar:`: al confirmar una feature `hecha`, con `estado=excedido` si elige C, y con `estado=aviso` por `D75` (corte preventivo).
