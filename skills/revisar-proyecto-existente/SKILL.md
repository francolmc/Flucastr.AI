---
name: revisar-proyecto-existente
description: "Revisa un proyecto que YA existe, en solo lectura, para obtener contexto y listar sus repos. Úsala al incorporar un workspace con código: deja escritos `definicion/repos.md` y `definicion/proyecto.md`. Para proyectos nuevos usa `definir-proyecto`."
---

# Revisar proyecto existente

Objetivo: entender lo que hay, tal como es, sin cambiarlo y sin suponer.

## Reglas de esta revisión

- Todo es solo lectura. Lo único que escribes está en `definicion/`.
- No leas `.env`, llaves ni credenciales; `.env.example` sí.
- No entres a carpetas generadas: `node_modules`, `dist`, `build`, `.venv`, `target`, `.next`.
- Cada dato que anotes lleva su origen («leído en `package.json`», «de `git remote -v`»).

## Pasos

### 1. Inventario

Lista las carpetas del workspace (primer y segundo nivel) y detecta cuáles son repos (tienen `.git`). **Anota todos los repos antes de leer ninguno**, para no perder uno por el camino.

### 2. Revisión por repo

De cada repo lee:

- README y documentación.
- Manifiestos (`package.json`, `requirements.txt`, `pom.xml`, `go.mod`, etc.) y configuración.
- Docker, compose y CI.
- Git: consulta el remoto, la rama actual y principal, y `git log --oneline -20`. Ejecuta cada consulta en una llamada independiente con `git -C <ruta>` (por ejemplo, `git -C <ruta> remote -v`); no encadenes `cd <ruta> && git ...` ni varias órdenes Git en una sola llamada.

### 3. Contexto

Responde con evidencia: qué hace el sistema, cómo se ejecuta, cómo se prueba, cómo se despliega y qué se conecta con qué (bases de datos, APIs, colas, servicios externos). Si algo no tiene evidencia, no lo afirmes: va a «Datos que faltan».

### 4. Preguntar lo que falta

Las preguntas vienen **después** de revisar y solo sobre lo que el código no responde. Máximo cinco, numeradas y de más a menos importante.

- Si una respuesta puede cambiar la arquitectura, **espera** antes de seguir.
- Si solo agrega detalle, sigue y déjala como pendiente en `proyecto.md`.

### 5. Escribir la salida

## Formato de `repos.md`

Tabla con las columnas *Repo*, *Rol*, *URL remota*, *Rama principal*, *Stack*, *Origen del dato*. Debajo, dos secciones:

- **Conexiones entre repos**: qué llama a qué y por qué medio.
- **Datos que faltan**: lo que no se pudo confirmar.
- **Estado**: borrador.

## Formato de `proyecto.md` (proyecto existente)

- **Qué hace**
- **Cómo se ejecuta**
- **Cómo se prueba**
- **Cómo se despliega**
- **Dependencias externas**
- **Preguntas abiertas**
- **Estado**: borrador.
