# Contrato de verificación

La garantía cubre solo los permisos instalados por el kit; los efectos internos de scripts declarados quedan sujetos a revisión de la evidencia.

El kit pide verificación por capacidades, no por herramientas. Cada proyecto declara en su `AGENTS.md`, en la sección Comandos, una línea por capacidad con el comando que la cubre. Una capacidad sin línea se cubre con `./verify`.

## Capacidades

- **Rápida** (`Comprobación rápida:`): segundos, en el host, sin servicios levantados. Corresponde al Nivel 1 de `planificar-cambio`.
- **Servicio** (`Servicio:`): la lógica contra dependencias reales (base de datos, cola, correo), sin interfaz. Corresponde al Nivel 2.
- **Aceptación** (`Aceptación:`): un archivo por flujo, filtrable por nombre. No corta al primer fallo: resume todos al final. Corresponde al Nivel 3.
- **Evidencia** (`Evidencia:`): dónde escribe `resultado.json` la corrida.

## Huella

Por cada carpeta de `repos:`: `{ git status --porcelain; git diff HEAD; } | sha256sum | cut -c1-12`.

## resultado.json

```json
{ "huella": "<12 hex>", "nivel": "rapida|servicio|aceptacion", "fase": "<etapa donde terminó>", "ok": true, "fallo": "ninguno" }
```

- `fase` es texto libre del proyecto.
- `fallo` es cerrado: `ninguno`, `entorno`, `dependencia`, `prueba` o `tiempo`.
- `ok` es `true` solo si la corrida pasó completa.
