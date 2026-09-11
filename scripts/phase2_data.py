import json
from collections import OrderedDict

RETIRED = ["Homunculus Fallacy", "Conflicting Conditions", "Appeal to Closure"]
MERGED = {"Excluded Middle": "Black & White", "Appeal to Money": "Appeal to Authority",
          "Suppressed Correlative": "Definist Fallacy"}
REMOVED = set(RETIRED) | set(MERGED)

# --- fallacies.json ---
fallacies = json.load(open('src/data/fallacies.json'), object_pairs_hook=OrderedDict)
before = len(fallacies)
fallacies = [f for f in fallacies if f['name'] not in REMOVED]
json.dump(fallacies, open('src/data/fallacies.json', 'w'), indent=2)
print(f"fallacies: {before} -> {len(fallacies)}")

# --- quiz-questions.json ---
qs = json.load(open('src/data/quiz-questions.json'))
names = {f['name'] for f in fallacies}
cat = {f['name']: f.get('category') for f in fallacies}
before_q = len(qs)
qs = [q for q in qs if q['fallacy_name'] not in REMOVED]

scrubbed = 0
for q in qs:
    if any(o in REMOVED for o in q['options']):
        new_opts = []
        for o in q['options']:
            if o in REMOVED:
                # substitute: same-category real fallacy not already present
                candidates = sorted(n for n in names
                                    if n not in q['options'] and n != q['correct_answer']
                                    and cat.get(n) == cat.get(q['fallacy_name']))
                if not candidates:
                    candidates = sorted(n for n in names
                                        if n not in q['options'] and n != q['correct_answer'])
                o = candidates[0]
                scrubbed += 1
            new_opts.append(o)
        q['options'] = new_opts
json.dump(qs, open('src/data/quiz-questions.json', 'w'), indent=2)
print(f"questions: {before_q} -> {len(qs)} | option substitutions: {scrubbed}")

# --- enhancedData.ts: remove entries from the five maps ---
src = open('src/data/enhancedData.ts').read()
removed_keys = 0
for name in sorted(REMOVED, key=len, reverse=True):
    # remove one-line entries:  "Name": "...",   (keyTerms, categoryMappings, validVersionTemplates)
    import re
    pat = re.compile(r'^\s*"' + re.escape(name) + r'": \[[^\]]*\],\n', re.M)
    src, n1 = pat.subn('', src)
    pat2 = re.compile(r'^\s*"' + re.escape(name) + r'": "[^"]*",\n', re.M)
    src, n2 = pat2.subn('', src)
    removed_keys += n1 + n2

# remove multi-line template-literal diagram entries
for name in sorted(REMOVED, key=len, reverse=True):
    import re
    pat = re.compile(r'^\s*"' + re.escape(name) + r'": `[^`]*`,\n', re.M)
    src, n3 = pat.subn('', src)
    removed_keys += n3

# scrub confusionPairs VALUES referencing removed names
def scrub_pair(m):
    key, inner = m.group(1), m.group(2)
    items = [v.strip() for v in inner.split(',') if v.strip()]
    kept = [v for v in items if v not in REMOVED]
    if not kept:
        return ''
    return f'  "{key}": [{", ".join(kept)}],'
pat = re.compile(r'^  "([^"]+)": \[([^\]]*)\],\n', re.M)
src = pat.sub(scrub_pair, src)
json.dump({"scrubbed_map_entries": removed_keys}, open('/tmp/phase2_stats.json', 'w'))
open('src/data/enhancedData.ts', 'w').write(src)
print(f"enhancedData map entries removed: {removed_keys}")
