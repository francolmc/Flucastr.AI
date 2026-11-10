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

1. **Perfil mínimo del revisor** (**medido**, sección 8): con `--ignore-user-config --ephemeral -c skills.bundled.enabled=false -c skills.include_instructions=false` el primer turno baja de 18.299 a 16.370 tokens (−10,5 %; ≈0,10 créditos por revisión en frío, estimado). Quita el bloque de skills; las definiciones de herramientas y la instrucción de sistema se quedan. La estimación previa de 8 a 10 k tokens y 0,4 a 0,5 créditos no se sostiene. Falta comprobar que el revisor sigue leyendo el plan y el diff.
2. **Caché caliente** (**medido en parte**, secciones 6 y 7): la caché sobrevive a corridas seguidas, pero en la serie de la sección 7 cae a 0 con 1 min de separación y solo T0 tuvo 7.168 tokens. Si los 18 k se reutilizaran, la entrada costaría ≈0,05 créditos (estimado). Por qué se pierde la caché no está medido.
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

- ~~si la caché del revisor sobrevive entre dos revisiones seguidas, y cuánto dura~~ (medido en la sección 6: sobrevive una parte, no todo; la duración no se midió);
- ~~cuánto del prefijo de 19 k es instrucción de sistema no recortable~~ (sección 8: los flags de perfil mínimo no recortan la instrucción de sistema; sí el bloque de skills);
- cómo rinde Luna como revisor frente a Sol;
- cuántos tokens suma el plan y el diff al prompt real.

Cinco mediciones mínimas:

1. Dos revisiones seguidas del mismo plan con Sol: ¿el primer turno de la segunda llega con caché?
2. ~~Una revisión con `--ignore-user-config --ephemeral` y sin skills: tokens del primer turno.~~ (hecha en la sección 8)
3. El mismo diff con defectos sembrados, revisado por Luna y por Sol: defectos detectados por cada uno.
4. Tamaño en tokens del plan y del diff, sumado al prefijo.
5. Razón revisor/constructor en 5 planes reales, no en uno.

## 6. Medición 1: caché entre revisiones

Medido con `codex exec` con la config del revisor (`gpt-6.1-sol`, esfuerzo `low`, `--sandbox read-only`, `-C` en la raíz, sin `--output-schema`), prompt trivial, tres corridas seguidas (B a 7 s de A, C a 7 s de B). Primer evento `token_count` de cada rollout; créditos con la fórmula de `scripts/uso.mjs` y `scripts/tarifas.json` (entrada sin caché a 50, caché a 2,5, salida a 250, por 1M).

| Corrida | Hora (UTC-3) | Prompt | Entrada | En caché | % en caché | Créditos |
| --- | --- | --- | --- | --- | --- | --- |
| A | 02:38:06 | «Responde solo: OK» | 17.756 | 0 | 0 % | 0,889 |
| B | 02:38:17 | «Responde solo: OK» | 18.299 | 7.168 | 39 % | 0,576 |
| C | 02:38:24 | «Responde solo: LISTO» | 18.300 | 7.168 | 39 % | 0,576 |

Suma: **2,041 créditos**, por encima del tope de 2 (M3 no se cumple por 0,04).

Conclusión: **sí**, la caché sobrevive entre corridas seguidas (B y C reciben 7.168 tokens en caché; A no tenía ninguno), y también cuando cambia el final del prompt (C). Pero solo 7.168 de ≈18 k tokens del prefijo se reutilizan; el resto se paga entero en cada corrida. Frente a la revisión del piloto (0 en caché a ≈2,5 min), aquí las corridas estaban a 7 s; la diferencia puede ser de tiempo o de otra causa, no medida.

Hipótesis, no hecho: si el prefijo compartido fuera mayor, la caché bajaría el costo del primer turno. Qué haría falta: medir con separaciones de 1 min, 5 min y 15 min, y comparar el prefijo de A con el de B para ver qué bloque no se repite.

