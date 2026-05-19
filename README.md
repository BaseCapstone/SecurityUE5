# 🛡️ Lyra Anti-Cheat Security Project

본 프로젝트는 언리얼 엔진(Lyra Starter Game) 기반의 보안/핵 탐지 시스템입니다. 
게임 클라이언트(Unreal), 웹 프론트엔드/백엔드(Node.js 등), 그리고 AI 분석 서버가 통신하여 비정상적인 플레이어를 실시간으로 탐지하고 제재하는 시스템을 구축합니다.

## 🏛️ 시스템 아키텍처 (System Architecture)

1. **Lyra Client (Game Feature Plugin):** 플레이어의 데이터를 수집(Detector)하고, JSON으로 변환하여 백엔드로 전송합니다. 시뮬레이션을 위한 핵 기능(Cheats)도 포함되어 있습니다.
2. **Web Backend:** 게임 클라이언트로부터 로그를 수신하고, AI 서버에 분석을 요청합니다. 관리자 명령을 받아 클라이언트를 강제 종료(Kick)합니다.
3. **Web Frontend:** 관리자가 의심 유저의 핵 사용 확률을 확인하고 제재할 수 있는 대시보드와, 일반 유저가 게임을 실행하는 웹 페이지입니다.
4. **AI Server (AWS 기반):** 수집된 게임 데이터를 바탕으로 학습된 모델이 해당 유저의 핵 사용 확률(%)을 계산하여 반환합니다.

---

## 📂 폴더 구조 (Monorepo Directory Structure)

우리 프로젝트는 단일 저장소(Monorepo) 원칙을 따르며, 각 파트별 폴더는 다음과 같습니다.

```text
📁 Project_Root
├── 📄 .gitignore               # 통합 gitignore (Unreal, Node, Python 등)
├── 📄 README.md                
│
├── 📁 LyraProject              # 언리얼 엔진 (Lyra) 클라이언트
│   ├── 📄 LyraStarterGame.uproject
│   ├── 📁 Config               # 프로젝트 설정 파일 (ini)
│   └── 📁 Plugins
│       └── 📁 GameFeatures
│           └── 📁 AntiCheatFeature  # 💡 우리가 개발하는 핵심 보안 플러그인 (C++)
│               ├── 📄 AntiCheatFeature.uplugin
│               ├── 📁 Content
│               └── 📁 Source
│                   └── 📁 AntiCheatFeatureRuntime
│                       ├── 📁 Public  (Cheats, Detector, Network 헤더)
│                       └── 📁 Private (Cheats, Detector, Network 소스)
│
├── 📁 Web                      # 웹 서비스 (프론트엔드 & 백엔드)
│   ├── 📁 frontend             # 일반 유저 / 관리자 대시보드
│   └── 📁 backend              # 데이터 통신 허브 및 제재 서버
│
└── 📁 AI_Server                # AI 모델 학습 및 추론 API 서버
    └── ⚠️ (Note: 이 폴더 내부 구조는 AI 담당 팀원분이 모델 및 AWS 환경에 맞춰 자유롭게 세팅할 예정입니다.)
```
---

## 🎮 게임 실행 가이드 (How to Run)

본 게임을 설치하고 실행하는 방법입니다. 아래 순서대로 진행해 주세요.

### 📋 사전 준비 및 실행 순서

1. **파일 다운로드 및 압축 해제**
   * 추가 경로로 다운로드한 `Windows.zip` 파일의 압축을 원하는 경로에 해제합니다.

2. **배치 파일 복사**
   * 다운로드 폴더에 있는 `Launch_LyraGame.bat` 파일과 `Register_LyraProtocol.bat` 파일을 압축을 푼 `Windows` 폴더 안으로 복사(이동)합니다.

3. **프로토콜 등록 (최초 1회 필수)**
   * `Windows` 폴더로 복사한 `Register_LyraProtocol.bat` 파일을 **마우스 우클릭 -> [관리자 권한으로 실행]**합니다.
   * > 💡 **참고:** 이 배치 파일은 웹에서 게임을 인식할 수 있도록 게임의 실행 경로를 등록해 주는 역할을 합니다.

4. **게임 실행**
   * 공식 웹페이지에 접속하여 로그인을 진행합니다.
   * 웹페이지 내의 **[게임 실행]** 버튼을 클릭하여 게임을 런칭합니다.

---

### ⚠️ 주의 사항
* `Register_LyraProtocol.bat` 파일은 반드시 **관리자 권한**으로 실행해야 경로 등록이 정상적으로 완료됩니다.
* 게임 실행에 문제가 있을 경우, 배치 파일이 `Windows` 폴더 내에 올바르게 위치해 있는지 다시 한번 확인해 주세요.