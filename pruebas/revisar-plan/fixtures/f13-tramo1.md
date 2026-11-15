# F13 — Diseño integral de la experiencia existente

## Pasos
### Tramo 1 — Estructura, primer uso e inicio
Resultado: navegación real y primer uso funcionales. Archivos: Web `app/`, pruebas Web, `docs/experiencia.md` y verificación necesaria.
- [ ] Trasladar los principios aprobados de `experiencia-borrador.md` a `docs/experiencia.md` (A1, A6).
- [ ] Crear componentes compartidos y navegación adaptable que mantenga accesibles los recorridos restantes (A1, A6).
- [ ] Conectar acceso, saldo inicial y resumen a sus datos reales, con estados de carga y error (A1, A5).
- [ ] Probar entrada, primer saldo y navegación productiva con datos sintéticos, incluyendo vista móvil (A1, A5, A6).
Verificación del tramo: `node verificacion/rapida.mjs` — nivel 1 (≈5 min); cubre A1, A5, A6 con las pruebas incorporadas.
