from fastapi import FastAPI, HTTPException, Query, Depends, Body, status, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import SessionLocal, Base, engine, User, GameLog, AIPrediction, SanctionHistory
from sqlalchemy import text, func
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
import json
from typing import Optional, Union
import httpx

app = FastAPI()

# 실시간 서버 가동률(Uptime) 계산용 글로벌 변수 및 미들웨어
TOTAL_REQUESTS = 0
ERROR_5XX_COUNT = 0

@app.middleware("http")
async def track_uptime_middleware(request, call_next):
    global TOTAL_REQUESTS, ERROR_5XX_COUNT
    # 정적 파일이나 단순 상태 확인 등을 모두 포함하여 실제 트래픽 기반으로 가동률 계산
    TOTAL_REQUESTS += 1
    try:
        response = await call_next(request)
        if response.status_code >= 500:
            ERROR_5XX_COUNT += 1
        return response
    except Exception:
        ERROR_5XX_COUNT += 1
        raise

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

class AIPredictionDetailSchema(BaseModel):
    probability: float     # 핵사용확률
    predicted_label: str   # 어떤 핵을 썼는지 (스피드핵, 갓모드, ESP, 에임핵)
    predictions: str       # 정상, 의심, 위험, 확신, 핵

class DetectionRequestSchema(BaseModel):
    nickname: Optional[str] = None  # 컴퓨터에서 사용한 닉네임 (또는 컴퓨터 시리얼번호)
    player_id: Optional[Union[int, str]] = None
    log_id: Optional[int] = None
    prediction: Optional[AIPredictionDetailSchema] = None

class HackDetails(BaseModel):
    speed: float  # 스피드핵 비율 (%)
    esp: float    # ESP 비율 (%)
    god: float    # 무적핵 비율 (%)
    aim: float    # 에임핵 비율 (%)

class HackReportSchema(BaseModel):
    nickname: Optional[str] = None          # 컴퓨터 시리얼번호 (닉네임)
    player_id: Optional[str] = None
    detection_rate: float  # 검출률 (%)
    hacks: HackDetails     # 핵별 정보 딕셔너리

