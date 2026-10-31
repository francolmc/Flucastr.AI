# task-01 — `modelos.json` con `ventanas` y `compactar_en`
repo: Flucastr.AI   depende_de: —   estado: aprobada

## Descripción
Declarar en `modelos.json` los datos que necesita la compactación automática: la ventana de contexto de cada modelo de Pi del perfil `pi-openai` (`ventanas`) y el umbral deseado (`compactar_en`, defecto 100000). Sin esto el resolver no puede calcular `reserveTokens = ventana − compactar_en`. Es el primer paso de F19 y no cambia ninguna resolución de modelos.

## Contexto
- Leído `modelos.json` (raíz): claves `version` (1), `_leeme`, `niveles`, `nivel_por_defecto`, `respaldo`, `perfiles` (`pi-openai`: proveedor `openai`, modelos `openai/gpt-6-astra`, `openai/gpt-6.1-sol`, `openai/gpt-6-luna`; `claude-code`), `perfil_por_defecto`, `agentes`.
- Informe base `pruebas/resultados/2026-10-31-verificacion-compactacion.md`, punto 4: las tres ventanas son 272000 (catálogo de Pi, proveedor `openai`). Claude Code no lleva `ventanas`: su valor es `compactar_en + 33000` (punto 6 del informe) y lo calcula el resolver.
- Diseño: `definitions/ARCHITECTURE.md`, «Valores sin hardcodear». Un perfil puede sobreescribir `compactar_en`; esta tarea no lo hace.
- No cambiar `version`: `pruebas/capa1/remoto.test.mjs` (línea 311) espera «personal 1, publicado 2» partiendo de la versión actual.
- Consumidores: `scripts/resolver.mjs` (lee solo las claves que usa; ignora las demás), `pruebas/comprobaciones/modelos-agentes.mjs`. Ninguno rechaza claves nuevas.

## Decisiones ya tomadas
- `compactar_en` va en la raíz del objeto, justo después de `nivel_por_defecto`: `"compactar_en": 100000,`.
- `ventanas` va dentro de `perfiles.pi-openai`, justo después de `modelos`, con las tres claves exactas `provider/modelId` y valor `272000` cada una. El perfil `claude-code` no cambia.
- Se amplía el texto de `_leeme` con una frase: «compactar_en = tokens de contexto a los que compacta la herramienta; ventanas = ventana de contexto por modelo (Pi: reserveTokens = ventana − compactar_en; Claude Code: autoCompactWindow = compactar_en + 33000).» El resto del texto de `_leeme` no se toca.
- Formato: dos espacios de sangría y estilo del archivo actual (una línea por clave corta).

## Alcance / Fuera de alcance
Alcance: solo `modelos.json`.
Fuera de alcance: `version`, niveles, agentes, el perfil `claude-code`, `scripts/resolver.mjs`, `instalar.sh`, pruebas y `~/.flucastr-ai/modelos.json` (el personal de Franco).

## Pasos
1. Editar `modelos.json`: añadir `"compactar_en": 100000,` tras `nivel_por_defecto`. Resultado: `node -e "console.log(require('./modelos.json').compactar_en)"` imprime `100000`.
2. Añadir `ventanas` al perfil `pi-openai` con los tres modelos a 272000. Resultado: `Object.keys(...ventanas)` coincide con `Object.values(...modelos)` del mismo perfil.
3. Ampliar `_leeme` con la frase indicada. Resultado: el JSON sigue parseando.
4. Correr la verificación y pegarla en *Evidencia*.

## Criterios de aceptación
1. `modelos.json` es JSON válido y tiene `compactar_en` = 100000 y `perfiles.pi-openai.ventanas` con las tres claves en 272000 (comando de *Verificación*).
2. Las claves de `ventanas` son exactamente los modelos de `perfiles.pi-openai.modelos` (comando de *Verificación*).
3. La resolución no cambió: `node scripts/resolver.mjs modelo <agente> <herramienta>` da los mismos ocho valores de antes (comando de *Verificación*).
4. `bash pruebas/rapida.sh` termina con exit 0.
5. `git diff --stat modelos.json` muestra solo `modelos.json`.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node -e "const c=require('./modelos.json');const p=c.perfiles['pi-openai'];console.log(c.compactar_en, JSON.stringify(p.ventanas)); console.log(JSON.stringify(Object.keys(p.ventanas).sort())===JSON.stringify(Object.values(p.modelos).sort()))"
for a in arquitecto planificador coordinador constructor; do for h in claude-code pi; do echo "$a $h $(node scripts/resolver.mjs modelo $a $h)"; done; done
R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -2 "$R"
git diff --stat
```
Esperado: `100000 {"openai/gpt-6-astra":272000,"openai/gpt-6.1-sol":272000,"openai/gpt-6-luna":272000}` y `true`; ocho líneas con `claude-sonnet-5-5` / `claude-haiku-5-5` (constructor) y `openai/gpt-6.1-sol` / `openai/gpt-6-luna` (constructor); `rapida: … (tope 30 s)` con exit 0; el diff solo tiene `modelos.json` de esta tarea (el árbol ya trae otros cambios sin commit de F18: ignorarlos, filtrar por `modelos.json`). Ejecutado por el planificador: solo los comandos de lectura; el resultado de `rapida.sh` se mide al construir.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
