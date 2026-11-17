# 12. medidor de costos: scripts/uso.mjs sobre fixtures con totales conocidos (A1 a A5; A6 en el tramo 2)
paso 12 "medidor de costos: pruebas de scripts/uso.mjs sobre fixtures"
node pruebas/uso/probar.mjs || fallo "12: pruebas del medidor de costos (scripts/uso.mjs) no pasaron"
echo "ok 12: pruebas del medidor pasaron sobre los fixtures"

# 13. kit run: ciclo constructor -> verify -> revisor con CLIs simulados (A1, A2, A3, A5); sin CLIs reales
paso 13 "kit run: arnés con constructor, verify y revisor simulados"
node pruebas/kit-run/probar.mjs || fallo "13: pruebas de kit run (scripts/kit-run.mjs) no pasaron"
echo "ok 13: pruebas de kit run pasaron con los CLIs simulados"

