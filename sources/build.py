import subprocess, re, json, pathlib
r=subprocess.run("npx esbuild src/ui.js --bundle --format=iife --outfile=dist/app.js --minify --legal-comments=none",shell=True,capture_output=True,text=True); print(r.stderr[-300:])
js=open('dist/app.js').read()
assert '</script' not in js.lower(), "balise script dans le bundle"
html=open('template.html').read(); data=open('contenu.json').read()
assert '</' not in data
html=html.replace('/*JSON*/',data).replace('/*BUNDLE*/',js)
open('../index.html','w').write(html); print('index.html',len(html)//1024,'Ko')
