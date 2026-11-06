---
name: generar-clonar
description: "Genera `initialize.sh`, un script que clona el proyecto completo a partir de `definitions/REPOS.md`. Úsala cuando el proyecto tenga repos remotos. El script se escribe, nunca se ejecuta."
---

# Generar initialize.sh

Entrada: `definitions/REPOS.md`.

## Reglas

- **No inventes URLs.** Si a un repo le falta la URL, déjalo como comentario `# FALTA URL: <repo>` y avísalo al terminar.
- Usa las URLs tal como están en los remotos, sin credenciales ni tokens.
- Recibe la carpeta destino como primer argumento; si no se da, usa la carpeta actual.
- Clona un repo solo si su carpeta no existe, y nunca pisa nada.
- Imprime qué clonó y qué omitió.
- **No lo ejecutes.** Puedes validar la sintaxis con `bash -n`; clonar lo hace Franco.

## Esqueleto

```bash
#!/usr/bin/env bash
set -euo pipefail

DESTINO="${1:-.}"
mkdir -p "$DESTINO"

clonar() {
  local nombre="$1" url="$2" rama="$3"
  if [ -e "$DESTINO/$nombre" ]; then
    echo "omitido (ya existe): $nombre"
    return
  fi
  git clone --branch "$rama" "$url" "$DESTINO/$nombre"
  echo "clonado: $nombre"
}

# Una línea por repo, tomada de REPOS.md:
# clonar "<nombre>" "<url>" "<rama>"
```

## Verificación

Cada repo de `REPOS.md` tiene su línea en el script, y ninguna línea del script es un repo que no esté en `REPOS.md`.
