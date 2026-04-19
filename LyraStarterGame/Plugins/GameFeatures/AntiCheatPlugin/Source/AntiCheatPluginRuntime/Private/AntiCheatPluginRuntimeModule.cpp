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
	// 게임 인스턴스가 시작될 때 컴포넌트 주입 요청을 등록합니다.
	GameInstanceStartHandle = FWorldDelegates::OnStartGameInstance.AddRaw(this, &FAntiCheatPluginRuntimeModule::RegisterComponentRequest);

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
	if (GameInstanceStartHandle.IsValid())
	{
		FWorldDelegates::OnStartGameInstance.Remove(GameInstanceStartHandle);
		GameInstanceStartHandle.Reset();
	}
	ComponentRequestHandles.Empty();
}

// 기존의 OnWorldInitialized (타이머 방식)를 제거했습니다. 
// Lyra의 ComponentManager가 더 안전하게 컴포넌트를 넣어줄 것입니다.

void FAntiCheatPluginRuntimeModule::RegisterComponentRequest(UGameInstance* GameInstance)
{
	if (!GameInstance) return;

	const TObjectKey<UGameInstance> GameInstanceKey(GameInstance);
	if (ComponentRequestHandles.Contains(GameInstanceKey)) return;

	UGameFrameworkComponentManager* ComponentManager = UGameInstance::GetSubsystem<UGameFrameworkComponentManager>(GameInstance);
	if (!ComponentManager) return;

	// 핵심: 로컬 플레이어 컨트롤러가 생성될 때 AntiCheatVulnerabilityComponent를 자동으로 추가하도록 예약합니다.
	TSharedPtr<FComponentRequestHandle> RequestHandle = ComponentManager->AddComponentRequest(
		APlayerController::StaticClass(),
		UAntiCheatVulnerabilityComponent::StaticClass(),
		EGameFrameworkAddComponentFlags::AddUnique);

	if (RequestHandle.IsValid())
	{
		ComponentRequestHandles.Add(GameInstanceKey, RequestHandle);
	}
}

#undef LOCTEXT_NAMESPACE

IMPLEMENT_MODULE(FAntiCheatPluginRuntimeModule, AntiCheatPluginRuntime)