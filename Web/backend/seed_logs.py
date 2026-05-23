import sys
sys.stdout.reconfigure(encoding='utf-8')

from database import SessionLocal, Base, engine, User, GameLog
from passlib.context import CryptContext
import json

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_logs():
    db = SessionLocal()
    try:
        # Clear existing logs and non-admin users to reset cleanly
        db.query(GameLog).delete()
        db.query(User).filter(User.username != 'admin').delete()
        db.commit()

        print("[OK] Existing test users and logs cleared.")

        # Create 3 players
        # 1. testuser01 (Clean player, few logs)
        user1 = User(
            name="김철수",
            username="testuser01",
            password_hash=pwd_context.hash("test12345"),
            role="user"
        )
        # 2. user_warning (Active player, warning score 70)
        user2 = User(
            name="이영희",
            username="user_warning",
            password_hash=pwd_context.hash("test12345"),
            role="user"
        )
        # 3. user_danger (Cheater player, danger score 28)
        user3 = User(
            name="박지성",
            username="user_danger",
            password_hash=pwd_context.hash("test12345"),
            role="user"
        )

        db.add_all([user1, user2, user3])
        db.commit()
        db.refresh(user1)
        db.refresh(user2)
        db.refresh(user3)

        print("[OK] Test users created successfully.")

        # Seed logs for user1 (3 clean logs)
        for i in range(3):
            log = GameLog(
                user_id=user1.id,
                event_data=json.dumps([{
                    "Speed": 400.0 + (i * 20),
                    "SpeedHack": 0,
                    "Aim": 0,
                    "GodMode": 0,
                    "ESP": 0
                }])
            )
            db.add(log)

        # Seed logs for user2 (15 logs total, 1 has speed over 1000)
        for i in range(15):
            is_suspicious = (i == 7)
            log = GameLog(
                user_id=user2.id,
                event_data=json.dumps([{
                    "Speed": 1200.0 if is_suspicious else 450.0 + (i * 10),
                    "SpeedHack": 0,
                    "Aim": 0,
                    "GodMode": 0,
                    "ESP": 0
                }])
            )
            db.add(log)

        # Seed logs for user3 (36 logs, 3 have explicit hacks)
        for i in range(36):
            has_hack = (i in [10, 20, 30])
            log = GameLog(
                user_id=user3.id,
                event_data=json.dumps([{
                    "Speed": 1500.0 if has_hack else 500.0,
                    "SpeedHack": 1 if has_hack and i == 10 else 0,
                    "Aim": 1 if has_hack and i == 20 else 0,
                    "GodMode": 0,
                    "ESP": 1 if has_hack and i == 30 else 0
                }])
            )
            db.add(log)

        db.commit()
        print("[OK] Dynamic game logs seeded successfully.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_logs()
