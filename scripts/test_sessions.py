"""
Test Session Management
Copyright © 2024 Paksa IT Solutions
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_sessions():
    print("Testing Session Management...")
    
    # 1. Login as admin
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
    
    # 2. Get active sessions
    print("\n2. Get active sessions...")
    sessions_response = requests.get(
        f"{BASE_URL}/api/admin/sessions",
        headers=headers
    )
    
    if sessions_response.status_code == 200:
        data = sessions_response.json()
        print(f"✅ Found {data['total']} active sessions")
        for session in data['sessions'][:3]:
            print(f"   - {session['email']} ({session['role']}) from {session['ip_address']}")
    else:
        print(f"❌ Failed to get sessions: {sessions_response.text}")
    
    # 3. Get session stats
    print("\n3. Get session stats...")
    stats_response = requests.get(
        f"{BASE_URL}/api/admin/sessions/stats",
        headers=headers
    )
    
    if stats_response.status_code == 200:
        stats = stats_response.json()
        print(f"✅ Stats:")
        print(f"   - Total active: {stats['total_active']}")
        print(f"   - Active last hour: {stats['active_last_hour']}")
        print(f"   - By role: {stats['by_role']}")
    else:
        print(f"❌ Failed to get stats: {stats_response.text}")
    
    # 4. Get session config
    print("\n4. Get session config...")
    config_response = requests.get(
        f"{BASE_URL}/api/admin/sessions/config",
        headers=headers
    )
    
    if config_response.status_code == 200:
        config = config_response.json()
        print(f"✅ Config:")
        print(f"   - Session timeout: {config['session_timeout']}s")
        print(f"   - Idle timeout: {config['idle_timeout']}s")
        print(f"   - Max sessions per user: {config['max_sessions_per_user']}")
    else:
        print(f"❌ Failed to get config: {config_response.text}")
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    test_sessions()
