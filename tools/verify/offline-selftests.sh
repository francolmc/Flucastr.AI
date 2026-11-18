# 10. arnés OpenSpec: solo autopruebas offline; nunca ejecuta --run
paso 10 "autopruebas offline del runner OpenSpec, sin inferencia"
if [ -f tests/comparar-openspec/runner/cli.mjs ]; then
  node tests/comparar-openspec/runner/cli.mjs --self-test || fallo "10: autopruebas offline del runner OpenSpec"
  echo "ok 10: self-test del runner pasó; no se lanzó --run ni inferencia"
else
  echo "AVISO 10: falta tests/comparar-openspec/; paso omitido"
fi

# 10b. revisor de planes: contrato CLI, límites y avisos por línea
paso "10b" "revisor de planes: pruebas de scripts/review-plan.mjs"
node --test tests/review-plan/*.test.mjs || fallo "10b: pruebas del revisor de planes no pasaron"
echo "ok 10b: pruebas del revisor de planes pasaron"

# 10c. diagnóstico: la fingerprint de evidencia excluye los planes y detecta cambios de producto
paso "10c" "diagnóstico: pruebas de vigencia de fingerprint en tests/diagnosis-suggests"
node --test tests/diagnosis-suggests/*.test.mjs || fallo "10c: pruebas de fingerprint del diagnóstico no pasaron"
echo "ok 10c: pruebas de fingerprint del diagnóstico pasaron"

