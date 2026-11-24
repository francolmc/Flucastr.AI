---
status: approved
repos: [.]
type: code
---
# Plan sintético con tabla malformada

## Aceptación

| ID | Resultado observable | Comprobación | Resultado esperado |
|----|----------------------|--------------|--------------------|
| A1 | Uno | `node --version` | exit 0 |
| A1 | Repetido | `node --version` | exit 0 |
| A2 | Sin cuarta columna | `node --version` |
