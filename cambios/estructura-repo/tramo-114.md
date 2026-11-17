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
- [x] Copiar `skills/diagnosticar/fingerprint.mjs` a `core/skills/diagnose/fingerprint.mjs` y registrar el par en `tools/core-compatibility.json` (A114). Comprobación: `cmp` y el comprobador retornan 0; alterar temporalmente un byte hace fallar al comprobador.
- [x] Comprobar `./instalar-remoto.sh` y una instalación por copia con `bash ./instalar.sh --copiar` en HOME aislado (A114). Comprobación: los archivos de la skill instalados incluyen `fingerprint.mjs`, y el paquete contiene las dos rutas como archivos regulares.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A114). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además compatibilidad, paquete, instalación por copia y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: `cp -p` dejó ambas rutas como archivos regulares modo `644`; `cmp`, `node --check core/skills/diagnose/fingerprint.mjs` y `node tools/verify/core-compatibility.mjs` pasaron. Una raíz sintética temporal con el par válido fue aceptada por `checkCoreCompatibility`; al añadir bytes solo a la copia, el comprobador la rechazó por `contenido distinto`. El fixture se eliminó y los archivos fuente y destino reales no se alteraron durante la prueba negativa.
- Paso 2: un fixture de paquete tar sintético instaló con `./instalar-remoto.sh` vía `FLUCASTR_ORIGEN`, sin red y bajo Bubblewrap; ambos archivos se confirmaron como regulares, con bytes idénticos en el tar y en el kit instalado. Después `bash ./home/.flucastr-ai/kit/instalar.sh --copiar` corrió con HOME temporal y entorno Claude sintético; `~/.claude/skills/diagnosticar/fingerprint.mjs` quedó como archivo regular con bytes iguales. Ambos comandos terminaron con código 0.
- Paso 3: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó `exit 0` en 43.7 s. El `./verify` aislado coincide con `linea-base/` salvo el mensaje exacto autorizado del escenario 9; las dos simulaciones son repetibles y coinciden con sus referencias, aplicando solo esa excepción.
