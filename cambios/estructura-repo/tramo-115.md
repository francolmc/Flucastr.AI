# Tramo 115 — Conectar la huella de diagnóstico (borrador)

## Pasos

### Tramo 115 — Historia: usar el módulo local de cada skill
Como mantenedor quiero separar la huella para conservar el diagnóstico en instalaciones por enlace y por copia.
Dependencias: tramo 114 revisado; matriz de escenarios y referencia del tramo 112. Contratos: ambos entrypoints siguen siendo archivos regulares idénticos; importar `./fingerprint.mjs` desde cada directorio, sin dependencia de la raíz del repositorio; conservar orden, argumentos, códigos, formato y ausencia de escrituras. Ejemplo: una instalación nueva mediante `--copiar` ejecuta el diagnóstico después de retirar el repositorio fuente de su vista.
Alcance: `skills/diagnosticar/diagnosticar.mjs`, `core/skills/diagnose/diagnosticar.mjs` y pruebas; los módulos de huella permanecen idénticos.
Archivos: `skills/diagnosticar/diagnosticar.mjs`, `core/skills/diagnose/diagnosticar.mjs`.
CUANDO se ejecute el diagnóstico en cualquiera de las rutas instaladas ENTONCES devuelve el resultado de referencia y no modifica el proyecto (A115).
Aceptación A115: reemplazar las funciones duplicadas por el import local sin modificar su lógica; comprobador de compatibilidad en verde; texto, JSON, errores y huellas coinciden con la matriz del tramo 112. La prueba cubre enlaces ya instalados, copia nueva y paquete remoto offline.
TODO:
- [ ] Sustituir las definiciones de `recorrer` y `huellaActual` por imports locales en `skills/diagnosticar/diagnosticar.mjs` y `core/skills/diagnose/diagnosticar.mjs` y retirar solo imports que ya no se usen (A115). Comprobación: ambos archivos son idénticos y el comprobador retorna 0.
- [ ] Ejecutar la matriz de `cambios/estructura-repo/tramo-112.md` sobre repositorios sintéticos, incluidos árbol con exclusiones, repo sin HEAD y carpeta que no es raíz de repo; comparar la huella antes y después y comprobar que no hay escrituras (A115). Comprobación: salida, código y estado del árbol coinciden con la referencia.
- [ ] Probar `skills/diagnosticar/diagnosticar.mjs` instalado por enlace, por `--copiar` y desde el paquete remoto offline, con el repositorio fuente inaccesible para la copia (A115). Comprobación: las tres variantes producen el mismo resultado para el mismo fixture y ninguna depende de `tools/` ni del checkout.
- [ ] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A115). Comprobación: códigos, salida y efectos coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además matriz, instalaciones aisladas y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos y resultados; detenerse para revisión.

## Evidencia
Pendiente.
