from fastapi import FastAPI, HTTPException, Query, Depends, Body, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import SessionLocal, Base, engine, User, GameLog
from sqlalchemy import text, func
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
import json
from typing import Optional

app = FastAPI()

# CORS 설정 (프론트엔드와 포트가 다를 수 있으므로)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os

# 보안: SECRET_KEY는 환경변수에서 로드 (없으면 기본값 사용, 프로덕션에서는 반드시 설정할 것)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "lyra_shield_secret_key_change_me")
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

def mask_string(s: str, visible: int = 2) -> str:
    """문자열의 앞 visible글자만 보여주고 나머지를 *로 마스킹합니다."""
    if not s or len(s) <= visible:
        return "*" * len(s) if s else ""
    return s[:visible] + "*" * (len(s) - visible)

# ═══════════════════════════════════════════════════
# Pydantic 스키마
# ═══════════════════════════════════════════════════

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

# ═══════════════════════════════════════════════════
# DB 세션 & JWT 인증 의존성
# ═══════════════════════════════════════════════════

# DB 세션을 열고 닫아주는 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# JWT 토큰으로 현재 유저를 인증하는 의존성 함수
def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Authorization 헤더에서 Bearer 토큰을 추출하고 유저를 조회합니다."""
    if not authorization:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    
    # "Bearer <token>" 형식 파싱
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="잘못된 인증 형식입니다.")
    
    token = parts[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="토큰이 만료되었습니다. 다시 로그인해주세요.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")
    
    return user

# ═══════════════════════════════════════════════════
# 인증 API (회원가입 / 로그인)
# ═══════════════════════════════════════════════════

@app.post("/api/auth/register")
async def register_user(user_data: RegisterSchema, db: Session = Depends(get_db)):
    """회원가입 — DB에 새 유저를 생성합니다."""
    # 이미 존재하는 아이디인지 확인
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="이미 존재하는 아이디입니다.")
    
    hashed_password = get_password_hash(user_data.password)
    
    new_user = User(
        name=user_data.name,
        username=user_data.username,
        password_hash=hashed_password,
        role="user"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "회원가입이 완료되었습니다.", "user_id": new_user.id}

@app.post("/api/auth/login")
async def login_user(login_data: LoginSchema, db: Session = Depends(get_db)):
    """로그인 — JWT 토큰을 발급하고 last_login을 업데이트합니다."""
    user = db.query(User).filter(User.username == login_data.username).first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 일치하지 않습니다.")
    
    # last_login 업데이트
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {
        "token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "role": user.role,
            "last_login": str(user.last_login) if user.last_login else None
        }
    }

# ═══════════════════════════════════════════════════
# 유저 프로필 / 게임 데이터 API (로그인 필수)
# ═══════════════════════════════════════════════════

@app.get("/api/user/profile")
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """현재 로그인한 유저의 프로필 + 게임 통계를 반환합니다."""
    # 해당 유저의 게임 로그 수 조회
    log_count = db.query(GameLog).filter(GameLog.user_id == current_user.id).count()
    
    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "name": current_user.name,
            "role": current_user.role,
            "created_at": str(current_user.created_at),
            "last_login": str(current_user.last_login) if current_user.last_login else None
        },
        "game_stats": {
            "total_logs": log_count
        }
    }

@app.get("/api/user/game-data")
async def get_user_game_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """현재 로그인한 유저의 게임 로그 데이터를 반환합니다."""
    logs = db.query(GameLog).filter(
        GameLog.user_id == current_user.id
    ).order_by(GameLog.created_at.desc()).limit(50).all()
    
    result = []
    for log in logs:
        raw = log.event_data
        if isinstance(raw, str):
            try:
                event_data = json.loads(raw)
            except json.JSONDecodeError:
                event_data = raw
        else:
            event_data = raw
        
        result.append({
            "log_id": log.log_id,
            "event_data": event_data,
            "created_at": str(log.created_at)
        })
    
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "logs": result,
        "total": len(result)
    }

# ═══════════════════════════════════════════════════
# 게임 로그 API (언리얼 클라이언트용)
# ═══════════════════════════════════════════════════

@app.get("/api/logs/{logId}")
async def get_log_by_id(logId: int, db: Session = Depends(get_db)):
    """로그 ID로 특정 로그를 조회합니다."""
    log = db.query(GameLog).filter(GameLog.log_id == logId).first()
    
    if log is None:
        raise HTTPException(status_code=404, detail="Log not found")

    raw_event_data = log.event_data
    if isinstance(raw_event_data, str):
        event_data = json.loads(raw_event_data)
    else:
        event_data = raw_event_data

    log_data = {
        "log_id": log.log_id,
        "user_id": log.user_id,
        "event_data": event_data,
        "created_at": str(log.created_at)
    }

    return {"log": log_data}

@app.post("/api/logs", status_code=status.HTTP_201_CREATED)
async def save_game_log(
    log_data: list = Body(...),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """게임 로그를 저장합니다. 인증된 유저면 user_id를 함께 저장합니다."""
    try:
        if not log_data:
            raise HTTPException(status_code=400, detail="Empty log data")

        # 인증된 유저가 있으면 user_id 연결
        user_id = None
        if authorization:
            try:
                parts = authorization.split()
                if len(parts) == 2 and parts[0].lower() == "bearer":
                    payload = jwt.decode(parts[1], SECRET_KEY, algorithms=[ALGORITHM])
                    username = payload.get("sub")
                    if username:
                        user = db.query(User).filter(User.username == username).first()
                        if user:
                            user_id = user.id
            except Exception:
                pass  # 인증 실패해도 로그 저장은 진행

        event_data_json = json.dumps(log_data)
        
        new_log = GameLog(
            user_id=user_id,
            event_data=event_data_json
        )
        db.add(new_log)
        db.commit()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "로그 데이터 저장 완료", "user_id": user_id}

# ═══════════════════════════════════════════════════
# 관리자 전용 API (role='admin' 필수)
# ═══════════════════════════════════════════════════

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """관리자 권한이 필요한 엔드포인트에 사용하는 의존성 함수."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    return current_user

