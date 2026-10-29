# Permisos de las corridas exploratorias

Las corridas se ejecutan en un fixture temporal. La instantánea de `pruebas/comprobaciones/instantanea.mjs` detecta cambios fuera de `definicion/` y cambios Git persistentes; no bloquea por sí misma lecturas ni escrituras. Las entradas Bash de la allowlist son permisos por comando individual: no autorizan una línea compuesta que los concatene.

## Claude Code

Se lanzó el `claude` instalado desde el fixture con `--permission-mode dontAsk --permission-prompts none`; no se usaron `acceptEdits` ni `bypassPermissions`. Los patrones pasados como argumentos separados fueron:

- `--allowedTools`: `Read(./**)`, `Write(./definicion/**)`, `Edit(./definicion/**)`, `Skill`, `Bash(git -C ./app remote -v)`, `Bash(git -C ./app branch -a)`, `Bash(git -C ./app branch --show-current)`, `Bash(git -C ./app log --oneline -20)`, `Bash(git -C ./app status --short)`, `Bash(ls *)`, `Bash(find *)`, `Bash(cat ./app/README.md)`, `Bash(cat ./app/COMPONENTE.md)`, `Bash(cat ./app/package.json)`, `Bash(cat ./app/react-router.config.ts)`, `Bash(cat ./app/vite.config.ts)`, `Bash(cat ./app/app/routes.ts)`, `Bash(cat ./app/app/root.tsx)`, `Bash(cat ./app/app/routes/home.tsx)`, `Bash(cat ./.env.example)`, `Bash(bash -n ./definicion/clonar.sh)` y `Bash(mkdir -p ./definicion)`.
- `--disallowedTools`: `Read(./.env)`, `Read(.env)`, `Bash(cat ./.env)`, `Bash(grep * ./.env)`, `Bash(head * ./.env)`, `Bash(cat .env)`, `Bash(grep * .env)`, `Bash(head * .env)`, `Bash(cat **/.env)`, `Bash(grep * **/.env)` y `Bash(head * **/.env)`.

Los permisos de archivos son relativos al cwd temporal y limitan `Write`/`Edit` a `definicion/`. No se habilitó Bash genérico ni Git mutante. En la corrida Claude emitió una sola llamada Bash compuesta que mezclaba `find`, `cd`, lecturas y Git; no coincidió con los permisos individuales y fue denegada. No ejecutó `git log` ni `bash -n`. Para usar las capacidades autorizadas debe invocar cada comando permitido en una llamada Bash separada; no se amplía Bash para permitir comandos compuestos. La detección estructurada e instantánea son controles posteriores, no sustituyen las denegaciones.

## Pi

Invocar el lanzador instalado `pi-arquitecto` sin `--tools` ni `--exclude-tools`, para conservar las herramientas normales, incluido `bash`. En esta etapa Pi no tiene una allowlist por comando ni confinamiento por ruta configurado por el arnés: Bash, `write` y `edit` quedan disponibles como en el uso normal del lanzador. Por tanto, Pi se verifica **solo por detección** mediante registro estructurado e instantánea; esa detección no impide una lectura de `.env`, una escritura fuera de `definicion/` o la ejecución de `clonar.sh`.
