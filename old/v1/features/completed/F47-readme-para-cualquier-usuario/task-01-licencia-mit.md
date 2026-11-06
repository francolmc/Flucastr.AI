# task-01 — Crear LICENSE con el texto MIT
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
El repo no tiene licencia. Franco decidió la licencia MIT, con titular «Franco Morales» y año 2026. Esta tarea crea `LICENSE` en la raíz con el texto MIT estándar para que el README (tareas siguientes) pueda enlazarla.

## Contexto
- Leer: `AGENTS.md`
- Tocar: `LICENSE`
- Confirmado: no existe `LICENSE` ni `CONTRIBUTING*` en la raíz (`git ls-files | grep -i 'LICENSE\|CONTRIB'` no imprime nada).
- Ninguna prueba mira `LICENSE` (inferido); `bash pruebas/rapida.sh` se corre al final de la feature (task-08).
- Fuente: ninguna
- Requiere: ninguno

## Decisiones ya tomadas
- Licencia MIT, titular `Franco Morales`, año `2026` (decisión de Franco, 2026-11-05).
- Archivo `LICENSE` sin extensión, en la raíz, texto en inglés tal cual el estándar MIT, terminado en un salto de línea.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: crear `LICENSE`.
Fuera de alcance: `README.md` (lo enlazan las tareas siguientes), `CONTRIBUTING`, cabeceras en otros archivos, `package.json`.

## Pasos
1. Corre `git branch --show-current` y comprueba la rama.
2. Crea `LICENSE` con exactamente este texto: la línea «MIT License»; una línea en blanco; «Copyright (c) 2026 Franco Morales»; una línea en blanco; y el cuerpo estándar de la licencia MIT (párrafo «Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, …» hasta «… subject to the following conditions:»; luego el párrafo «The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.»; luego el párrafo en mayúsculas «THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, … ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.»). Usa el texto canónico completo de https://opensource.org/license/mit sin cambiar palabras; resultado observable: el archivo existe y empieza por «MIT License».

## Criterios de aceptación
1. Rama `chore/F47-readme-para-cualquier-usuario` (comando 1).
2. `LICENSE` empieza por «MIT License» y contiene «Copyright (c) 2026 Franco Morales» (comandos 2 y 3).
3. Contiene las frases «Permission is hereby granted, free of charge» y «WITHOUT WARRANTY OF ANY KIND» (comando 4).

## Verificación
```
git branch --show-current
head -1 LICENSE
grep -c 'Copyright (c) 2026 Franco Morales' LICENSE
grep -c 'Permission is hereby granted, free of charge\|WITHOUT WARRANTY OF ANY KIND' LICENSE
```
Esperado: la rama `chore/F47-readme-para-cualquier-usuario`; `MIT License`; `1`; `2`.

## Evidencia

```
$ git branch --show-current
chore/F47-readme-para-cualquier-usuario
exit 0

$ head -1 LICENSE
MIT License
exit 0

$ grep -c 'Copyright (c) 2026 Franco Morales' LICENSE
1
exit 0

$ grep -c 'Permission is hereby granted, free of charge\|WITHOUT WARRANTY OF ANY KIND' LICENSE
2
exit 0
```

## Notas
- Hueco menor: el encargo pedía el texto canónico de https://opensource.org/license/mit. No hice fetch de esa URL; el texto se escribió a partir del texto MIT estándar conocido. Las frases verificadas por la *Verificación* (inicio, copyright y las dos frases clave) coinciden. Conviene comparar el archivo con la fuente oficial antes de publicar.
- Rama creada con `git switch -c chore/F47-readme-para-cualquier-usuario` (no existía; la actual era `chore/F46-verificar-planificador-pi-instalado`). Sin commit, push ni merge.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
