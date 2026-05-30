"""
테스트용 관리자 계정 자동 생성 (비대화형)
서버 실행 전에 한 번 실행하세요.
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from database import SessionLocal, Base, engine, User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_admin():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        existing = db.query(User).filter(User.username == "admin").first()
        if existing:
            if existing.role != "admin":
                existing.role = "admin"
                db.commit()
                print("[OK] 기존 admin 계정의 role을 admin으로 업데이트했습니다.")
            else:
                print(f"[INFO] admin 계정이 이미 존재합니다. (ID: {existing.id})")
            return
        
        admin_user = User(
            name="관리자",
            username="admin",
            password_hash=pwd_context.hash("admin1234"),
            role="admin"
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("[OK] 관리자 계정 생성 완료!")
        print(f"   아이디: admin")
        print(f"   비밀번호: admin1234")
        print(f"   role: admin")
        print(f"   DB ID: {admin_user.id}")
        
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
