// Copyright Epic Games, Inc. All Rights Reserved.

#include "AntiCheatPluginRuntimeModule.h"

#include "AntiCheatVulnerabilityComponent.h"
#include "Components/GameFrameworkComponentManager.h"
#include "Engine/Engine.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"

#define LOCTEXT_NAMESPACE "FAntiCheatPluginRuntimeModule"

void FAntiCheatPluginRuntimeModule::StartupModule()
{
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
