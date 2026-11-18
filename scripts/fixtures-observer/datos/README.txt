Fixture del observador de Docker (scripts/observe.mjs report --data <esta carpeta>).

Qué contiene
- eventos.jsonl: dos proyectos Compose solapados y un oom.
  proyecto-a-1 (web y worker): 10:00:00 a 10:10:00.
  proyecto-b-2 (db): 10:05:00 a 10:20:00. Su oom es a las 10:07:00.
  Solape entre ambos: 10:05:00 a 10:10:00 = 5 minutos.
- muestras.jsonl: uso de memoria de cada contenedor y de la memoria del host.
- builds.jsonl: 6 builds completas con nombre api (3) y web (3).
  Hay una línea repetida de api-1 (debe ignorarse por ref) y una build api-4 sin terminar (debe ignorarse).

Cálculo a mano (base de la salida esperada)
- api: duraciones 100 s, 200 s y 150 s. Mediana 150 s, máximo 200 s.
  Caché: (9+3+6) / (10+10+10) = 18/30 = 60%.
- web: duraciones 40 s, 60 s y 50 s. Mediana 50 s, máximo 60 s.
  Caché: (4+3+2) / (4+4+4) = 9/12 = 75%.
- proyecto-a-1: pico web 450 MiB (de 300, 450 y 380); pico worker 200 MiB (de 120 y 200).
- proyecto-b-2: pico db 1.5 GiB = 1536 MiB.
- Memoria del host: pico usada 3300 MiB de 3900 MiB (a las 10:06:00).

Salida esperada del informe (A1, A2, A3). Debe coincidir línea a línea.
--- salida esperada ---
BUILDS (UTC; sin duplicados por ref)
api: n=3 mediana=150s maximo=200s cache=60%
web: n=3 mediana=50s maximo=60s cache=75%
PROYECTOS (UTC)
proyecto-a-1: 10:00:00 -> 10:10:00 pico proyecto-a-1-web-1=450MiB proyecto-a-1-worker-1=200MiB
proyecto-b-2: 10:05:00 -> 10:20:00 pico proyecto-b-2-db-1=1536MiB
EVENTOS
OOM 10:07:00 contenedor=proyecto-b-2-db-1 proyecto=proyecto-b-2
SOLAPES
proyecto-a-1 <-> proyecto-b-2: 5 min (10:05:00 -> 10:10:00)
HOST (UTC)
pico memoria usada 3300MiB de 3900MiB
--- fin ---
