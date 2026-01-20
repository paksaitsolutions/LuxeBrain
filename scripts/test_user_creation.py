"""
Test User Creation
Copyright © 2024 Paksa IT Solutions
"""

import requests
import json

API_URL = "http://localhost:8000"

# First, login as admin
login_data = {
    "email": "admin@luxebrain.ai",
    "password": "Zafar@1980"
}

print("1. Logging in as admin...")
response = requests.post(f"{API_URL}/api/v1/auth/login", json=login_data)
if response.status_code == 200:
    token = response.json()["access_token"]
    print(f"✅ Login successful! Token: {token[:20]}...")
else:
    print(f"❌ Login failed: {response.status_code} - {response.text}")
    exit(1)

# Create a new user
headers = {"Authorization": f"Bearer {token}"}
new_user = {
    "email": "test.user@luxebrain.ai",
    "password": "Test@1234",
    "full_name": "Test User",
    "role": "support",
    "department": "support",
    "phone": "+1 (555) 123-4567",
    "avatar_url": "https://ui-avatars.com/api/?name=Test+User"
}

print("\n2. Creating new user...")
response = requests.post(f"{API_URL}/api/admin/rbac/users", json=new_user, headers=headers)
if response.status_code == 200:
    print(f"✅ User created successfully!")
    print(json.dumps(response.json(), indent=2))
else:
    print(f"❌ User creation failed: {response.status_code}")
    print(response.text)

# Get all users
print("\n3. Fetching all users...")
response = requests.get(f"{API_URL}/api/admin/rbac/users", headers=headers)
if response.status_code == 200:
    users = response.json()["users"]
    print(f"✅ Found {len(users)} users:")
    for user in users:
        print(f"  - {user['full_name']} ({user['email']}) - {user['role']}")
else:
    print(f"❌ Failed to fetch users: {response.status_code}")
    print(response.text)
