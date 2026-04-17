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
    FWorldDelegates::OnPostWorldInitialization.AddRaw(this, &FAntiCheatPluginRuntimeModule::OnWorldInitialized);

    GameInstanceStartHandle = FWorldDelegates::OnStartGameInstance.AddRaw(this, &FAntiCheatPluginRuntimeModule::RegisterComponentRequest);

    if (GEngine)
    {
        for (const FWorldContext& WorldContext : GEngine->GetWorldContexts())
        {
            RegisterComponentRequest(WorldContext.OwningGameInstance);
        }
    }
}

void FAntiCheatPluginRuntimeModule::ShutdownModule() {
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