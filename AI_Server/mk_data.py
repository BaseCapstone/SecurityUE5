import requests
import json
# from ai.predict import predict_anomaly
# from ai.train import train_model



class LogResult():
    def __init__(self, player_id: int, abnormal_ratio: float):
        self.player_id = player_id
        self.abnormal_ratio = abnormal_ratio



# 훈련용 데이터 가공 및 저장
data_list = []
data_lists = []

print(f"로그 처리 시작...")

for log_id in range(5,10000):
    print(f"{log_id}번 로그 처리 중...")
    response = requests.get(f"https://perfectly-curdle-gecko.ngrok-free.dev/api/log?logId={log_id}")

    if response.status_code != 200:
        print("로그 가져오기 실패:", response.status_code)

        with open("temp.txt", "w") as f:
            f.write(str(log_id))

        break

    datas = response.json()["log"]["event_data"]
    

    if len(datas) != 30:
        print(f"{log_id}번 로그는 데이터 개수가 30개가 아니라서 넘어갑니다.")
        continue

    current_time = datas[0]["timestamp"]
    current_label = datas[0]["label"]

    data_list = []
    err = False

    for data in datas:
        userId = data["userId"]
        timestamp = data["timestamp"]

        label = data["label"]

        if current_time > timestamp or current_label != label:
            err = True
            print("리스트의 순서가 틀리거나 핵 사용 여부가 변경되어 해당 데이터는 넘어갑니다.")
            break

        current_time = timestamp

        location = data["location"]
        x = location["x"]
        y = location["y"]
        z = location["z"]

        speed = data["speed"]

        rotation = data["rotation"]
        pitch = rotation["pitch"]
        yaw = rotation["yaw"]
        roll = rotation["roll"]

        delta = data["deltaRotation"]
        d_pitch = delta["pitch"]
        d_yaw = delta["yaw"]
        d_roll = delta["roll"]

        hp = data["currentHP"]
        distance = data["targetDistance"]
        angle = data["targetAngle"]
        visible = data["bIsTargetVisible"]

        data_list.append([
            timestamp,
            x, y, z,
            speed,
            pitch, yaw, roll,
            d_pitch, d_yaw, d_roll,
            hp,
            distance,
            angle,
            visible,
            label
        ])

        print(
            f"{timestamp}"
        )

    if not err:
        data_lists.append(data_list)

        
data_folder = "data/"

# 데이터셋 생성
with open(data_folder + "output.jsonl", "w", encoding="utf-8") as f:
    for data_list in data_lists:
        obj = {
            "frames": [row[:-1] for row in data_list],
            "label": data_list[0][-1]
        }
        f.write(json.dumps(obj) + "\n")



# # 결과를 저장하고 디비와의 통신 POST
# result = LogResult(player_id=player_id, abnormal_ratio=predict_anomaly(sequence))

# response = requests.post(
#     "http://~~~~~ 디비 주소/analysis_result",
#     json=result
# )
