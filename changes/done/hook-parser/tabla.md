# Decisiones del hook: antes y después

`normal`: el hook no decide (rigen los permisos de Claude Code y las reglas deny, que no cambian). `⏎`: salto de línea. En negrita, lo que cambia. «Hoy» está medido con la función actual; «Propuesta» aún no está implementada.

| Id | Comando | Hoy | Propuesta |
|---|---|---|---|
| P1 | <code>cat &gt;&gt; notas.md &lt;&lt;'EOF'⏎El git commit, git push y deploy los hace la persona.⏎EOF</code> | deny | **normal** |
| P2 | <code>cat &gt; notas.md &lt;&lt;EOF⏎gh pr create y gh pr merge son de la persona.⏎EOF</code> | deny | **normal** |
| P3 | <code>cat &gt;&gt; notas.md &lt;&lt;-'FIN'⏎⇥Nunca leas .env⏎⇥FIN</code> | deny | **normal** |
| P4 | <code>mkdir -p changes/x &amp;&amp; cat &gt; changes/x/notes.md &lt;&lt;'EOF'⏎git merge queda para la persona⏎EOF</code> | deny | **normal** |
| P5 | <code>echo "recuerda: git push lo haces tú"</code> | deny | **normal** |
| P6 | <code>printf '%s&#92;n' "pendiente: deploy" &gt;&gt; notas.txt</code> | deny | **normal** |
| P7 | <code>grep -n "git commit" AGENTS.md</code> | deny | **normal** |
| P8 | <code>rg 'gh pr merge' docs</code> | deny | **normal** |
| P9 | <code>grep -c ".env" AGENTS.md</code> | deny | **normal** |
| P10 | <code>cat &gt;&gt; archivo &lt;&lt;'EOF'⏎git commit y git push los hace la persona⏎EOF</code> | deny | deny |
| C1 | <code>cat &gt; x.sh &lt;&lt;'EOF'⏎git push⏎EOF</code> | deny | deny |
| C2 | <code>cat &gt; .git/hooks/pre-push &lt;&lt;'EOF'⏎git push⏎EOF</code> | deny | deny |
| C3 | <code>git log --grep "merge"</code> | deny | deny |
| C4 | <code>cat &gt;&gt; notas.md &lt;&lt;'EOF'⏎texto: git push⏎EOF⏎node otro.mjs</code> | deny | deny |
| C5 | <code>cd docs &amp;&amp; cat &gt;&gt; notas.md &lt;&lt;'EOF'⏎git push lo haces tú⏎EOF</code> | deny | deny |
| C6 | <code>ls # luego git push</code> | deny | deny |
| C7 | <code>grep -r ".env" .</code> | deny | deny |
| C8 | <code>grep -n "git commit" AGENTS.md &gt; salida.sh</code> | deny | deny |
| C9 | <code>echo "git push" &gt; .git/hooks/pre-commit</code> | deny | deny |
| N1 | <code>git commit -m x</code> | deny | deny |
| N2 | <code>git push origin main</code> | deny | deny |
| N3 | <code>git merge main</code> | deny | deny |
| N4 | <code>gh pr create --fill</code> | deny | deny |
| N5 | <code>gh pr merge 5</code> | deny | deny |
| N6 | <code>cat .env</code> | deny | deny |
| N7 | <code>bash -c "git push"</code> | deny | deny |
| N8 | <code>git -C . commit -m x</code> | deny | deny |
| N9 | <code>git -c user.name=x commit -m y</code> | deny | deny |
| N10 | <code>vercel deploy</code> | deny | deny |
| N11 | <code>rm -rf build</code> | deny | deny |
| E1 | <code>ls &amp;&amp; git push</code> | deny | deny |
| E2 | <code>false &#124;&#124; git commit -m x</code> | deny | deny |
| E3 | <code>true; git merge x</code> | deny | deny |
| E4 | <code>echo x &#124; git commit -F -</code> | deny | deny |
| E5 | <code>echo ok&amp;&amp;git push</code> | normal | **deny** |
| E6 | <code>true;git commit -m x</code> | normal | **deny** |
| E7 | <code>(git push)</code> | normal | **deny** |
| E8 | <code>echo "&#36;(git push)"</code> | normal | **deny** |
| E9 | <code>echo &#96;git push&#96;</code> | normal | **deny** |
| E10 | <code>x=&#36;(git merge main)</code> | normal | **deny** |
| E11 | <code>x=&#36;(cat .env)</code> | deny | deny |
| E12 | <code>echo &#36;(gh pr create --fill)</code> | normal | **deny** |
| E13 | <code>echo &#36;(gh pr merge 5)</code> | normal | **deny** |
| E14 | <code>echo &#36;(bash -c 'git push')</code> | normal | **deny** |
| E15 | <code>echo &#36;(git -C . push)</code> | normal | **deny** |
| E16 | <code>echo &#36;(git -c a.b=c commit)</code> | normal | **deny** |
| E17 | <code>echo &#36;(vercel deploy)</code> | normal | **deny** |
| E18 | <code>ls &amp;&amp; rm -rf build</code> | normal | normal |
| E19 | <code>ls⏎git push</code> | deny | deny |
| E20 | <code>diff &lt;(git push) notas.md</code> | normal | **deny** |
| X1 | <code>bash &lt;&lt;'EOF'⏎git push⏎EOF</code> | deny | deny |
| X2 | <code>cat &lt;&lt;'EOF' &#124; sh⏎git push⏎EOF</code> | deny | deny |
| X3 | <code>cat &lt;&lt;EOF &gt; notas.md⏎&#36;(git push)⏎EOF</code> | normal | **deny** |
| X4 | <code>cat &gt; x.sh &lt;&lt;'EOF'⏎git push⏎EOF⏎bash x.sh</code> | deny | deny |
| X5 | <code>cat &gt;&gt; notas.md &lt;&lt;'EOF'⏎texto⏎EOF⏎git push</code> | deny | deny |
| X6 | <code>echo "git push" &#124; bash</code> | deny | deny |
| X7 | <code>eval "git push"</code> | deny | deny |
| X8 | <code>ssh host "git push"</code> | deny | deny |
| X9 | <code>env git push</code> | deny | deny |
| X10 | <code>echo .env &#124; xargs cat</code> | deny | deny |
| X11 | <code>cat &#36;(echo .env)</code> | deny | deny |
| X12 | <code>find . -exec git push &#92;;</code> | deny | deny |
| X13 | <code>bash &lt;&lt;'EOF'⏎/usr/bin/git push⏎EOF</code> | normal | **deny** |
| H1 | <code>cat&lt;.env</code> | normal | **deny** |
| H2 | <code>cat ".en""v"</code> | normal | **deny** |
| H3 | <code>/usr/bin/git push</code> | normal | **deny** |
| H4 | <code>g&#92;it push</code> | normal | **deny** |
| H5 | <code>gh -R o/r pr create</code> | normal | **deny** |
| H6 | <code>git -c alias.ci=commit ci -m x</code> | normal | **deny** |
| H7 | <code>bash -c ls</code> | normal | normal |
| H8 | <code>sh -c 'cat .env'</code> | deny | deny |
| H9 | <code>zsh -c ls</code> | normal | normal |
| H10 | <code>&#36;(echo git) push</code> | normal | **ask** |
| H11 | <code>x=git; &#36;x push</code> | normal | **ask** |
| H12 | <code>git &#36;sub origin</code> | normal | **ask** |
| H13 | <code>env /usr/bin/git push</code> | normal | **deny** |
| B1 | <code>bash -lc 'git push'</code> | deny | deny |
| B2 | <code>sh -c "&#36;cmd"</code> | normal | **ask** |
| B3 | <code>bash -c 'ls &amp;&amp; git merge x'</code> | deny | deny |
| B4 | <code>bash -c 'bash -c "git push"'</code> | normal | **deny** |
| B5 | <code>zsh -c 'cat .env'</code> | deny | deny |
| B6 | <code>eval "&#36;cmd"</code> | normal | **ask** |
| S1 | <code>git -C . status</code> | normal | normal |
| S2 | <code>git -c core.quotepath=off diff</code> | normal | normal |
| S3 | <code>grep -n x AGENTS.md &#124; head -5</code> | normal | normal |
| S4 | <code>for f in a b; do wc -l "&#36;f"; done</code> | normal | normal |
| S5 | <code>npm run deploy:prod</code> | normal | normal |
| S6 | <code>docker push imagen</code> | normal | normal |
| R1 | <code>if [ -f a ]; then wc -l a; fi</code> | normal | normal |
| R2 | <code>echo "&#36;{HOME}/x" 2&gt;&amp;1 &#124; head</code> | normal | normal |
| R3 | <code>n=&#36;(ls &#124; wc -l); echo "&#36;n"</code> | normal | normal |
| R4 | <code>while read -r f; do echo "&#36;f"; done &lt; lista.txt</code> | normal | normal |
| R5 | <code>find . -name '&#42;.md' -exec grep -l x {} &#92;;</code> | normal | normal |
| R6 | <code>[[ -d docs ]] &amp;&amp; ls docs</code> | normal | normal |
| U1 | <code>echo "sin cerrar</code> | normal | **ask** |
| U2 | <code>cat &lt;&lt;'EOF'⏎git push</code> | deny | deny |
| U3 | <code>case x in a) ls ;; esac</code> | normal | **ask** |
