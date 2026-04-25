from fastapi import FastAPI
import requests
from ai.predict import predict_anomaly

class LogResult():
    def __init__(self, player_id: int, abnormal_ratio: float):
        self.player_id = player_id
        self.abnormal_ratio = abnormal_ratio

app = FastAPI()

response = requests.get(f"http://~~~~ 디비 주소/api/log/{log_id}")

if response.status_code == 200:
    data = response.json()

    player_id = data["player_id"]
    sequence = data["sequence"]

    print(player_id)
    print(sequence)
else:
    print("로그 가져오기 실패:", response.status_code)


result = LogResult(player_id=player_id, abnormal_ratio=predict_anomaly(sequence))

response = requests.post(
    "http://~~~~~ 디비 주소/analysis_result",
    json=result
)
