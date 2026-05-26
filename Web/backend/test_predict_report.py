import requests
import json

BASE_URL = "http://localhost:8000"

def login_and_get_token(username, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": username, "password": password})
    if r.status_code == 200:
        return r.json()["token"]
    return None

def test_prediction_report():
    print("\n--- 1. Testing AI Prediction Report Submission ---")
    url = f"{BASE_URL}/api/predict/report"
    # User's exact structure from request:
    # {'player_id': '257', 'log_id': '1211', 'prediction': {'probability': 0.3716, 'predicted_label': '갓모드', 'predictions': '의심'}}
    payload = {
        "player_id": "testuser01",
        "log_id": "1211",
        "prediction": {
            "probability": 0.3716,
            "predicted_label": "갓모드",
            "predictions": "의심"
        }
    }
    
    r = requests.post(url, json=payload)
    print(f"Status Code: {r.status_code}")
    if r.status_code == 200:
        print("Response JSON:")
        print(json.dumps(r.json(), indent=2, ensure_ascii=False))
    else:
        print(f"Error: {r.text}")

def test_admin_predictions(admin_token):
    print("\n--- 2. Testing Fetching Predictions for Admin ---")
    url = f"{BASE_URL}/api/admin/predictions"
    r = requests.get(url, headers={"Authorization": f"Bearer {admin_token}"})
    print(f"Status Code: {r.status_code}")
    if r.status_code == 200:
        d = r.json()
        print(f"Total predictions: {d['total']}")
        print(f"Status percentages: {d['status_percentages']}")
        print(f"Label percentages: {d['label_percentages']}")
        print("First prediction log:")
        print(json.dumps(d['predictions'][0], indent=2, ensure_ascii=False))
    else:
        print(f"Error: {r.text}")

def test_user_ban_and_play_block(admin_token):
    print("\n--- 3. Testing User Ban and Play Game Block Flow ---")
    
    # Let's get the list of users to find testuser01's ID
    r = requests.get(f"{BASE_URL}/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    users = r.json()["users"]
    user_id = None
    for u in users:
        if u["username"] == "testuser01":
            user_id = u["id"]
            print(f"Found testuser01 ID: {user_id}, Current ban state: {u['is_banned']}")
            break
            
    if not user_id:
        print("testuser01 not found.")
        return
        
    # Ban the user
    print(f"\nBanning user ID: {user_id}...")
    r_ban = requests.post(f"{BASE_URL}/api/admin/users/{user_id}/ban", headers={"Authorization": f"Bearer {admin_token}"})
    print(f"Ban Status Code: {r_ban.status_code}")
    print(r_ban.json())
    
    # Try to issue game token for testuser01 (should fail with 403)
    print("\nAttempting to get game-token for banned testuser01...")
    user_token = login_and_get_token("testuser01", "test12345")
    if user_token:
        r_token = requests.post(f"{BASE_URL}/api/auth/game-token", headers={"Authorization": f"Bearer {user_token}"})
        print(f"Game token status: {r_token.status_code}")
        print(f"Game token response: {r_token.text}")
    else:
        print("Failed to login as testuser01.")
        
    # Unban the user
    print(f"\nUnbanning user ID: {user_id}...")
    r_unban = requests.post(f"{BASE_URL}/api/admin/users/{user_id}/unban", headers={"Authorization": f"Bearer {admin_token}"})
    print(f"Unban Status Code: {r_unban.status_code}")
    print(r_unban.json())
    
    # Try to issue game token again (should succeed with 200)
    print("\nAttempting to get game-token for unbanned testuser01...")
    r_token = requests.post(f"{BASE_URL}/api/auth/game-token", headers={"Authorization": f"Bearer {user_token}"})
    print(f"Game token status: {r_token.status_code}")
    if r_token.status_code == 200:
        print("Successfully issued game token after unbanning!")
    else:
        print(f"Error response: {r_token.text}")

if __name__ == "__main__":
    admin_token = login_and_get_token("admin", "admin1234")
    if not admin_token:
        print("Failed to login as admin.")
    else:
        test_prediction_report()
        test_admin_predictions(admin_token)
        test_user_ban_and_play_block(admin_token)
