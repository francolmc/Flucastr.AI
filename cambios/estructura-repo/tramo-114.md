# Tramo 114 — Distribuir el módulo de huella (borrador)

## Pasos

### Tramo 114 — Historia: mantener equivalentes las dos copias
Como mantenedor quiero que el módulo preparado acompañe también a la skill de `core/` para conservar la instalación por copia.
Dependencias: tramo 113 revisado; inventario y comprobador del tramo 82; empaquetado del tramo 81. Contratos: ambos archivos son regulares y sus bytes y permisos ejecutables coinciden; todavía ningún entrypoint importa el módulo. Las instalaciones por copia reciben el directorio completo de la skill, incluidas sus dependencias locales. Ejemplo: al copiar la skill a un HOME temporal, `fingerprint.mjs` queda junto a `diagnosticar.mjs`.
Alcance: `core/skills/diagnose/fingerprint.mjs`, `tools/core-compatibility.json` y pruebas. No modificar los entrypoints.
Archivos: `core/skills/diagnose/fingerprint.mjs`, `tools/core-compatibility.json`.
CUANDO se compruebe o empaquete el par ENTONCES existe en las dos rutas con los mismos bytes y modo (A114).
Aceptación A114: el comprobador acepta el par y rechaza una divergencia en una copia temporal; el paquete remoto contiene ambos archivos y las pruebas de instalación aislada comprueban su inclusión.
TODO:
- [ ] Copiar `skills/diagnosticar/fingerprint.mjs` a `core/skills/diagnose/fingerprint.mjs` y registrar el par en `tools/core-compatibility.json` (A114). Comprobación: `cmp` y el comprobador retornan 0; alterar temporalmente un byte hace fallar al comprobador.
- [ ] Comprobar `./instalar-remoto.sh` y una instalación por copia con `bash ./instalar.sh --copiar` en HOME aislado (A114). Comprobación: los archivos de la skill instalados incluyen `fingerprint.mjs`, y el paquete contiene las dos rutas como archivos regulares.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A114). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además compatibilidad, paquete, instalación por copia y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
