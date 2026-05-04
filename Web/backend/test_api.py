"""API 전체 플로우 테스트"""
import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests, json

BASE = 'http://localhost:8000'

print("=== 1. 일반 유저 로그인 ===")
r = requests.post(f'{BASE}/api/auth/login', json={'username':'testuser01', 'password':'test12345'})
d = r.json()
token = d['token']
print(f"Status: {r.status_code}")
print(f"User: {d['user']['username']}, Role: {d['user']['role']}, LastLogin: {d['user']['last_login']}")

print("\n=== 2. 프로필 조회 (JWT 인증) ===")
r2 = requests.get(f'{BASE}/api/user/profile', headers={'Authorization': f'Bearer {token}'})
print(f"Status: {r2.status_code}")
print(json.dumps(r2.json(), ensure_ascii=False, indent=2))

print("\n=== 3. 관리자 로그인 ===")
r3 = requests.post(f'{BASE}/api/auth/login', json={'username':'admin', 'password':'admin1234'})
d3 = r3.json()
admin_token = d3['token']
print(f"Status: {r3.status_code}")
print(f"User: {d3['user']['username']}, Role: {d3['user']['role']}")

print("\n=== 4. 관리자 전용 유저목록 (이름 마스킹) ===")
r4 = requests.get(f'{BASE}/api/admin/users', headers={'Authorization': f'Bearer {admin_token}'})
print(f"Status: {r4.status_code}")
print(json.dumps(r4.json(), ensure_ascii=False, indent=2))

print("\n=== 5. 일반 유저로 관리자 API 시도 (403 거부 예상) ===")
r5 = requests.get(f'{BASE}/api/admin/users', headers={'Authorization': f'Bearer {token}'})
print(f"Status: {r5.status_code}")
print(json.dumps(r5.json(), ensure_ascii=False, indent=2))

print("\n=== 6. 비인증 프로필 조회 (401 예상) ===")
r6 = requests.get(f'{BASE}/api/user/profile')
print(f"Status: {r6.status_code}")
print(json.dumps(r6.json(), ensure_ascii=False, indent=2))

print("\n=== 모든 테스트 완료! ===")