class AIPredictionReportSchema(BaseModel):
    player_id: Optional[str] = None         # 컴퓨터 일련번호 (username과 동일)
    nickname: Optional[str] = None          # 닉네임 호환용 필드
    log_id: str            # 몇번째 로그인지
    prediction: AIPredictionDetailSchema




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
    if getattr(current_user, "is_banned", 0) == 1:
        raise HTTPException(status_code=403, detail="핵 사용 의심 대상자로 지정되어 게임을 플레이할 수 없습니다.")


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
    # 1. 누적 보호 유저 (기본 하드코딩 제거, 실제 플레이어 유저 수)
    user_count = db.query(User).filter(User.role != "admin").count()
    total_users = user_count
    
    # 2. 실시간 검출/차단 로그 수 분석 (AI 예측 결과를 기준으로 집계)
    hack_log_count = db.query(AIPrediction).filter(AIPrediction.predictions.in_(["의심", "위험", "확신", "핵"])).count()
            
    # 3. 유저 AI 판정 기반 상태 집계 및 평균 보안 점수 계산
    danger_count = 0
    warning_count = 0
    total_score = 0
    user_with_score_count = 0
    
    all_users = db.query(User).filter(User.role != "admin").all()
    for u in all_users:
        # AI 예측 로그를 기반으로 보안 점수 계산
        preds = db.query(AIPrediction).filter(AIPrediction.player_id == u.username).all()
        score = 100
        for p in preds:
            if p.predictions == "의심":
                score -= 5
            elif p.predictions == "위험":
                score -= 15
            elif p.predictions in ["확신", "핵"]:
                score -= 30
        if score < 0:
            score = 0
            
        total_score += score
        user_with_score_count += 1
        
        if u.is_banned == 1:
            danger_count += 1
            continue
            
        last_pred = db.query(AIPrediction).filter(AIPrediction.player_id == u.username).order_by(AIPrediction.created_at.desc()).first()
        if last_pred:
            if last_pred.predictions in ["위험", "확신", "핵"]:
                danger_count += 1
            elif last_pred.predictions == "의심":
                warning_count += 1

    # 최근 10분 내 로그인 유저 수 (어드민 포함 실제 로그인 유저)
    ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
    recent_login_count = db.query(User).filter(User.last_login >= ten_minutes_ago).count()
    
    # 실제 수치 연산 (베이스 수치 제거)
    kst_now = datetime.utcnow() + timedelta(hours=9)
    start_of_month = datetime(kst_now.year, kst_now.month, 1) - timedelta(hours=9) # 이번 달 시작일 (UTC)

    # 금월 제재 수 (이번 달에 차단 기록된 내역)
    monthly_banned = db.query(SanctionHistory).filter(
        SanctionHistory.action == "ban",
        SanctionHistory.created_at >= start_of_month
    ).count()

    current_online = max(1, recent_login_count)  # 어드민 접속 상태이므로 최소 1 보장
    suspicious_count = warning_count
    blocked_count = monthly_banned # 금월 차단 수
    
    # KST 오늘 기준 AI 탐지 차단 수 계산
    kst_today_midnight = datetime(kst_now.year, kst_now.month, kst_now.day)
    utc_today_start = kst_today_midnight - timedelta(hours=9)
    
    today_blocked = db.query(AIPrediction).filter(
        AIPrediction.predictions.in_(["의심", "위험", "확신", "핵"]),
        AIPrediction.created_at >= utc_today_start
    ).count()
    
    if user_with_score_count > 0:
        average_score = round(total_score / user_with_score_count, 1)
    else:
        average_score = 100.0
    
    # Compute dynamic detection accuracy
    preds = db.query(AIPrediction).all()
    correct_count = 0
    evaluated_count = 0
    for p in preds:
        try:
            log_id_int = int(p.log_id)
        except ValueError:
            continue
        log = db.query(GameLog).filter(GameLog.log_id == log_id_int).first()
        if log:
            try:
                evt_data = json.loads(log.event_data) if isinstance(log.event_data, str) else log.event_data
                events = evt_data if isinstance(evt_data, list) else [evt_data]
            except Exception:
                continue
            
            has_cheat = False
            for evt in events:
                if (evt.get('SpeedHack') == 1 or 
                    (evt.get('Speed') is not None and evt.get('Speed') > 1000) or
                    evt.get('ESP') == 1 or 
                    evt.get('GodMode') == 1 or 
                    evt.get('Aim') == 1):
                    has_cheat = True
                    break
            
            ai_detected = (p.predictions in ["의심", "위험", "확신", "핵"])
            if has_cheat == ai_detected:
                correct_count += 1
            evaluated_count += 1
            
    if evaluated_count > 0:
        detection_accuracy_val = f"{round((correct_count / evaluated_count) * 100.0, 1)}%"
    else:
        detection_accuracy_val = "100.0%"

    # 실시간 가동률 계산
    global TOTAL_REQUESTS, ERROR_5XX_COUNT
    if TOTAL_REQUESTS > 0:
        uptime_ratio = (TOTAL_REQUESTS - ERROR_5XX_COUNT) / TOTAL_REQUESTS
        server_uptime_val = f"{round(uptime_ratio * 100.0, 2)}%"
    else:
        server_uptime_val = "100.00%"

    return {
        "detection_accuracy": detection_accuracy_val,
        "total_protected_users": total_users,
        "blocked_count": blocked_count,
        "server_uptime": server_uptime_val,
        "online_users": current_online,
        "suspicious_users": suspicious_count,
        "banned_users": monthly_banned,
        "today_blocked": today_blocked,
        "average_score": average_score
    }

@app.get("/api/public/ranking")
async def get_public_ranking(db: Session = Depends(get_db)):
    users = db.query(User).all()
    ranking_list = []
    
    for u in users:
        if u.role == "admin":
            continue
            
        preds = db.query(AIPrediction).filter(AIPrediction.player_id == u.username).all()
        score = 100
        for p in preds:
            if p.predictions == "의심":
                score -= 5
            elif p.predictions == "위험":
                score -= 15
            elif p.predictions in ["확신", "핵"]:
                score -= 30
        if score < 0:
            score = 0
            
        # 검증된 게임 수는 AI 검사가 완료된 고유 log_id 개수로 연동
        total_logs = db.query(AIPrediction.log_id).filter(AIPrediction.player_id == u.username).distinct().count()
        masked_username = mask_string(u.username)
        
        ranking_list.append({
            "username": masked_username,
            "score": score,
            "total_logs": total_logs,
            "status": "정상" if score >= 70 else ("주의" if score >= 30 else "제재")
        })
        
    # 정렬: 스코어 내림차순 -> 검증된 로그 수 내림차순
    ranking_list.sort(key=lambda x: (-x["score"], -x["total_logs"]))
    
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

