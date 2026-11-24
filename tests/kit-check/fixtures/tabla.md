---
status: approved
repos: [.]
executor: builder
type: code
---
# Plan sintético con tabla global

## Aceptación

| ID | Resultado observable | Comprobación | Resultado esperado |
|----|----------------------|--------------|--------------------|
| A1 | Receta | `grep -c x inventario.txt` | exit 0 |
| A2 | Versión visible | `node --version` | exit 0 |
