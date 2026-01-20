"""
Test Plans API Endpoint
Copyright © 2024 Paksa IT Solutions
"""

import requests

# Test the plans endpoint
url = "http://localhost:8000/api/admin/tenants/plans"

# You'll need to get a valid token first by logging in
# For now, let's just test if the endpoint is accessible
try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
