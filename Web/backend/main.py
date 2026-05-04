from fastapi import FastAPI, HTTPException, Query, Depends, Body, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import SessionLocal, User
from sqlalchemy import text
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
import json

app = FastAPI()

# CORS 설정 (프론트엔드와 포트가 다를 수 있으므로)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "lyra_shield_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 언리얼에서 보낼 데이터 형식을 정의
class GameLogSchema(BaseModel):
    event_data: dict

class RegisterSchema(BaseModel):
    name: str
    username: str
    password: str

class LoginSchema(BaseModel):
    username: str
    password: str

# DB 세션을 열고 닫아주는 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 로그를 요청하는 GET 엔드포인트
@app.get("/api/logs/{logId}")
async def get_log_by_id(logId: int, db: Session = Depends(get_db)):
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
@app.post("api/logs", status_code=status.HTTP_201_CREATED)
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

@app.post("/api/auth/register")
async def register_user(user_data: RegisterSchema, db: Session = Depends(get_db)):
    # 이미 존재하는 아이디인지 확인
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="이미 존재하는 아이디입니다.")
    
    hashed_password = get_password_hash(user_data.password)
    
    new_user = User(
        name=user_data.name,
        username=user_data.username,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "회원가입이 완료되었습니다.", "user_id": new_user.id}

@app.post("/api/auth/login")
async def login_user(login_data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 일치하지 않습니다.")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.name
        }
    }