#include "AntiCheatPluginRuntimeModule.h"
#include "AntiCheatVulnerabilityComponent.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"
#include "Components/GameFrameworkComponentManager.h"
#include "Engine/Engine.h"
#include "Engine/GameInstance.h"

#define LOCTEXT_NAMESPACE "FAntiCheatPluginRuntimeModule"

void FAntiCheatPluginRuntimeModule::StartupModule()
{

	// 게임 인스턴스가 시작될 때 컴포넌트를 주입하도록 이벤트를 연결
	GameInstanceStartHandle = FWorldDelegates::OnStartGameInstance.AddRaw(this, &FAntiCheatPluginRuntimeModule::RegisterComponentRequest);

	// 플러그인이 로드될 때 이미 실행 중인 월드가 있으면 즉시 주입을 실행
	if (GEngine)
	{
		for (const FWorldContext& WorldContext : GEngine->GetWorldContexts())
		{
			RegisterComponentRequest(WorldContext.OwningGameInstance);
		}
	}
}

void FAntiCheatPluginRuntimeModule::ShutdownModule()
{	
	// 등록했던 게임 인스턴스 시작 이벤트를 안전하게 해제
	if (GameInstanceStartHandle.IsValid())
	{
		FWorldDelegates::OnStartGameInstance.Remove(GameInstanceStartHandle);
		GameInstanceStartHandle.Reset();
	}
	// 관리 중이던 컴포넌트 주입 요청 핸들들을 모두 비워 메모리 누수를 방지
	ComponentRequestHandles.Empty();
}

void FAntiCheatPluginRuntimeModule::RegisterComponentRequest(UGameInstance* GameInstance)
{
	if (!GameInstance) return;

	// TObjectKey를 사용해 현재 게임 인스턴스에 이미 컴포넌트 부착을 요청했는지 중복 검사
	const TObjectKey<UGameInstance> GameInstanceKey(GameInstance);
	if (ComponentRequestHandles.Contains(GameInstanceKey)) return;

	// 언리얼 엔진의 GameFrameworkComponetManager 서브시스템을 가져옴
	UGameFrameworkComponentManager* ComponentManager = UGameInstance::GetSubsystem<UGameFrameworkComponentManager>(GameInstance);
	if (!ComponentManager) return;

	// 모든 APlayeController 클래스가 생성될 때, UAntiCheatVulnerabilityComponent를 자동으로 하나씩 부착하도록 엔진에 요청
	TSharedPtr<FComponentRequestHandle> RequestHandle = ComponentManager->AddComponentRequest(
		APlayerController::StaticClass(),
		UAntiCheatVulnerabilityComponent::StaticClass(),
		EGameFrameworkAddComponentFlags::AddUnique);

	// 요청이 성공하면, 나중에 플러그인 종료 시 안전하게 정리할 수 있도록 맵에 저장
	if (RequestHandle.IsValid())
	{
		ComponentRequestHandles.Add(GameInstanceKey, RequestHandle);
	}
}

#undef LOCTEXT_NAMESPACE
// 엔진에 이 모듈을 AntiCheatPluginRuntime 이라는 이름으로 등록
IMPLEMENT_MODULE(FAntiCheatPluginRuntimeModule, AntiCheatPluginRuntime)