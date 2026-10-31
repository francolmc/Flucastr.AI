# Flucastr.AI

Kit personal de agentes, skills e instaladores para trabajar con IA en Claude Code y Pi. Un solo repo (remoto en GitHub: `francolmc/Flucastr.AI`). Estado: aprobado (2026-10-29).

- Qué es y cómo se prueba: [`definitions/PROJECT.md`](definitions/PROJECT.md)
- Repos: [`definitions/REPOS.md`](definitions/REPOS.md)
- Flujo de trabajo y tareas: [`definitions/WORKFLOW.md`](definitions/WORKFLOW.md)
- Estructura y diagrama: [`definitions/ARCHITECTURE.md`](definitions/ARCHITECTURE.md)

Reglas: no hay commit, push, PR, merge ni despliegue por parte de agentes (los commits y el PR los hace Franco); no se leen `.env`, llaves ni credenciales; una tarea, un archivo. Git de escritura permitido al `constructor`: crear la rama de la feature (`git switch -c`) y, solo con confirmación expresa de Franco (línea `CONFIRMAR:`), `git switch <rama>` a una rama existente; sin commit, push ni merge (`definitions/WORKFLOW.md` §9.1). En yolo no crea rama ni hace switch. Excepción acotada: el modo «yolo» (§9.3), solo a pedido explícito de Franco en la conversación; omite las puertas 2, 3 y 4 y no levanta ninguna otra regla de esta línea. `registro/` no se lee salvo pedido explícito de Franco.
