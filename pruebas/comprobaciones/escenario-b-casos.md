# Comprobaciones duras de B

La prueba automatizada está en `contrato.test.mjs`. Controles negativos: archivo de salida faltante, `AGENTS.md` vacío, estado no borrador, canario filtrado, cambio ajeno a rutas permitidas, `initialize.sh` sintácticamente inválido o incapaz de reconstruir, lista de repos/URL/rama incorrecta y repo ausente del diagrama. El arnés ejecuta una segunda vez el script y exige el aviso «omitido».