EXTERNAL_DOMAIN_URL = "https://vw93ues8p2k3qu-8000.proxy.runpod.net/api/analyze"

# 외부 도메인 전송 비동기 함수
async def forward_log_to_external(log_id: int, user_id: int, frames: list):
    async with httpx.AsyncClient() as client:
        try:
            # 💡 frames 자리에 순수 파이썬 리스트가 매핑되어, 
            # 겉모습은 전형적인 JSON 배열 [{...}, {...}] 형태로 전송됩니다.
            payload = {
                "log_id": log_id,
                "user_id": user_id,
                "frames": frames  
            }
            response = await client.post(EXTERNAL_DOMAIN_URL, json=payload, timeout=5.0)
            response.raise_for_status()
        except Exception as e:
            print(f" [경고] 외부 도메인 전송 실패 (Log ID: {log_id}): {e}")


@app.post("/api/logs", status_code=status.HTTP_201_CREATED)
async def save_game_log(
    background_tasks: BackgroundTasks,
    log_data: list = Body(...), # 💡 Lyra가 보낸 json 리스트 형태의 로그인 event_data
    current_user: User = Depends(get_current_game_user), # 기존 의존성 함수 사용
    db: Session = Depends(get_db)
):
    """게임 로그를 저장하고, 동시에 외부 분석 도메인으로 프레임 리스트를 포워딩합니다."""
    try:
        if not log_data:
            raise HTTPException(status_code=400, detail="로그 데이터가 비어 있습니다.")

        # 1. 메인 DB 저장용: 텍스트 형태로 저장해야 하므로 문자열화(json.dumps) 진행
        event_data_json = json.dumps(log_data)
        
        new_log = GameLog(
            user_id=current_user.id,
            event_data=event_data_json
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log) # 생성된 고유 log_id 확보

        # 2. 외부 도메인 전송용: GET API 참고 사항 반영
        # event_data_json(문자열)을 넣으면 외부 서버에서 "frames": "[{\\"x\\":1,...}]" 처럼 쌍따옴표가 깨집니다.
        # 따라서 최초에 들어온 원본 'log_data(파이썬 list)'를 그대로 실어 보냅니다.
        background_tasks.add_task(
            forward_log_to_external, 
            new_log.log_id, 
            current_user.id, 
            log_data # 💡 텍스트가 아닌 JSON 리스트 형태 그대로 전달
        )

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
    payload는 dict 형태
    예시 payload = {'player_id': 6, 'log_id': 500, 'prediction': {'probability': 0.418, 'predicted_label': 'ESP', 'predictions': '의심'}}

    여기서 player_id를 사용하여 유저를 조회하고 nickname을 추출
    log_id는 로그 조회에 사용, 대시보드엔 표시 X
    prediction은 마찬가지로 dict 형태로 받아서 분석결과를 반환
    probability는 확률 (0~1 사이 소수점 3자리까지의 값)
    predicted_label은 예측된 핵 종류 (예: 'ESP', '스피드핵', '갓모드', '에임핵')
    predictions는 '정상', '의심', '위험', '핵' 중 하나의 문자열로 핵 사용 여부를 나타냄

    기존 방식 (nickname 기반 조회)도 하위 호환으로 지원합니다.
    """
    # 만약 prediction 객체가 있다면, 새로운 payload 형식으로 처리합니다.
    if payload.prediction is not None:
        if payload.player_id is None:
            raise HTTPException(status_code=422, detail="player_id가 필요합니다.")
        try:
            user_id = int(payload.player_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="player_id는 숫자여야 합니다.")
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="해당 ID의 사용자를 찾을 수 없습니다.")
            
        nickname = user.name or user.username
        
        if payload.log_id is None:
            raise HTTPException(status_code=422, detail="log_id가 필요합니다.")
            
        # log_id로 로그 조회
        log = db.query(GameLog).filter(GameLog.log_id == payload.log_id).first()
        if not log:
            raise HTTPException(status_code=404, detail="해당 로그를 찾을 수 없습니다.")
            
        # 단일 로그에 대해 패킷 이벤트 분석
        total_packets = 0
        speed_hack_count = 0
        esp_count = 0
        god_mode_count = 0
        aim_count = 0
        detected_packets = 0

        try:
            raw = log.event_data
            if isinstance(raw, str):
                evt_data = json.loads(raw)
            else:
                evt_data = raw
            
            events = evt_data if isinstance(evt_data, list) else [evt_data]
            
            for evt in events:
                total_packets += 1
                
                is_speed = (evt.get('SpeedHack') == 1 or (evt.get('Speed') is not None and evt.get('Speed') > 1000))
                is_esp = (evt.get('ESP') == 1)
                is_god = (evt.get('GodMode') == 1)
                is_aim = (evt.get('Aim') == 1)
                
                if is_speed:
                    speed_hack_count += 1
                if is_esp:
                    esp_count += 1
                if is_god:
                    god_mode_count += 1
                if is_aim:
                    aim_count += 1
                    
                if is_speed or is_esp or is_god or is_aim:
                    detected_packets += 1
        except Exception:
            pass

        overall_detection_rate = 0.0
        speed_pct = 0.0
        esp_pct = 0.0
        god_pct = 0.0
        aim_pct = 0.0

        if total_packets > 0:
            overall_detection_rate = round((detected_packets / total_packets) * 100.0, 2)
            speed_pct = round((speed_hack_count / total_packets) * 100.0, 2)
            esp_pct = round((esp_count / total_packets) * 100.0, 2)
            god_pct = round((god_mode_count / total_packets) * 100.0, 2)
            aim_pct = round((aim_count / total_packets) * 100.0, 2)

        hack_percentages_list = [speed_pct, esp_pct, god_pct, aim_pct]

        # AI 예측 결과를 DB에 저장 (player_id는 기존 대시보드 호환을 위해 username 저장)
        new_prediction = AIPrediction(
            player_id=user.username,
            log_id=str(payload.log_id),
            probability=round(payload.prediction.probability, 3),
            predicted_label=payload.prediction.predicted_label,
            predictions=payload.prediction.predictions
        )
        try:
            db.add(new_prediction)
            db.commit()
            db.refresh(new_prediction)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"예측 결과 저장 실패: {str(e)}")

        return {
            "nickname": nickname,
            "username": user.username,
            "name": user.name,
            "prediction": {
                "probability": round(payload.prediction.probability, 3),
                "predicted_label": payload.prediction.predicted_label,
                "predictions": payload.prediction.predictions
            },
            "total_packets_analyzed": total_packets,
            "overall_detection_rate": overall_detection_rate,
            "hack_percentages_list": hack_percentages_list,
            "breakdown": {
                "speed_hack": speed_pct,
                "esp": esp_pct,
                "god_mode": god_pct,
                "aim_hack": aim_pct
            }
        }

    # 기존 방식의 페이로드 처리 (대시보드 상세 모달 조회 등)
    nickname = payload.nickname or payload.player_id
    if not nickname:
        raise HTTPException(status_code=422, detail="nickname 또는 player_id가 필요합니다.")
    
    # 1. 닉네임(username 또는 name)으로 유저 검색 (대소문자 구분 없음)
    user = db.query(User).filter(
        (func.lower(User.username) == str(nickname).lower()) | 
        (func.lower(User.name) == str(nickname).lower())
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="해당 닉네임의 사용자를 찾을 수 없습니다.")

    # 2. 해당 유저의 모든 게임 로그 가져오기
    logs = db.query(GameLog).filter(GameLog.user_id == user.id).all()
    
    total_packets = 0
    speed_hack_count = 0
    esp_count = 0
    god_mode_count = 0
    aim_count = 0
    detected_packets = 0

    for log in logs:
        try:
            raw = log.event_data
            if isinstance(raw, str):
                evt_data = json.loads(raw)
            else:
                evt_data = raw
            
            events = evt_data if isinstance(evt_data, list) else [evt_data]
            
            for evt in events:
                total_packets += 1
                
                is_speed = (evt.get('SpeedHack') == 1 or (evt.get('Speed') is not None and evt.get('Speed') > 1000))
                is_esp = (evt.get('ESP') == 1)
                is_god = (evt.get('GodMode') == 1)
                is_aim = (evt.get('Aim') == 1)
                
                if is_speed:
                    speed_hack_count += 1
                if is_esp:
                    esp_count += 1
                if is_god:
                    god_mode_count += 1
                if is_aim:
                    aim_count += 1
                    
                if is_speed or is_esp or is_god or is_aim:
                    detected_packets += 1
        except Exception:
            pass

    overall_detection_rate = 0.0
    speed_pct = 0.0
    esp_pct = 0.0
    god_pct = 0.0
    aim_pct = 0.0

    if total_packets > 0:
        overall_detection_rate = round((detected_packets / total_packets) * 100.0, 2)
        speed_pct = round((speed_hack_count / total_packets) * 100.0, 2)
        esp_pct = round((esp_count / total_packets) * 100.0, 2)
        god_pct = round((god_mode_count / total_packets) * 100.0, 2)
        aim_pct = round((aim_count / total_packets) * 100.0, 2)

    hack_percentages_list = [speed_pct, esp_pct, god_pct, aim_pct]

    return {
        "nickname": nickname,
        "username": user.username,
        "name": user.name,
        "total_packets_analyzed": total_packets,
        "overall_detection_rate": overall_detection_rate,
        "hack_percentages_list": hack_percentages_list,
        "breakdown": {
            "speed_hack": speed_pct,
            "esp": esp_pct,
            "god_mode": god_pct,
            "aim_hack": aim_pct
        }
    }

@app.post("/api/detect/report")
async def report_hack_detection(
    payload: HackReportSchema
):
    """
    컴퓨터 시리얼번호(닉네임), 검출률(%), 그리고 스피드핵, ESP, 무적핵, 에임핵 비율이
    포함된 딕셔너리를 받아와서 처리하고, 각각의 비율을 순서대로 담은 퍼센트 리스트를 반환합니다.
    """
    nickname = payload.nickname or payload.player_id
    if not nickname:
        raise HTTPException(status_code=422, detail="nickname 또는 player_id가 필요합니다.")
        
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

@app.post("/api/predict/report")
async def report_ai_prediction(
    payload: AIPredictionReportSchema,
    db: Session = Depends(get_db)
):
    """
    AI 모델 예측 결과를 딕셔너리 형태로 받아와 DB에 저장합니다.
    """
    player_id = payload.player_id or payload.nickname
    if not player_id:
        raise HTTPException(status_code=422, detail="player_id 또는 nickname이 필요합니다.")
        
    new_prediction = AIPrediction(
        player_id=player_id,
        log_id=payload.log_id,
        probability=payload.prediction.probability,
        predicted_label=payload.prediction.predicted_label,
        predictions=payload.prediction.predictions
    )
    
    try:
        db.add(new_prediction)
        db.commit()
        db.refresh(new_prediction)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"예측 결과 저장 실패: {str(e)}")

    # 갓모드, 스피드핵, ESP, 에임핵 수치를 리스트(혹은 응답) 형태로 넘겨줍니다.
    # 순서: [스피드핵, 갓모드, ESP, 에임핵]
    speed_pct = 0.0
    god_pct = 0.0
    esp_pct = 0.0
    aim_pct = 0.0
    
    label = payload.prediction.predicted_label
    prob = round(payload.prediction.probability * 100.0, 2)  # 퍼센트로 변환
    
    if label == "스피드핵":
        speed_pct = prob
    elif label == "갓모드":
        god_pct = prob
    elif label == "ESP":
        esp_pct = prob
    elif label == "에임핵":
        aim_pct = prob
        
    hack_percentages_list = [speed_pct, god_pct, esp_pct, aim_pct]
    
    return {
        "message": "AI 예측 결과가 등록되었습니다.",
        "player_id": player_id,
        "log_id": payload.log_id,
        "predictions": payload.prediction.predictions,
        "hack_percentages_list": hack_percentages_list
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
        # 최근 AI 예측 정보 가져오기 (가장 최근 1개)
        last_pred = db.query(AIPrediction).filter(AIPrediction.player_id == u.username).order_by(AIPrediction.created_at.desc()).first()
        pred_label = last_pred.predicted_label if last_pred else "-"
        pred_prob = f"{round(last_pred.probability * 100.0, 1)}%" if last_pred else "-"
        pred_status = last_pred.predictions if last_pred else "정상"
        
        result.append({
            "id": u.id,
            "username": u.username,
            "name": u.name,
            "role": u.role,
            "is_banned": getattr(u, "is_banned", 0),
            "created_at": str(u.created_at),
            "last_login": str(u.last_login) if u.last_login else None,
            "game_logs_count": log_count,
            "ai_predicted_label": pred_label,
            "ai_probability": pred_prob,
            "ai_status": pred_status
        })
    
    return {"users": result, "total": len(result)}

@app.post("/api/admin/users/{user_id}/ban")
async def ban_user(
    user_id: int,
    reason: Optional[str] = Query(None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """유저 제재 처리"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    user.is_banned = 1
    
    sanction_reason = reason or "관리자 수동 제재"
    sanction = SanctionHistory(
        user_id=user.id,
        action="ban",
        reason=sanction_reason
    )
    db.add(sanction)
    db.commit()
    return {"message": f"{user.username} 유저가 제재되었습니다.", "is_banned": 1}

