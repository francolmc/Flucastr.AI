# Por qué falló A4 y qué lo bajaría

Solo documentación. Etiquetas: **medido** (rollouts de Codex del 2026-11-10 y salida de `codex debug prompt-input`), **documentado** (tarifas y mecánica del proveedor, `scripts/tarifas.json`), **estimado** y **opinión**.

## 1. Causa medida de la razón 6,6

Revisor `gpt-6.1-sol`, esfuerzo `low`, 3 llamadas al modelo por revisión. Constructor `gpt-6-luna`, esfuerzo `medium`. Tarifas Sol (documentado): 50 entrada, 2,5 en caché y 250 salida, en créditos por 1M de tokens.

| Revisión | Entrada total | En caché | Entrada sin caché | Salida (razonamiento) | Créditos |
| --- | --- | --- | --- | --- | --- |
| 1 | 64.501 | 40.576 | 23.925 → 1,196 | 323 (43) → 0,081 | 1,378 |
| 2 | 60.803 | 38.528 | 22.275 → 1,114 | 163 (0) → 0,041 | 1,251 |

Constructor Luna: 285.268 y 282.930 tokens totales, 0,2264 y 0,1702 créditos. Razón = (1,378 + 1,251) / (0,2264 + 0,1702) ≈ 6,6 (**medido**).

Lectura (**medido**):

- La entrada sin caché es el 87 % (revisión 1) y el 89 % (revisión 2) del costo del revisor. La salida con razonamiento es el 6 % y el 3 %.
- El razonamiento no es la causa: el esfuerzo ya es `low` y la salida pesa 163 a 323 tokens.
- El primer turno de cada revisión tiene 19.265 y 18.786 tokens de entrada, con 0 en caché (≈0,96 créditos solo ese turno). Es un prefijo fijo que se paga entero en cada revisión.
- El constructor sí tuvo 7.168 tokens en caché en su segundo arranque (rollout 00-03-17).
- Se descarta la hipótesis «razonamiento caro» del informe externo y se confirma la del prefijo fijo. El prefijo medido (≈19 k) es mayor que los 8 a 13 k citados.

## 2. Qué compone el prefijo (≈19 k)

Medido con `codex -m gpt-6.1-sol -c model_reasoning_effort="low" debug prompt-input` en la raíz del repo, sin prompt de usuario. La salida son unos 78.400 caracteres de JSON. Tamaño por componente, en caracteres (**medido**; no en tokens):

| Componente | Caracteres | Parte |
| --- | --- | --- |
| Definiciones de herramientas (`functions`, `clock`, `collaboration`) | 25.970 | 33 % |
| Instrucciones de sistema de Codex | 21.524 | 27 % |
| Lista de skills (84 entradas) | 18.177 | 23 % |
| `AGENTS.md` del proyecto | 6.642 | 8 % |
| Rol y modo multi-agente | 2.671 | 3 % |
| Envoltura JSON | resto | ≈4 % |

- No se pudo medir en tokens por componente: no hay tokenizador local. Con 78 k caracteres y 19.265 tokens medidos, la proporción es ≈4 caracteres por token (**estimado**).
- El plan y el diff que el revisor recibe no están en esta salida; se suman al prefijo (**no medido**).
- La medición usa la config del usuario (sin `--ignore-user-config`). El revisor real corre con `codex exec` y `-C` en la raíz, así que carga lo mismo.

## 3. Palancas, ordenadas por ahorro estimado

Sobre un revisor de 1,378 créditos:

1. **Perfil mínimo del revisor** (**estimado**): quitar skills y herramientas que no usa y correr con `--ignore-user-config --ephemeral` (ambos flags existen en `codex exec`). Skills y herramientas suman ≈56 % de los caracteres; si se quitan, el prefijo bajaría a ≈8 a 10 k tokens y ahorraría ≈0,4 a 0,5 créditos por revisión. Hay que comprobar que el revisor sigue leyendo el plan y el diff. La instrucción de sistema de Codex no se puede quitar.
2. **Caché caliente** (**estimado**): si los 19 k del primer turno estuvieran en caché, cada revisión costaría ≈0,4 créditos y la razón caería a ≈2,0. Falta medir si la caché sobrevive entre revisiones.
3. **No revisar dos veces por defectos que el plan pudo cubrir** (**opinión**).
4. **Revisión escalonada con Luna** (**opinión**): una primera pasada barata y Sol solo si Luna marca riesgo. Con tarifas documentadas, Sol cuesta 20 veces Luna por token de entrada. El riesgo de calidad no está medido.
5. **A4 según tamaño** (**opinión**): solo para planes o diffs por encima de un umbral.

## 4. Evidencia externa (síntesis)

- Cognition (abr 2026): un revisor sin contexto compartido rinde mejor. Costo no publicado. (documentado por la fuente; su aplicación aquí es **opinión**)
- Anthropic: la relectura del historial usa caché; un subagente nuevo paga su propio prefijo (≈25 k en una medición de terceros, **no reproducida**).
- OpenAI (dic 2025): verificar cuesta «una fracción» del generador, y el esfuerzo alto rinde menos en código generado. Sin cifras. (documentado)
- Codex `exec` trivial: 8 a 13 k tokens de entrada (medición de terceros, **no reproducida**; aquí se midió ≈19 k con el kit).
- No hay razón revisor/constructor de referencia publicada.

## 5. Qué no se sabe y mediciones mínimas

No se sabe:

- si la caché del revisor sobrevive entre dos revisiones seguidas, y cuánto dura;
- cuánto del prefijo de 19 k es instrucción de sistema no recortable;
- cómo rinde Luna como revisor frente a Sol;
- cuántos tokens suma el plan y el diff al prompt real.

Cinco mediciones mínimas:

1. Dos revisiones seguidas del mismo plan con Sol: ¿el primer turno de la segunda llega con caché?
2. Una revisión con `--ignore-user-config --ephemeral` y sin skills: tokens del primer turno.
3. El mismo diff con defectos sembrados, revisado por Luna y por Sol: defectos detectados por cada uno.
4. Tamaño en tokens del plan y del diff, sumado al prefijo.
5. Razón revisor/constructor en 5 planes reales, no en uno.
