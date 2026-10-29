---
name: disenar-arquitectura
description: "Decide la estructura (uno o varios repos), dibuja el diagrama de arquitectura y escribe `definicion/arquitectura.md`. Úsala después de `definir-proyecto` (modo nueva) o de `revisar-proyecto-existente` (modo actual)."
---

# Diseñar arquitectura

Entradas: `definicion/proyecto.md` y, si el proyecto existe, `definicion/repos.md`.

## Paso 1: elegir el modo

Elige uno y no los mezcles:

- **Nueva**: propones cómo debería ser.
- **Actual**: describes cómo es hoy. Aquí no juzgas ni rediseñas; lo que mejorarías va aparte, en «Observaciones».

## Paso 2: estructura (solo en modo nueva)

Decide si va un repo o varios. **Por defecto, uno solo.** Separa únicamente si se cumple al menos una de estas razones:

- Se despliegan de forma independiente.
- Tienen ciclos de vida o equipos distintos.
- Tienen runtimes o lenguajes distintos, cada uno con su propio despliegue.

Escribe la razón y la alternativa descartada. En modo actual solo describe la estructura que ya existe.

## Paso 3: diagrama

Un diagrama Mermaid de tipo `flowchart`:

- Los nodos son componentes: usuarios, repos, bases de datos y servicios externos. Los externos con forma distinta a los propios.
- Cada flecha lleva una etiqueta con el dato o protocolo.
- Toda conexión listada en «Conexiones entre repos» de `repos.md` aparece como flecha. Si es inferida, la etiqueta termina en «(inferido)».
- Etiquetas siempre entre comillas, para evitar errores de sintaxis con paréntesis o tildes.
- Una sola vista y unos 12 nodos como máximo. Si no cabe, haz una vista general y otra de detalle.

## Paso 4: escribir `definicion/arquitectura.md`

Secciones, en este orden:

- **Estructura y su razón**
- **Diagrama**
- **Componentes**: tabla con *Componente*, *Responsabilidad*, *Tecnología*, *Origen del dato*.
- **Decisiones**: tabla con *Decisión*, *Por qué*, *Descartado y por qué*, *Qué la cambiaría*.
- **Supuestos y pendientes**
- **Observaciones**: solo en modo actual; mejoras posibles, separadas del diagrama.
- **Estado**: borrador.

## Verificación

Cada repo de `repos.md` aparece en el diagrama, y cada repo del diagrama está en `repos.md`.
