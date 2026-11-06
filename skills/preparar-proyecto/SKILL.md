---
name: preparar-proyecto
description: "Deja un proyecto listo para trabajar con el kit: un `AGENTS.md` corto y un comando `verify` que prueba desde cero que todo funciona junto (build limpio, arranque y recorrido real). Úsala si falta `AGENTS.md` o `verify`."
---

# Preparar un proyecto

Dos entregables: `AGENTS.md` y `verify`. Sin ellos no hay forma fiable de saber si un cambio quedó bien.

## 1. AGENTS.md (máximo unas 40 líneas)

Solo lo que un agente no puede deducir leyendo el código:

```markdown
# <Proyecto>
<Una frase: qué es.>

## Estructura
<Repos o carpetas y qué hace cada uno. Stack.>

## Comandos
- Instalar: `...`
- Correr en local: `...`
- Pruebas: `...`
- **Verificar todo desde cero: `./verify`**

## Reglas
- Agentes: sin commit, push, PR, merge ni despliegue; no leer `.env` ni llaves (`.env.example` sí).
- Ramas: `feature/`, `fix/`, `chore/`, `docs/`.
- <Convenciones propias, solo las que no se deducen del código.>
```

Si el proyecto ya existe, explóralo antes y no repitas lo que el código ya dice.

## 2. verify

Un único comando en la raíz (`./verify`) que **falla con código distinto de 0** en el primer escalón roto y no necesita nada de tu máquina:

1. **Build limpio.** Instalación desde el lock (`npm ci`, `pnpm install --frozen-lockfile`) y build de las imágenes sin caché. Detecta dependencias sin declarar y contextos de build incompletos.
2. **Arranque real.** Un `docker compose` con todo el sistema: web, API, base de datos y un buzón de correo de prueba (Mailpit). Las migraciones corren al arrancar y se espera a que los servicios respondan.
3. **Recorrido real.** El flujo clave de punta a punta, sin mocks de base de datos ni de correo.
4. **Mismo camino que producción.** Los mismos Dockerfiles y las mismas variables de `.env.example`; solo cambian los valores.

Reglas de diseño:

- **Contexto de build = el repo entero** menos lo que excluya `.dockerignore`. Nunca una lista de archivos permitidos: cada olvido rompe el build.
- Declara en `package.json` todo lo que el código importa directamente. Un paquete que solo llega como dependencia de otro (por ejemplo `express` vía el adaptador de NestJS) funciona en tu máquina y falla en un build limpio. En TypeScript, la regla `import/no-extraneous-dependencies` de ESLint lo detecta.
- Limpieza al final (`down -v`) y un proyecto de compose propio, para no pisar nada.
- **Solo corre cuando alguien lo pide**, nunca como efecto lateral de planificar.
- Imprime un encabezado por escalón y `VERIFY OK` al final.

Hay un esqueleto para adaptar en `referencia.md`, junto a esta skill. Es un punto de partida: ajusta nombres, puertos y el recorrido a tu proyecto.

## 3. Comprobar

Corre `./verify` en un clon limpio o con el árbol sin artefactos de build. Un `verify` que nunca falló no demuestra nada: rómpelo a propósito una vez (por ejemplo, quita una dependencia) y confirma que lo detecta.
