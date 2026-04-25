from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from database import SessionLocal
from sqlalchemy import text
import datetime
import json

app = FastAPI()

# 언리얼에서 보낼 데이터 형식을 정의 (Pydantic 모델)
class GameLogSchema(BaseModel):
    user_id: str
    event_data: dict  # JSON 데이터를 받기 위한 딕셔너리 타입

@app.get("/api/log") #로그를 요청하는 GET 엔드포인트
async def get_log_by_id(logId: int = Query(...)):
    db = SessionLocal()
    try:
        # 1. 모든 로그를 가져오는 쿼리 실행
        sql = text("SELECT * FROM game_logs WHERE log_id = :id")
        result = db.execute(sql, {"id": logId}).fetchone()

        if result is None:
            raise HTTPException(status_code=404, detail="Log not found")

        log_data = {
<<<<<<< HEAD
            "log_id": result.log_id,
            "user_id": result.user_id,
            "event_data": result.event_data, # 이미 JSON으로 저장되어 있으니 그대로 사용
=======
            "log_id": result.log_id, # 로그 번호
            "user_id": result.user_id, # 사용자의 ID
            "event_type": result.event_type, # 발생한 이벤트의 타입
            "event_data": result.event_data, # 발생한 이벤트의 상세 로그 (JSON 형태)
>>>>>>> 06490ee62aecc6b25b362d95181019595cdd7b28
            "created_at": str(result.created_at) # 날짜는 문자열로 변환
        }

        return {"log": log_data}
    finally:
        db.close()

# 로그를 받는 POST 엔드포인트
@app.post("/log")
async def save_game_log(log: GameLogSchema):
    db = SessionLocal()
    try:
<<<<<<< HEAD
        # SQL 직접 실행 혹은 ORM 방식 사용
        sql = text("INSERT INTO game_logs (user_id, event_data) VALUES (:u, :p)")
=======
        sql = text("INSERT INTO game_logs (user_id, event_type, event_data) VALUES (:u, :e, :p)")
>>>>>>> 06490ee62aecc6b25b362d95181019595cdd7b28
        event_data_json = json.dumps(log.event_data)
        db.execute(sql, {"u": log.user_id, "p": event_data_json})
        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()

    return {"message": "Log saved successfully"}
