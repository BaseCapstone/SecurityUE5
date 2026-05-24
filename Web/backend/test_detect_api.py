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

def test_report_endpoint():
    url = f"{BASE_URL}/api/detect/report"
    payload = {
        "nickname": "PC_SERIAL_998877",
        "detection_rate": 45.5,
        "hacks": {
            "speed": 25.0,
            "esp": 15.5,
            "god": 0.0,
            "aim": 5.0
        }
    }
    headers = {"Content-Type": "application/json"}
    
    print("\n--- Testing API /api/detect/report (Dictionary Payload) ---")
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
    
    # Test the new report endpoint accepting dictionary format
    test_report_endpoint()