@app.post("/api/admin/users/{user_id}/unban")
async def unban_user(
    user_id: int,
    reason: Optional[str] = Query(None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """유저 제재 해제 처리"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    user.is_banned = 0
    
    sanction_reason = reason or "관리자 수동 제재 해제"
    sanction = SanctionHistory(
        user_id=user.id,
        action="unban",
        reason=sanction_reason
    )
    db.add(sanction)
    db.commit()
    return {"message": f"{user.username} 유저의 제재가 해제되었습니다.", "is_banned": 0}

@app.get("/api/admin/users/{user_id}/sanctions")
async def get_user_sanctions(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """특정 유저의 제재 이력 조회"""
    sanctions = db.query(SanctionHistory).filter(
        SanctionHistory.user_id == user_id
    ).order_by(SanctionHistory.created_at.desc()).all()
    
    result = []
    for s in sanctions:
        result.append({
            "id": s.id,
            "action": s.action,
            "reason": s.reason,
            "created_at": str(s.created_at)
        })
    return {"user_id": user_id, "sanctions": result}

@app.get("/api/admin/settings")
async def get_admin_settings(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """관리자 전용 — 시스템 설정 상태와 리소스 및 DB 상태 반환"""
    db_name_type = "MySQL"
    db_path = str(engine.url)
    if "sqlite" in str(engine.url):
        db_name_type = "SQLite (로컬 백업)"
        db_path = "./security_ue5.db"
    
    total_users = db.query(User).filter(User.role != "admin").count()
    total_logs = db.query(GameLog).count()
    total_preds = db.query(AIPrediction).count()
    total_sanctions = db.query(SanctionHistory).count()
    
    return {
        "db_type": db_name_type,
        "db_path": db_path,
        "total_users": total_users,
        "total_logs": total_logs,
        "total_predictions": total_preds,
        "total_sanctions": total_sanctions,
        "ai_model_version": "v3.0",
        "last_update": "2026.05.27",
        "auto_ban_threshold": "90%",
        "realtime_alert": "활성화",
        "log_retention_days": "90일"
    }

@app.get("/api/admin/predictions")
async def get_predictions(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """관리자 전용 — 최근 AI 예측 결과 및 통계를 반환합니다."""
    predictions_list = db.query(AIPrediction).order_by(AIPrediction.created_at.desc()).limit(100).all()
    
    total = len(predictions_list)
    status_counts = {"정상": 0, "의심": 0, "위험": 0, "확신": 0, "핵": 0}
    label_counts = {"스피드핵": 0, "갓모드": 0, "ESP": 0, "에임핵": 0}
    
    for p in predictions_list:
        if p.predictions in status_counts:
            status_counts[p.predictions] += 1
        if p.predicted_label in label_counts:
            label_counts[p.predicted_label] += 1
        
    status_percentages = {}
    label_percentages = {}
    if total > 0:
        for k, v in status_counts.items():
            status_percentages[k] = round((v / total) * 100.0, 1)
        for k, v in label_counts.items():
            label_percentages[k] = round((v / total) * 100.0, 1)
    else:
        for k in status_counts.keys():
            status_percentages[k] = 0.0
        for k in label_counts.keys():
            label_percentages[k] = 0.0
            
    result = []
    for p in predictions_list:
        result.append({
            "prediction_id": p.prediction_id,
            "player_id": p.player_id,
            "log_id": p.log_id,
            "probability": p.probability,
            "predicted_label": p.predicted_label,
            "predictions": p.predictions,
            "created_at": str(p.created_at)
        })
        
    return {
        "predictions": result,
        "total": total,
        "status_counts": status_counts,
        "label_counts": label_counts,
        "status_percentages": status_percentages,
        "label_percentages": label_percentages
    }


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
    """서버 시작 시 DB 테이블을 자동 생성하고 마이그레이션을 적용합니다."""
    # 1. 테이블 자동 생성 (ai_predictions 등)
    Base.metadata.create_all(bind=engine)
    
    # 2. users 테이블에 is_banned 컬럼이 없는 경우 추가
    try:
        with engine.begin() as conn:
            if engine.dialect.name == "sqlite":
                columns = [row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
            else:
                columns = [row[0] for row in conn.execute(text("SHOW COLUMNS FROM users")).fetchall()]
            
            if "is_banned" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0"))
                print("[DB] Added is_banned column to users table.")
    except Exception as e:
        print(f"[DB] Migration failed or is_banned already exists: {e}")


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
