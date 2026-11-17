# Tramo 141 — Acortar README y preservar guía

## Pasos

### Tramo 141 — Historia: Acortar README y preservar guía
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 140 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: README.md, docs/guide.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: README.md, docs/guide.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A141).
Aceptación A141: Comprobar enlaces y anclas usados, prueba positiva y negativa de verify, comandos documentados y ausencia de nombres propios en contenido vigente.
TODO:
- [x] En `README.md`, Mover la guía completa a docs/guide.md ajustando sus enlaces relativos; dejar README breve con mapa de estructura efectiva, entradas, enlaces esenciales y literal pi-constructor requerido por verify. Anonimizar solo contenido vigente de ambos documentos. (A141). Comprobación: Comprobar enlaces y anclas usados, prueba positiva y negativa de verify, comandos documentados y ausencia de nombres propios en contenido vigente.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A141). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: `README.md` es un índice breve con mapa de estructura, entradas `bash instalar.sh`, `bash instalar.sh --simular`, `./verify` y literal `pi-constructor`; `docs/guide.md` conserva la guía completa y sus comandos. El comprobador Python de enlaces/anclas confirmó todos los destinos internos; confirmó secciones de instalación/verificación, entradas y ausencia de “Franco” en ambos documentos. Positivo y negativo de `verify` quedaron cubiertos por la salida aislada: `ok 8d: ejecutor:, 20 palabras (sin 60 palabras), ventana propia y pi-constructor presentes; copia sin ejecutor: falla`. `git diff --check -- README.md docs/guide.md` pasó (`exit 0`).
- Paso 2: `$ timeout 71 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó en 43,3 s (`exit 0`). Salida: `control negativo: modificación adicional en 8i rechazada.`; `verify coincide salvo las sustituciones textuales exactas autorizadas de los escenarios 9 y 8i.`; `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo las excepciones textuales exactas autorizadas de los escenarios 9 y 8i.`. Receta aislada ejecutó `./verify` y dos simulaciones; códigos, salidas y efectos coincidieron con la referencia bajo esas excepciones.
