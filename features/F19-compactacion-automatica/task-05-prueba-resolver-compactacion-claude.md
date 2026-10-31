# task-05 — Prueba del resolver: compactación de Claude Code y `comparar-modelos`
repo: Flucastr.AI   depende_de: task-04   estado: aprobada

## Descripción
Fijar con una prueba determinista (sin modelo ni red) la variante de Claude Code de `fijar-compactacion` / `quitar-compactacion` (valor `compactar_en + 33000`, rango 100000–1000000, no pisar al usuario, convivencia con `fijar-agente`) y los avisos nuevos de `comparar-modelos`, con controles negativos. Entra en `rapida.sh` sin tocarla.

## Contexto
- Órdenes implementadas en task-04 (sintaxis y líneas de salida `fijado:<valor>`, `ya-estaba`, `omitido-usuario`, `omitido-umbral`, `omitido-rango:<valor>`, `quitado`, `archivo-quitado`, `omitido`, `campo nuevo: …`) y `fijar-agente` / `quitar-agente` ya existentes en `scripts/resolver.mjs`.
- Estilo: `pruebas/comprobaciones/resolver-agentes.test.mjs` y la prueba de la task-03 (`pruebas/comprobaciones/resolver-compactacion-pi.test.mjs`): `node:test`, `spawnSync`, carpetas temporales, `FLUCASTR_MODELOS` para un `modelos.json` propio.
- Informe `pruebas/resultados/2026-10-31-verificacion-compactacion.md`, punto 5: valores fuera de 100000–1000000 se ignoran en silencio en Claude Code (por eso el resolver debe omitirlos con aviso).
- Tope de `rapida.sh`: 30 s; esta prueba debe durar menos de ~2 s.

## Decisiones ya tomadas
- Archivo nuevo `pruebas/comprobaciones/resolver-compactacion-claude.test.mjs`.
- Casos:
  1. Carpeta nueva: `fijado:133000`; contenido exacto `{"autoCompactWindow":133000}`; repetir da `ya-estaba` y el archivo no cambia (bytes).
  2. El valor sigue a `modelos.json`: con `compactar_en` = 150000 en un `modelos.json` temporal → `fijado:183000`; con un override de perfil (`perfiles["claude-code"].compactar_en` = 120000, global 100000) → `fijado:153000`.
  3. Rango: `compactar_en` = 50000 (85000 resultante, fuera de rango) → `omitido-rango:83000` y no se escribe; `compactar_en` = 980000 → `omitido-rango:1013000`; ausente o `"abc"` → `omitido-umbral`.
  4. No pisar: archivo con `{"autoCompactWindow":150000,"otra":1}` → `omitido-usuario` y bytes iguales; con el mismo valor 133000 puesto a mano → `ya-estaba`; con `modelSettings` presentes se conservan.
  5. Convivencia con el agente: `fijar-agente <ruta> coordinador` y luego `fijar-compactacion claude <ruta>` dejan ambas claves; `quitar-compactacion claude <ruta> 133000` deja solo `agent`; `quitar-agente <ruta> coordinador` borra entonces el archivo (`archivo-quitado`).
  6. Quitar: valor distinto → `omitido`; archivo inexistente → `omitido`; archivo que queda vacío → `archivo-quitado` y no existe.
  7. JSON inválido: exit 1 y bytes iguales. `--simular`: misma línea y la carpeta sigue vacía.
  8. `comparar-modelos`: con un personal sin `compactar_en` ni `ventanas` imprime exactamente `campo nuevo: compactar_en` y `campo nuevo: ventanas (perfil pi-openai)`; entre dos archivos iguales no imprime nada; un perfil nuevo solo en el publicado sigue dando `perfil nuevo: …` (no `campo nuevo`).
  9. Controles negativos: (a) un ayudante `ajenasIntactas(antes, despues)` devuelve las claves de `antes` que cambiaron o faltan; con el resultado real de los casos 4 y 5 → `[]`, y con una copia dañada a propósito (se borra `agent`, `otra` cambia) → lista exactamente esas dos; (b) la comprobación del caso 3 pasada contra un valor dentro de rango (133000) debe *no* ser `omitido-rango` (`assert.notEqual`), lo que demuestra que el caso distingue rango válido de inválido.
- Cifras como números, no como texto.

## Alcance / Fuera de alcance
Alcance: el archivo nuevo `pruebas/comprobaciones/resolver-compactacion-claude.test.mjs`.
Fuera de alcance: `scripts/resolver.mjs` (si la prueba revela un defecto, nota o `BLOQUEO`; no se corrige aquí), la prueba de Pi (task-03), `instalar.sh`, `desinstalar.sh`, `rapida.sh`.

## Pasos
1. Leer las órdenes nuevas de `scripts/resolver.mjs` y la prueba de la task-03. Resultado: salidas reales anotadas en *Notas*.
2. Crear el archivo con ayudantes (`resolver`, `carpeta`, `modelosTemporal`, `ajenasIntactas`). Resultado: `node --check` sin errores.
3. Escribir los casos 1 a 4. Resultado: aprobados.
4. Escribir los casos 5 a 7. Resultado: aprobados.
5. Escribir los casos 8 y 9. Resultado: aprobados.
6. Comprobar a mano un control negativo (quitar temporalmente una aserción de rango y ver que el caso 3 falla); restaurar y anotarlo en *Notas*.
7. Correr la verificación y pegarla en *Evidencia*.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/resolver-compactacion-claude.test.mjs` termina con `fail 0` y al menos 9 pruebas aprobadas.
2. La prueba dura menos de 2 s.
3. El control negativo 9(a) detecta la copia dañada (lista no vacía con `agent` y `otra`).
4. `bash pruebas/rapida.sh` termina con exit 0 y menos de 30 s.
5. `git status --short` muestra como nuevo, de esta tarea, solo ese archivo.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
time node --test pruebas/comprobaciones/resolver-compactacion-claude.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -3 "$R"
git status --short pruebas/comprobaciones/
```
Esperado: `tests` ≥ 9, `fail 0`, tiempo < 2 s; `rapida: … (tope 30 s)` con exit 0; el archivo nuevo aparece como `??`. No ejecutado por el planificador: depende de la task-04.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
