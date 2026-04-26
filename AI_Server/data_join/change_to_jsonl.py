import requests
import json
from fastapi import FastAPI

def write_jsonl_split(json_iterable, base_filename="output", max_lines=10000):
    file_index = 1
    line_count = 0
    
    current_file = open(f"{base_filename}_{file_index}.jsonl", "w", encoding="utf-8")
    
    for item in json_iterable:
        # JSON → 문자열 변환
        json_line = json.dumps(item, ensure_ascii=False)
        
        # 파일에 한 줄 쓰기
        current_file.write(json_line + "\n")
        line_count += 1
        
        # 10000줄 채우면 다음 파일로
        if line_count >= max_lines:
            current_file.close()
            
            file_index += 1
            line_count = 0
            current_file = open(f"{base_filename}_{file_index}.jsonl", "w", encoding="utf-8")
    
    current_file.close()


# 디비와의 통신 GET
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

# 사용 예시
data = [{"id": i, "value": f"test_{i}"} for i in range(25000)]

write_jsonl_split(data)