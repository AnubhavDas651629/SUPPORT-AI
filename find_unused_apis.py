import re
import glob

backend_routes_full = []
for filepath in glob.glob('app/api/v1/*.py'):
    with open(filepath, 'r') as f:
        content = f.read()
        
    prefix_match = re.search(r'prefix="([^"]+)"', content)
    prefix = prefix_match.group(1) if prefix_match else ""
        
    matches = re.findall(r'@router\.(get|post|put|patch|delete)\("([^"]*)"', content)
    for method, path in matches:
        full_path = f"{prefix}{path}"
        full_path = full_path.replace('//', '/')
        if full_path.endswith('/') and len(full_path) > 1:
            full_path = full_path[:-1]
        backend_routes_full.append((method.upper(), full_path, filepath))

frontend_calls = set()
with open('frontend_routes.txt', 'r') as f:
    for line in f:
        match = re.search(r'api\.(get|post|put|patch|delete)\([`"'"'"']([^`"'"'"'?]+)', line)
        if match:
            method = match.group(1).upper()
            path = match.group(2)
            path_regex = re.sub(r'\$\{[^}]+\}', '[^/]+', path)
            if not path_regex.startswith('/'):
                path_regex = '/' + path_regex
            frontend_calls.add((method, path_regex))

print("\nUnused APIs:")
unused_count = 0
for method, b_path, filepath in backend_routes_full:
    used = False
    for f_method, f_path_regex in frontend_calls:
        if method == f_method:
            if re.fullmatch(f_path_regex, b_path):
                used = True
                break
    if not used:
        print(f"UNUSED: {method} {b_path} (in {filepath})")
        unused_count += 1
print(f"Total unused: {unused_count} out of {len(backend_routes_full)}")
