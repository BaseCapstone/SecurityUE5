import sys
from datetime import datetime, timedelta
sys.stdout.reconfigure(encoding='utf-8')

from database import SessionLocal, Base, engine, User, GameLog, AIPrediction, SanctionHistory
from passlib.context import CryptContext
import json

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_logs():
    db = SessionLocal()
    try:
        # Clear existing logs, predictions, sanctions, and non-admin users to reset cleanly
        db.query(GameLog).delete()
        db.query(AIPrediction).delete()
        db.query(SanctionHistory).delete()
        db.query(User).filter(User.username != 'admin').delete()
        db.commit()

        print("[OK] Existing test users, logs, predictions, and sanctions cleared.")

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
            role="user",
            is_banned=1
        )

        db.add_all([user1, user2, user3])
        db.commit()
        db.refresh(user1)
        db.refresh(user2)
        db.refresh(user3)

        print("[OK] Test users created successfully.")

        # Seed logs for user1 (3 clean logs)
        user1_logs = []
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
            db.flush()
            user1_logs.append(log)

        # Seed logs for user2 (15 logs total, 6 have speed over 1000 to match the 6 "의심" predictions)
        user2_logs = []
        susp_indices = [5, 7, 9, 11, 13, 14]
        for i in range(15):
            is_suspicious = (i in susp_indices)
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
            db.flush()
            user2_logs.append(log)

        # Seed logs for user3 (36 logs, 3 have explicit hacks)
        user3_logs = []
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
            db.flush()
            user3_logs.append(log)

        # Seed AI Predictions for user1 (3 normal predictions)
        for i, log in enumerate(user1_logs):
            pred = AIPrediction(
                user_id=user1.id,
                log_id=log.log_id,
                probability=0.01 + (i * 0.01),
                predicted_label="스피드핵",
                predictions="정상",
                created_at=datetime.utcnow() - timedelta(days=1, hours=i)
            )
            db.add(pred)

        # Seed AI Predictions for user_warning (6 suspicious predictions and 9 normal predictions)
        susp_count = 0
        for i, log in enumerate(user2_logs):
            if i in susp_indices:
                pred = AIPrediction(
                    user_id=user2.id,
                    log_id=log.log_id,
                    probability=0.55 + (susp_count * 0.02),
                    predicted_label="스피드핵" if susp_count % 2 == 0 else "ESP",
                    predictions="의심",
                    created_at=datetime.utcnow() - timedelta(days=1, hours=susp_count)
                )
                susp_count += 1
            else:
                pred = AIPrediction(
                    user_id=user2.id,
                    log_id=log.log_id,
                    probability=0.12,
                    predicted_label="스피드핵",
                    predictions="정상",
                    created_at=datetime.utcnow() - timedelta(days=1, hours=i)
                )
            db.add(pred)

        # Seed AI Predictions for user_danger (3 certain/danger predictions and 33 normal predictions)
        danger_count = 0
        for i, log in enumerate(user3_logs):
            if i in [10, 20, 30]:
                pred = AIPrediction(
                    user_id=user3.id,
                    log_id=log.log_id,
                    probability=0.92 + (danger_count * 0.02),
                    predicted_label="에임핵" if i == 20 else ("스피드핵" if i == 10 else "ESP"),
                    predictions="확신",
                    created_at=datetime.utcnow() - timedelta(days=1, hours=danger_count)
                )
                danger_count += 1
            else:
                pred = AIPrediction(
                    user_id=user3.id,
                    log_id=log.log_id,
                    probability=0.05,
                    predicted_label="스피드핵",
                    predictions="정상",
                    created_at=datetime.utcnow() - timedelta(days=1, hours=i)
                )
            db.add(pred)

        # Seed SanctionHistory for user_danger (banned user)
        sanction = SanctionHistory(
            user_id=user3.id,
            action="ban",
            reason="AI 탐지 차단 수 임계값 초과 자동 제재 (에임핵/스피드핵/ESP 감지)",
            created_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add(sanction)

        db.commit()
        print("[OK] Dynamic game logs, AI predictions, and sanction history seeded successfully.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_logs()
