"""
관리자 계정 생성 스크립트
DB에 role='admin'인 관리자 계정을 안전하게 생성합니다.
비밀번호는 bcrypt 해시로 저장됩니다.

사용법:
  python create_admin.py
"""
from database import SessionLocal, Base, engine, User
from passlib.context import CryptContext
import getpass

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    # 테이블이 없으면 생성
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 기존 admin 계정 확인
        existing = db.query(User).filter(User.username == "admin").first()
        if existing:
            print(f"⚠️  'admin' 계정이 이미 존재합니다. (ID: {existing.id}, role: {existing.role})")
            choice = input("비밀번호를 재설정하시겠습니까? (y/n): ").strip().lower()
            if choice == 'y':
                new_pw = getpass.getpass("새 비밀번호 입력: ")
                confirm_pw = getpass.getpass("비밀번호 확인: ")
                if new_pw != confirm_pw:
                    print("❌ 비밀번호가 일치하지 않습니다.")
                    return
                if len(new_pw) < 8:
                    print("❌ 비밀번호는 8자 이상이어야 합니다.")
                    return
                existing.password_hash = pwd_context.hash(new_pw)
                existing.role = "admin"
                db.commit()
                print("✅ 관리자 비밀번호가 재설정되었습니다.")
            return
        
        # 새 관리자 계정 생성
        print("═══ Lyra Shield 관리자 계정 생성 ═══")
        print()
        
        name = input("관리자 이름: ").strip()
        if not name:
            name = "관리자"
        
        password = getpass.getpass("관리자 비밀번호 입력 (8자 이상): ")
        confirm = getpass.getpass("비밀번호 확인: ")
        
        if password != confirm:
            print("❌ 비밀번호가 일치하지 않습니다.")
            return
        
        if len(password) < 8:
            print("❌ 비밀번호는 8자 이상이어야 합니다.")
            return
        
        admin_user = User(
            name=name,
            username="admin",
            password_hash=pwd_context.hash(password),
            role="admin"
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print()
        print(f"✅ 관리자 계정 생성 완료!")
        print(f"   아이디: admin")
        print(f"   이름: {name}")
        print(f"   비밀번호: {'*' * len(password)} (마스킹)")
        print(f"   role: admin")
        print(f"   DB ID: {admin_user.id}")
        
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
