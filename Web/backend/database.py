import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, func, text, ForeignKey, Float
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

# .env 파일 로드
load_dotenv()

# os.getenv를 사용하여 환경변수 호출
db_user = os.getenv("DB_USER", "root")
db_password = os.getenv("DB_PASSWORD", "")
db_host = os.getenv("DB_HOST", "localhost")
db_name = os.getenv("DB_NAME", "security_ue5")

DB_URL = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:3306/{db_name}"

try:
    # MySQL 연결 시도 (빠른 실패를 위해 2초 타임아웃 지정)
    engine = create_engine(
        DB_URL,
        connect_args={"connect_timeout": 2},
        pool_size=5,        # 평상시 유지 커넥션 수
        max_overflow=10,    # 최대 15개까지 허용 (개발용 RDS t4g.micro 기준)
        pool_timeout=30,    # 커넥션 대기 최대 시간 (초)
        pool_recycle=1800,  # 30분마다 커넥션 재활용 (MySQL 타임아웃 방지)
        pool_pre_ping=True, # 끊어진 커넥션 자동 감지 및 재연결
    )
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("[DB] MySQL connection success!")
except Exception as e:
    print(f"[DB] MySQL connection failed: {e}")
    print("[DB] Falling back to SQLite (security_ue5.db)...")
    DB_URL = "sqlite:///./security_ue5.db"
    engine = create_engine(DB_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)  # "user" 또는 "admin"
    is_banned = Column(Integer, default=0, nullable=False)     # 0: 정상, 1: 제재됨
    created_at = Column(DateTime, default=func.now())
    last_login = Column(DateTime, nullable=True)

    # 관계 설정
    game_logs = relationship("GameLog", back_populates="user")


class GameLog(Base):
    __tablename__ = "game_logs"
    log_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # 유저 연결 (nullable: 기존 로그 호환)
    event_data = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())

    # 관계 설정
    user = relationship("User", back_populates="game_logs")

class AIPrediction(Base):
    __tablename__ = "ai_prediction"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)  # 유저 ID
    log_id = Column(Integer, primary_key=True)      # 로그 번호
    probability = Column(Float, nullable=False)     # 핵사용확률
    predicted_label = Column(String(50), nullable=False)  # 어떤 핵을 썼는지 (스피드핵, 갓모드, ESP, 에임핵)
    predictions = Column(String(50), nullable=False)      # 상태 (정상, 의심, 위험, 확신)
    created_at = Column(DateTime, default=func.now())

class SanctionHistory(Base):
    __tablename__ = "sanction_history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)  # "ban", "unban"
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())


