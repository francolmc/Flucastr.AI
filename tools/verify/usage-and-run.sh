# 12. medidor de costos: scripts/usage.mjs sobre fixtures con totales conocidos (A1 a A5; A6 en el tramo 2)
paso 12 "medidor de costos: pruebas de scripts/usage.mjs sobre fixtures"
node tests/usage/run.mjs || fallo "12: pruebas del medidor de costos (scripts/usage.mjs) no pasaron"
echo "ok 12: pruebas del medidor pasaron sobre los fixtures"

# 13. kit run: ciclo builder -> verify -> revisor con CLIs simulados (A1, A2, A3, A5); sin CLIs reales
paso 13 "kit run: arnés con builder, verify y revisor simulados"
node tests/kit-run/run.mjs || fallo "13: pruebas de kit run (scripts/kit-run.mjs) no pasaron"
echo "ok 13: pruebas de kit run pasaron con los CLIs simulados"

# 14. informe de corridas: scripts/runs-report.mjs sobre fixtures con cifras conocidas (A6 a A9; A10 la cubre este paso)
paso 14 "informe de corridas: pruebas de scripts/runs-report.mjs sobre fixtures"
node tests/runs-report/run.mjs || fallo "14: pruebas del informe de corridas (scripts/runs-report.mjs) no pasaron"
echo "ok 14: pruebas del informe pasaron sobre los fixtures"

