"""Validate generated pages, local links, fragments, assets and duplicate IDs."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json

ROOT=Path(__file__).resolve().parent.parent
SITE=ROOT/'site'
errors=[]

class Document(HTMLParser):
    def __init__(self):
        super().__init__();self.refs=[];self.ids=[];self.titles=0;self.main=0;self.lang=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag=='html':self.lang=bool(a.get('lang'))
        if tag=='title':self.titles+=1
        if tag=='main':self.main+=1
        if tag=='img' and 'alt' not in a:errors.append('Missing image alt text')
        for key in ['href','src','data-poster']:
            if key in a:self.refs.append(a[key])

documents={}
for file in SITE.rglob('*.html'):
    doc=Document();doc.feed(file.read_text());documents[file.resolve()]=doc
    if len(doc.ids)!=len(set(doc.ids)):errors.append(f'Duplicate IDs in {file}')
    if doc.titles!=1 or doc.main!=1 or not doc.lang:errors.append(f'Invalid document landmarks in {file}')
for file,doc in documents.items():
    for ref in doc.refs:
        u=urlsplit(ref)
        if u.scheme or u.netloc:continue
        target=(file.parent/unquote(u.path)).resolve() if u.path else file
        if not target.is_relative_to(SITE.resolve()):errors.append(f'Escapes site: {file} -> {ref}');continue
        if not target.exists():errors.append(f'Missing target: {file} -> {ref}')
        if u.fragment and target in documents and unquote(u.fragment) not in documents[target].ids:errors.append(f'Missing fragment: {file} -> {ref}')
routes=json.loads((ROOT/'src/routes.json').read_text())
assert len(routes)==len(documents)
assert not errors, '\n'.join(errors)
print(f'PASS: {len(documents)} pages; all local links, fragments, assets and document landmarks valid.')
