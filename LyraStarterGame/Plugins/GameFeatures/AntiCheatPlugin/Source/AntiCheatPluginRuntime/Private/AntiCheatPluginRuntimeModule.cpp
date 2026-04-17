#include "AntiCheatPluginRuntimeModule.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"
#include "AntiCheatDataCollector.h"
#include "TimerManager.h"
#include "AntiCheatVulnerabilityComponent.h"
#include "Components/GameFrameworkComponentManager.h"
#include "Engine/Engine.h"
#include "Engine/GameInstance.h"

#define LOCTEXT_NAMESPACE "FAntiCheatPluginRuntimeModule"

void FAntiCheatPluginRuntimeModule::StartupModule()
{
	// 1. 월드 초기화 시 데이터 수집기(DataCollector) 자동 주입을 위한 델리게이트 등록
	FWorldDelegates::OnPostWorldInitialization.AddRaw(this, &FAntiCheatPluginRuntimeModule::OnWorldInitialized);

	// 2. 게임 인스턴스 시작 시 취약점 컴포넌트(VulnerabilityComponent) 등록을 위한 델리게이트 등록
	GameInstanceStartHandle = FWorldDelegates::OnStartGameInstance.AddRaw(this, &FAntiCheatPluginRuntimeModule::RegisterComponentRequest);

	// 3. 이미 실행 중인 월드 컨텍스트가 있다면 즉시 등록 시도 (에디터/PIE 대응)
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
	// 등록된 델리게이트 핸들 정리
	if (GameInstanceStartHandle.IsValid())
	{
		FWorldDelegates::OnStartGameInstance.Remove(GameInstanceStartHandle);
		GameInstanceStartHandle.Reset();
	}

	ComponentRequestHandles.Empty();
}

void FAntiCheatPluginRuntimeModule::OnWorldInitialized(UWorld* World, const UWorld::InitializationValues IVS)
{
	if (World && World->IsGameWorld())
	{
		// 1초마다 로컬 플레이어 컨트롤러를 확인하여 수집기 컴포넌트가 없으면 주입
		FTimerHandle RepeatHandle;
		World->GetTimerManager().SetTimer(RepeatHandle, [World]()
			{
				for (FConstPlayerControllerIterator Iterator = World->GetPlayerControllerIterator(); Iterator; ++Iterator)
				{
					APlayerController* PC = Iterator->Get();

					if (PC && PC->IsLocalController() && !PC->FindComponentByClass<UAntiCheatDataCollector>())
					{
						UAntiCheatDataCollector* NewComp = NewObject<UAntiCheatDataCollector>(PC, TEXT("AntiCheat_AutoInjected"));
						if (NewComp)
						{
							NewComp->RegisterComponent();
							UE_LOG(LogTemp, Warning, TEXT("=== [AntiCheat] 수집기 주입 성공! ==="));
						}
					}
				}
			}, 1.0f, true);
	}
}

void FAntiCheatPluginRuntimeModule::RegisterComponentRequest(UGameInstance* GameInstance)
{
	if (!GameInstance)
	{
		return;
	}

	const TObjectKey<UGameInstance> GameInstanceKey(GameInstance);
	if (ComponentRequestHandles.Contains(GameInstanceKey))
	{
		return;
	}

	UGameFrameworkComponentManager* ComponentManager = UGameInstance::GetSubsystem<UGameFrameworkComponentManager>(GameInstance);
	if (!ComponentManager)
	{
		return;
	}

	// PlayerController 스폰 시 자동으로 AntiCheatVulnerabilityComponent가 추가되도록 요청
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