# 12. medidor de costos: scripts/usage.mjs sobre fixtures con totales conocidos (A1 a A5; A6 en el tramo 2)
paso 12 "medidor de costos: pruebas de scripts/usage.mjs sobre fixtures"
node tests/usage/run.mjs || fallo "12: pruebas del medidor de costos (scripts/usage.mjs) no pasaron"
echo "ok 12: pruebas del medidor pasaron sobre los fixtures"

# 13. kit run: ciclo builder -> verify -> revisor con CLIs simulados (A1, A2, A3, A5); sin CLIs reales
paso 13 "kit run: arnés con builder, verify y revisor simulados"
node tests/kit-run/run.mjs || fallo "13: pruebas de kit run (scripts/kit-run.mjs) no pasaron"
node --test tests/escalera/*.test.mjs || fallo "13: pruebas de la escalera de recuperación (tests/escalera) no pasaron"
echo "ok 13: pruebas de kit run y de la escalera pasaron con los CLIs simulados"

# 14. informe de corridas: scripts/runs-report.mjs sobre fixtures con cifras conocidas (A6 a A9; A10 la cubre este paso)
paso 14 "informe de corridas: pruebas de scripts/runs-report.mjs sobre fixtures"
node tests/runs-report/run.mjs || fallo "14: pruebas del informe de corridas (scripts/runs-report.mjs) no pasaron"
echo "ok 14: pruebas del informe pasaron sobre los fixtures"

# 15. progreso en vivo: log de eventos, estado, scripts/kit-status.mjs y scripts/kit-nota.mjs sobre fixtures (A1 a A7; A8 es este paso)
paso 15 "progreso en vivo: pruebas de eventos, estado, kit-status y kit-nota sobre fixtures"
node tests/progress/run.mjs || fallo "15: pruebas del progreso en vivo (tools/progress, scripts/kit-status.mjs, scripts/kit-nota.mjs) no pasaron"
echo "ok 15: pruebas del progreso en vivo pasaron sobre los fixtures"

# 16. kit-check: scripts/kit-check.mjs sobre fixtures sintéticos de criterios A# (A1 a A6; A7 es este paso)
paso 16 "kit-check: pruebas de scripts/kit-check.mjs sobre fixtures sintéticos"
node tests/kit-check/run.mjs || fallo "16: pruebas de kit-check (scripts/kit-check.mjs) no pasaron"
echo "ok 16: pruebas de kit-check pasaron sobre los fixtures"

# 17. kit-scope: scripts/kit-scope.mjs sobre fixtures de alcance y cambios (A1 de la historia de kit-scope-close)
paso 17 "kit-scope: pruebas de scripts/kit-scope.mjs sobre fixtures"
node tests/kit-scope/run.mjs || fallo "17: pruebas de kit-scope (scripts/kit-scope.mjs) no pasaron"
echo "ok 17: pruebas de kit-scope pasaron sobre los fixtures"

# 18. kit-close: scripts/kit-close.mjs sobre fixtures cerrados y no verificables (A1 de la historia de kit-scope-close)
paso 18 "kit-close: pruebas de scripts/kit-close.mjs sobre fixtures"
node tests/kit-close/run.mjs || fallo "18: pruebas de kit-close (scripts/kit-close.mjs) no pasaron"
echo "ok 18: pruebas de kit-close pasaron sobre los fixtures"


# 19. spawn-seguro: escaneo estático de spawnSync/execFileSync/execSync con stdin pipe (A10, A11, A12 de la historia de spawn-seguro)
paso 19 "spawn-seguro: escaneo estático de llamadas síncronas con stdin pipe (tests/spawn-seguro/estatico.mjs)"
node tests/spawn-seguro/estatico.mjs || fallo "19: el repo tiene una llamada síncrona con stdin que puede ser pipe (A10)"
if node tests/spawn-seguro/estatico.mjs --fixture-mala; then rc=0; else rc=$?; fi
[ "$rc" -eq 1 ] || fallo "19: la fixture mala debía salir con 1 y salió con $rc (A11)"
if node tests/spawn-seguro/estatico.mjs --vacio; then rc=0; else rc=$?; fi
[ "$rc" -eq 1 ] || fallo "19: el escaneo sin llamadas debía salir con 1 y salió con $rc (A12)"
echo "ok 19: escaneo de stdin pasó sobre el repo y falló como se esperaba en las dos fixtures"
