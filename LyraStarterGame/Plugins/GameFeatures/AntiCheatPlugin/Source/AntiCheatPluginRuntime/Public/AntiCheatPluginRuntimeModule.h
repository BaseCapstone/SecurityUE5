#pragma once 

#include "Modules/ModuleManager.h"
#include "CoreMinimal.h"
#include "UObject/ObjectKey.h"

class UGameInstance;
struct FComponentRequestHandle;

class FAntiCheatPluginRuntimeModule : public IModuleInterface
{
public:
	virtual void StartupModule() override;
	virtual void ShutdownModule() override;

private:
	void OnWorldInitialized(UWorld* World, const UWorld::InitializationValues IVS);
	void RegisterComponentRequest(UGameInstance* GameInstance);

private:
	FDelegateHandle GameInstanceStartHandle;
	TMap<TObjectKey<UGameInstance>, TSharedPtr<FComponentRequestHandle>> ComponentRequestHandles;
};