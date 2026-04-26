from fastapi import FastAPI, HTTPException, Query, Depends, Body
from pydantic import BaseModel
from database import SessionLocal
from sqlalchemy import text
from sqlalchemy.orm import Session
import json

app = FastAPI()

# 언리얼에서 보낼 데이터 형식을 정의
class GameLogSchema(BaseModel):
    event_data: dict

# DB 세션을 열고 닫아주는 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 로그를 요청하는 GET 엔드포인트
@app.get("/api/log")
async def get_log_by_id(logId: int = Query(...), db: Session = Depends(get_db)):
    # 모든 로그를 가져오는 쿼리 실행
    sql = text("SELECT * FROM game_logs WHERE log_id = :id")
    result = db.execute(sql, {"id": logId}).fetchone()

    if result is None:
        raise HTTPException(status_code=404, detail="Log not found")

    # MySQL에서 가져온 데이터가 문자열(str)일때 변환
    raw_event_data = result.event_data
    if isinstance(raw_event_data, str):
        event_data = json.loads(raw_event_data)
    else:
        event_data = raw_event_data

    log_data = {
        "log_id": result.log_id, #로그 ID
        "event_data": event_data, # 딕셔너리로 변환된 데이터
        "created_at": str(result.created_at) #로그가 작성된 시간
    }

    return {"log": log_data}

# 로그를 받는 POST 엔드포인트
@app.post("/log")
async def save_game_log(log_data: list = Body(...), db: Session = Depends(get_db)): # log_data는 배열 [ {...}, {...} ]의 형태
    try:
        if not log_data:
            raise HTTPException(status_code=400, detail="Empty log data")

        sql = text("INSERT INTO game_logs (event_data) VALUES (:p)")

        # 리스트를 통째로 JSON 문자열로 변환하여 저장
        event_data_json = json.dumps(log_data)

        db.execute(sql, {"p": event_data_json})
        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "로그 데이터 저장 완료"}