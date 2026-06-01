import requests
import json

BASE_URL = "http://ec2-13-124-52-143.ap-northeast-2.compute.amazonaws.com:8000"

def test_detect_endpoint(user_id, log_id):
    url = f"{BASE_URL}/api/detect/analyze"
    payload = {
        "user_id": user_id,
        "log_id": log_id,
        "prediction": {
            "probability": 0.77,
            "predicted_label": "에임핵",
            "predictions": "확신"
        }
    }
    headers = {"Content-Type": "application/json"}
    
    print(f"\n--- Testing API for user_id={user_id}, log_id={log_id} ---")
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
    test_detect_endpoint(user_id=2, log_id=424)

