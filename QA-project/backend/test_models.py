import urllib.request, json
req = urllib.request.Request('https://openrouter.ai/api/v1/models')
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    for m in data['data']:
        if m.get('architecture', {}).get('modality') == 'text->embedding' or 'embed' in m['id'].lower() or 'nomic' in m['id'].lower():
            print(f\
m['id']
-
m['name']
\)
