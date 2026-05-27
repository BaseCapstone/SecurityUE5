import requests
import json

BASE_URL = "http://localhost:8000"

def test_detect_endpoint(player_id, log_id):
    url = f"{BASE_URL}/api/detect/analyze"
    payload = {
        "player_id": player_id,
        "log_id": log_id,
        "prediction": {
            "probability": 0.418,
            "predicted_label": "ESP",
            "predictions": "의심"
        }
    }
    headers = {"Content-Type": "application/json"}
    
    print(f"\n--- Testing API for player_id={player_id}, log_id={log_id} ---")
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
    test_detect_endpoint(player_id=6, log_id=500)
    
    # Test the new report endpoint accepting dictionary format
    test_report_endpoint()

