// Copyright Epic Games, Inc. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Modules/ModuleManager.h"
#include "UObject/ObjectKey.h"

class UGameInstance;
struct FComponentRequestHandle;

class FAntiCheatPluginRuntimeModule : public IModuleInterface
{
public:
	//~IModuleInterface
	virtual void StartupModule() override;
	virtual void ShutdownModule() override;
	//~End of IModuleInterface

private:
	void RegisterComponentRequest(UGameInstance* GameInstance);

private:
	FDelegateHandle GameInstanceStartHandle;
	TMap<TObjectKey<UGameInstance>, TSharedPtr<FComponentRequestHandle>> ComponentRequestHandles;
};
