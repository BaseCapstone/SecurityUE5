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
    void RegisterComponentRequest(UGameInstance* GameInstance);
    void OnWorldInitialized(UWorld* World, const UWorld::InitializationValues IVS);
private:
    FDelegateHandle GameInstanceStartHandle;
    TMap<TObjectKey<UGameInstance>, TSharedPtr<FComponentRequestHandle>> ComponentRequestHandles;
};