@app.get("/api/admin/users")
async def get_all_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """관리자 전용 — 전체 유저 목록 (민감 정보 마스킹 처리)."""
    users = db.query(User).all()
    
    result = []
    for u in users:
        log_count = db.query(GameLog).filter(GameLog.user_id == u.id).count()
        result.append({
            "id": u.id,
            "username": u.username,
            "name": u.name,
            "role": u.role,
            "created_at": str(u.created_at),
            "last_login": str(u.last_login) if u.last_login else None,
            "game_logs_count": log_count
        })
    
    return {"users": result, "total": len(result)}

@app.get("/api/admin/users/{user_id}/logs")
async def get_user_logs_for_admin(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """관리자 전용 — 특정 유저의 실제 게임 로그 반환."""
    logs = db.query(GameLog).filter(
        GameLog.user_id == user_id
    ).order_by(GameLog.created_at.desc()).limit(100).all()
    
    result = []
    for log in logs:
        raw = log.event_data
        if isinstance(raw, str):
            try:
                event_data = json.loads(raw)
            except json.JSONDecodeError:
                event_data = raw
        else:
            event_data = raw
        
        result.append({
            "log_id": log.log_id,
            "event_data": event_data,
            "created_at": str(log.created_at)
        })
    
    return {"user_id": user_id, "logs": result, "total": len(result)}

# ═══════════════════════════════════════════════════
# 서버 시작 시 테이블 자동 생성
# ═══════════════════════════════════════════════════

@app.on_event("startup")
async def startup_event():
    """서버 시작 시 DB 테이블을 자동 생성합니다."""
    Base.metadata.create_all(bind=engine)

# ═══════════════════════════════════════════════════
# 프론트엔드 정적 파일 서빙
# ═══════════════════════════════════════════════════
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dir = Path(__file__).parent.parent / "frontend"
if frontend_dir.exists():
    @app.get("/")
    async def serve_frontend():
        return FileResponse(str(frontend_dir / "index.html"))
    
    # 정적 파일 마운트 (CSS, JS 등) — 반드시 마지막에 위치
    app.mount("/", StaticFiles(directory=str(frontend_dir)), name="static")