# Feature retrospectiva de ejemplo

## Alcance
Solo los archivos declarados en la historia; sin cambio de comportamiento adicional.

## Pasos
### Tramo 1 — Historia: llegar a la sección
Como persona usuaria quiero llegar a una sección privada para encontrar sus acciones existentes. Dependencias: ninguna.
Archivos: `Proyecto.FinanzasV5.WebApp/app/components/PrivateShell.tsx`, `verificacion/recorrido.mjs`.
CUANDO entro al espacio privado ENTONCES el enlace llega a la sección existente (A1).
Aceptación A1: el recorrido sintético confirma el enlace y su destino único.
- [ ] Actualizar `Proyecto.FinanzasV5.WebApp/app/components/PrivateShell.tsx` (A1). Comprobación: comparar el destino con la definición acordada; coincide.
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` — nivel 2; exit 0; cubre A1.
Handoff: usar datos sintéticos y devolver evidencia del recorrido.
