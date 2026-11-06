---
name: planificar-cambio
description: "Escribe el plan de un cambio en `cambios/<nombre>/plan.md`: el único documento que recibe el constructor. Úsala cuando el trabajo tiene varios pasos o cruza capas (web, API, base de datos)."
---

# Planificar un cambio

El plan es el **traspaso** entre tú y el constructor. El constructor es un modelo pequeño que no vio tu conversación: solo sabe lo que está escrito. Escribe el plan para que no tenga que adivinar nada.

## Antes de escribir

- Explora e investiga hasta tener evidencia real: corre el build, lee los archivos, confirma que las rutas existen. Nunca cites en el plan un archivo que no hayas visto.
- Si el cambio cruza capas, **un solo plan** cubre el recorrido completo. No abras un plan por archivo ni por capa.

## Plantilla

Crea `cambios/<nombre>/plan.md` (nombre corto en minúsculas con guiones):

```markdown
---
estado: borrador
rama: feature/<nombre>
repos: [<carpeta>, ...]
---
# <Cambio>

## Objetivo
Una o dos frases: qué queda funcionando y para quién.

## Supuestos
Lo que diste por sentado del pedido ambiguo, una línea cada uno. Si no hubo nada que suponer, escribe «Ninguno».

## Alcance
Carpetas y archivos donde el constructor puede cambiar cosas. Incluye todo el camino
que el objetivo cruza (código, manifiestos, lock, Dockerfiles, configuración).
Fuera de alcance: lo que NO se toca.

## Decisiones ya tomadas
Lo que el constructor no debe volver a decidir, cada una con su porqué en una línea.

## Escenarios
- CUANDO <situación> ENTONCES <resultado observable>

## Verificación
`<comando>` — el que define «hecho». Debe correr desde cero y fallar si algo falla.

## Pasos
- [ ] <paso concreto y comprobable>

## Evidencia
(la escribe el constructor)

## Notas
(la escribe el constructor)
```

## Estados

El campo `estado:` del plan tiene solo estos valores, con su responsable:

- `borrador`: el principal lo escribe.
- `aprobado`: el principal lo pasa con el «sí» de Franco.
- `en curso`: el constructor, al empezar.
- `listo`: el constructor, si `verify` pasó.
- `parcial`: el constructor, si devolvió `PARCIAL` o `PAUSA`.

Al cerrar, el principal mueve la carpeta a `cambios/hechos/` **sin cambiar `estado`**: la carpeta es la marca. No existe el estado `hecho` ni `cerrado`.

## Reglas del buen plan

1. **Alcance por camino, no por archivo.** Si el constructor encuentra un fallo relacionado dentro del alcance, lo corrige; no debe tener que parar por eso.
2. **Un comando de verificación** que prueba el resultado final, no cada pieza. Si el proyecto aún no tiene `verify`, el primer plan es crearlo (`preparar-proyecto`).
3. **De 3 a 10 pasos**, en orden, cada uno comprobable. Sin código completo salvo firmas o contratos que deban respetarse.
4. **Corto.** Que un modelo pequeño lo lea entero sin esfuerzo. Orientación de tamaño, no límite duro: un cambio simple cabe en unos 5 KB; uno que investiga y toca varias piezas puede llegar a unos 8 KB. Si pasa de eso, probablemente son dos cambios. No hay herramienta que lo mida.
5. **Repos en el frontmatter.** `repos:` es obligatorio: la lista de carpetas (relativas a la raíz del proyecto) donde el cambio toca código o recibe la rama. Un proyecto de un repo escribe `repos: [.]`. Un workspace escribe solo las carpetas que el cambio toca (p. ej. `repos: [api]`). Si el cambio toca solo documentos o `verify` de la raíz, `repos: [.]`: la raíz cuenta como un repo más.
6. **Decisiones cerradas.** Si falta una decisión de producto, pregúntala a Franco antes de pedir la aprobación; no la dejes abierta en el plan.
7. **Supuestos explícitos.** Cada supuesto en `## Supuestos` va en una línea y dice qué pasa si Franco lo corrige (p. ej. «Validar email con regex simple; si Franco quiere DNS, cambian el alcance y un paso»). Lo que no sea supuesto, sino decisión que cambia el resultado, no va ahí: se pregunta.

## Antes de pedir la aprobación

Relee el plan como si fueras el constructor sin contexto: ¿qué tendrías que adivinar? Corrige eso. Luego detente y di a Franco la ruta del plan. Con su «sí», cambia `estado: aprobado`.

Si el constructor devuelve `parcial`, corriges el plan y lo vuelves a `estado: aprobado` antes de relanzar: el constructor solo arranca con `aprobado`.
