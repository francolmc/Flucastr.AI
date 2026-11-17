---
name: diagnosticar
description: "Diagnostica un proyecto contra el contrato de verificación (qué capacidades faltan, cuánto cuesta hoy y una sola mejora), a pedido y solo en lectura. Úsala si la persona usuaria pide «diagnostica»."
---

# Diagnosticar un proyecto

Cuándo: solo a pedido de la persona usuaria («diagnostica»). No corre al planificar ni al construir. Es solo lectura: no escribe archivos, no corre `verify` y no bloquea nada. Lo que sí bloquea está en `agentes/principal.md`, «Qué bloquea y qué no».

## Cómo

1. Desde la raíz del proyecto, corre el script que está junto a esta skill, en modo JSON para evaluar:
   `node <carpeta-de-esta-skill>/diagnosticar.mjs . --json`
   El script no ejecuta los comandos declarados: solo mira si están en `AGENTS.md`, si `resultado.json` es válido y vigente, cuántos archivos de flujo hay y las reglas de la receta Node. Si un comando debe correr, lo decides tú con contexto; no corras `verify` para esto.
2. Responde **en la conversación**, en tres partes:
   - **(a) Qué falta:** las capacidades `falta` (se cubren con `./verify`), `resultado.json` inválido u obsoleto, y los avisos.
   - **(b) Cuánto cuesta hoy:** solo con datos observables: duración medida de una corrida, `git log` (arreglos que volvieron), planes en `cambios/` con `PAUSA` o `DEVUELTO`, archivos de código sin test. Sin dato, escribe `sin evidencia`. No estimes cifras.
   - **(c) Una sola mejora recomendada:** qué es, por qué y tamaño estimado. Si no falta nada, di «sin faltas» y no propongas ninguna.
3. No escribas ningún archivo del proyecto.
