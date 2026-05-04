import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, DateTime, func, text, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base

# .env 파일 로드
load_dotenv()

# os.getenv를 사용하여 환경변수 호출
db_user = os.getenv("DB_USER", "root")
db_password = os.getenv("DB_PASSWORD", "")
db_host = os.getenv("DB_HOST", "localhost")
db_name = os.getenv("DB_NAME", "security_ue5")

DB_URL = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:3306/{db_name}"

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=func.now())
    last_login = Column(DateTime, nullable=True)