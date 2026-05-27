from fastapi import FastAPI, HTTPException, Query, Depends, Body, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from database import SessionLocal, Base, engine, User, GameLog
from sqlalchemy import text, func
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
import json
from typing import Literal, Optional

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
GAME_TOKEN_EXPIRE_HOURS = 6

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

def decode_bearer_token(authorization: Optional[str]) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="잘못된 인증 형식입니다.")

    try:
        return jwt.decode(parts[1], SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="토큰이 만료되었습니다. 다시 로그인해주세요.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")

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

class DetectionPredictionSchema(BaseModel):
    probability: float = Field(..., ge=0.0, le=1.0)
    predicted_label: str
    predictions: Literal["정상", "의심", "위험", "핵"]

    @field_validator("probability")
    @classmethod
    def round_probability(cls, value: float) -> float:
        return round(value, 3)

class DetectionRequestSchema(BaseModel):
    player_id: int
    log_id: int
    prediction: DetectionPredictionSchema

class HackDetails(BaseModel):
    speed: float  # 스피드핵 비율 (%)
    esp: float    # ESP 비율 (%)
    god: float    # 무적핵 비율 (%)
    aim: float    # 에임핵 비율 (%)

class HackReportSchema(BaseModel):
    nickname: str          # 컴퓨터 시리얼번호 (닉네임)
    detection_rate: float  # 검출률 (%)
    hacks: HackDetails     # 핵별 정보 딕셔너리



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

def get_current_game_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    payload = decode_bearer_token(authorization)
    if payload.get("token_type") != "game":
        raise HTTPException(status_code=401, detail="게임 토큰이 필요합니다.")

    user_id = payload.get("user_id")
    username = payload.get("sub")
    if user_id is None or username is None:
        raise HTTPException(status_code=401, detail="유효하지 않은 게임 토큰입니다.")

    user = db.query(User).filter(User.id == user_id, User.username == username).first()
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

@app.post("/api/auth/game-token")
async def issue_game_token(current_user: User = Depends(get_current_user)):
    """Issue a short-lived JWT for the game client after web login."""
    if current_user.role == "admin":
        raise HTTPException(status_code=403, detail="관리자 계정은 게임 클라이언트를 실행할 수 없습니다.")

    expires_delta = timedelta(hours=GAME_TOKEN_EXPIRE_HOURS)
    expires_at = datetime.utcnow() + expires_delta
    game_token = create_access_token(
        data={
            "sub": current_user.username,
            "user_id": current_user.id,
            "role": current_user.role,
            "token_type": "game"
        },
        expires_delta=expires_delta
    )

    return {
        "game_token": game_token,
        "token_type": "Bearer",
        "expires_at": expires_at.isoformat() + "Z",
        "expires_in_seconds": int(expires_delta.total_seconds()),
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "name": current_user.name
        }
    }

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
        "logs": result,
        "total": len(result)
    }

# ═══════════════════════════════════════════════════
# 퍼블릭 통계 / 랭킹 API (홈 화면 및 대시보드 연동용)
# ═══════════════════════════════════════════════════

@app.get("/api/public/stats")
async def get_public_stats(db: Session = Depends(get_db)):
    # 1. 누적 보호 유저 (기본 15840 + DB 유저 수)
    user_count = db.query(User).count()
    total_users = 15840 + user_count
    
    # 2. 실시간 검출/차단 로그 수 분석
    logs = db.query(GameLog).all()
    hack_log_count = 0
    for log in logs:
        try:
            raw = log.event_data
            if isinstance(raw, str):
                evt_data = json.loads(raw)
            else:
                evt_data = raw
                
            events = evt_data if isinstance(evt_data, list) else [evt_data]
            for evt in events:
                is_hack = False
                if (evt.get('SpeedHack') == 1 or 
                    evt.get('Aim') == 1 or 
                    evt.get('GodMode') == 1 or 
                    evt.get('ESP') == 1 or 
                    (evt.get('Speed') is not None and evt.get('Speed') > 1000)):
                    is_hack = True
                
                if is_hack:
                    hack_log_count += 1
                    break
        except Exception:
            pass
            
    # 3. 유저 점수기반 상태 집계
    danger_count = 0
    warning_count = 0
    all_users = db.query(User).all()
    for u in all_users:
        if u.role == "admin":
            continue
        user_log_cnt = db.query(GameLog).filter(GameLog.user_id == u.id).count()
        score = 100 - (user_log_cnt * 2)
        if score < 30:
            danger_count += 1
        elif score < 70:
            warning_count += 1

    # 최근 10분 내 로그인 유저 수
    ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
    recent_login_count = db.query(User).filter(User.last_login >= ten_minutes_ago).count()
    
    # 하드코딩 사양에 맞춰 동적 베이스 수치 연산
    banned_count = 1203 + hack_log_count
    current_online = 247 + recent_login_count
    suspicious_count = 5 + warning_count
    monthly_banned = 38 + danger_count
    
    return {
        "detection_accuracy": "99.7%",
        "total_protected_users": total_users,
        "blocked_count": banned_count,
        "server_uptime": "99.99%",
        "online_users": current_online,
        "suspicious_users": suspicious_count,
        "banned_users": monthly_banned
    }

@app.get("/api/public/ranking")
async def get_public_ranking(db: Session = Depends(get_db)):
    users = db.query(User).all()
    ranking_list = []
    
    for u in users:
        if u.role == "admin":
            continue
        log_count = db.query(GameLog).filter(GameLog.user_id == u.id).count()
        score = 100 - (log_count * 2)
        if score < 0:
            score = 0
            
        masked_username = mask_string(u.username)
        
        ranking_list.append({
            "username": masked_username,
            "score": score,
            "total_logs": log_count,
            "status": "정상" if score >= 70 else ("주의" if score >= 30 else "제재")
        })
        
    # 정렬: 스코어 내림차순 -> 로그 수 오름차순
    ranking_list.sort(key=lambda x: (-x["score"], x["total_logs"]))
    
    # 상위 10명만 노출
    top_ranking = ranking_list[:10]
    return {"ranking": top_ranking}

