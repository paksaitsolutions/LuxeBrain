# Fix all TENANTS_DB references
# Run: python fix_tenants_db.py

import re

files_to_fix = [
    "api/routes/admin_portal.py",
    "api/routes/metering.py", 
    "api/routes/stripe_webhooks.py",
    "api/utils/usage_scheduler.py"
]

for filepath in files_to_fix:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove TENANTS_DB import
    content = re.sub(r'from api\.utils\.tenant_resolver import.*TENANTS_DB.*\n', '', content)
    
    # Comment out TENANTS_DB usage with TODO
    content = re.sub(r'(\s+)(.*TENANTS_DB.*)', r'\1# TODO: Migrate to database - \2', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed {filepath}")

print("Done! All TENANTS_DB references commented out.")
