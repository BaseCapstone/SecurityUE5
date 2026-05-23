import os
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

# 로그 아이디 범위는 첫 로그부터 마지막 로그까지 탐색
# 로그 아이디는 1부터 시작하나 중간에 삭제되면 300번 로그가 시작일 수 있음
# 가정이 아닌 실제 로그 아이디 범위를 받아오도록

first_log_id = 26780
length = 200

for log_id in range(first_log_id, first_log_id + length):
    print(f"{log_id}번 로그 처리 중...")
    response = requests.get(f"http://ec2-13-124-52-143.ap-northeast-2.compute.amazonaws.com:8000/api/logs/{log_id}")

    if response.status_code != 200:
        print("로그 가져오기 실패:", response.status_code)

        with open("temp.txt", "w") as f:
            f.write(str(log_id))

        break

    datas = response.json()["log"]["event_data"]
    

    if len(datas) != 30:
        print(f"{log_id}번 로그는 데이터 개수가 30개가 아니라서 넘어갑니다.")
        continue

    current_speedLabel = datas[0]["speedHack"]
    current_godLabel = datas[0]["godMode"]
    current_espLabel = datas[0]["eSP"]
    current_aimLabel = datas[0]["aim"]

    current_time = datas[0]["timestamp"]
    

    data_list = []
    err = False

    for data in datas:
        userId = data["userId"]
        timestamp = data["timestamp"]

        speedLabel = data["speedHack"]
        godLabel = data["godMode"]
        espLabel = data["eSP"]
        aimLabel = data["aim"]

        if current_time > timestamp or not (current_speedLabel == speedLabel and current_godLabel == godLabel and current_espLabel == espLabel and current_aimLabel == aimLabel):
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
        visible = 1 if data["bIsTargetVisible"] == "true" else 0

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
            speedLabel, godLabel, espLabel, aimLabel
        ])

        # print(
        #     f"{timestamp}"
        # )

    if not err:
        data_lists.append(data_list)

        
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

data_folder = os.path.join(BASE_DIR, "data")

os.makedirs(data_folder, exist_ok=True)

output_path = os.path.join(data_folder, "output_test.jsonl")

with open(output_path, "w", encoding="utf-8") as f:
    for data_list in data_lists:
        obj = {
            "frames": [row[:-4] for row in data_list],
            "label": data_list[0][-4:]
        }
        f.write(json.dumps(obj) + "\n")



# # 결과를 저장하고 디비와의 통신 POST
# result = LogResult(player_id=player_id, abnormal_ratio=predict_anomaly(sequence))

# response = requests.post(
#     "http://~~~~~ 디비 주소/analysis_result",
#     json=result
# )
