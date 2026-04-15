#include "AntiCheatPluginRuntimeModule.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"
#include "AntiCheatDataCollector.h"
#include "TimerManager.h"

void FAntiCheatPluginRuntimeModule::StartupModule()
{
    // [시스템 예약] 엔진의 월드 초기화가 완료된 직후(OnPostWorldInitialization) 호출될 함수를 연결.
    // 람다나 일반 함수 대신 Raw 포인터를 사용하여 효율적으로 이벤트를 수신
    FWorldDelegates::OnPostWorldInitialization.AddRaw(this, &FAntiCheatPluginRuntimeModule::OnWorldInitialized);
}

void FAntiCheatPluginRuntimeModule::ShutdownModule() {
    // 종료 시 필요한 정리 로직이 있다면 여기에 작성
}

void FAntiCheatPluginRuntimeModule::OnWorldInitialized(UWorld* World, const UWorld::InitializationValues IVS)
{
    // 실제 게임 세션(에디터 월드가 아닌 실제 게임 월드)인지 확인
    if (World && World->IsGameWorld())
    {
        /** * [자동 주입 시스템 가동]
         * 1초마다 월드 내의 모든 플레이어 컨트롤러를 검사하여
         * 감시 컴포넌트(UAntiCheatDataCollector)가 없는 경우 강제로 부착
         */
        FTimerHandle RepeatHandle;
        World->GetTimerManager().SetTimer(RepeatHandle, [World]()
            {
                // 월드 내의 모든 플레이어 컨트롤러를 순회하는 이터레이터
                for (FConstPlayerControllerIterator Iterator = World->GetPlayerControllerIterator(); Iterator; ++Iterator)
                {
                    APlayerController* PC = Iterator->Get();

                    /**
                     * 로컬 플레이어인지 확인하고,
                     * 이미 안티치트 컴포넌트가 부착되어 있는지 체크하여 중복 부착을 방지
                     */
                    if (PC && PC->IsLocalController() && !PC->FindComponentByClass<UAntiCheatDataCollector>())
                    {
                        // 런타임에 동적으로 컴포넌트 생성 (Injected 방식)
                        UAntiCheatDataCollector* NewComp = NewObject<UAntiCheatDataCollector>(PC, TEXT("AntiCheat_AutoInjected"));
                        if (NewComp)
                        {
                            // 로그를 남겨 주입 성공 여부를 확인
                            NewComp->RegisterComponent();
                            UE_LOG(LogTemp, Warning, TEXT("=== [AntiCheat] 수집기 주입 성공! ==="));
                        }
                    }
                }
            }, 1.0f, true); // true: 무한 반복
    }
}

#undef LOCTEXT_NAMESPACE
// 이 클래스를 모듈로 엔진에 등록
IMPLEMENT_MODULE(FAntiCheatPluginRuntimeModule, AntiCheatPluginRuntime)