# Cambio: saludo de equipo

## Exploración
La CLI `base/app.cjs` acepta `saludo` y `version`. El saludo actual debe cambiar; la versión debe mantenerse.

## Evaluación y decisión
Cambio pequeño y claro: modificar la salida de `saludo` conservando el comando vecino.

## Alcance y aceptación
Cambiar `Hola, mundo` por `Hola, equipo`. `node app.cjs saludo` debe imprimir exactamente `Hola, equipo`; `node app.cjs version` debe conservar `1`. No cambies otros comandos.

## Plan
Lee la base, realiza el cambio y ejecuta ambos comandos para comprobar las salidas y sus códigos.
