---
name: ejecutar-plan
description: "Aplica un plan aprobado de `cambios/<nombre>/plan.md`: recorre los pasos, corrige dentro del alcance, corre `verify` y deja evidencia real. Úsala al construir."
---

# Ejecutar un plan

Entrada: la ruta del plan.

## Antes de empezar

1. Lee el plan completo. Si `estado` no es `aprobado`, detente y dilo; no cambies nada.
2. Si el encargo trae `Rama:`: para cada carpeta de `repos:` del plan (frontmatter), y solo esas:
   - Si la carpeta no tiene `.git` (p. ej. una raíz de workspace que no es repo), anótalo en *Notas* y sigue con la siguiente.
   - Si `git -C <carpeta> branch --show-current` ya es la rama, sigue.
   - Si la rama ya existe en esa carpeta (`git -C <carpeta> rev-parse --verify --quiet refs/heads/<rama>`), `PAUSA` con `motivo=acceso` y la causa.
   - Si no, `git -C <carpeta> switch -c <rama>` (en `.`, `git switch -c <rama>`).
   - Si el plan no trae `repos:`, `PAUSA` con `motivo=ambiguo`.
3. Cambia `estado: en curso`.

## Bucle de ejecución

Para cada paso `- [ ]`, en orden:

- Haz el cambio mínimo y enfocado, dentro de *Alcance*.
- Marca `- [x]` solo si el comportamiento especificado está **completo**. Nunca recortes, pospongas ni simplifiques lo pedido para que algo «pase».
- Si encuentras un fallo relacionado **dentro del alcance** (un import sin declarar, una ruta que falta en el contexto de build, un lock desactualizado), corrígelo y anótalo en *Notas*. No es motivo de pausa.

## Verificación

Al terminar los pasos, corre el comando de *Verificación* **tal cual** está escrito.

- Si pasa, escribe la evidencia y termina.
- Si falla, busca la causa raíz en todo el camino del alcance, no solo del primer error; corrige y vuelve a correr.
- **Tope:** 3 corridas de verificación. Si la misma causa persiste tras dos correcciones, o llegas a la tercera corrida sin pasar, devuelve `PARCIAL` con el diagnóstico completo (todo lo que encontraste, no solo el último error).

## Cuándo pausar (solo estos casos)

- Un paso es ambiguo y varias lecturas cambian el resultado → `motivo=ambiguo`.
- La solución del plan no funciona (problema de diseño) → `motivo=diseño`.
- Hace falta trabajo fuera de *Alcance* o que cambia un comportamiento especificado → `motivo=alcance`.
- Falta una credencial, un acceso o una herramienta → `motivo=acceso`.

No adivines: pausa. Deja lo hecho como está.

## Evidencia

En *Evidencia* pega cada comando de verificación como `$ <comando>`, idéntico al del plan, con su salida **real** (la cola relevante, hasta unos 1,5 KB; nunca inventada) y una última línea `exit N` con el código real.

## Al terminar

- En *Notas*: decisiones menores que tomaste y fallos relacionados que corregiste.
Estados que usas (el principal define el resto):

- Al empezar: `en curso`.
- `estado: listo` si `verify` pasó; `estado: parcial` si devuelves `PARCIAL` o `PAUSA`.
- **Nunca** otro estado. Cerrar y mover la carpeta a `cambios/hechos/` es del principal, no tuyo.
- Primera línea de tu respuesta: `COMPLETADO`, `PARCIAL` o `PAUSA`, con el formato de tu agente.
