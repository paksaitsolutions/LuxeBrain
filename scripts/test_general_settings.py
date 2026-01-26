"""
Test General Settings
Copyright © 2024 Paksa IT Solutions
"""

import requests

BASE_URL = "http://localhost:8000"

def test_general_settings():
    print("Testing General Settings...")
    
    # Login
    print("\n1. Login as admin...")
    login_response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"email": "admin@luxebrain.ai", "password": "admin123"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login successful")
    
    # Get settings
    print("\n2. Get general settings...")
    get_response = requests.get(
        f"{BASE_URL}/api/admin/settings/general",
        headers=headers
    )
    
    if get_response.status_code == 200:
        settings = get_response.json()
        print(f"✅ Settings loaded:")
        print(f"   - Company: {settings.get('company_name')}")
        print(f"   - Email: {settings.get('support_email')}")
        print(f"   - Phone: {settings.get('support_phone')}")
        print(f"   - Timezone: {settings.get('timezone')}")
    else:
        print(f"❌ Failed to get settings: {get_response.text}")
        return
    
    # Update settings
    print("\n3. Update general settings...")
    update_data = {
        "company_name": "LuxeBrain AI Updated",
        "support_email": "support@luxebrain.ai",
        "support_phone": "+1-555-0200",
        "timezone": "America/New_York"
    }
    
    update_response = requests.put(
        f"{BASE_URL}/api/admin/settings/general",
        headers=headers,
        json=update_data
    )
    
    if update_response.status_code == 200:
        print("✅ Settings updated successfully")
    else:
        print(f"❌ Failed to update settings: {update_response.text}")
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    test_general_settings()
