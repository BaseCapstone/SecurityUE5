#pragma once 
#include "Modules/ModuleManager.h"
#include "CoreMinimal.h"
#include "UObject/ObjectKey.h"

class UGameInstance;
struct FComponentRequestHandle;

// 안티치트 플러그인의 시작/종료를 관리하는 메인 모듈 클래스
class FAntiCheatPluginRuntimeModule : public IModuleInterface
{
public:
	// 플러그인 최초 로드 시 호출(초기화 및 이벤트 바인딩)
	virtual void StartupModule() override;
	// 플러그인 언로드 시 호출(메모리 정리 및 이벤트 해제)
	virtual void ShutdownModule() override;

private:
	// 게임 월드가 새로 생성될 때 엔진에 의해 호출되는 콜백
	void OnWorldInitialized(UWorld* World, const UWorld::InitializationValues IVS);
	// 게임 인스턴스 내 플레이어게 안티치트 컴포넌트를 동적으로 부착 요청
	void RegisterComponentRequest(UGameInstance* GameInstance);
private:
	// 게임 시작 이벤트의 구독을 해제하기 위해 저장해두는 핸들
	FDelegateHandle GameInstanceStartHandle;
	// 게임 인스턴스별 컴포넌트 추가 요청을 메모리 누수 없이 관리하는 맵
	TMap<TObjectKey<UGameInstance>, TSharedPtr<FComponentRequestHandle>> ComponentRequestHandles;
};