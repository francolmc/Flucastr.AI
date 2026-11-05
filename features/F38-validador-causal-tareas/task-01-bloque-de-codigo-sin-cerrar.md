# task-01 — Detectar bloques de código sin cerrar como primer error
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Hoy un bloque de código sin cerrar en una tarea (caso real: un bloque «```sh» pegado al final de un párrafo de *Evidencia*) hace que `secciones` trate el resto del archivo como código, y el validador responde con la cascada «Falta la sección ## Notas». Esta tarea agrega la detección de paridad de cercas (``` y ~~~, con su longitud) como PRIMER y único error, con el número de línea, la sección donde cae y quién la escribe.

## Contexto
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- Tocar: `scripts/formato-tarea.mjs`, `pruebas/comprobaciones/formato-tarea.test.mjs`
- Requiere: runtime:node@25
- `scripts/formato-tarea.mjs` líneas 33-48: `secciones(lineas)` usa `/^```/` para alternar `enCodigo`; líneas 51-70: `validarTarea(texto)` arma `errores` y hace `return errores` al final. `scripts/formato-fuente.mjs` importa `secciones` y no cambia.
- Propietarios de sección (`definitions/WORKFLOW.md` §6): *Evidencia* y *Notas* las escribe el constructor; las otras ocho, el planificador.
- `pruebas/comprobaciones/formato-tarea.test.mjs` tiene la `muestra` válida y la lista `variantes`; `node --test` corre cada archivo.
- Comando de base: `bash pruebas/rapida.sh` (≈40 s, verificado hoy).

## Decisiones ya tomadas
- Nuevas funciones exportadas en `scripts/formato-tarea.mjs`: `bloqueSinCerrar(lineas)` devuelve `null` o `{ linea, seccion }` (`linea` es el número 1-based de la cerca de apertura; `seccion` es el título `##` vigente o `null` si cae antes de la primera sección); `mensajeBloqueSinCerrar(lineas)` devuelve `null` o el texto del error de abajo (la usarán `validarTarea` y, en task-02, `validarEvidencia`).
- Cerca válida: línea que empieza con 0 a 3 espacios y luego 3 o más «`» o 3 o más «~» iguales. Apertura con «`» no puede traer «`» en el resto de la línea. Cierra solo una cerca del mismo carácter, de longitud mayor o igual a la de apertura y sin texto después (solo espacios). Una cerca a mitad de línea no es cerca.
- Dentro de un bloque no se reconocen encabezados `##` ni otras cercas distintas.
- En `validarTarea`, si `mensajeBloqueSinCerrar` devuelve algo, se devuelve SOLO este error y nada más: `Hay un bloque de código abierto en línea N, en «## Sección» (la escribe el constructor|el planificador): falta la cerca de cierre.` Sin sección: `…en línea N, antes de la primera sección: falta la cerca de cierre.`
- `secciones` pasa a usar la misma lógica de cercas (con longitud y «~»), para que no haya dos criterios.
- No se tocan `formato-evidencia.mjs` ni `formato-bloqueo.mjs` (task-02).

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: `bloqueSinCerrar`, el error único en `validarTarea` y la cerca con longitud y «~» en `secciones`, con pruebas.
Fuera de alcance: `--evidencia`, la firma, el hook, cualquier cambio en tareas existentes y en `skills/`.

## Pasos
1. Antes de editar, guarda las tareas de `features/completed/` que hoy son válidas con el comando de *Verificación* 2 (queda en `pruebas/.temporales/f38-t01-antes.txt`).
2. En `scripts/formato-tarea.mjs`, escribe `bloqueSinCerrar` y `mensajeBloqueSinCerrar`, y usa la primera dentro de `secciones` para decidir qué líneas son código.
3. En `validarTarea`, justo después de partir en líneas, devuelve el error único si hay bloque sin cerrar.
4. En el test, agrega la tarea dañada: `muestra` con, en *Evidencia*, el párrafo `Salida del paso 2:` seguido sin cierre de «```sh» y `$ ls`; espera exactamente un error que contiene `bloque de código abierto en línea` y `## Evidencia` y no contiene `Falta la sección`.
5. Agrega pruebas: cerca «~~~» sin cerrar; «````» abierta y cerrada con «```» (sigue abierta); «```» cerrada con «````» (cerrada); «```» a mitad de línea (sin error); bloque abierto antes de la primera sección; `muestra` sigue sin errores.
6. Corre el comando de *Verificación* 2 de nuevo y compara.

## Criterios de aceptación
1. La tarea dañada del paso 4 da un solo error con «bloque de código abierto en línea N», la sección *Evidencia* y quien la escribe, sin «Falta la sección». Se comprueba con `node --test pruebas/comprobaciones/formato-tarea.test.mjs`.
2. «~~~» sin cerrar y «````» cerrada con una cerca más corta se rechazan; «```» cerrada con «````» y «```» a mitad de línea no. Misma prueba.
3. Ninguna tarea de `features/completed/` que era válida antes deja de serlo: la lista del paso 6 contiene a la del paso 1.
4. `bash pruebas/rapida.sh` termina en 0.

## Verificación
```
git branch --show-current
for f in features/completed/*/task-*.md; do node scripts/validar-tarea.mjs "$f" >/dev/null && echo "$f"; done > pruebas/.temporales/f38-t01-despues.txt; comm -23 pruebas/.temporales/f38-t01-antes.txt pruebas/.temporales/f38-t01-despues.txt | wc -l
node --test pruebas/comprobaciones/formato-tarea.test.mjs
bash pruebas/rapida.sh
```
Esperado: primera salida `fix/F38-validador-causal-tareas`; el `wc -l` imprime `0`; la segunda y la tercera salen con `exit 0` y la prueba muestra `fail 0`.

## Evidencia
```
$ git branch --show-current
fix/F38-validador-causal-tareas
exit 0
```

```
$ for f in features/completed/*/task-*.md; do node scripts/validar-tarea.mjs "$f" >/dev/null && echo "$f"; done > pruebas/.temporales/f38-t01-despues.txt; comm -23 pruebas/.temporales/f38-t01-antes.txt pruebas/.temporales/f38-t01-despues.txt | wc -l
0
exit 0
```

```
$ node --test pruebas/comprobaciones/formato-tarea.test.mjs
✔ un bloque «```sh» sin cerrar en Evidencia da un solo error con línea, sección y autor
✔ una cerca «~~~» sin cerrar se rechaza y la escribe el planificador
✔ una cerca «````» cerrada con «```» sigue abierta
✔ una cerca «```» cerrada con «````» queda cerrada
✔ una cerca «```» a mitad de línea no abre bloque
✔ un bloque abierto antes de la primera sección da error sin sección
✔ las tareas reales de features/ cumplen el formato
ℹ tests 34
ℹ suites 0
ℹ pass 34
ℹ fail 0
exit 0
```

```
$ bash pruebas/rapida.sh
✔ lanzar-constructor-claude.sh: el control negativo rechaza una lista autorizada con git commit (27.998583ms)
ℹ tests 766
ℹ suites 0
ℹ pass 766
ℹ fail 0
ℹ cancelled 0
rapida: 53 archivos en 29 s (tope 90 s)
exit 0
```

## Notas
Hueco menor: la prueba «antes de la primera sección» quita la cerca de cierre de *Verificación* de la muestra, porque esa cerca cerraba la abierta y el error caía en la línea 33 (el segundo ``` de *Verificación*). Así la regla se prueba sin otras cercas.
Hueco menor: la apertura admite 0 a 3 espacios de sangría y la cerca de apertura pertenece a la sección vigente, como antes.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
