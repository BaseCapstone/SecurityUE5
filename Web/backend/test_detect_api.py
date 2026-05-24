import requests
import json

BASE_URL = "http://localhost:8000"

def test_detect_endpoint(nickname):
    url = f"{BASE_URL}/api/detect/analyze"
    payload = {"nickname": nickname}
    headers = {"Content-Type": "application/json"}
    
    print(f"\n--- Testing API for nickname: {nickname} ---")
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Response JSON:")
            print(json.dumps(response.json(), indent=4, ensure_ascii=False))
        else:
            print(f"Error Response: {response.text}")
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    # Test with normal user, user with warning, user with hacks (danger), and non-existent user
    test_detect_endpoint("testuser01")
    test_detect_endpoint("user_warning")
    test_detect_endpoint("user_danger")
    test_detect_endpoint("invalid_nickname")
