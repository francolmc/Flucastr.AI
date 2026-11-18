# 9b. migración de nombres: --migrate-names simula sin escribir, renombra, es idempotente y no toca changes/done
paso "9b" "migración de nombres: pruebas de tests/migration"
node --test tests/migration/names.test.mjs || fallo "9b: pruebas de migración de nombres no pasaron"
echo "ok 9b: pruebas de migración de nombres pasaron"