## 7. Medición 2: separación de tiempo

Config del revisor (`gpt-6.1-sol`, esfuerzo `low`, `--sandbox read-only`, `-C` en la raíz, prompt «Responde solo: OK»). Primer `token_count` del rollout; créditos con `scripts/tarifas.json`. Hora UTC-3.

| Corrida | Separación desde la anterior | Entrada | En caché | % en caché | Créditos |
| --- | --- | --- | --- | --- | --- |
| T0 (fin 02:47:27) | ≈9 min desde la última de la sección 6 | 17.756 | 7.168 | 40 % | 0,549 |
| T1 (02:48:27) | 1 min | 18.299 | 0 | 0 % | 0,916 |
| T2 (02:53:32) | 5 min | 18.299 | 0 | 0 % | 0,916 |
| T3 (03:03:38) | 10 min | 18.299 | 0 | 0 % | 0,916 |

Suma de la parte: 3,297 créditos.

Conclusión (**medido**): en esta serie la caché ya no aparece a 1 min de separación y tampoco a 5 ni a 10 min. T0 sí la tuvo (7.168 tokens) con ≈9 min de separación desde la sección 6, así que la separación por sí sola no explica la caché: la pregunta «desde qué separación cae» queda contestada solo como «≤ 1 min en esta serie». La causa no está medida.

## 8. Medición 3: perfil mínimo

Config del revisor igual que la sección 7. Perfil mínimo: `--ignore-user-config --ephemeral -c skills.bundled.enabled=false -c skills.include_instructions=false`. Hora UTC-3. Créditos con `scripts/tarifas.json`. M0 va sin `--json`: con `--ephemeral` no hay rollout y no da desglose de caché.

| Corrida | Config | Entrada | En caché | % en caché | Créditos |
| --- | --- | --- | --- | --- | --- |
| T0 (02:47) | actual | 17.756 | 7.168 | 40 % | 0,549 |
| T1 (02:48) | actual | 18.299 | 0 | 0 % | 0,916 |
| M0 (03:18) | mínimo, sin `--json` | no desglosada | no desglosada | — | ≤ 0,173 |
| M0b (03:19) | mínimo, `--json` | 16.370 | 7.168 | 44 % | 0,479 |
| M1 (03:19) | mínimo, `--json` | 16.370 | 7.168 | 44 % | 0,479 |
| M0c (03:20) | mínimo, `--json` | 16.370 | 7.168 | 44 % | 0,479 |

Frente a T1 (sin caché, misma sesión de medición), el perfil mínimo baja la entrada de 18.299 a 16.370 tokens (−1.929, −10,5 %) y el costo del primer turno en frío de 0,916 a ≈0,820 créditos (≈−0,10, estimado con la tarifa). Frente a T0, con caché parcial en ambas, baja de 0,549 a 0,479 créditos.

`codex debug prompt-input` no acepta `--ignore-user-config`, `--ephemeral` ni `-C` (error «unexpected argument»); con solo los dos `-c` salió: 85.748 → 79.884 caracteres (−6,8 %). Baja el bloque de skills (19.630 → 13.876 caracteres en ese ítem); las definiciones de herramientas (26.452) y las instrucciones de sistema (22.131) no cambian. Estas cifras no igualan a las 78.400 de la sección 2: no se reconcilió la diferencia.

Sin reconciliar: M0 reporta 3.447 «tokens used» en stderr y las corridas con `--json` reportan 16.370 de entrada. Se usa la cifra de `--json`, que coincide en M0b, M1 y M0c.

Conclusión (**medido**): **sí**, el perfil mínimo baja el primer turno ≈1.929 tokens (≈10,5 %) y ≈0,10 créditos por revisión en frío (estimado). La estimación de la sección 3 (prefijo de 8 a 10 k y 0,4 a 0,5 créditos) no se sostiene. Calidad (que el revisor siga leyendo plan y diff) no medida.
