import os
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
        
        norm_b = re.sub(r'\{[^}]+\}', '{}', full_path)
        backend_routes_full.append((method.upper(), norm_b, full_path, filepath))

frontend_calls = set()
def add_frontend_call(method, path):
    path = re.sub(r'\$\{[^}]+\}', '{}', path)
    path = path.split('?')[0]
    if "/api/v1" in path:
        path = path.split("/api/v1")[1]
    if not path.startswith('/'):
        path = '/' + path
    frontend_calls.add((method.upper(), path))

# Walk frontend/src
for root, _, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            with open(os.path.join(root, file), 'r') as f:
                content = f.read()
                matches = re.findall(r'api\.(get|post|put|patch|delete)(?:<[^>]+>)?\(\s*(["\'`])([^"\'`]+)\2', content)
                for method, _, path in matches:
                    add_frontend_call(method, path)
                    
                matches_fetch = re.findall(r'fetch\(\s*(["\'`])([^"\'`]+)\2', content)
                for _, path in matches_fetch:
                    add_frontend_call("GET", path)
                    add_frontend_call("POST", path)

# Walk app/static for Vanilla JS
for root, _, files in os.walk('app/static'):
    for file in files:
        if file.endswith('.js'):
            with open(os.path.join(root, file), 'r') as f:
                content = f.read()
                matches_fetch = re.findall(r'fetch\(\s*(["\'`])([^"\'`]+)\2', content)
                for _, path in matches_fetch:
                    add_frontend_call("GET", path)
                    add_frontend_call("POST", path)
                    
print("\nUnused APIs:")
unused_count = 0
for method, norm_b, b_path, filepath in backend_routes_full:
    used = False
    for f_method, f_path in frontend_calls:
        if method == f_method and norm_b == f_path:
            used = True
            break
    if not used:
        print(f"- `{method} {b_path}` (in `{filepath}`)")
        unused_count += 1
print(f"\nTotal unused: {unused_count} out of {len(backend_routes_full)}")

