# task-05 — README: instalación sin clonar, en lenguaje neutro
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
`### Sin clonar el repo (PC de trabajo)` del README habla del PC de trabajo de Franco y termina con una «Comprobación manual» que solo él puede hacer. Se reescribe para cualquier persona que instale sin clon, conservando todos los comandos, y se retira la comprobación manual.

## Contexto
- Leer: `README.md@153-45`
- Tocar: `README.md`
- El rango 153-197 va de `### Sin clonar el repo (PC de trabajo)` hasta la línea en blanco previa a `## Pruebas` (la línea 197).
- Confirmado por lectura: `instalar-remoto.sh` existe y los comandos de esa sección son los vigentes; no se vuelven a ejecutar (descargan de la red).
- Fuente: ninguna
- Requiere: runtime:node@25.8.1

## Decisiones ya tomadas
- Mismo estilo que task-02 (tuteo / tercera persona; sin «mi», «mis», «yo», «tengo»).
- Título nuevo: `### Sin clonar el repo` (sin «PC de trabajo»); la frase de apertura dice «en un equipo donde no quieres o no puedes clonar el repo».
- Se conservan intactos los tres bloques de comandos (descarga en dos pasos, una línea, y gestión desde `~/.flucastr-ai/kit/`) y las viñetas sobre atomicidad, `version`, `modelos.json` personal y `desinstalar.sh`.
- Se elimina la subsección `#### Comprobación manual en el PC de trabajo` completa y el párrafo «Pendiente de comprobar en el PC de trabajo…» (esa pendiente pasa a `## Limitaciones`, task-02); el párrafo previo sobre `--skills-proyecto` con `--copiar` se conserva sin la frase «Si Pi está en el workspace de ese PC».
- La viñeta de requisitos queda: «Requisitos de este camino: `bash`, `curl`, `tar` y `node`.»
- «Riesgo asumido de `curl | bash`» pasa a «Riesgo de `curl | bash`»: quien controle la cuenta de GitHub del repo controla lo que se ejecuta; por eso la forma de dos pasos va primero; el autor prevé 2FA y PR obligatorio en `main` como mitigación.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: la subsección `### Sin clonar el repo` completa.
Fuera de alcance: `instalar-remoto.sh`, `instalar.sh`, otras secciones, ejecutar la instalación real.

## Pasos
1. Corre `git branch --show-current` y comprueba la rama.
2. En `README.md`, aplica las decisiones anteriores a la subsección (título, apertura, viñetas, riesgo).
3. Borra `#### Comprobación manual en el PC de trabajo` y el párrafo «Pendiente de comprobar…».

## Criterios de aceptación
1. Rama `chore/F47-readme-para-cualquier-usuario` (comando 1).
2. La subsección no contiene primera persona ni «PC de trabajo» (comando 2).
3. Siguen los tres comandos clave (comando 3).
4. La prueba del árbol de `## Estructura` sigue pasando (comando 4).

## Verificación
```
git branch --show-current
awk '/^### Sin clonar el repo/,/^## Cómo se prueba|^## Pruebas/' README.md | grep -nEiw 'mi|mis|yo|tengo|mío|mía|PC de trabajo'; echo "grep:$?"
grep -c 'instalar-remoto.sh --estado\|instalar-remoto.sh --actualizar\|instalar-remoto.sh --ref' README.md
node --test pruebas/comprobaciones/readme-estructura.test.mjs
```
Esperado: la rama `chore/F47-readme-para-cualquier-usuario`; solo `grep:1`; `4`; las pruebas pasan con 0 fallos.

## Evidencia

```
$ git branch --show-current
chore/F47-readme-para-cualquier-usuario
exit 0
```

```
$ awk '/^### Sin clonar el repo/,/^## Cómo se prueba|^## Pruebas/' README.md | grep -nEiw 'mi|mis|yo|tengo|mío|mía|PC de trabajo'; echo "grep:$?"
grep:1
exit 0
```

```
$ grep -c 'instalar-remoto.sh --estado\|instalar-remoto.sh --actualizar\|instalar-remoto.sh --ref' README.md
4
exit 0
```

```
$ node --test pruebas/comprobaciones/readme-estructura.test.mjs
✔ muestra válida: no hay errores (0.937416ms)
✔ variante: falta un agente en el README (0.117292ms)
✔ variante: falta una skill en el README (0.360042ms)
✔ variante: sobra un agente en el README (0.074375ms)
✔ variante: sobra una skill en el README (0.077791ms)
✔ variante: README sin sección «## Estructura» (0.062584ms)
✔ repo real: README, agentes/ y skills/ coinciden (0.324916ms)
ℹ tests 7
ℹ pass 7
ℹ fail 0
exit 0
```

## Notas
- Aviso: el rango de Leer `README.md@153-45` no es válido. Ubiqué la sección por su encabezado: empieza en la línea 153 y termina antes de `## Cómo se prueba` (198). No hubo desplazamiento.
- Primera pasada de Verificación: `grep:0`, porque la viñeta de actualización (línea 29 del README) decía «el mío». Corregida a «el personal». Segunda pasada: `grep:1`. Son las dos pasadas permitidas.
- Huecos menores resueltos (tuteo y sin primera persona, como task-02):
  1. Apertura: «En el PC de trabajo no tengo clon. Ahí uso» pasa a «En un equipo donde no quieres o no puedes clonar el repo, usa».
  2. «Lo que recomiendo» pasa a «Lo recomendable»; «lo leí y confío» a «lo leíste y confías»; «lo manejo» a «lo gestionas»; «lo corro yo» a «lo ejecutas».
  3. «mi `modelos.json`» (dos veces) y «el mío» pasan a «personal».
  4. Riesgo: «Riesgo asumido de `curl | bash`» pasa a «Riesgo de `curl | bash`», y «en este PC» a «en ese equipo». Requisitos: «Requisitos de este camino».
  5. Párrafo de `--skills-proyecto`: se quita «Si Pi está en el workspace de ese PC,» y la frase «Pendiente de comprobar…». Se borra por completo `#### Comprobación manual en el PC de trabajo`.
- Los tres bloques de comandos y las viñetas de atomicidad, `version`, `modelos.json` y `desinstalar.sh` quedan intactos.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=5; resultado=lista; causa=ninguna