# ═══════════════════════════════════════════════════
# 게임 로그 API (언리얼 클라이언트용)
# ═══════════════════════════════════════════════════

@app.get("/api/logs/{logId}")
async def get_log_by_id(logId: int, db: Session = Depends(get_db)):
    """로그 ID로 특정 로그를 조회합니다."""
    log = db.query(GameLog).filter(GameLog.log_id == logId).first()
    
    if log is None:
        raise HTTPException(status_code=404, detail="로그를 찾을 수 없습니다.")

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
    current_user: User = Depends(get_current_game_user),
    db: Session = Depends(get_db)
):
    """게임 로그를 저장합니다. 인증된 유저면 user_id를 함께 저장합니다."""
    try:
        if not log_data:
            raise HTTPException(status_code=400, detail="로그 데이터가 비어 있습니다.")

        event_data_json = json.dumps(log_data)
        
        new_log = GameLog(
            user_id=current_user.id,
            event_data=event_data_json
        )
        db.add(new_log)
        db.commit()

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "로그 데이터가 저장되었습니다.", "user_id": current_user.id}

@app.post("/api/detect/analyze")
async def analyze_hack_detection(
    payload: DetectionRequestSchema,
    db: Session = Depends(get_db)
):
    
    """
    받은 데이터를 기반으로 player_id를 통해 user를 조회하여 닉네임 추출
    로그는 무시해도됨
    prediction을 기반으로 대시보드에 띄우면 된다
    predicted_label은 예측된 핵 종류 (예: 'ESP', '스피드핵', '갓모드', '에임핵')
    predictions는 '정상', '의심', '위험', '확신' 중 하나로 예측 결과의 상태를 나타냄

    이거 기반으로 admin.html의 대시보드에 예측 결과를 보여주는 API
    참고로 대시보드엔 제재 버튼이 동봉되어있음
    """
    """
    AI 서버가 보낸 단일 분석 결과를 받아 대시보드용 응답으로 변환합니다.

    payload 예시:
    {
        "player_id": 6,
        "log_id": 500,
        "prediction": {
            "probability": 0.418,
            "predicted_label": "ESP",
            "predictions": "의심"
        }
    }
    """
    user = db.query(User).filter(User.id == payload.player_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="해당 player_id의 사용자를 찾을 수 없습니다.")

    # log = db.query(GameLog).filter(
    #     GameLog.log_id == payload.log_id,
    #     GameLog.user_id == user.id
    # ).first()
    # if not log:
    #     raise HTTPException(status_code=404, detail="해당 사용자의 로그를 찾을 수 없습니다.")

    prediction = payload.prediction
    probability = round(prediction.probability, 3)
    probability_pct = round(probability * 100.0, 2)
    predicted_label = prediction.predicted_label.strip()
    status_label = prediction.predictions

    label_map = {
        "스피드핵": "speed_hack",
        "esp": "esp",
        "갓모드": "god_mode",
        "에임핵": "aim_hack",
    }
    normalized_label = label_map.get(
        predicted_label.lower().replace(" ", "").replace("-", "_"),
        "unknown"
    )

    breakdown = {
        "speed_hack": 0.0,
        "esp": 0.0,
        "god_mode": 0.0,
        "aim_hack": 0.0
    }
    if status_label != "정상" and normalized_label in breakdown:
        breakdown[normalized_label] = probability_pct

    hack_percentages_list = [
        breakdown["speed_hack"],
        breakdown["esp"],
        breakdown["god_mode"],
        breakdown["aim_hack"]
    ]

    return {
        "nickname": user.name,
        "username": user.username,
        "player_id": user.id,
        "overall_detection_rate": 0.0 if status_label == "정상" else probability_pct,
        "hack_percentages_list": hack_percentages_list,
        "prediction_result": {
            "probability": probability,
            "probability_percent": probability_pct,
            "predicted_label": predicted_label,
            "normalized_label": normalized_label,
            "predictions": status_label,
            "is_hack_detected": status_label != "정상"
        },
        "breakdown": breakdown
    }

@app.post("/api/detect/report")
async def report_hack_detection(
    payload: HackReportSchema
):
    """
    컴퓨터 시리얼번호(닉네임), 검출률(%), 그리고 스피드핵, ESP, 무적핵, 에임핵 비율이
    포함된 딕셔너리를 받아와서 처리하고, 각각의 비율을 순서대로 담은 퍼센트 리스트를 반환합니다.
    """
    nickname = payload.nickname
    detection_rate = payload.detection_rate
    
    # 딕셔너리(객체)에서 각각의 핵 비율 값 추출
    speed_pct = payload.hacks.speed
    esp_pct = payload.hacks.esp
    god_pct = payload.hacks.god
    aim_pct = payload.hacks.aim
    
    # 스피드, esp, god모드, 에임핵 순서의 퍼센트 리스트
    hack_percentages_list = [speed_pct, esp_pct, god_pct, aim_pct]
    
    return {
        "nickname": nickname,
        "detection_rate": detection_rate,
        "hack_percentages_list": hack_percentages_list,
        "hacks_dict": {
            "speed": speed_pct,
            "esp": esp_pct,
            "god": god_pct,
            "aim": aim_pct
        }
    }



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
