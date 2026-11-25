# Regenera assets/js/data/mockdata.js a partir de assets/data/mockdata.json (ejecutar desde la raíz del proyecto).
import json
d=json.load(open('assets/data/mockdata.json',encoding='utf8'))
open('assets/js/data/mockdata.js','w',encoding='utf8').write("window.PawLink = window.PawLink || {};\nPawLink.mockdata = "+json.dumps(d,ensure_ascii=False,indent=1)+";\n")
print('mockdata.js regenerado')
