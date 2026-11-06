# task-06 — README: requisitos e instalación con clon
repo: Flucastr.AI   depende_de: task-05   estado: hecha

## Descripción
Los requisitos solo aparecen dentro de la instalación remota, y la apertura de `## Instalación` habla de «mi equipo principal» y del «PC de trabajo». Se agrega una sección `## Requisitos` antes de `## Instalación` y se reescribe la apertura y `### Con el repo clonado` para cualquier lector, sin cambiar comandos ni opciones.

## Contexto
- Leer: `README.md@108-45`
- Tocar: `README.md`
- El rango 108-152 va de `## Instalación` hasta la línea previa a `### Sin clonar el repo`; el diagrama mermaid de la apertura se conserva.
- Confirmado por lectura: `instalar.sh` exige `node` (línea 62: «Falta node: se usa para leer modelos.json») e instala para Claude Code si existe `~/.claude` o el comando `claude`, y para Pi si existe `~/.pi` o el comando `pi` (líneas 103-104). `bash instalar.sh --simular` existe (cabecera: `Uso: bash instalar.sh [--simular] [--copiar] [--solo claude|pi] [--proyecto <ruta> [--agente <nombre>]] [--skills-proyecto]`).
- Node del entorno de pruebas: `node --version` imprime v25.8.1; el repo no declara versión mínima (no hay `package.json`).
- Fuente: ninguna
- Requiere: runtime:node@25.8.1

## Decisiones ya tomadas
- Mismo estilo que task-02 (tuteo / tercera persona; sin «mi», «mis», «yo», «tengo»).
- `## Requisitos` va justo antes de `## Instalación` y dice exactamente: (1) `bash`; (2) `node` (probado con v25.8.1; el kit no declara una versión mínima); (3) al menos una herramienta de agentes: Claude Code (`claude`, verificado con 2.1.308) o Pi (`pi`, verificado con 1.4.0); (4) `git` para el flujo de ramas por feature; (5) `curl` y `tar` solo si instalas sin clonar el repo; (6) un sistema tipo Unix (macOS; Windows no probado).
- Apertura de `## Instalación`: «Hay dos caminos: con el repo clonado y sin clonar. Los dos terminan igual: agentes y skills instalados para Claude Code y Pi.» (sin equipos de Franco).
- En `### Con el repo clonado` se conservan todos los comandos y viñetas; solo se reescriben los giros en primera persona o estilo personal («tú eliges el nivel», sin «mi»). Se agrega al principio de la subsección: «Primero valida con `bash instalar.sh --simular`.»

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: nueva `## Requisitos`, apertura de `## Instalación` y `### Con el repo clonado`.
Fuera de alcance: `### Sin clonar el repo` (task-05), scripts, versión mínima de Node, `package.json`.

## Pasos
1. Corre `git branch --show-current` y comprueba la rama.
2. Inserta `## Requisitos` antes de `## Instalación` con el contenido de *Decisiones ya tomadas*.
3. Reescribe la apertura de `## Instalación` y `### Con el repo clonado` según las decisiones.
4. Corre `bash instalar.sh --simular` y comprueba que sale 0 (no escribe nada).

## Criterios de aceptación
1. Rama `chore/F47-readme-para-cualquier-usuario` (comando 1).
2. Existe `## Requisitos` justo antes de `## Instalación` y menciona `bash`, `node`, `claude`, `pi`, `git`, `curl` y `tar` (comandos 2 y 3).
3. El rango no contiene primera persona ni «PC de trabajo» (comando 4).
4. `bash instalar.sh --simular` termina en 0 (comando 5).

## Verificación
```
git branch --show-current
grep -n '^## Requisitos$\|^## Instalación$' README.md
awk '/^## Requisitos/,/^### Sin clonar el repo/' README.md | grep -c 'bash\|node\|claude\|pi\b\|git\|curl\|tar'
awk '/^## Instalación/,/^### Sin clonar el repo/' README.md | grep -nEiw 'mi|mis|yo|tengo|mío|mía|PC de trabajo'; echo "grep:$?"
bash instalar.sh --simular >/dev/null; echo "exit:$?"
```
Esperado: la rama `chore/F47-readme-para-cualquier-usuario`; dos líneas con `## Requisitos` y luego `## Instalación`; un número mayor o igual que 7; solo `grep:1`; `exit:0`.

## Evidencia

```
$ git branch --show-current
chore/F47-readme-para-cualquier-usuario
exit 0

$ grep -n '^## Requisitos$\|^## Instalación$' README.md
108:## Requisitos
117:## Instalación
exit 0

$ awk '/^## Requisitos/,/^### Sin clonar el repo/' README.md | grep -c 'bash\|node\|claude\|pi\b\|git\|curl\|tar'
24
exit 0

$ awk '/^## Instalación/,/^### Sin clonar el repo/' README.md | grep -nEiw 'mi|mis|yo|tengo|mío|mía|PC de trabajo'; echo "grep:$?"
grep:1
exit 0

$ bash instalar.sh --simular >/dev/null; echo "exit:$?"
exit:0
exit 0
```

## Notas

- Rango de Leer: `README.md@108-45` no es válido (fin antes del inicio). Se ubicó la sección por encabezado: `## Requisitos` en línea 108, `## Instalación` en 117 y `### Sin clonar el repo` en 164 tras insertar la sección y la línea «Primero valida»; el rango real es 108-163, con el diagrama mermaid incluido.
- Hueco menor: el diagrama mermaid decía «¿Tengo el repo clonado?», que el criterio 3 (sin primera persona en el rango) y la verificación contaban como «tengo». Se cambió la etiqueta a «¿Hay repo clonado?»; la estructura del diagrama se conserva.
- Hueco menor: en la apertura se quitó la negrita de «con el repo clonado» y «sin clonar» para dejar el texto exacto de *Decisiones ya tomadas*.
- Hueco menor: la frase «Primero valida con `bash instalar.sh --simular`.» va justo debajo de `### Con el repo clonado`, antes del bloque de comandos.
- Ningún cambio en `### Sin clonar el repo`, scripts ni `package.json`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
