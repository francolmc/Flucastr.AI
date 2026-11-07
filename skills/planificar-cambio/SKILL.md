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
ejecutor: constructor | principal
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
Lo que el constructor no debe volver a decidir, cada una con su porqué en una línea. Incluye `Ejecutor: <quién>, porque <respuesta de la prueba de ejecutabilidad>`.

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
- `parcial`: el constructor, si devolvió `PAUSA`.

Al cerrar, el principal mueve la carpeta a `cambios/hechos/` **sin cambiar `estado`**: la carpeta es la marca. No existe el estado `hecho` ni `cerrado`.

## Reglas del buen plan

1. **Alcance por camino, no por archivo.** Si el constructor encuentra un fallo relacionado dentro del alcance, lo corrige; no debe tener que parar por eso.
2. **Un comando de verificación** que prueba el resultado final, no cada pieza. Si el proyecto aún no tiene `verify`, el primer plan es crearlo (`preparar-proyecto`).
3. **Paso atómico**: una línea, una acción, una comprobación, unas 20 palabras como máximo. Un paso con más de un requisito se parte. No hay tope de pasos (40 es válido), en orden, cada uno comprobable. Sin código completo salvo firmas o contratos que deban respetarse.
4. **Corto.** Que un modelo pequeño lo lea entero sin esfuerzo. Orientación de tamaño, no límite duro: un cambio simple cabe en unos 5 KB; uno que investiga y toca varias piezas puede llegar a unos 8 KB. Si pasa de eso, se parte en tramos, cada uno con su verificación (o son dos cambios). No hay herramienta que lo mida.
5. **Repos en el frontmatter.** `repos:` es obligatorio: la lista de carpetas (relativas a la raíz del proyecto) donde el cambio toca código o recibe la rama. Un proyecto de un repo escribe `repos: [.]`. Un workspace escribe solo las carpetas que el cambio toca (p. ej. `repos: [api]`). Si el cambio toca solo documentos o `verify` de la raíz, `repos: [.]`: la raíz cuenta como un repo más.
6. **Decisiones cerradas.** Si falta una decisión de producto, pregúntala a Franco antes de pedir la aprobación; no la dejes abierta en el plan.
7. **Quién ejecuta (`ejecutor:`).** Se decide con el plan ya escrito, no por el tipo de tarea, con la **Prueba de ejecutabilidad**: cuatro preguntas sí/no. (1) ¿Cada paso trae su comprobación exacta? (2) ¿Ningún paso depende de un resultado que solo existe al ejecutar? (3) ¿El plan dice qué hacer ante cada error previsible? (4) ¿No toca credenciales, despliegue ni producción? Todo sí: `ejecutor: constructor`. Falla la 1 o la 3: investiga, mejora el plan y repite la prueba. Falla la 2 o la 4: `ejecutor: principal` (lo ejecuta él cargando `ejecutar-plan`, o el constructor con nivel `medio` en `modelos.json`). Sea cual sea el ejecutor, `## Decisiones ya tomadas` lleva una línea `Ejecutor: <quién>, porque <respuesta de la prueba>`, para que Franco la discuta en la puerta 1. Sin la línea `ejecutor:`, se trata como `constructor`.
8. **Supuestos explícitos.** Cada supuesto en `## Supuestos` va en una línea y dice qué pasa si Franco lo corrige (p. ej. «Validar email con regex simple; si Franco quiere DNS, cambian el alcance y un paso»). Lo que no sea supuesto, sino decisión que cambia el resultado, no va ahí: se pregunta.
9. **Duración en los pasos pesados.** Un paso que lanza un build, una instalación o una suite lleva su duración estimada entre paréntesis, p. ej. «(≈8 min)». Si la suma pasa de unos 20 minutos, parte el plan en tramos, cada uno con su verificación parcial. Los pasos intermedios usan `VERIFY_RAPIDO=1 ./verify` (build con caché); «sin caché» solo en la corrida final de aceptación.

## Antes de pedir la aprobación

Aplica la Prueba de ejecutabilidad (regla 7) y anota el ejecutor. Relee el plan como si fueras el constructor sin contexto: ¿qué tendrías que adivinar? Corrige eso. Luego detente y di a Franco la ruta del plan. Con su «sí», cambia `estado: aprobado`.

Si el constructor devuelve `parcial`, corriges el plan y lo vuelves a `estado: aprobado` antes de relanzar: el constructor solo arranca con `aprobado`. Al relanzar tras una `PAUSA` no agregues texto sobre condiciones de detención («límite real», «checkpoint»): solo cuál es el siguiente paso.
